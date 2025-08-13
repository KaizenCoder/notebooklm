import { z, ZodIssue } from 'zod';
import { config } from 'dotenv';

// Load .env file (override to avoid host env clashes)
config({ override: true });

const EnvSchema = z.object({
  PORT: z.string().default('8000'),
  NOTEBOOK_GENERATION_AUTH: z.string().min(1, 'Missing NOTEBOOK_GENERATION_AUTH'),
  POSTGRES_DSN: z.string().min(1, 'Missing POSTGRES_DSN').optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://ollama:11434'),
  OLLAMA_EMBED_MODEL: z.string().optional(),
  OLLAMA_LLM_MODEL: z.string().optional(),
  OLLAMA_TIMEOUT_MS: z.string().optional(),
  GPU_ONLY: z.string().optional(),
  IDEMPOTENCY_TTL_MS: z.string().optional(),
  WHISPER_ASR_URL: z.string().url().optional(),
  COQUI_TTS_URL: z.string().url().optional(),
  STORAGE_BASE_URL: z.string().url().optional(),
  NO_MOCKS: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  REDIS_STREAM_HEARTBEAT: z.string().default('coordination_heartbeat'),
  REDIS_STREAM_BLOCKERS: z.string().default('coordination_blockers'),
  REDIS_STREAM_AUDIT_REQ: z.string().default('audit_requests'),
  REDIS_STREAM_AUDIT_VERDICT: z.string().default('auditeur_compliance'),
  COMMS_ORCHESTRATOR_EMIT: z.string().optional(),
  STREAM_GLOBAL: z.string().default('agents:global'),
  STREAM_ORCH_INBOX: z.string().default('agents:orchestrator'),
  STREAM_PAIR_PREFIX: z.string().default('agents:pair:'),
  COMMS_MODE: z.string().default('multi-stream'),
  COMMS_COMPAT_LEGACY: z.string().optional(),
  // PDF Bridge configuration
  PDF_BRIDGE_ENABLED: z.string().default('true'),
  PDF_BRIDGE_TIMEOUT: z.string().default('30'),
  PDF_BRIDGE_MAX_PAGES: z.string().default('1000'),
  PDF_BRIDGE_PYTHON_PATH: z.string().optional()
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i: ZodIssue) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`ENV validation failed: ${msg}`);
  }
  return parsed.data;
}
