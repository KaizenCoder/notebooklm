// Read latest entries from Redis streams
// Usage:
//   node scripts/redis-read-latest.cjs [STREAMS_CSV] [COUNT]
// Defaults:
//   STREAMS_CSV="agents:global,agents:pair:team03" COUNT=5

const { createClient } = require('redis');

(async () => {
  const STREAMS_CSV = process.argv[2] || 'agents:global,agents:pair:team03';
  const COUNT = parseInt(process.argv[3] || '5', 10);
  const STREAMS = STREAMS_CSV.split(',').map(s => s.trim()).filter(Boolean);

  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const client = createClient({ url });
  client.on('error', (e) => console.error('Redis error:', e.message));
  await client.connect();

  for (const stream of STREAMS) {
    const entries = await client.sendCommand(['XREVRANGE', stream, '+', '-', 'COUNT', String(COUNT)]);
    console.log(`STREAM ${stream} (latest ${COUNT}):`);
    if (!entries || entries.length === 0) {
      console.log('  (no messages)');
      continue;
    }
    for (const [id, arr] of entries) {
      const obj = {};
      for (let i = 0; i < arr.length; i += 2) obj[arr[i]] = arr[i+1];
      console.log('  ID:', id);
      console.log('  Fields:', JSON.stringify(obj));
    }
  }

  await client.quit();
})().catch(async (e) => {
  console.error('Failure reading latest entries:', e);
  process.exit(1);
});
