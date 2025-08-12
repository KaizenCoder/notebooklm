import { z, ZodIssue } from 'zod';

const EnvSchema = z.object({
  PORT: z.string().default('8000'),
  NOTEBOOK_GENERATION_AUTH: z.string().min(1, 'Missing NOTEBOOK_GENERATION_AUTH'),
  POSTGRES_DSN: z.string().min(1, 'Missing POSTGRES_DSN').optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://ollama:11434'),
  OLLAMA_EMBED_MODEL: z.string().optional(),
  OLLAMA_LLM_MODEL: z.string().optional(),
  GPU_ONLY: z.string().optional(), // '1' to enforce
  IDEMPOTENCY_TTL_MS: z.string().optional(), // TTL for idempotency store
  WHISPER_ASR_URL: z.string().url().optional()
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
