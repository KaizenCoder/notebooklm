import { createDocumentProcessor } from '../../src/services/document.js';

const env = { OLLAMA_EMBED_MODEL: 'nomic-embed-text' } as any;
const fakeOllama = { embeddings: async (_m: string, _p: string) => Array.from({ length: 768 }, () => 0.5) } as any;

// Capture upserts from the document processor
let capturedDocs: any[] = [];
const fakeDb = { upsertDocuments: async (docs: any[]) => { capturedDocs = docs; } } as any;

const docProc = createDocumentProcessor(env, { ollama: fakeOllama as any, db: fakeDb });

// Build a deterministic token stream of 480 tokens to force 3 chunks with 40-token overlap
const tokens = Array.from({ length: 480 }, (_, i) => `t${i}`);
const text = tokens.join(' ');

await docProc.processDocument({ notebookId: 'nb-ovlp', sourceId: 's-ovlp', text });

if (!capturedDocs.length || capturedDocs.length < 3) {
  console.error('expected at least 3 chunks, got', capturedDocs.length);
  process.exit(1);
}

// Validate metadata + dims
for (const d of capturedDocs) {
  if (!Array.isArray(d.embedding) || d.embedding.length !== 768) {
    console.error('expected 768-dim embeddings');
    process.exit(1);
  }
  const loc = d?.metadata?.loc?.lines;
  if (!loc || typeof loc.from !== 'number' || typeof loc.to !== 'number') {
    console.error('expected metadata.loc.lines with from/to');
    process.exit(1);
  }
}

// Validate 40-token overlap between consecutive chunks
function splitTokens(s: string) { return s.trim().split(/\s+/).filter(Boolean); }
for (let i = 1; i < capturedDocs.length; i++) {
  const prev = splitTokens(capturedDocs[i - 1].text);
  const curr = splitTokens(capturedDocs[i].text);
  const prevTail = prev.slice(-40).join(' ');
  const currHead = curr.slice(0, 40).join(' ');
  if (prevTail !== currHead) {
    console.error('expected 40-token overlap between chunks', i - 1, 'and', i);
    process.exit(1);
  }
}

console.log('PASS chunking-overlap-metadata');
