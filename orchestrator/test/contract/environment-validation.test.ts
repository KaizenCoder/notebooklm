// Test environment validation with various scenarios

// Save original env
const originalEnv = { ...process.env };

// Test 1: Valid minimal configuration
process.env = {
  ...originalEnv,
  POSTGRES_DSN: 'postgresql://test:test@localhost:5432/test',
  OLLAMA_BASE_URL: 'http://localhost:11434',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text',
  NOTEBOOK_GENERATION_AUTH: 'test-token-12345'
};

// This should not throw
import { validateEnvironment, validateRequiredServices } from '../../src/config/environment.js';

const validEnv = validateEnvironment();
if (!validEnv.POSTGRES_DSN || !validEnv.OLLAMA_BASE_URL) {
  console.error('valid environment should parse successfully');
  process.exit(1);
}

const missingServices = validateRequiredServices(validEnv);
if (missingServices.length > 0) {
  console.error('valid environment should have no missing services');
  process.exit(1);
}

// Test 2: Missing required variables (should fail)
process.env = { ...originalEnv };
delete process.env.POSTGRES_DSN;
delete process.env.OLLAMA_BASE_URL;

try {
  // Reset cache for new validation
  delete require.cache[require.resolve('../../src/config/environment.js')];
  const { validateEnvironment: validateEnv2 } = require('../../src/config/environment.js');
  validateEnv2();
  console.error('missing required env should throw validation error');
  process.exit(1);
} catch (error) {
  // Expected - validation should fail
  if (!error.message || !error.issues) {
    console.error('expected ZodError with validation issues');
    process.exit(1);
  }
}

// Test 3: Invalid values
process.env = {
  ...originalEnv,
  POSTGRES_DSN: 'postgresql://test:test@localhost:5432/test',
  OLLAMA_BASE_URL: 'not-a-url',
  OLLAMA_EMBED_MODEL: 'nomic-embed-text',
  NOTEBOOK_GENERATION_AUTH: '123', // too short
  PORT: '99999999', // too high
  GPU_ONLY: '2' // invalid value
};

try {
  delete require.cache[require.resolve('../../src/config/environment.js')];
  const { validateEnvironment: validateEnv3 } = require('../../src/config/environment.js');
  validateEnv3();
  console.error('invalid env values should throw validation error');
  process.exit(1);
} catch (error) {
  // Expected - validation should fail for multiple issues
}

// Restore original environment
process.env = originalEnv;

console.log('PASS environment-validation');
