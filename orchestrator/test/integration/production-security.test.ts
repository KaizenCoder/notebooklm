/**
 * Test de vérification des améliorations de sécurité
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStorageAdapter } from '../../src/adapters/storage';
import { resilienceMetrics } from '../../src/utils/resilience';

describe('Production Security Enhancements', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    resilienceMetrics.reset();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Storage Security', () => {
    it('should enforce security validation in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const adapter = createStorageAdapter('./test-storage-prod');
      
      // Test file extension blocking
      const dangerousBuffer = Buffer.from('dangerous executable');
      await expect(
        adapter.upload(dangerousBuffer, 'virus.exe')
      ).rejects.toThrow('File extension .exe is not allowed for security reasons');
    });

    it('should allow unknown file types in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const adapter = createStorageAdapter('./test-storage-dev');
      const unknownBuffer = Buffer.from('unknown file type');
      
      // This should work in dev but warn
      const file = await adapter.upload(unknownBuffer, 'test.unknown');
      expect(file.mimeType).toBe('application/octet-stream');
    });
  });

  describe('Resilience Metrics', () => {
    it('should collect metrics correctly', async () => {
      const { withRetry } = await import('../../src/utils/resilience');
      
      // Test successful operation
      await withRetry(
        async () => 'success',
        { maxAttempts: 3, delayMs: 10 }
      );
      
      // Test failed operation
      try {
        await withRetry(
          async () => { throw new Error('fail'); },
          { maxAttempts: 2, delayMs: 10 }
        );
      } catch (e) {
        // Expected to fail
      }
      
      const metrics = resilienceMetrics.getMetrics();
      expect(metrics.operationSuccess).toBe(1);
      expect(metrics.operationFailures).toBe(2); // 2 attempts that failed
      expect(metrics.retryAttempts).toBe(1); // 1 retry attempt
    });
  });

  describe('Configuration', () => {
    it('should use production defaults correctly', async () => {
      const { PRODUCTION_DEFAULTS } = await import('../../src/utils/resilience');
      
      expect(PRODUCTION_DEFAULTS.RETRY.maxAttempts).toBe(3);
      expect(PRODUCTION_DEFAULTS.RETRY.delayMs).toBe(500);
      expect(PRODUCTION_DEFAULTS.TIMEOUT.timeoutMs).toBe(10000);
      expect(PRODUCTION_DEFAULTS.CIRCUIT_BREAKER.threshold).toBe(5);
    });

    it('should load adapter config correctly', async () => {
      const { adapterConfig } = await import('../../src/config/adapters');
      
      expect(adapterConfig.storage.basePath).toBeDefined();
      expect(adapterConfig.whisper.baseUrl).toBeDefined();
      expect(adapterConfig.coqui.baseUrl).toBeDefined();
    });
  });
});
