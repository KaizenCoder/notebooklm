import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const calls: any[] = [];
const fakeDb = {
  ping: async () => true,
  upsertDocuments: async (_docs: any[]) => { calls.push(['upsert']); },
  updateSourceStatus: async (id: string, status: string) => { calls.push(['status', id, status]); }
};

const fakeOllama = { embeddings: async () => [] };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(() => fn()); }, size: () => 0 };

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, jobs: fakeJobs as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/process-document',
  headers: { Authorization: 'Bearer test' },
  payload: { notebookId: 'nb1', sourceId: 's42', text: 'A\nB' },
});

if (res.statusCode !== 202) {
  console.error('process-document should be 202, got', res.statusCode);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 0));

const statuses = calls.filter(c => c[0] === 'status');
if (statuses.length < 2 || statuses[0][2] !== 'indexing' || statuses[statuses.length-1][2] !== 'ready') {
  console.error('expected source status indexing -> ready, got', statuses);
  process.exit(1);
}

console.log('PASS process-document-status');
