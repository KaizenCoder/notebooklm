import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const STREAM = process.env.PROBE_STREAM || 'coordination_heartbeat';

function iso() { return new Date().toISOString(); }

async function main() {
  const client = createClient({ url: REDIS_URL });
  client.on('error', (e) => console.error('[redis]', e.message));
  await client.connect();
  const correlation = `probe-${Math.random().toString(36).slice(2, 10)}`;
  const payload = {
    from_agent: 'probe',
    team: 'orange',
    role: 'impl',
    tm_ids: ['probe'],
    task_id: '0',
    event: 'TEST',
    status: 'IN_PROGRESS',
    timestamp: iso(),
    correlation_id: correlation
  };
  const flat = Object.fromEntries(
    Object.entries(payload).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
  );

  const id = await client.xAdd(STREAM, '*', flat);
  const last = await client.xRevRange(STREAM, '+', '-', { COUNT: 1 });

  console.log(JSON.stringify({ ok: true, xadd_id: id, last }));
  await client.quit();
}

main().catch((e) => { console.error(JSON.stringify({ ok: false, error: String(e?.message || e) })); process.exit(1); });
