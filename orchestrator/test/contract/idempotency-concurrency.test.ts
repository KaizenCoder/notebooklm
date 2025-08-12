import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const fakeDb = { ping: async () => true, upsertDocuments: async (_: any[]) => {} };
const fakeOllama = { embeddings: async () => [] };
const fakeJobs = { add: (_: string, __: () => any) => {}, size: () => 0 };

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, jobs: fakeJobs as any });

const headers = { Authorization: 'Bearer test', 'Idempotency-Key': 'concur-1' } as any;

const payload = { source_id: 's1', source_type: 'txt', file_url: 'http://x', file_path: 'p', callback_url: 'http://cb' };

const [r1, r2] = await Promise.all([
  app.inject({ method: 'POST', url: '/webhook/process-document', headers, payload }),
  app.inject({ method: 'POST', url: '/webhook/process-document', headers, payload })
]);

if (r1.statusCode !== 202 || r2.statusCode !== 202) { console.error('concurrency idempotency: expected 202 both'); process.exit(1); }
if (r1.body !== r2.body) { console.error('concurrency idempotency: bodies must match'); process.exit(1); }

console.log('PASS idempotency-concurrency');
