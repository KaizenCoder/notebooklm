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
    'to','auditor',
    'topic','AUDIT_REQUEST',
    'event','READY_FOR_AUDIT',
    'status','READY',
    'tm_ids','["T3"]',
    'task_id','T3',
    'pair_id','team03',
    'links','["https://github.com/KaizenCoder/notebooklm/pull/5"]',
    'timestamp', now,
    'correlation_id', randomUUID(),
    'details','Bundle prêt pour audit'
  ];

  const addedId = await client.sendCommand(['XADD', 'agents:pair:team03', '*', ...fields]);
  console.log('AUDIT_REQUEST_SENT', addedId);
  await client.quit();
})().catch(async (e) => {
  console.error('fatal', e && e.message ? e.message : String(e));
  process.exit(1);
});
