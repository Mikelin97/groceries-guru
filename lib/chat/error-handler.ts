export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export class RetryableError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry non-retryable errors
      if (error instanceof NonRetryableError) {
        throw error;
      }
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} retries: ${lastError.message}`);
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      console.warn(
        `Operation failed (attempt ${attempt + 1}/${maxRetries + 1}): ${lastError.message}. Retrying in ${delay}ms...`
      );
      
      await sleep(delay);
      attempt++;
    }
  }

  throw lastError!;
}

export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  options: {
    failureThreshold?: number;
    recoveryTimeout?: number;
    monitoringWindow?: number;
  } = {}
): Promise<T> {
  const {
    failureThreshold = 5,
    recoveryTimeout = 60000, // 1 minute
    monitoringWindow = 120000, // 2 minutes
  } = options;

  const now = Date.now();
  const key = operation.toString(); // Simple key based on function
  
  // In a real implementation, you'd use a proper circuit breaker state store
  // For now, we'll use a simple in-memory approach
  if (!circuitBreakerStates.has(key)) {
    circuitBreakerStates.set(key, {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
    });
  }

  const state = circuitBreakerStates.get(key)!;

  // Check if circuit should be reset
  if (state.state === 'OPEN' && now - state.lastFailureTime > recoveryTimeout) {
    state.state = 'HALF_OPEN';
    state.failures = 0;
  }

  // Fail fast if circuit is open
  if (state.state === 'OPEN') {
    throw new NonRetryableError('Circuit breaker is OPEN - failing fast');
  }

  try {
    const result = await operation();
    
    // Success - reset circuit breaker
    if (state.state === 'HALF_OPEN') {
      state.state = 'CLOSED';
    }
    state.failures = 0;
    
    return result;
  } catch (error) {
    state.failures++;
    state.lastFailureTime = now;
    
    // Open circuit if failure threshold exceeded
    if (state.failures >= failureThreshold) {
      state.state = 'OPEN';
      console.error(`Circuit breaker OPENED for operation: ${key}`);
    }
    
    throw error;
  }
}

export function isTransientError(error: Error): boolean {
  const transientErrorPatterns = [
    /ECONNRESET/,
    /ETIMEDOUT/,
    /ENOTFOUND/,
    /ECONNREFUSED/,
    /socket hang up/,
    /network/i,
    /timeout/i,
    /connection/i,
    /Redis.*connection/i,
    /database.*connection/i,
  ];

  return transientErrorPatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple in-memory circuit breaker state store
// In production, this should be replaced with a distributed store like Redis
const circuitBreakerStates = new Map<string, {
  failures: number;
  lastFailureTime: number;
  state: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
}>();