import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

let capturedDocs: any[] = [];
const fakeDb = {
  ping: async () => true,
  upsertDocuments: async (docs: any[]) => { capturedDocs = docs; }
};

// Return a wrong-dimension embedding to trigger the guard
const fakeOllama = {
  embeddings: async (_model: string, prompt: string) => Array.from({ length: 32 }, () => prompt.length % 7)
};

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, supabase: {} as any, jobs: { add() {}, size() { return 0; } } as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/process-document',
  headers: { Authorization: 'Bearer test' },
  payload: { notebookId: 'nb-guard', sourceId: 's-guard', text: 'One two three four five six seven eight nine ten' },
});

if (res.statusCode !== 202) {
  console.error('process-document should be 202 on mismatch guard, got', res.statusCode, res.body);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 0));

if (!capturedDocs.length) {
  console.error('Expected docs to be upserted even when embeddings mismatch');
  process.exit(1);
}

for (const d of capturedDocs) {
  if (!Array.isArray(d.embedding)) {
    console.error('Expected embedding array');
    process.exit(1);
  }
  if (d.embedding.length !== 0) {
    console.error('Expected empty embedding array on mismatch, got', d.embedding.length);
    process.exit(1);
  }
}

console.log('PASS embeddings-dim-mismatch');
