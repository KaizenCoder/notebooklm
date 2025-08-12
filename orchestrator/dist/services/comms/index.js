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
    const ready = client.connect();
    // Canaux conformes aux spécifications ONBOARDING_AI.md
    const AGENTS_GLOBAL = 'agents:global';
    const AGENTS_ORCHESTRATOR = 'agents:orchestrator';
    const AGENTS_PAIR_TEAM03 = 'agents:pair:team03';
    // Fallback vers anciens noms pour compatibilité
    const HEARTBEAT_STREAM = env.REDIS_STREAM_HEARTBEAT || 'coordination_heartbeat';
    const BLOCKERS_STREAM = env.REDIS_STREAM_BLOCKERS || 'coordination_blockers';
    const AUDIT_REQ_STREAM = env.REDIS_STREAM_AUDIT_REQ || 'audit_requests';
    const AUDIT_VERDICT_STREAM = env.REDIS_STREAM_AUDIT_VERDICT || 'auditeur_compliance';
    async function xadd(stream, msg) {
        const parsed = MessageSchema.safeParse(msg);
        if (!parsed.success)
            return;
        const flat = {};
        for (const [k, v] of Object.entries(parsed.data)) {
            flat[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
        await ready;
        await client.xAdd(stream, '*', flat);
    }
    async function publishToMultipleStreams(msg, streams) {
        await ready;
        const promises = streams.map(stream => xadd(stream, msg));
        await Promise.allSettled(promises);
    }
    return {
        async publishHeartbeat(msg) {
            // Publier sur les canaux spécifiés dans ONBOARDING_AI.md
            await publishToMultipleStreams(msg, [AGENTS_GLOBAL, AGENTS_ORCHESTRATOR, AGENTS_PAIR_TEAM03, HEARTBEAT_STREAM]);
        },
        async publishBlocker(msg) {
            // Publier blockers sur canaux critiques
            await publishToMultipleStreams(msg, [AGENTS_GLOBAL, AGENTS_ORCHESTRATOR, BLOCKERS_STREAM]);
        },
        async publishAuditRequest(msg) {
            await publishToMultipleStreams(msg, [AGENTS_GLOBAL, AGENTS_PAIR_TEAM03, AUDIT_REQ_STREAM]);
        },
        async publishAuditVerdict(msg) {
            await publishToMultipleStreams(msg, [AGENTS_GLOBAL, AGENTS_PAIR_TEAM03, AUDIT_VERDICT_STREAM]);
        },
        async close() { try {
            await client.disconnect();
        }
        catch { } }
    };
}
