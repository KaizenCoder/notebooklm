import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const captured: any[] = [];
const fakeLogger = { info: (o:any,m?:string)=>{ captured.push({o,m}); } } as any;

const fakeDb = {
  ping: async () => true,
  updateNotebookStatus: async (_id: string, _status: string) => {},
  setNotebookAudio: async (_id: string, _url: string) => {}
};

const fakeJobs = {
  add: (_name: string, fn: any, _payload: any) => { Promise.resolve().then(fn); },
  size: () => 0
};

const fakeAudio = { synthesize: async (_: string) => new Uint8Array([1,2,3]) } as any;
const fakeStorage = { upload: async (_bin: Uint8Array, _path: string) => 'http://mock-storage/audio.mp3' } as any;

const app = buildApp({ env, db: fakeDb as any, jobs: fakeJobs as any, audio: fakeAudio as any, storage: fakeStorage as any });
(app as any).log = fakeLogger;

const headers = { Authorization: 'Bearer test', 'Idempotency-Key': 'idem-audio-1' } as any;
const payload = { notebook_id: 'nb1' } as any;

const r1 = await app.inject({ method: 'POST', url: '/webhook/generate-audio', headers, payload });
const r2 = await app.inject({ method: 'POST', url: '/webhook/generate-audio', headers, payload });

if (r1.statusCode !== 202 || r2.statusCode !== 202) { console.error('idempotency generate-audio expected 202'); process.exit(1); }
if (r1.body !== r2.body) { console.error('idempotency generate-audio same key must return same body'); process.exit(1); }

console.log('PASS idempotency-generate-audio');
