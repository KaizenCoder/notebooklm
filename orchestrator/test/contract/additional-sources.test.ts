import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

let upserts: any[] = [];
const fakeDb = { ping: async () => true, upsertDocuments: async (docs: any[]) => { upserts.push(...docs); } };
const fakeOllama = { embeddings: async (_m: string, prompt: string) => Array.from({ length: 8 }, (_, i) => i + prompt.length) };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(() => fn()); }, size: () => 0 };
const fakeDocProc = (await import('../../src/services/document.js')).createDocumentProcessor(env, { ollama: fakeOllama as any, db: fakeDb as any, storage: { fetchText: async () => 'X' } as any });
const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, jobs: fakeJobs as any, docProc: fakeDocProc });

// copied-text
{
  upserts = [];
  const res = await app.inject({ method: 'POST', url: '/webhook/process-additional-sources', headers: { Authorization: 'Bearer test' }, payload: { type: 'copied-text', notebookId: 'nb1', sourceId: 's1', title: 't', content: 'lorem ipsum' } });
  if (res.statusCode !== 200) { console.error('additional-sources copied-text should be 200, got', res.statusCode, res.body); process.exit(1); }
  if (!upserts.length) { console.error('expected upserts for copied-text'); process.exit(1); }
}

// multiple-websites
{
  upserts = [];
  const res = await app.inject({ method: 'POST', url: '/webhook/process-additional-sources', headers: { Authorization: 'Bearer test' }, payload: { type: 'multiple-websites', notebookId: 'nb1', urls: ['https://a','https://b'], sourceIds: ['sa','sb'] } });
  if (res.statusCode !== 200) { console.error('additional-sources multiple-websites should be 200, got', res.statusCode, res.body); process.exit(1); }
  if (!upserts.length) { console.error('expected upserts for multiple-websites'); process.exit(1); }
}

console.log('PASS additional-sources');
