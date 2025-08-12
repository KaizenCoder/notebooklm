import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const app = buildApp({ env });

const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' }, payload: { source_type: 'pdf' } });
if (res.statusCode !== 422) { console.error('process-document invalid payload should be 422, got', res.statusCode, res.body); process.exit(1); }
const body = res.json();
if (!body || !body.code || !body.correlation_id) { console.error('ErrorResponse shape invalid', body); process.exit(1); }
console.log('PASS process-document-invalid');
