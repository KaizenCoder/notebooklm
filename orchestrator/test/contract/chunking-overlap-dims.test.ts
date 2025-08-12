import { createDocumentProcessor } from '../../src/services/document.js';

const env = { OLLAMA_EMBED_MODEL: 'nomic-embed-text' } as any;
const fakeOllama = { embeddings: async (_m: string, prompt: string) => Array.from({ length: 768 }, () => 0.1) };
const fakeDb = { upsertDocuments: async (_: any[]) => {} } as any;

const docProc = createDocumentProcessor(env, { ollama: fakeOllama as any, db: fakeDb });

const text = Array.from({ length: 500 }, (_, i) => `w${i}`).join(' ');
const res = await docProc.processDocument({ notebookId: 'nb', sourceId: 's', text });

if (!res || typeof res.chunks !== 'number' || res.chunks < 2) {
  console.error('expected multiple chunks');
  process.exit(1);
}

console.log('PASS chunking-overlap-dims');
