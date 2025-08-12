import { createClient } from 'redis';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = (i + 1 < argv.length && !argv[i + 1].startsWith('--')) ? argv[++i] : 'true';
      args[key] = val;
    }
  }
  return args;
}

function toJsonStringOrNull(value) {
  if (value == null || value === '') return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) || typeof parsed === 'object') {
      return JSON.stringify(parsed);
    }
  } catch {}
  return String(value);
}

function nowIso() { return new Date().toISOString(); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function xadd(client, stream, msg) {
  const flat = Object.fromEntries(Object.entries(msg).map(([k, v]) => [k, String(v)]));
  const id = await client.xAdd(stream, '*', flat);
  return id;
}

async function main() {
  const args = parseArgs(process.argv);

  const url = process.env.REDIS_URL || args.redis || 'redis://127.0.0.1:6379';
  const streamsEnv = (process.env.STREAMS || args.streams || 'agents:pair:team03,agents:global');
  const streams = streamsEnv.split(',').map((s) => s.trim()).filter(Boolean);

  const agentId = process.env.AGENT_ID || args.agent || 'agent_generic';
  const team = process.env.TEAM || args.team || 'teamXX';
  const role = process.env.ROLE || args.role || 'impl';
  const to = process.env.TO || args.to || 'orchestrator';
  const pairId = process.env.PAIR_ID || args.pair || team;

  const topic = 'HEARTBEAT';
  const eventBoot = process.env.EVENT_BOOT || args.event_boot || 'AGENT_ONLINE';
  const eventPing = process.env.EVENT_PING || args.event_ping || (role === 'audit' ? 'AUDITOR_ALIVE' : 'IMPL_ALIVE');
  const eventShutdown = process.env.EVENT_SHUTDOWN || args.event_shutdown || 'AGENT_OFFLINE';

  const statusOnline = process.env.STATUS_ONLINE || args.status_online || 'ONLINE';
  const statusOffline = process.env.STATUS_OFFLINE || args.status_offline || 'OFFLINE';

  const intervalMs = Number(process.env.INTERVAL_MS || args.interval_ms || '600000');
  const jitterMs = Number(process.env.JITTER_MS || args.jitter_ms || '30000');

  const tmIdsRaw = process.env.TM_IDS || args.tm_ids || JSON.stringify([pairId]);
  const tmIdsJson = toJsonStringOrNull(tmIdsRaw) || JSON.stringify([pairId]);

  const lastSeenTtl = Number(process.env.LAST_SEEN_TTL || args.last_seen_ttl || '0');
  const lastSeenKey = `agent:lastseen:${agentId}`;

  const mode = (args.mode || 'loop').toLowerCase();

  const client = createClient({ url });
  client.on('error', (e) => console.error('[redis]', e?.message || String(e)));
  await client.connect();

  console.log(`[${nowIso()}] agent_heartbeat_start url=${url} streams=${streams.join(',')} agent=${agentId} team=${team} role=${role} mode=${mode}`);

  async function publishOnce(event, status, details) {
    const base = {
      from_agent: agentId,
      team,
      role,
      to,
      topic,
      event,
      status,
      timestamp: nowIso(),
      correlation_id: `${agentId}-${Math.random().toString(36).slice(2, 10)}`,
      task_id: 'hb',
      pair_id: pairId,
      tm_ids: tmIdsJson,
      details,
    };
    for (const stream of streams) {
      try {
        const id = await xadd(client, stream, base);
        console.log(JSON.stringify({ ts: nowIso(), ok: true, stream, id, msg: base }));
      } catch (e) {
        console.error(JSON.stringify({ ts: nowIso(), ok: false, stream, error: String(e?.message || e) }));
      }
    }
    if (lastSeenTtl > 0) {
      try { await client.setEx(lastSeenKey, lastSeenTtl, nowIso()); } catch {}
    }
  }

  if (mode === 'boot') {
    await publishOnce(eventBoot, statusOnline, 'boot heartbeat');
    await client.quit();
    return;
  }

  if (mode === 'shutdown') {
    await publishOnce(eventShutdown, statusOffline, 'shutdown heartbeat');
    await client.quit();
    return;
  }

  // loop mode
  await publishOnce(eventBoot, statusOnline, 'boot heartbeat');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const jitter = Math.floor((Math.random() * (2 * jitterMs + 1)) - jitterMs);
    const delay = Math.max(1000, intervalMs + jitter);
    await sleep(delay);
    await publishOnce(eventPing, statusOnline, 'periodic heartbeat');
  }
}

main().catch((e) => { console.error(`[${nowIso()}] fatal`, e?.message || String(e)); process.exit(1); });
