import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
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

const app = buildApp({ env, db: fakeDb as any, jobs: fakeJobs as any, supabase: {} as any });

const res = await app.inject({
  method: 'POST',
  url: '/webhook/generate-audio',
  headers: { Authorization: 'Bearer test' },
  payload: { notebook_id: 'nb1', callback_url: 'http://localhost/callback' },
});

if (res.statusCode !== 202) {
  console.error('generate-audio should be 202, got', res.statusCode, res.body);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 0));

if (!updates.length) {
  console.error('expected notebook updates for audio generation');
  process.exit(1);
}

console.log('PASS generate-audio');
