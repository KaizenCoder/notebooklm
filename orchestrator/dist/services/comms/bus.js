import { createClient } from 'redis';
import { z } from 'zod';
const BusMessageSchema = z.object({
    from_agent: z.string().min(1),
    team: z.string().min(1),
    role: z.enum(['spec', 'impl', 'test', 'audit', 'ops', 'coord', 'orchestrator']).optional(),
    to: z.string().min(1),
    topic: z.string().min(1),
    event: z.string().min(1),
    status: z.string().min(1),
    tm_ids: z.array(z.string()).min(0).optional(),
    task_id: z.union([z.string(), z.number()]).optional(),
    subtask_id: z.union([z.string(), z.number()]).optional(),
    severity: z.enum(['INFO', 'WARN', 'CRITICAL']).optional(),
    timestamp: z.string().min(1),
    correlation_id: z.string().min(1),
    pair_id: z.string().optional(),
    details: z.string().max(2000).optional(),
    links: z.array(z.string().url()).max(10).optional(),
    test_refs: z.array(z.string()).max(10).optional(),
    doc_refs: z.array(z.string()).max(10).optional(),
    env: z.enum(['dev', 'ci', 'staging', 'prod']).optional()
});
export function createBus(env) {
    if (!env.REDIS_URL)
        return null;
    const client = createClient({ url: env.REDIS_URL });
    client.on('error', (e) => { /* eslint-disable no-console */ console.error('[redis]', e?.message || String(e)); });
    const ready = client.connect();
    async function ensureGroup(stream, group) {
        await ready;
        try {
            await client.xGroupCreate(stream, group, '$', { MKSTREAM: true });
        }
        catch (e) {
            const msg = String(e?.message || e);
            if (!msg.includes('BUSYGROUP'))
                throw e;
        }
    }
    async function publish(stream, msg) {
        await ready;
        const parsed = BusMessageSchema.safeParse(msg);
        if (!parsed.success)
            return null;
        const flat = {};
        for (const [k, v] of Object.entries(parsed.data))
            flat[k] = typeof v === 'string' ? v : JSON.stringify(v);
        return client.xAdd(stream, '*', flat);
    }
    function consume(streams, group, consumer, onMessage) {
        let stopped = false;
        (async () => {
            await ready;
            for (const s of streams) {
                try {
                    await ensureGroup(s, group);
                }
                catch { }
            }
            const ids = streams.map(() => '>');
            const opts = { BLOCK: 1000, COUNT: 50 };
            while (!stopped) {
                try {
                    const res = await client.xReadGroup(group, consumer, streams.map((s, i) => ({ key: s, id: ids[i] })), opts);
                    if (!res)
                        continue;
                    for (const r of res) {
                        for (const m of r.messages) {
                            try {
                                await onMessage(r.name, m.id, m.message);
                                await client.xAck(r.name, group, m.id);
                            }
                            catch { }
                        }
                    }
                }
                catch {
                    // keep loop
                }
            }
        })();
        return { stop: async () => { stopped = true; try {
                await client.quit();
            }
            catch { } } };
    }
    return { ensureGroup, publish, consume, client };
}
