import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const app = buildApp({ env });

const headers = { Authorization: 'Bearer test', 'Idempotency-Key': 'idem-as-1' } as any;

// multiple-websites idempotency should return same response on replay
{
  const payload = { type: 'multiple-websites', notebookId: 'nb1', urls: ['https://a', 'https://b'], sourceIds: ['s1','s2'] } as any;
  const r1 = await app.inject({ method: 'POST', url: '/webhook/process-additional-sources', headers, payload });
  const r2 = await app.inject({ method: 'POST', url: '/webhook/process-additional-sources', headers, payload });
  if (r1.statusCode !== 200 || r2.statusCode !== 200) { console.error('idempotency-additional-sources expected 200'); process.exit(1); }
  if (r1.body !== r2.body) { console.error('idempotency-additional-sources same key must return same body'); process.exit(1); }
}

// copied-text idempotency should return same response on replay
{
  const headers2 = { Authorization: 'Bearer test', 'Idempotency-Key': 'idem-as-2' } as any;
  const payload = { type: 'copied-text', notebookId: 'nb1', content: 'hello', sourceId: 's1' } as any;
  const r1 = await app.inject({ method: 'POST', url: '/webhook/process-additional-sources', headers: headers2, payload });
  const r2 = await app.inject({ method: 'POST', url: '/webhook/process-additional-sources', headers: headers2, payload });
  if (r1.statusCode !== 200 || r2.statusCode !== 200) { console.error('idempotency-additional-sources/copied expected 200'); process.exit(1); }
  if (r1.body !== r2.body) { console.error('idempotency-additional-sources/copied same key must return same body'); process.exit(1); }
}

console.log('PASS idempotency-additional-sources');
