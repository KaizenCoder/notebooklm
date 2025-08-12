import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'secret',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const app = buildApp({ env });

const headers = { authorization: 'secret' } as any;
const payload = { file_url: 'http://example.com/a.txt', file_path: '/a.txt', source_type: 'txt', callback_url: 'http://127.0.0.1:0/cb', source_id: 'sid-1', notebook_id: 'nb-1' };

const reqA = app.inject({ method: 'POST', url: '/webhook/process-document', headers: { ...headers, 'idempotency-key': 'concurrent-1' }, payload });
const reqB = app.inject({ method: 'POST', url: '/webhook/process-document', headers: { ...headers, 'idempotency-key': 'concurrent-1' }, payload });

const [res1, res2] = await Promise.all([reqA, reqB]);

if (res1.statusCode !== 202 || res2.statusCode !== 202) {
  console.error('Expected both 202, got', res1.statusCode, res2.statusCode);
  process.exit(1);
}

const b1 = res1.json();
const b2 = res2.json();
if (!b1?.success || !b2?.success || b1.message !== b2.message) {
  console.error('Idempotency responses not consistent', b1, b2);
  process.exit(1);
}

console.log('PASS idempotency-concurrency');
