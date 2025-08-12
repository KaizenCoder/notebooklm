import { buildApp } from '../../src/app.js';

// Validate 503 NOT_READY shape with details and correlation_id
const baseEnv = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text',
  OLLAMA_LLM_MODEL: 'qwen3:8b-q4_K_M'
} as any;

// 1) DB failure -> 503, code NOT_READY with details.db error
{
  const env = { ...baseEnv } as any;
  const fakeDb = { ping: async () => { throw new Error('db down'); } };
  const fakeOllama = { listModels: async () => ({ models: [ { name: 'nomic-embed-text' }, { name: 'qwen3:8b-q4_K_M' } ] }) };
  const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any });
  const res = await app.inject({ method: 'GET', url: '/ready' });
  if (res.statusCode !== 503) { console.error('expected 503 for DB failure'); process.exit(1); }
  const body = res.json();
  if (!body || body.code !== 'NOT_READY' || !body.details || !body.details.db || !body.correlation_id) {
    console.error('invalid NOT_READY shape for DB failure', body);
    process.exit(1);
  }
}

// 2) Missing models -> 503, details.models.missing present
{
  const env = { ...baseEnv } as any;
  const fakeDb = { ping: async () => true };
  const fakeOllama = { listModels: async () => ({ models: [ { name: 'other' } ] }) };
  const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any });
  const res = await app.inject({ method: 'GET', url: '/ready' });
  if (res.statusCode !== 503) { console.error('expected 503 for missing models'); process.exit(1); }
  const body = res.json();
  const missing = body?.details?.models?.missing;
  if (!missing || !Array.isArray(missing) || missing.length === 0) {
    console.error('expected details.models.missing to be a non-empty array', body);
    process.exit(1);
  }
}

console.log('PASS ready-error-shape');

