import { buildApp } from '../src/app.js';
import { createClient } from 'redis';

async function lastId(stream, url) {
  const c = createClient({ url });
  await c.connect();
  const msgs = await c.xRevRange(stream, '+', '-', { COUNT: 1 });
  await c.quit();
  return msgs[0]?.id || '0-0';
}

async function readSince(stream, url, fromId, predicate, blockMs = 8000) {
  const c = createClient({ url });
  await c.connect();
  const start = Date.now();
  let last = fromId;
  while (Date.now() - start < blockMs) {
    const res = await c.xRead([{ key: stream, id: last }], { BLOCK: 1000, COUNT: 20 });
    if (res) {
      for (const r of res) {
        for (const m of r.messages) {
          last = m.id;
          if (predicate(m)) { await c.quit(); return { ok: true, id: m.id, msg: m.message }; }
        }
      }
    }
  }
  await c.quit();
  return { ok: false };
}

async function main() {
  const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const STREAM = process.env.REDIS_STREAM_HEARTBEAT || 'coordination_heartbeat';
  const notebookId = 'nb_smoke';

  const env = {
    PORT: '0',
    NOTEBOOK_GENERATION_AUTH: 'Bearer test',
    OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
    REDIS_URL,
    COMMS_ORCHESTRATOR_EMIT: '1'
  };
  const fakeDb = { ping: async()=>true, updateNotebookStatus: async()=>{}, setNotebookAudio: async()=>{} };
  const fakeJobs = { add: (_n, fn) => { Promise.resolve().then(fn); }, size: () => 0 };
  const fakeAudio = { synthesize: async () => new Uint8Array([1,2,3]) };
  const fakeStorage = { upload: async (_bin, path) => `http://local/${path}` };
  const fakeSupabase = { matchDocuments: async ()=> [] };

  const app = buildApp({ env, db: fakeDb, jobs: fakeJobs, audio: fakeAudio, storage: fakeStorage, supabase: fakeSupabase });

  const fromId = await lastId(STREAM, REDIS_URL);

  const listen = readSince(STREAM, REDIS_URL, fromId, (m) => {
    const f = m.message;
    return f.event === 'TTS_JOB' && f.task_id === notebookId;
  }, 8000);

  const res = await app.inject({ method: 'POST', url: '/webhook/generate-audio', headers: { Authorization: 'Bearer test' }, payload: { notebook_id: notebookId } });
  const ok = await listen;
  console.log(JSON.stringify({ http_status: res.statusCode, heartbeat: ok }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
