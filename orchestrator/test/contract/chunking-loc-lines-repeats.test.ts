import { createDocumentProcessor } from '../../src/services/document.js';

const env = { OLLAMA_EMBED_MODEL: 'nomic-embed-text' } as any;
const fakeOllama = { embeddings: async (_m: string, _p: string) => Array.from({ length: 768 }, () => 0.1) } as any;
const fakeDb = { upsertDocuments: async (_: any[]) => {} } as any;

const docProc = createDocumentProcessor(env, { ollama: fakeOllama as any, db: fakeDb });

// Build a text with repeated patterns across lines to challenge loc.lines mapping
const lines: string[] = [];
for (let i = 0; i < 30; i++) {
  const base = `repeat segment ${i % 5}`; // repeats every 5 lines
  lines.push(`${base} alpha beta gamma delta epsilon zeta eta theta iota kappa`);
}
const text = lines.join('\n');

const res = await docProc.processDocument({ notebookId: 'nb-rep', sourceId: 's-rep', text });

if (!res || typeof res.chunks !== 'number' || res.chunks < 2) {
  console.error('expected multiple chunks for repeated text');
  process.exit(1);
}

console.log('PASS chunking-loc-lines-repeats');
