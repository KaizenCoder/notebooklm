import { buildApp } from '../../src/app.js';

const env = {
  PORT: '8000',
  NOTEBOOK_GENERATION_AUTH: 'secret',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text',
  GPU_ONLY: '1'
} as any;

const fakeDb = { ping: async () => true };
const fakeOllama = {
  // Simule une sonde GPU qui échoue
  checkGpu: async (_: string) => false
};

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any });

async function assertGpuRequired(method: string, url: string) {
  const res = await app.inject({ method: method as any, url, headers: { authorization: 'secret' } });
  if (res.statusCode !== 503) {
    console.error(url, 'should be 503 GPU_REQUIRED, got', res.statusCode, res.body);
    process.exit(1);
  }
  try {
    const json = res.json();
    if (json.code !== 'GPU_REQUIRED') {
      console.error(url, 'should return code GPU_REQUIRED, got', json.code, json);
      process.exit(1);
    }
  } catch (e) {
    console.error(url, 'invalid JSON response', e, res.body);
    process.exit(1);
  }
}

await assertGpuRequired('POST', '/webhook/chat');
await assertGpuRequired('POST', '/webhook/process-document');
await assertGpuRequired('POST', '/webhook/process-additional-sources');

console.log('PASS gpu-runtime-guard for chat, process-document, process-additional-sources');
