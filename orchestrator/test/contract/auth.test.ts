import { buildApp } from '../../src/app.js';

// Validate Authorization behavior on webhook routes and open access on non-webhook routes
const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const app = buildApp({ env });

// Missing Authorization on webhook -> 401
{
  const res = await app.inject({ method: 'POST', url: '/webhook/chat', payload: { messages: [] } });
  if (res.statusCode !== 401) {
    console.error('auth missing should be 401, got', res.statusCode, res.body);
    process.exit(1);
  }
  const body = res.json();
  if (!body || body.code !== 'UNAUTHORIZED') {
    console.error('auth missing body invalid', body);
    process.exit(1);
  }
}

// Invalid Authorization on webhook -> 401
{
  const res = await app.inject({ method: 'POST', url: '/webhook/chat', headers: { Authorization: 'Bearer wrong' }, payload: { messages: [] } });
  if (res.statusCode !== 401) {
    console.error('auth invalid should be 401, got', res.statusCode, res.body);
    process.exit(1);
  }
}

// Non-webhook route should not require auth
{
  const res = await app.inject({ method: 'GET', url: '/health' });
  if (res.statusCode !== 200) {
    console.error('/health should be 200 without auth, got', res.statusCode, res.body);
    process.exit(1);
  }
}

console.log('PASS auth');
