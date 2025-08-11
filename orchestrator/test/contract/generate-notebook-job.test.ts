import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

let statuses: any[] = [];
const fakeDb = {
  ping: async () => true,
  updateNotebookStatus: async (id: string, status: string) => { statuses.push({ id, status }); }
};

const fakeJobs = {
  add: (_name: string, fn: any, _payload: any) => { Promise.resolve().then(fn); },
  size: () => 0
};

const app = buildApp({ env, db: fakeDb as any, jobs: fakeJobs as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/generate-notebook-content',
  headers: { Authorization: 'Bearer test' },
  payload: { notebookId: 'nb1' },
});

if (res.statusCode !== 202) {
  console.error('generate-notebook-content should be 202, got', res.statusCode, res.body);
  process.exit(1);
}

// Allow microtask to run
await new Promise((r) => setTimeout(r, 0));

if (statuses.length < 2 || statuses[0].status !== 'generating' || statuses[1].status !== 'ready') {
  console.error('expected notebook status updates (generating -> ready), got', statuses);
  process.exit(1);
}

console.log('PASS generate-notebook-job');
