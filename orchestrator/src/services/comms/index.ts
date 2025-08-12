import { createClient } from 'redis';
import { z } from 'zod';
import type { Env } from '../../env.js';

const MessageSchema = z.object({
  from_agent: z.string().min(1),
  team: z.string().min(1),
  role: z.enum(['spec','impl','test','audit','ops','coord']),
  tm_ids: z.array(z.string()).min(1),
  task_id: z.union([z.string(), z.number()]),
  subtask_id: z.union([z.string(), z.number()]).optional(),
  event: z.string().min(1),
  status: z.string().min(1),
  severity: z.enum(['INFO','WARN','CRITICAL']).optional(),
  timestamp: z.string().min(1),
  correlation_id: z.string().min(1),
  details: z.string().max(1500).optional(),
  links: z.array(z.string().url()).max(10).optional(),
  test_refs: z.array(z.string()).max(10).optional(),
  doc_refs: z.array(z.string()).max(10).optional(),
  env: z.enum(['dev','ci','staging','prod']).optional()
});

export type InterTeamMessage = z.infer<typeof MessageSchema>;

export type Comms = {
  publishHeartbeat: (msg: InterTeamMessage) => Promise<void>;
  publishBlocker: (msg: InterTeamMessage & { owner?: string }) => Promise<void>;
  publishAuditRequest: (msg: InterTeamMessage) => Promise<void>;
  publishAuditVerdict: (msg: InterTeamMessage) => Promise<void>;
  close: () => Promise<void>;
};

export function createComms(env: Env): Comms | null {
  if (!env.REDIS_URL) return null;
  const client = createClient({ url: env.REDIS_URL });
  client.on('error', (err) => { /* eslint-disable no-console */ console.error('Redis error', err); });
  const ready = client.connect();

  const HEARTBEAT_STREAM = (env as any).REDIS_STREAM_HEARTBEAT || 'coordination_heartbeat';
  const BLOCKERS_STREAM = (env as any).REDIS_STREAM_BLOCKERS || 'coordination_blockers';
  const AUDIT_REQ_STREAM = (env as any).REDIS_STREAM_AUDIT_REQ || 'audit_requests';
  const AUDIT_VERDICT_STREAM = (env as any).REDIS_STREAM_AUDIT_VERDICT || 'auditeur_compliance';

  async function xadd(stream: string, msg: InterTeamMessage & Record<string, unknown>) {
    const parsed = MessageSchema.safeParse(msg);
    if (!parsed.success) return;
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      flat[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
    await ready;
    await client.xAdd(stream, '*', flat as any);
  }

  return {
    async publishHeartbeat(msg) { await xadd(HEARTBEAT_STREAM, msg); },
    async publishBlocker(msg) { await xadd(BLOCKERS_STREAM, msg); },
    async publishAuditRequest(msg) { await xadd(AUDIT_REQ_STREAM, msg); },
    async publishAuditVerdict(msg) { await xadd(AUDIT_VERDICT_STREAM, msg); },
    async close() { try { await client.disconnect(); } catch {} }
  };
}
