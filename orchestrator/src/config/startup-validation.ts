import { validateEnvironment, validateRequiredServices, validateGpuConfiguration } from './environment.js';

export async function validateStartupConfiguration(): Promise<void> {
  console.log('🔧 Validating startup configuration...');
  
  // Step 1: Validate environment variables
  const env = validateEnvironment();
  console.log('✅ Environment variables validated');
  
  // Step 2: Check required services configuration
  const missingServices = validateRequiredServices(env);
  if (missingServices.length > 0) {
    console.error('❌ Missing required service configurations:');
    missingServices.forEach(service => console.error(`  - ${service}`));
    process.exit(1);
  }
  console.log('✅ Required services configured');
  
  // Step 3: GPU configuration check
  if (!validateGpuConfiguration(env)) {
    console.error('❌ GPU-only mode requires OLLAMA_EMBED_MODEL and OLLAMA_CHAT_MODEL');
    process.exit(1);
  }
  console.log(`✅ GPU configuration valid (GPU_ONLY=${env.GPU_ONLY})`);
  
  // Step 4: Runtime configuration summary
  console.log('📊 Configuration summary:');
  console.log(`  - Node environment: ${env.NODE_ENV}`);
  console.log(`  - Port: ${env.PORT}`);
  console.log(`  - Database timeout: ${env.DB_TIMEOUT_MS}ms`);
  console.log(`  - Ollama timeout: ${env.OLLAMA_TIMEOUT_MS}ms`);
  console.log(`  - Batch size: ${env.DB_UPSERT_BATCH_SIZE}`);
  console.log(`  - Log level: ${env.LOG_LEVEL} (sample rate: ${env.LOG_SAMPLE_RATE})`);
  console.log(`  - Retry attempts: ${env.RETRY_MAX_ATTEMPTS}`);
  
  console.log('🚀 Startup validation completed successfully');
}
