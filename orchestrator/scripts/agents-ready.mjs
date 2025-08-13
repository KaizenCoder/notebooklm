import { createClient } from 'redis';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.replace(/^--/, '');
      const v = (i + 1 < argv.length && !argv[i + 1].startsWith('--')) ? argv[++i] : 'true';
      args[k] = v;
    }
  }
  return args;
}

function iso() { return new Date().toISOString(); }

(async () => {
  const args = parseArgs(process.argv);
  const url = process.env.REDIS_URL || args.redis || 'redis://127.0.0.1:6379';
  const pattern = args.pattern || 'agent:lastseen:*';
  const client = createClient({ url });
  client.on('error', (e) => console.error('[redis]', e?.message || String(e)));
  await client.connect();
  try {
    const keys = await client.keys(pattern);
    const now = Date.now();
    const out = [];
    for (const key of keys) {
      const val = await client.get(key);
      const ttl = await client.ttl(key);
      const agentId = key.replace('agent:lastseen:', '');
      out.push({ agentId, lastSeen: val, ttlSeconds: ttl });
    }
    out.sort((a, b) => String(a.agentId).localeCompare(String(b.agentId)));
    console.log(JSON.stringify({ ts: iso(), count: out.length, agents: out }, null, 2));
  } finally {
    await client.quit();
  }
})().catch((e) => { console.error('[fatal]', e?.message || String(e)); process.exit(1); });


