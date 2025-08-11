import { buildApp } from '../../src/app.js';

// Fake deps to simulate failure conditions
const baseEnv = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text',
  OLLAMA_LLM_MODEL: 'qwen3:8b-q4_K_M'
} as any;

// 1) DB failure -> 503
{
  const fakeDb = { ping: async () => { throw new Error('db down'); } };
  const fakeOllama = { listModels: async () => ({ models: [ { name: 'nomic-embed-text' }, { name: 'qwen3:8b-q4_K_M' } ] }) };
  const app = buildApp({ env: baseEnv, db: fakeDb as any, ollama: fakeOllama as any });
  const res = await app.inject({ method: 'GET', url: '/ready' });
  if (res.statusCode !== 503) {
    console.error('ready DB failure should be 503, got', res.statusCode, res.body);
    process.exit(1);
  }
}

// 2) Missing models -> 503
{
  const fakeDb = { ping: async () => true };
  const fakeOllama = { listModels: async () => ({ models: [ { name: 'some-other-model' } ] }) };
  const app = buildApp({ env: baseEnv, db: fakeDb as any, ollama: fakeOllama as any });
  const res = await app.inject({ method: 'GET', url: '/ready' });
  if (res.statusCode !== 503) {
    console.error('ready missing models should be 503, got', res.statusCode, res.body);
    process.exit(1);
  }
}

// 3) GPU_ONLY=1 with failing probe -> 503
{
  const env = { ...baseEnv, GPU_ONLY: '1' } as any;
  const fakeDb = { ping: async () => true };
  const fakeOllama = {
    listModels: async () => ({ models: [ { name: 'nomic-embed-text' }, { name: 'qwen3:8b-q4_K_M' } ] }),
    checkGpu: async () => false
  };
  const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any });
  const res = await app.inject({ method: 'GET', url: '/ready' });
  if (res.statusCode !== 503) {
    console.error('ready GPU_ONLY failing probe should be 503, got', res.statusCode, res.body);
    process.exit(1);
  }
}

// 4) GPU_ONLY=1 with passing probe -> 200
{
  const env = { ...baseEnv, GPU_ONLY: '1' } as any;
  const fakeDb = { ping: async () => true };
  const fakeOllama = {
    listModels: async () => ({ models: [ { name: 'nomic-embed-text' }, { name: 'qwen3:8b-q4_K_M' } ] }),
    checkGpu: async () => true
  };
  const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any });
  const res = await app.inject({ method: 'GET', url: '/ready' });
  if (res.statusCode !== 200) {
    console.error('ready GPU_ONLY passing probe should be 200, got', res.statusCode, res.body);
    process.exit(1);
  }
}

console.log('PASS ready-failures');
