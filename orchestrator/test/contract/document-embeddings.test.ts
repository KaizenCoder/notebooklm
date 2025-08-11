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

const fakeOllama = {
  embeddings: async (_model: string, prompt: string) => Array.from({ length: 8 }, (_, i) => i + prompt.length)
};

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, supabase: {} as any, jobs: { add() {}, size() { return 0; } } as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/process-document',
  headers: { Authorization: 'Bearer test' },
  payload: { notebookId: 'nb1', sourceId: 's1', text: 'Hello world\nThis is a test' },
});

if (res.statusCode !== 202) {
  console.error('process-document should be 202, got', res.statusCode, res.body);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 0));

if (!capturedDocs.length) {
  console.error('Expected docs to be upserted');
  process.exit(1);
}

for (const d of capturedDocs) {
  if (!Array.isArray(d.embedding) || d.embedding.length !== 8) {
    console.error('Expected 8-dim embedding for each chunk, got', d.embedding?.length);
    process.exit(1);
  }
}

console.log('PASS document-embeddings');
