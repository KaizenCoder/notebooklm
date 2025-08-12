import { createClient } from 'redis';
const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const stream = process.env.STREAM || 'coordination_heartbeat';
const count = Number(process.env.COUNT || '20');
const c = createClient({ url });
await c.connect();
const msgs = await c.xRevRange(stream, '+', '-', { COUNT: count });
console.log(JSON.stringify(msgs, null, 2));
await c.quit();
