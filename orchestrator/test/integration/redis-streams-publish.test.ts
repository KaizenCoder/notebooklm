import { buildApp } from '../../src/app.js';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const env = {
  PORT: '0',
  NOTEBOOK_GENERATION_AUTH: 'Bearer test',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  REDIS_URL
} as any;

// Fake deps to avoid network except Redis
const fakeDb = { ping: async()=>true, updateSourceStatus: async()=>{}, updateNotebookStatus: async()=>{}, setNotebookAudio: async()=>{} };
const fakeJobs = { add: (_: string, fn: () => any) => { Promise.resolve().then(fn); }, size: () => 0 };
const fakeAudio = { synthesize: async (_: string) => new Uint8Array([1,2,3]) };
const fakeStorage = { upload: async (_bin: Uint8Array, path: string) => `http://local/${path}`, uploadText: async (_: string, __: string) => void 0, fetchText: async (_: string)=> 'hello' };
const fakeSupabase = { matchDocuments: async ()=> [] };

const app = buildApp({ env, db: fakeDb as any, jobs: fakeJobs as any, audio: fakeAudio as any, storage: fakeStorage as any, supabase: fakeSupabase as any } as any);

async function lastId(stream: string): Promise<string | null> {
  const c = createClient({ url: REDIS_URL });
  await c.connect();
  const msgs = await c.xRevRange(stream, '+', '-', { COUNT: 1 });
  await c.quit();
  return msgs[0]?.id ?? null;
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// 1) generate-audio START/DONE
{
  const beforeId = await lastId('coordination_heartbeat');
  const res = await app.inject({ method: 'POST', url: '/webhook/generate-audio', headers: { Authorization: 'Bearer test' }, payload: { notebook_id: 'nb_test' } });
  if (res.statusCode !== 202) { console.error('expected 202 gen-audio'); process.exit(1); }
  await sleep(1000);
  const afterId = await lastId('coordination_heartbeat');
  if (!afterId || afterId === beforeId) { console.error('no heartbeat published for generate-audio'); process.exit(1); }
}

// 2) process-document START/DONE
{
  const beforeId = await lastId('coordination_heartbeat');
  const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' }, payload: { source_id: 's1', file_url: 'http://example.com/a', file_path: '/a', source_type: 'txt', callback_url: 'http://localhost/cb', notebook_id: 'nb1' } });
  if (res.statusCode !== 202) { console.error('expected 202 process-document'); process.exit(1); }
  await sleep(1000);
  const afterId = await lastId('coordination_heartbeat');
  if (!afterId || afterId === beforeId) { console.error('no heartbeat published for process-document'); process.exit(1); }
}

// 3) process-additional-sources START/DONE (copied-text)
{
  const beforeId = await lastId('coordination_heartbeat');
  const res = await app.inject({ method: 'POST', url: '/webhook/process-additional-sources', headers: { Authorization: 'Bearer test' }, payload: { type: 'copied-text', notebookId: 'nb1', content: 'hello', sourceId: 'sid1' } });
  if (res.statusCode !== 200) { console.error('expected 200 additional-sources'); process.exit(1); }
  await sleep(1000);
  const afterId = await lastId('coordination_heartbeat');
  if (!afterId || afterId === beforeId) { console.error('no heartbeat published for additional-sources'); process.exit(1); }
}

console.log('PASS redis-streams-publish');
