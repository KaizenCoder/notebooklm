import { createClient } from 'redis';

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const stream = 'agents:pair:team03';

const msg = {
  from_agent: 'orchestrator',
  team: 'team03',
  role: 'orchestrator',
  to: 'auditor_team03',
  topic: 'STATUS_UPDATE',
  event: 'ORCH_ACK',
  status: 'ACK',
  timestamp: new Date().toISOString(),
  correlation_id: `orch-ack-${Math.random().toString(36).slice(2,10)}`,
  task_id: 'tm-03',
  tm_ids: JSON.stringify(['tm-03']),
  pair_id: 'team03',
  details: 'Accusé de réception: messages reçus via Redis (pair + global)'
};

const flat = Object.fromEntries(Object.entries(msg).map(([k,v]) => [k, String(v)]));

(async () => {
  const client = createClient({ url });
  client.on('error', (e)=>console.error('[redis]', e?.message || String(e)));
  await client.connect();
  const id = await client.xAdd(stream, '*', flat);
  console.log(JSON.stringify({ ok: true, stream, id, msg }, null, 2));
  await client.quit();
})().catch((e)=>{
  console.error(JSON.stringify({ ok:false, error: String(e?.message||e) }));
  process.exit(1);
});
