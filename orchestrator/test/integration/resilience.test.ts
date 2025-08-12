/**
 * Integration tests for resilience utilities
 * Tests for Task 17: Resilience & Fault Tolerance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  withTimeout,
  TimeoutError,
  RetryableError,
  CircuitBreaker,
  createResilientOllamaAdapter
} from '../../src/utils/resilience';

describe('Resilience Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation, {
        maxAttempts: 3,
        delayMs: 100
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(operation, {
        maxAttempts: 3,
        delayMs: 10
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw RetryableError after max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('persistent failure'));
      
      await expect(
        withRetry(operation, {
          maxAttempts: 2,
          delayMs: 10
        })
      ).rejects.toThrow(RetryableError);
      
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should respect retry condition', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('validation error'));
      
      await expect(
        withRetry(operation, {
          maxAttempts: 3,
          delayMs: 10,
          retryCondition: (error: Error) => !error.message.includes('validation')
        })
      ).rejects.toThrow('validation error');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should implement exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      
      await withRetry(operation, {
        maxAttempts: 3,
        delayMs: 100,
        backoffMultiplier: 2
      });
      
      const endTime = Date.now();
      
      // Should have waited at least 100ms + 200ms = 300ms
      expect(endTime - startTime).toBeGreaterThan(250);
    });
  });

  describe('withTimeout', () => {
    it('should complete operation within timeout', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withTimeout(operation, {
        timeoutMs: 1000
      });
      
      expect(result).toBe('success');
    });

    it('should throw TimeoutError when operation exceeds timeout', async () => {
      const operation = vi.fn(() => new Promise(resolve => setTimeout(resolve, 200)));
      
      await expect(
        withTimeout(operation, {
          timeoutMs: 100,
          timeoutMessage: 'Custom timeout message'
        })
      ).rejects.toThrow(TimeoutError);
    });

    it('should include timeout duration in error', async () => {
      const operation = vi.fn(() => new Promise(resolve => setTimeout(resolve, 200)));
      
      try {
        await withTimeout(operation, { timeoutMs: 100 });
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        expect((error as TimeoutError).timeoutMs).toBe(100);
      }
    });
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(3, 1000, 5000);
    });

    it('should execute operation when circuit is closed', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState().state).toBe('CLOSED');
    });

    it('should open circuit after threshold failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('failure'));
      
      // Fail 3 times to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch {}
      }
      
      expect(circuitBreaker.getState().state).toBe('OPEN');
      
      // Next call should immediately fail
      await expect(
        circuitBreaker.execute(operation)
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to half-open after reset timeout', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');
      
      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(operation);
        } catch {}
      }
      
      expect(circuitBreaker.getState().state).toBe('OPEN');
      
      // Fast-forward time to exceed reset timeout
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6000);
      
      // Next successful call should close circuit
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState().state).toBe('CLOSED');
    });
  });

  describe('createResilientOllamaAdapter', () => {
    let mockAdapter: any;
    let resilientAdapter: any;

    beforeEach(() => {
      mockAdapter = {
        generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
        chat: vi.fn().mockResolvedValue({ message: 'Hello' })
      };
      resilientAdapter = createResilientOllamaAdapter(mockAdapter);
    });

    it('should wrap generateEmbedding with resilience', async () => {
      const result = await resilientAdapter.generateEmbedding('test text');
      
      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockAdapter.generateEmbedding).toHaveBeenCalledWith('test text');
    });

    it('should wrap chat with resilience', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await resilientAdapter.chat(messages);
      
      expect(result).toEqual({ message: 'Hello' });
      expect(mockAdapter.chat).toHaveBeenCalledWith(messages);
    });

    it('should retry on network errors', async () => {
      mockAdapter.generateEmbedding
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue([0.1, 0.2, 0.3]);
      
      const result = await resilientAdapter.generateEmbedding('test');
      
      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockAdapter.generateEmbedding).toHaveBeenCalledTimes(3);
    });

    it('should not retry on validation errors', async () => {
      mockAdapter.generateEmbedding.mockRejectedValue(new Error('validation failed'));
      
      await expect(
        resilientAdapter.generateEmbedding('test')
      ).rejects.toThrow('validation failed');
      
      expect(mockAdapter.generateEmbedding).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Types', () => {
    it('should create TimeoutError with correct properties', () => {
      const error = new TimeoutError('Operation timed out', 5000);
      
      expect(error.name).toBe('TimeoutError');
      expect(error.message).toBe('Operation timed out');
      expect(error.timeoutMs).toBe(5000);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create RetryableError with correct properties', () => {
      const originalError = new Error('original');
      const error = new RetryableError('Retry failed', originalError);
      
      expect(error.name).toBe('RetryableError');
      expect(error.message).toBe('Retry failed');
      expect(error.originalError).toBe(originalError);
      expect(error.cause).toBe(originalError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
