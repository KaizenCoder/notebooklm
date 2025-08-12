import { buildApp } from '../../src/app.js';
import { createClient, type StreamMessageReply } from 'redis';

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

async function xreadFor(stream: string, predicate: (m: StreamMessageReply) => boolean, blockMs = 5000): Promise<boolean> {
  const c = createClient({ url: REDIS_URL });
  await c.connect();
  const start = Date.now();
  let lastId = '$';
  while (Date.now() - start < blockMs) {
    const res = await c.xRead({ key: stream, id: lastId }, { BLOCK: 1000, COUNT: 10 });
    if (res && res.length) {
      for (const streamRes of res) {
        for (const msg of streamRes.messages) {
          if (predicate(msg)) { await c.quit(); return true; }
          lastId = msg.id;
        }
      }
    }
  }
  await c.quit();
  return false;
}

function hasFields(target: Record<string,string>, expected: Record<string,string>) {
  for (const [k,v] of Object.entries(expected)) { if (target[k] !== v) return false; }
  return true;
}

// 1) generate-audio START or DONE via XREAD blocker
{
  const listen = xreadFor('coordination_heartbeat', (m) => {
    const f = m.message as Record<string,string>;
    return (f.event === 'TTS_JOB' && f.task_id === 'nb_test');
  }, 6000);
  const res = await app.inject({ method: 'POST', url: '/webhook/generate-audio', headers: { Authorization: 'Bearer test' }, payload: { notebook_id: 'nb_test' } });
  if (res.statusCode !== 202) { console.error('expected 202 gen-audio'); process.exit(1); }
  const ok = await listen;
  if (!ok) { console.error('no heartbeat published for generate-audio'); process.exit(1); }
}

// 2) process-document START or DONE via XREAD blocker
{
  const listen = xreadFor('coordination_heartbeat', (m) => {
    const f = m.message as Record<string,string>;
    return (f.event === 'PROCESS_DOCUMENT' && f.task_id === 's1');
  }, 6000);
  const res = await app.inject({ method: 'POST', url: '/webhook/process-document', headers: { Authorization: 'Bearer test' }, payload: { source_id: 's1', file_url: 'http://example.com/a', file_path: '/a', source_type: 'txt', callback_url: 'http://localhost/cb', notebook_id: 'nb1' } });
  if (res.statusCode !== 202) { console.error('expected 202 process-document'); process.exit(1); }
  const ok = await listen;
  if (!ok) { console.error('no heartbeat published for process-document'); process.exit(1); }
}

// 3) process-additional-sources START or DONE via XREAD blocker
{
  const listen = xreadFor('coordination_heartbeat', (m) => {
    const f = m.message as Record<string,string>;
    return (f.event === 'PROCESS_ADDITIONAL_SOURCES' && f.task_id === 'sid1');
  }, 6000);
  const res = await app.inject({ method: 'POST', url: '/webhook/process-additional-sources', headers: { Authorization: 'Bearer test' }, payload: { type: 'copied-text', notebookId: 'nb1', content: 'hello', sourceId: 'sid1' } });
  if (res.statusCode !== 200) { console.error('expected 200 additional-sources'); process.exit(1); }
  const ok = await listen;
  if (!ok) { console.error('no heartbeat published for additional-sources'); process.exit(1); }
}

console.log('PASS redis-streams-publish');
