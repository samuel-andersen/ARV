/**
 * Shared resilience helpers for external-service providers. Every provider is
 * expected to wrap its network calls in these so retries/timeouts/failover are
 * uniform rather than reinvented per adapter.
 */

export interface RetryOptions {
  /** Total attempts including the first. */
  attempts?: number;
  /** Base backoff in ms; doubles each retry (2s, 4s, 8s…). */
  baseDelayMs?: number;
  /** Per-attempt timeout in ms. */
  timeoutMs?: number;
  /** Called on each failed attempt for health monitoring/logging. */
  onRetry?: (error: unknown, attempt: number) => void;
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reject if `fn` doesn't settle within `ms`. */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Run `fn` with exponential-backoff retries and a per-attempt timeout. */
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    attempts = 3,
    baseDelayMs = 2000,
    timeoutMs = 15000,
    onRetry,
  } = opts;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await withTimeout(fn, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        onRetry?.(error, attempt);
        await delay(baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}
