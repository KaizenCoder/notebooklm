import { createClient } from 'redis';
import { z } from 'zod';
const MessageSchema = z.object({
    from_agent: z.string().min(1),
    team: z.string().min(1),
    role: z.enum(['spec', 'impl', 'test', 'audit', 'ops', 'coord']),
    tm_ids: z.array(z.string()).min(1),
    task_id: z.union([z.string(), z.number()]),
    subtask_id: z.union([z.string(), z.number()]).optional(),
    event: z.string().min(1),
    status: z.string().min(1),
    severity: z.enum(['INFO', 'WARN', 'CRITICAL']).optional(),
    timestamp: z.string().min(1),
    correlation_id: z.string().min(8),
    details: z.string().max(1500).optional(),
    links: z.array(z.string().url()).max(10).optional(),
    test_refs: z.array(z.string()).max(10).optional(),
    doc_refs: z.array(z.string()).max(10).optional(),
    env: z.enum(['dev', 'ci', 'staging', 'prod']).optional()
});
export function createComms(env) {
    if (!env.REDIS_URL)
        return null;
    const client = createClient({ url: env.REDIS_URL });
    client.on('error', (err) => { /* eslint-disable no-console */ console.error('Redis error', err); });
    client.connect().catch(() => { });
    async function xadd(stream, msg) {
        const parsed = MessageSchema.safeParse(msg);
        if (!parsed.success)
            return; // ne bloque pas la route en cas d'échec de validation
        const flat = {};
        for (const [k, v] of Object.entries(parsed.data)) {
            flat[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
        try {
            await client.xAdd(stream, '*', flat);
        }
        catch { }
    }
    return {
        async publishHeartbeat(msg) { await xadd(env.REDIS_STREAM_HEARTBEAT, msg); },
        async publishBlocker(msg) { await xadd(env.REDIS_STREAM_BLOCKERS, msg); },
        async publishAuditRequest(msg) { await xadd(env.REDIS_STREAM_AUDIT_REQ, msg); },
        async publishAuditVerdict(msg) { await xadd(env.REDIS_STREAM_AUDIT_VERDICT, msg); },
        async close() { try {
            await client.disconnect();
        }
        catch { } }
    };
}
