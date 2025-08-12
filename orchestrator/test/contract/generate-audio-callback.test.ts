import { buildApp } from '../../src/app.js';
import Fastify from 'fastify';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  COQUI_TTS_URL: 'http://127.0.0.1:5002', // Dummy URL for Coqui
  STORAGE_BASE_URL: 'http://127.0.0.1:9000' // Dummy URL for Storage
} as any;

let updates: any[] = [];
const fakeDb = {
  ping: async () => true,
  updateNotebookStatus: async (id: string, status: string) => { updates.push({ id, status }); },
  setNotebookAudio: async (id: string, url: string) => { updates.push({ id, audio_url: url }); }
};

const fakeJobs = {
  add: (_name: string, fn: any, _payload: any) => { Promise.resolve().then(fn); },
  size: () => 0
};

const fakeAudio = {
  synthesize: async (_text: string) => new Uint8Array([1, 2, 3, 4]) // Mock audio data
};

const fakeStorage = {
  fetchText: async (_url: string) => 'mock text',
  upload: async (_bin: Uint8Array, path: string) => `http://mock-storage/${path}` // Mock uploaded URL
};

// Callback capture server
const cbApp = Fastify({ logger: false });
let callbackPayload: any = null;
cbApp.post('/cb', async (req: any, reply: any) => {
  callbackPayload = req.body;
  reply.code(200).send({ ok: true });
});
await cbApp.listen({ port: 0, host: '127.0.0.1' });
const address = cbApp.server.address();
const cbPort = typeof address === 'object' && address ? address.port : 0;
const callbackUrl = `http://127.0.0.1:${cbPort}/cb`;

const app = buildApp({ env, db: fakeDb as any, jobs: fakeJobs as any, supabase: {} as any, audio: fakeAudio as any, storage: fakeStorage as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/generate-audio',
  headers: { Authorization: 'Bearer test' },
  payload: { notebook_id: 'nb1', callback_url: callbackUrl },
});

if (res.statusCode !== 202) {
  console.error('generate-audio should be 202, got', res.statusCode, res.body);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 10));

if (!updates.find(u => u.status === 'completed')) {
  console.error('expected notebook status completed in updates', updates);
  process.exit(1);
}

if (!callbackPayload || callbackPayload.status !== 'success' || callbackPayload.notebook_id !== 'nb1' || typeof callbackPayload.audio_url !== 'string') {
  console.error('expected callback payload success with audio_url and notebook_id', callbackPayload);
  process.exit(1);
}

await cbApp.close();
console.log('PASS generate-audio-callback');
