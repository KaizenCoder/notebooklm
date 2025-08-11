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
        for (let i = 0; i < cumulative.length; i++) {
          if (cumulative[i] >= pos + 1) { fromLine = i + 1; break; }
        }
        const posEnd = pos + slice.length;
        for (let i = 0; i < cumulative.length; i++) {
          if (cumulative[i] >= posEnd) { toLine = i + 1; break; }
        }
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
    if (params.sourceType === 'pdf' && params.fileUrl && pdf?.extractText) return pdf.extractText(params.fileUrl);
    if (params.sourceType === 'audio' && params.fileUrl && whisper?.transcribe) return whisper.transcribe(params.fileUrl);
    return '';
  }

  return {
    async processDocument(payload: { notebookId?: string; sourceId?: string; text?: string; sourceType?: string; fileUrl?: string }) {
      const fullText = await loadTextFromSource({ text: payload.text, sourceType: payload.sourceType, fileUrl: payload.fileUrl });
      const chunks = chunkTokens(fullText);
      const docs: UpsertDoc[] = [];

      if (db?.updateSourceStatus && payload.sourceId) { try { await db.updateSourceStatus(payload.sourceId, 'indexing'); } catch {} }

      // batch embeddings (simulate by awaiting sequentially; real impl could parallelize with Promise.allSettled in limited concurrency)
      for (const c of chunks) {
        let embedding: number[] = [];
        if (env.OLLAMA_EMBED_MODEL && typeof ollama?.embeddings === 'function') {
          try { embedding = await ollama.embeddings(env.OLLAMA_EMBED_MODEL, c.text); } catch { embedding = []; }
        }
        docs.push({ text: c.text, embedding, metadata: { notebook_id: payload.notebookId, source_id: payload.sourceId, loc: { lines: { from: c.from, to: c.to } } } });
      }

      if (db?.upsertDocuments) { await db.upsertDocuments(docs); }
      if (db?.updateSourceStatus && payload.sourceId) { try { await db.updateSourceStatus(payload.sourceId, 'ready'); } catch {} }
      return { chunks: docs.length };
    }
  };
}

export type DocumentProcessor = ReturnType<typeof createDocumentProcessor>;
