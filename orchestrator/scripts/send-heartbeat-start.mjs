import { createClient } from 'redis';
import { randomUUID } from 'crypto';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

(async () => {
  const client = createClient({ url: redisUrl });
  client.on('error', (e) => console.error('redis_error', e && e.message ? e.message : String(e)));
  await client.connect();

  const now = new Date().toISOString();
  const fields = [
    'from_agent','impl_team03',
    'team','team03',
    'role','impl',
    'to','orchestrator',
    'topic','HEARTBEAT',
    'event','TASK_START',
    'status','IN_PROGRESS',
    'tm_ids','["T3.1"]',
    'task_id','T3',
    'pair_id','team03',
    'timestamp', now,
    'correlation_id', randomUUID(),
    'details','Début impl T3'
  ];

  const addedId = await client.sendCommand(['XADD', 'agents:global', '*', ...fields]);
  console.log('HEARTBEAT_START_SENT', addedId);
  await client.quit();
})().catch(async (e) => {
  console.error('fatal', e && e.message ? e.message : String(e));
  process.exit(1);
});
