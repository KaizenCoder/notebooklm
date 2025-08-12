import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

const captured: any[] = [];
const fakeLogger = { info: (o:any, m?:string) => { captured.push({ o, m }); }, error: (_o:any,_m?:string)=>{} } as any;

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

const app = buildApp({ env, db: fakeDb as any, jobs: fakeJobs as any, audio: fakeAudio as any, storage: fakeStorage as any } as any);
(app as any).log = fakeLogger;

const res = await app.inject({ method: 'POST', url: '/webhook/generate-audio', headers: { Authorization: 'Bearer test' }, payload: { notebook_id: 'nb1' } });
if (res.statusCode !== 202) { console.error('expected 202'); process.exit(1); }

// Assertions logs structurés (sans callback)
const codes = captured.map((e) => e.o?.event_code).filter(Boolean);
for (const need of ['TTS_START','TTS_COMPLETE','UPLOAD_START','UPLOAD_COMPLETE']) {
  if (!codes.includes(need)) {
    console.error('missing event_code', need);
    console.error('got', codes);
    process.exit(1);
  }
}

console.log('PASS generate-audio-step-logs');
