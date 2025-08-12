import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

let upserts: any[] = [];
const fakeDb = {
  ping: async () => true,
  upsertDocuments: async (docs: any[]) => { upserts.push(...docs); },
  updateSourceStatus: async () => {}
};

const fakeOllama = { embeddings: async (_m: string, prompt: string) => Array.from({ length: 8 }, (_, i) => i + prompt.length) };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(() => fn()); }, size: () => 0 };
const fakeStorage = { fetchText: async (url: string) => url.includes('ok.txt') ? 'Hello from file\nAnother line' : '' };

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, jobs: fakeJobs as any, docProc: (await import('../../src/services/document.js')).createDocumentProcessor(env, { ollama: fakeOllama as any, db: fakeDb as any, storage: fakeStorage as any }) });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/process-document',
  headers: { Authorization: 'Bearer test' },
  payload: { source_id: 's1', source_type: 'txt', file_url: 'http://local/ok.txt', file_path: 'p', callback_url: 'http://local/cb' }
});

if (res.statusCode !== 202) {
  console.error('process-document (txt) should be 202, got', res.statusCode, res.body);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 0));

if (!upserts.length) {
  console.error('expected upsertDocuments after txt ingestion');
  process.exit(1);
}

console.log('PASS process-document-txt');
