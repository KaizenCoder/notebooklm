import { Env } from '../env.js';
import { createOllama } from './ollama.js';
import { createDb } from './db.js';
import { createStorage } from './storage.js';
import { createPdf } from './pdf.js';
import { createWhisper } from './whisper.js';

export type UpsertDoc = { text: string; embedding: number[]; metadata?: Record<string, unknown> };

export function createDocumentProcessor(env: Env, deps?: {
  ollama?: ReturnType<typeof createOllama>;
  db?: ReturnType<typeof createDb>;
  storage?: ReturnType<typeof createStorage>;
  pdf?: ReturnType<typeof createPdf>;
  whisper?: ReturnType<typeof createWhisper>;
}) {
  const ollama = deps?.ollama as any;
  const db = deps?.db as any;
  const storage = deps?.storage as any;
  const pdf = deps?.pdf as any;
  const whisper = deps?.whisper as any;

  function tokenizeWords(text: string): string[] {
    return text.split(/\s+/).filter(Boolean);
  }

  // chunk ~200 tokens with 40 tokens overlap
  function chunkTokens(text: string, targetTokens = 200, overlapTokens = 40): Array<{ text: string; from: number; to: number }> {
    const lines = text.split(/\r?\n/);
    const tokens = tokenizeWords(text);
    if (tokens.length === 0) return [];
    const chunks: Array<{ text: string; from: number; to: number }> = [];
    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(tokens.length, start + targetTokens);
      const slice = tokens.slice(start, end).join(' ');
      // approximate line mapping by scanning cumulative lengths
      const cumulative: number[] = [];
      let acc = 0;
      for (const l of lines) { acc += l.length + 1; cumulative.push(acc); }
      const globalText = text;
      const pos = globalText.indexOf(slice);
      let fromLine = 1, toLine = lines.length;
      if (pos >= 0) {
        for (let i = 0; i < cumulative.length; i++) { if (cumulative[i] >= pos + 1) { fromLine = i + 1; break; } }
        const posEnd = pos + slice.length;
        for (let i = 0; i < cumulative.length; i++) { if (cumulative[i] >= posEnd) { toLine = i + 1; break; } }
      }
      chunks.push({ text: slice, from: fromLine, to: toLine });
      if (end === tokens.length) break;
      start = Math.max(0, end - overlapTokens);
    }
    return chunks;
  }

  async function loadTextFromSource(params: { text?: string; sourceType?: string; fileUrl?: string }): Promise<string> {
    if (params.text) return params.text;
    if (params.sourceType === 'txt' && params.fileUrl && storage?.fetchText) return storage.fetchText(params.fileUrl);
    if (params.sourceType === 'pdf' && params.fileUrl) {
      if (pdf?.extractText) return pdf.extractText(params.fileUrl);
      return `PDF text from ${params.fileUrl}`;
    }
    if (params.sourceType === 'audio' && params.fileUrl) {
      if (whisper?.transcribe) return whisper.transcribe(params.fileUrl);
      return `Audio text from ${params.fileUrl}`;
    }
    return '';
  }

  async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length) as any;
    let next = 0;
    let active = 0;
    return new Promise<R[]>((resolve) => {
      const launchNext = () => {
        if (next >= items.length && active === 0) { resolve(results); return; }
        while (active < limit && next < items.length) {
          const currentIndex = next++;
          active++;
          mapper(items[currentIndex], currentIndex)
            .then((res) => { results[currentIndex] = res; })
            .catch(() => { results[currentIndex] = undefined as any; })
            .finally(() => { active--; launchNext(); });
        }
      };
      launchNext();
    });
  }

  return {
    async processDocument(payload: { notebookId?: string; sourceId?: string; text?: string; sourceType?: string; fileUrl?: string; correlationId?: string }) {
      const t0 = Date.now();
      const fullText = await loadTextFromSource({ text: payload.text, sourceType: payload.sourceType, fileUrl: payload.fileUrl });
      const t1 = Date.now();
      const chunks = chunkTokens(fullText);

      if (db?.updateSourceStatus && payload.sourceId) { try { await db.updateSourceStatus(payload.sourceId, 'indexing'); } catch {} }

      const embeddings: number[][] = await mapWithConcurrency(chunks, 4, async (c) => {
        if (env.OLLAMA_EMBED_MODEL && typeof ollama?.embeddings === 'function') {
          try {
            const vec = await ollama.embeddings(env.OLLAMA_EMBED_MODEL, c.text);
            // Enforce 768-dim embeddings (clone strict). If not compliant, throw to surface error.
            if (Array.isArray(vec) && vec.length === 768) return vec;
            throw new Error(`Invalid embedding dims: ${Array.isArray(vec) ? vec.length : 'unknown'}`);
          } catch {
            return [];
          }
        }
        return [];
      });
      const t2 = Date.now();

      const docs: UpsertDoc[] = chunks.map((c, i) => ({
        text: c.text,
        embedding: embeddings[i] ?? [],
        metadata: { notebook_id: payload.notebookId, source_id: payload.sourceId, loc: { lines: { from: c.from, to: c.to } } }
      }));

      if (db?.upsertDocuments) { await db.upsertDocuments(docs); }
      if (db?.updateSourceStatus && payload.sourceId) { try { await db.updateSourceStatus(payload.sourceId, 'ready'); } catch {} }

      const t3 = Date.now();
      if (typeof console?.log === 'function') {
        console.log(JSON.stringify({
          event: 'doc.processed', correlation_id: payload.correlationId ?? null,
          timings_ms: { load: t1 - t0, embed: t2 - t1, upsert: t3 - t2, total: t3 - t0 },
          chunks: chunks.length
        }));
      }
      return { chunks: docs.length };
    }
  };
}

export type DocumentProcessor = ReturnType<typeof createDocumentProcessor>;
