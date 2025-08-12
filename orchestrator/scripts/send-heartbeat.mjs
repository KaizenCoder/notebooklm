import { createClient } from 'redis';

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const stream = process.env.STREAM || 'coordination_heartbeat';
const now = new Date().toISOString();

const message = {
  from_agent: process.env.FROM_AGENT || 'manual_agent',
  team: process.env.TEAM || 'orange',
  role: process.env.ROLE || 'impl',
  tm_ids: process.env.TM_IDS || '["manual"]',
  task_id: process.env.TASK_ID || 'manual-1',
  event: process.env.EVENT || 'TEST',
  status: process.env.STATUS || 'IN_PROGRESS',
  timestamp: now,
  correlation_id: process.env.CORRELATION_ID || `manual-${Math.random().toString(36).slice(2,10)}`,
  details: process.env.DETAILS || 'manual heartbeat'
};

const flat = Object.fromEntries(Object.entries(message).map(([k,v]) => [k, String(v)]));

async function main(){
  const c = createClient({ url });
  c.on('error', (e)=>console.error('[redis]', e.message));
  await c.connect();
  const id = await c.xAdd(stream, '*', flat);
  console.log(JSON.stringify({ ok: true, stream, id, message }));
  await c.quit();
}

main().catch((e)=>{ console.error(JSON.stringify({ ok:false, error: String(e?.message||e) })); process.exit(1); });
