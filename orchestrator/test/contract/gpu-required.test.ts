import { buildApp } from '../../src/app.js';

// GPU enforcement: expect 503 GPU_REQUIRED when GPU_ONLY=1 and checkGpu=false
const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  GPU_ONLY: '1',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

const fakeOllama = {
  checkGpu: async () => false
} as any;

const app = buildApp({ env, ollama: fakeOllama });

// chat should 503 when GPU required but not available
{
  const res = await app.inject({ method: 'POST', url: '/webhook/chat', headers: { Authorization: 'Bearer test' }, payload: { messages: [{ role: 'user', content: 'hi' }] } });
  if (res.statusCode !== 503) {
    console.error('chat should be 503 GPU_REQUIRED, got', res.statusCode, res.body);
    process.exit(1);
  }
  const body = res.json();
  if (!body || body.code !== 'GPU_REQUIRED') {
    console.error('chat body invalid', body);
    process.exit(1);
  }
}

// process-document should 503 when GPU required but not available
{
  const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' }, payload: {} });
  if (res.statusCode !== 503) {
    console.error('process-document should be 503 GPU_REQUIRED, got', res.statusCode, res.body);
    process.exit(1);
  }
  const body = res.json();
  if (!body || body.code !== 'GPU_REQUIRED') {
    console.error('process-document body invalid', body);
    process.exit(1);
  }
}

console.log('PASS gpu-required');
