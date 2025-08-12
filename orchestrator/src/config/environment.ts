import { z } from 'zod';

// Comprehensive environment schema with strict validation
const environmentSchema = z.object({
  // Core application
  PORT: z.coerce.number().min(1024).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database
  POSTGRES_DSN: z.string().min(1, 'POSTGRES_DSN is required'),
  DB_TIMEOUT_MS: z.coerce.number().min(1000).max(60000).default(10000),
  DB_UPSERT_BATCH_SIZE: z.coerce.number().min(1).max(1000).default(100),
  
  // Ollama/LLM
  OLLAMA_BASE_URL: z.string().url('OLLAMA_BASE_URL must be valid URL'),
  OLLAMA_EMBED_MODEL: z.string().min(1, 'OLLAMA_EMBED_MODEL is required'),
  OLLAMA_CHAT_MODEL: z.string().min(1).default('llama3.1'),
  OLLAMA_TIMEOUT_MS: z.coerce.number().min(1000).max(300000).default(30000),
  
  // GPU enforcement
  GPU_ONLY: z.coerce.number().min(0).max(1).default(0),
  
  // Authentication
  NOTEBOOK_GENERATION_AUTH: z.string().min(8, 'NOTEBOOK_GENERATION_AUTH must be at least 8 characters'),
  
  // Logging & observability
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1),
  
  // Idempotency & resilience
  IDEMPOTENCY_TTL_MS: z.coerce.number().min(60000).max(86400000).default(3600000), // 1h default
  RETRY_MAX_ATTEMPTS: z.coerce.number().min(1).max(10).default(3),
  RETRY_BASE_DELAY_MS: z.coerce.number().min(100).max(5000).default(1000),
  RETRY_MAX_DELAY_MS: z.coerce.number().min(1000).max(30000).default(10000),
  RETRY_BACKOFF_MULTIPLIER: z.coerce.number().min(1).max(5).default(2),
  
  // Rate limiting (for upcoming Task 11)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).max(3600000).default(60000).optional(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).max(10000).default(100).optional(),
  
  // Webhook callbacks
  ORCHESTRATOR_CALLBACK_URL: z.string().url().optional(),
  WEBHOOK_TIMEOUT_MS: z.coerce.number().min(1000).max(60000).default(5000).optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

let cachedEnv: Environment | null = null;

export function validateEnvironment(): Environment {
  if (cachedEnv) return cachedEnv;
  
  try {
    cachedEnv = environmentSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      console.error('\nRequired environment variables:');
      console.error('  POSTGRES_DSN=postgresql://user:pass@localhost:5432/dbname');
      console.error('  OLLAMA_BASE_URL=http://localhost:11434');
      console.error('  OLLAMA_EMBED_MODEL=nomic-embed-text');
      console.error('  NOTEBOOK_GENERATION_AUTH=your-secret-token');
    } else {
      console.error('❌ Unexpected environment validation error:', error);
    }
    process.exit(1);
  }
}

export function getEnvironment(): Environment {
  if (!cachedEnv) {
    throw new Error('Environment not validated. Call validateEnvironment() first.');
  }
  return cachedEnv;
}

// Validation helpers for runtime checks
export function validateRequiredServices(env: Environment): string[] {
  const missing: string[] = [];
  
  // Check critical services
  if (!env.POSTGRES_DSN) missing.push('POSTGRES_DSN');
  if (!env.OLLAMA_BASE_URL) missing.push('OLLAMA_BASE_URL');
  if (!env.OLLAMA_EMBED_MODEL) missing.push('OLLAMA_EMBED_MODEL');
  if (!env.NOTEBOOK_GENERATION_AUTH || env.NOTEBOOK_GENERATION_AUTH.length < 8) {
    missing.push('NOTEBOOK_GENERATION_AUTH (min 8 chars)');
  }
  
  return missing;
}

export function validateGpuConfiguration(env: Environment): boolean {
  if (env.GPU_ONLY === 1) {
    // In GPU-only mode, we need these models available
    return !!(env.OLLAMA_EMBED_MODEL && env.OLLAMA_CHAT_MODEL);
  }
  return true;
}
