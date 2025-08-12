// Publish a heartbeat to multiple Redis streams
// Usage:
//   node scripts/redis-send-heartbeat-multi.cjs [EVENT] [STATUS] [TASK_ID] [STREAMS_CSV]
// Defaults:
//   EVENT=HEARTBEAT STATUS=PING TASK_ID=ops STREAMS_CSV="agents:global,agents:pair:team03"

const { createClient } = require('redis');
const { randomUUID } = require('crypto');

(async () => {
  const EVENT = (process.argv[2] || 'HEARTBEAT').toUpperCase();
  const STATUS = (process.argv[3] || 'PING').toUpperCase();
  const TASK_ID = String(process.argv[4] || 'ops');
  const STREAMS_CSV = process.argv[5] || process.env.HEARTBEAT_STREAMS || 'agents:global,agents:pair:team03';
  const STREAMS = STREAMS_CSV.split(',').map(s => s.trim()).filter(Boolean);

  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const client = createClient({ url });
  client.on('error', (e) => console.error('Redis error:', e.message));
  await client.connect();

  const now = new Date().toISOString();
  const correlation = randomUUID();
  const baseFields = [
    'from_agent','orchestrator',
    'team','orange',
    'role','impl',
    'topic','HEARTBEAT',
    'event', EVENT,
    'status', STATUS,
    'severity','INFO',
    'timestamp', now,
    'correlation_id', correlation,
    'task_id', TASK_ID,
    'tm_ids','["ops"]',
    'details','multi-stream heartbeat'
  ];

  for (const stream of STREAMS) {
    const addedId = await client.sendCommand(['XADD', stream, '*', ...baseFields]);
    // eslint-disable-next-line no-console
    console.log('HEARTBEAT_SENT', stream, addedId, EVENT, STATUS, TASK_ID);
  }

  await client.quit();
})().catch(async (e) => {
  console.error('Failure sending multi-heartbeat:', e);
  process.exit(1);
});
