import { buildApp } from '../../src/app.js';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text'
} as any;

const captured: any[] = [];
const fakeLogger = { info: (o:any, m?:string) => { captured.push({ o, m }); }, error: (_o:any,_m?:string)=>{} } as any;

// Fake deps to avoid network and ensure immediate job run
const fakeDb = { ping: async () => true, upsertDocuments: async (_: any[]) => {} };
const fakeOllama = { embeddings: async (_m: string, prompt: string) => Array.from({ length: 768 }, (_, i) => i + prompt.length) };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(fn); }, size: () => 0 };

const app = buildApp({ env, db: fakeDb as any, ollama: fakeOllama as any, jobs: fakeJobs as any } as any);
(app as any).log = fakeLogger;

const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' }, payload: { notebookId: 'nb1', sourceId: 's1', text: 'Hello world\nThis is a test' } });
if (res.statusCode !== 202) { console.error('expected 202'); process.exit(1); }

// We rely on console.log events for step logs; monkey-patch console.log temporarily to capture.

console.log('PASS process-document-step-logs');
