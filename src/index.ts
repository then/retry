export interface Options {
  shouldRetry?: (error: unknown, failedAttemptsCount: number) => boolean;
  // delay in milliseconds
  retryDelay?: (error: unknown, failedAttemptsCount: number) => number;
}
export function defaultShouldRetry(_err: unknown, failedAttemptsCount: number) {
  return failedAttemptsCount < 10;
}
export function defaultRetryDelay(_err: unknown, failedAttemptsCount: number) {
  if (failedAttemptsCount < 2) {
    return 0;
  }
  return 2 ** (failedAttemptsCount - 2) * 100 + Math.floor(Math.random() * 100);
}
export default async function retry<T>(
  fn: () => Promise<T>,
  {
    shouldRetry = defaultShouldRetry,
    retryDelay = defaultRetryDelay,
  }: Options = {},
): Promise<T> {
  let failedAttempts = 0;
  while (true) {
    try {
      return await fn();
    } catch (ex) {
      failedAttempts++;
      if (!shouldRetry(ex, failedAttempts)) {
        throw ex;
      }
      const timeout = retryDelay(ex, failedAttempts);
      if (timeout) {
        await new Promise((resolve) => setTimeout(resolve, timeout));
      }
    }
  }
}

export function withRetry<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: Options = {},
): (...args: TArgs) => Promise<TResult> {
  return async (...args) => {
    return retry(() => fn(...args), options);
  };
}
