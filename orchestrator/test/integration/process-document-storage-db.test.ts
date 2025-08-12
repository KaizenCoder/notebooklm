import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

let upserts: any[] = [];
let statuses: any[] = [];
const fakeDb = {
  ping: async () => true,
  upsertDocuments: async (docs: any[]) => { upserts.push(...docs); },
  updateSourceStatus: async (id: string, status: string) => { statuses.push([id, status]); }
};

const fakeStorage = {
  fetchText: async (url: string) => `Downloaded text from ${url}`,
  upload: async (_bin: Uint8Array, path: string) => `local:///${path}`
};

const fakeOllama = {
  embeddings: async (_model: string, prompt: string) => Array.from({ length: 8 }, (_, i) => i + prompt.length)
};

const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(() => fn()); }, size: () => 0 };

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, storage: fakeStorage as any, jobs: fakeJobs as any, supabase: {} as any });

// Strict OpenAPI shape
const res = await app.inject({
  method: 'POST',
  url: '/webhook/process-document',
  headers: { Authorization: 'Bearer test' },
  payload: { source_id: 's42', file_url: 'local:///bucket/s42.txt', file_path: '/bucket/s42.txt', source_type: 'txt', callback_url: 'http://localhost/callback', notebook_id: 'nb1' },
});

if (res.statusCode !== 202) {
  console.error('process-document should be 202, got', res.statusCode, res.body);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 0));

if (!upserts.length) {
  console.error('Expected upsertDocuments to be called with docs');
  process.exit(1);
}

if (!statuses.length || statuses[0][1] !== 'indexing' || statuses[statuses.length - 1][1] !== 'ready') {
  console.error('Expected source status indexing -> ready, got', statuses);
  process.exit(1);
}

for (const d of upserts) {
  if (!d.metadata || d.metadata.notebook_id !== 'nb1' || d.metadata.source_id !== 's42') {
    console.error('Expected metadata notebook_id/source_id');
    process.exit(1);
  }
  if (!Array.isArray(d.embedding) || d.embedding.length !== 8) {
    console.error('Expected 8-dim embedding');
    process.exit(1);
  }
}

console.log('PASS integration: process-document with Storage+DB mocks');
