/**
 * Resilience utilities for handling timeouts, retries, and error recovery
 * Implementation for Task 17: Resilience & Fault Tolerance
 */

export class TimeoutError extends Error {
  constructor(message: string, public timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RetryableError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'RetryableError';
    this.cause = originalError;
  }
}

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryCondition?: (error: Error) => boolean;
}

export interface TimeoutOptions {
  timeoutMs: number;
  timeoutMessage?: string;
}

/**
 * Implements exponential backoff retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    delayMs,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    retryCondition = () => true
  } = options;

  let lastError: Error | undefined;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if we've reached max attempts
      if (attempt === maxAttempts) {
        break;
      }

      // Check if error should trigger retry
      if (!retryCondition(lastError)) {
        throw lastError;
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, currentDelay));

      // Exponential backoff
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  throw new RetryableError(
    `Operation failed after ${maxAttempts} attempts`,
    lastError || new Error('Unknown error')
  );
}

/**
 * Adds timeout capability to any async operation
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeoutMs, timeoutMessage } = options;

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(
        timeoutMessage || `Operation timed out after ${timeoutMs}ms`,
        timeoutMs
      ));
    }, timeoutMs);

    operation()
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number,
    private timeoutMs: number,
    private resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await withTimeout(operation, { timeoutMs: this.timeoutMs });
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Creates a resilient version of Ollama adapter with retry and timeout
 */
export function createResilientOllamaAdapter(baseAdapter: any) {
  const circuitBreaker = new CircuitBreaker(5, 30000, 60000);

  return {
    ...baseAdapter,
    
    async generateEmbedding(text: string) {
      return circuitBreaker.execute(() =>
        withRetry(
          () => baseAdapter.generateEmbedding(text),
          {
            maxAttempts: 3,
            delayMs: 1000,
            retryCondition: (error: Error) => {
              // Retry on network errors, timeouts, but not on validation errors
              return !error.message.includes('validation') && 
                     !error.message.includes('unauthorized');
            }
          }
        )
      );
    },

    async chat(messages: any[]) {
      return circuitBreaker.execute(() =>
        withRetry(
          () => baseAdapter.chat(messages),
          {
            maxAttempts: 3,
            delayMs: 2000,
            retryCondition: (error: Error) => {
              return !error.message.includes('validation') && 
                     !error.message.includes('unauthorized');
            }
          }
        )
      );
    }
  };
}
