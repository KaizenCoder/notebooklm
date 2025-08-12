import { createClient } from 'redis';

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const streamsEnv = process.env.STREAMS || 'agents:pair:team03,agents:global';
const streams = streamsEnv.split(',').map(s => s.trim()).filter(Boolean);
const agentId = process.env.AGENT_ID || 'auditor_team03';
const team = process.env.TEAM || 'team03';
const role = process.env.ROLE || 'audit';
const to = process.env.TO || 'orchestrator';
const topic = 'HEARTBEAT';
const event = process.env.EVENT || 'AUDITOR_ALIVE';
const status = process.env.STATUS || 'ONLINE';
const pairId = process.env.PAIR_ID || 'team03';
const intervalMs = Number(process.env.INTERVAL_MS || '600000');

function iso() { return new Date().toISOString(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const client = createClient({ url });
  client.on('error', (e) => console.error('[redis]', e?.message || String(e)));
  await client.connect();
  console.log(`[${iso()}] heartbeat_loop_start url=${url} streams=${streams.join(',')} agent=${agentId} interval_ms=${intervalMs}`);
  while (true) {
    const base = {
      from_agent: agentId,
      team,
      role,
      to,
      topic,
      event,
      status,
      timestamp: iso(),
      correlation_id: `${agentId}-${Math.random().toString(36).slice(2,10)}`,
      task_id: 'hb',
      pair_id: pairId,
      tm_ids: JSON.stringify([pairId]),
      details: 'periodic heartbeat'
    };
    for (const stream of streams) {
      const flat = Object.fromEntries(Object.entries(base).map(([k,v]) => [k, String(v)]));
      try {
        const id = await client.xAdd(stream, '*', flat);
        console.log(JSON.stringify({ ts: iso(), ok: true, stream, id, msg: base }));
      } catch (e) {
        console.error(JSON.stringify({ ts: iso(), ok: false, stream, error: String(e?.message || e) }));
      }
    }
    await sleep(intervalMs);
  }
})().catch((e) => { console.error(`[${iso()}] fatal`, e?.message || String(e)); process.exit(1); });
