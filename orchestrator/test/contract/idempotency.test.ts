import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

const fakeDb = { ping: async () => true, upsertDocuments: async (_: any[]) => {} };
const fakeOllama = { embeddings: async () => [] };
const fakeJobs = { add: (_: string, __: () => any) => {}, size: () => 0 };

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, jobs: fakeJobs as any });

const headers = { Authorization: 'Bearer test', 'Idempotency-Key': 'abc-123' } as any;

const r1 = await app.inject({ method: 'POST', url: '/webhook/process-document', headers, payload: { source_id: 's1', source_type: 'txt', file_url: 'http://x', file_path: 'p', callback_url: 'http://cb' } });
const r2 = await app.inject({ method: 'POST', url: '/webhook/process-document', headers, payload: { source_id: 's1', source_type: 'txt', file_url: 'http://x', file_path: 'p', callback_url: 'http://cb' } });

if (r1.statusCode !== 202 || r2.statusCode !== 202) { console.error('idempotency status expected 202'); process.exit(1); }
if (r1.body !== r2.body) { console.error('idempotency should return same response'); process.exit(1); }

console.log('PASS idempotency');
