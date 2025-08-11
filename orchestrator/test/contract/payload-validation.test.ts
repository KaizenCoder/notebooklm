import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const app = buildApp({ env });

// Missing required OpenAPI fields -> still 202 currently (compat), so we assert 202 for now
{
  const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' }, payload: { } });
  if (res.statusCode !== 202) { console.error('compat missing fields should still be 202 (transitory), got', res.statusCode); process.exit(1); }
}

console.log('PASS payload-validation-transitory');
