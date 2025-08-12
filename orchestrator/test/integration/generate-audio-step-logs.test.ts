import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434'
} as any;

// Logger capture (non bloquant)
const captured: any[] = [];
const fakeLogger = { info: (o:any,m?:string)=>{ captured.push({o,m}); }, error: (_:any,__:string)=>{} } as any;

// Fake deps pour éviter réseau
const fakeDb = { ping: async()=>true, updateNotebookStatus: async()=>{}, setNotebookAudio: async()=>{} };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(fn); }, size: () => 0 };
const fakeAudio = { synthesize: async (_: string) => new Uint8Array([1,2,3]) };
const fakeStorage = { upload: async (_bin: Uint8Array, path: string) => `http://local/${path}` };

const app = buildApp({ env, db: fakeDb as any, jobs: fakeJobs as any, audio: fakeAudio as any, storage: fakeStorage as any } as any);
(app as any).log = fakeLogger;

const res = await app.inject({ method: 'POST', url: '/webhook/generate-audio', headers: { Authorization: 'Bearer test' }, payload: { notebook_id: 'nb1', callback_url: 'http://localhost/cb' } });
if (res.statusCode !== 202) { console.error('expected 202'); process.exit(1); }

console.log('PASS generate-audio-step-logs');
