export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
  jitter: true
};

export async function retryAsync<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {}
): Promise<T> {
  const options = { ...defaultOptions, ...opts };
  let attempt = 0;

  while (attempt < options.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= options.maxAttempts) {
        throw error;
      }

      let delay = Math.min(
        options.baseDelayMs * Math.pow(2, attempt - 1),
        options.maxDelayMs
      );

      if (options.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable code');
}
