import { createClient } from 'redis';

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const stream = process.env.STREAM || 'agents:global';
const now = new Date().toISOString();

const msg = {
  from_agent: process.env.FROM_AGENT || 'agent_manual',
  team: process.env.TEAM || 'orange',
  role: process.env.ROLE || 'impl',
  to: process.env.TO || 'orchestrator',
  topic: process.env.TOPIC || 'HEARTBEAT',
  event: process.env.EVENT || 'TASK_START',
  status: process.env.STATUS || 'IN_PROGRESS',
  tm_ids: process.env.TM_IDS || '["1"]',
  task_id: process.env.TASK_ID || '1',
  pair_id: process.env.PAIR_ID || 'orange-violet',
  timestamp: now,
  correlation_id: process.env.CORRELATION_ID || `manual-${Math.random().toString(36).slice(2,10)}`,
  details: process.env.DETAILS || 'bus test'
};

const flat = Object.fromEntries(Object.entries(msg).map(([k,v]) => [k, String(v)]));

async function main(){
  const c = createClient({ url });
  c.on('error', (e)=>console.error('[redis]', e.message));
  await c.connect();
  const id = await c.xAdd(stream, '*', flat);
  console.log(JSON.stringify({ ok: true, stream, id, msg }));
  await c.quit();
}

main().catch((e)=>{ console.error(JSON.stringify({ ok:false, error: String(e?.message||e) })); process.exit(1); });
