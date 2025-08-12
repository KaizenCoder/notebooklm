import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const streamsEnv = process.env.STREAMS || process.env.STREAM || 'agents:pair:team03';
const streams = streamsEnv.split(',').map(s => s.trim()).filter(Boolean);
const group = process.env.GROUP || 'supervision';
const consumer = process.env.CONSUMER || `sup-${Math.random().toString(36).slice(2)}`;

function nowIso() {
  return new Date().toISOString();
}

async function ensureGroup(client, stream, groupName) {
  try {
    await client.xGroupCreate(stream, groupName, '$', { MKSTREAM: true });
    // eslint-disable-next-line no-console
    console.log(`[${nowIso()}] group_created stream=${stream} group=${groupName}`);
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    if (!msg.includes('BUSYGROUP')) throw e;
    // eslint-disable-next-line no-console
    console.log(`[${nowIso()}] group_exists stream=${stream} group=${groupName}`);
  }
}

(async () => {
  const client = createClient({ url: redisUrl });
  client.on('error', (e) => {
    // eslint-disable-next-line no-console
    console.error(`[${nowIso()}] redis_error`, (e && e.message) || String(e));
  });

  await client.connect();
  // eslint-disable-next-line no-console
  console.log(`[${nowIso()}] listener_start url=${redisUrl} streams=${streams.join(',')} group=${group} consumer=${consumer}`);

  for (const s of streams) {
    try { await ensureGroup(client, s, group); } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[${nowIso()}] ensure_group_error stream=${s} group=${group}`, e);
    }
  }

  const keys = streams.map((s) => ({ key: s, id: '>' }));

  while (true) {
    try {
      const res = await client.xReadGroup(group, consumer, keys, { BLOCK: 10000, COUNT: 50 });
      if (!res) {
        // eslint-disable-next-line no-console
        console.log(`[${nowIso()}] idle`);
        continue;
      }
      for (const r of res) {
        const streamName = r.name;
        for (const m of r.messages) {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify({
            ts: nowIso(),
            stream: streamName,
            id: m.id,
            message: m.message,
          }));
          try { await client.xAck(streamName, group, m.id); } catch {}
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[${nowIso()}] read_error`, e && e.message ? e.message : String(e));
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(`[${nowIso()}] fatal`, e && e.message ? e.message : String(e));
  process.exit(1);
});
