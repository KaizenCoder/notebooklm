import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

let upserts: any[] = [];
const fakeDb = {
  ping: async () => true,
  upsertDocuments: async (docs: any[]) => { upserts.push(...docs); }
};

const fakeJobs = {
  add: (_name: string, fn: any, _payload: any) => { Promise.resolve().then(fn); },
  size: () => 0
};

// Reuse real docProc creation through app by providing db and env; ollama unused here
const app = buildApp({ env, db: fakeDb as any, jobs: fakeJobs as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/process-document',
  headers: { Authorization: 'Bearer test' },
  payload: { notebookId: 'nb1', sourceId: 's1', text: 'Line 1\nLine 2' },
});

if (res.statusCode !== 202) {
  console.error('process-document should be 202, got', res.statusCode, res.body);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 0));

if (upserts.length === 0) {
  console.error('expected upsertDocuments to be called with chunks, got', upserts);
  process.exit(1);
}

console.log('PASS process-document-job');
