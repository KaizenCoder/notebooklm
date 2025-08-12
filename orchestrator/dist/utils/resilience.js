/**
 * Resilience utilities for handling timeouts, retries, and error recovery
 * Implementation for Task 17: Resilience & Fault Tolerance
 *
 * Production-ready configuration with telemetry and SLO-based defaults
 */
// Global metrics collector
class MetricsCollector {
    metrics = {
        retryAttempts: 0,
        timeouts: 0,
        circuitBreakerOpens: 0,
        circuitBreakerResets: 0,
        operationSuccess: 0,
        operationFailures: 0
    };
    increment(metric, value = 1) {
        this.metrics[metric] += value;
    }
    getMetrics() {
        // Allow overriding defaults via env or parameters in the future if needed
        return { ...this.metrics };
    }
    reset() {
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = 0;
        });
    }
}
export const resilienceMetrics = new MetricsCollector();
export class TimeoutError extends Error {
    timeoutMs;
    constructor(message, timeoutMs) {
        super(message);
        this.timeoutMs = timeoutMs;
        this.name = 'TimeoutError';
    }
}
export class RetryableError extends Error {
    originalError;
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = 'RetryableError';
        this.cause = originalError;
    }
}
// Production-ready SLO-based defaults
export const PRODUCTION_DEFAULTS = {
    RETRY: {
        maxAttempts: 3,
        delayMs: 500, // 500ms initial delay for SLO compliance
        backoffMultiplier: 1.5, // Gentler backoff for production
        maxDelayMs: 5000, // Max 5s delay to respect SLO
    },
    TIMEOUT: {
        timeoutMs: 10000, // 10s timeout for SLO compliance
    },
    CIRCUIT_BREAKER: {
        threshold: 5, // Open after 5 failures
        timeoutMs: 30000, // 30s timeout for operations
        resetTimeoutMs: 60000, // 1min before reset attempt
    }
};
/**
 * Implements exponential backoff retry logic with telemetry
 */
export async function withRetry(operation, options) {
    const { maxAttempts = PRODUCTION_DEFAULTS.RETRY.maxAttempts, delayMs = PRODUCTION_DEFAULTS.RETRY.delayMs, backoffMultiplier = PRODUCTION_DEFAULTS.RETRY.backoffMultiplier, maxDelayMs = PRODUCTION_DEFAULTS.RETRY.maxDelayMs, retryCondition = () => true } = options;
    let lastError;
    let currentDelay = delayMs;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await operation();
            resilienceMetrics.increment('operationSuccess');
            return result;
        }
        catch (error) {
            lastError = error;
            resilienceMetrics.increment('operationFailures');
            if (attempt === maxAttempts) {
                break;
            }
            if (!retryCondition(lastError)) {
                throw lastError;
            }
            resilienceMetrics.increment('retryAttempts');
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
        }
    }
    throw new RetryableError(`Operation failed after ${maxAttempts} attempts`, lastError || new Error('Unknown error'));
}
/**
 * Adds timeout capability to any async operation with telemetry
 */
export async function withTimeout(operation, options) {
    const { timeoutMs = PRODUCTION_DEFAULTS.TIMEOUT.timeoutMs, timeoutMessage } = options;
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            resilienceMetrics.increment('timeouts');
            reject(new TimeoutError(timeoutMessage || `Operation timed out after ${timeoutMs}ms`, timeoutMs));
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
 * Circuit breaker pattern implementation with telemetry and SLO-based defaults
 */
export class CircuitBreaker {
    threshold;
    timeoutMs;
    resetTimeoutMs;
    failures = 0;
    lastFailureTime = 0;
    state = 'CLOSED';
    constructor(threshold = PRODUCTION_DEFAULTS.CIRCUIT_BREAKER.threshold, timeoutMs = PRODUCTION_DEFAULTS.CIRCUIT_BREAKER.timeoutMs, resetTimeoutMs = PRODUCTION_DEFAULTS.CIRCUIT_BREAKER.resetTimeoutMs) {
        this.threshold = threshold;
        this.timeoutMs = timeoutMs;
        this.resetTimeoutMs = resetTimeoutMs;
    }
    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
                this.state = 'HALF_OPEN';
                resilienceMetrics.increment('circuitBreakerResets');
            }
            else {
                throw new Error('Circuit breaker is OPEN');
            }
        }
        try {
            const result = await withTimeout(operation, { timeoutMs: this.timeoutMs });
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            resilienceMetrics.increment('circuitBreakerOpens');
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
 * Creates a resilient version of Ollama adapter with SLO-optimized settings
 * Preserves surface of base adapter: listModels, chat(model, messages), embeddings(model, prompt), checkGpu
 */
export function createResilientOllamaAdapter(baseAdapter) {
    const circuitBreaker = new CircuitBreaker(); // Uses production defaults
    const wrapped = {
        ...baseAdapter,
        async chat(modelOrMessages, maybeMessages) {
            const invoke = () => (typeof maybeMessages !== 'undefined'
                ? baseAdapter.chat(modelOrMessages, maybeMessages)
                : baseAdapter.chat(modelOrMessages));
            return circuitBreaker.execute(() => withRetry(() => invoke(), {
                maxAttempts: PRODUCTION_DEFAULTS.RETRY.maxAttempts,
                delayMs: PRODUCTION_DEFAULTS.RETRY.delayMs * 2,
                backoffMultiplier: PRODUCTION_DEFAULTS.RETRY.backoffMultiplier,
                maxDelayMs: PRODUCTION_DEFAULTS.RETRY.maxDelayMs,
                retryCondition: (error) => !error.message.includes('validation') && !error.message.includes('unauthorized') && !error.message.includes('rate limit')
            }));
        },
        async embeddings(model, prompt, correlationId) {
            return circuitBreaker.execute(() => withRetry(() => baseAdapter.embeddings(model, prompt, correlationId), {
                maxAttempts: PRODUCTION_DEFAULTS.RETRY.maxAttempts,
                delayMs: PRODUCTION_DEFAULTS.RETRY.delayMs,
                backoffMultiplier: PRODUCTION_DEFAULTS.RETRY.backoffMultiplier,
                maxDelayMs: PRODUCTION_DEFAULTS.RETRY.maxDelayMs,
                retryCondition: (error) => !error.message.includes('validation') && !error.message.includes('unauthorized') && !error.message.includes('rate limit')
            }));
        },
        async generateEmbedding(text) {
            if (typeof baseAdapter.generateEmbedding === 'function') {
                return circuitBreaker.execute(() => withRetry(() => baseAdapter.generateEmbedding(text), {
                    maxAttempts: PRODUCTION_DEFAULTS.RETRY.maxAttempts,
                    delayMs: PRODUCTION_DEFAULTS.RETRY.delayMs,
                    backoffMultiplier: PRODUCTION_DEFAULTS.RETRY.backoffMultiplier,
                    maxDelayMs: PRODUCTION_DEFAULTS.RETRY.maxDelayMs,
                    retryCondition: (error) => !error.message.includes('validation') && !error.message.includes('unauthorized') && !error.message.includes('rate limit')
                }));
            }
            throw new Error('generateEmbedding not supported by base adapter');
        }
    };
    return wrapped;
}
