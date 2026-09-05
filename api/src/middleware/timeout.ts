import { Context, Next } from 'hono';

export const timeout = (ms: number = 30000) => {
  return async (c: Context, next: Next) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    
    // We can expose the abort signal via context if routes want to use it
    c.set('abortSignal', controller.signal);

    try {
      const result = await Promise.race([
        next(),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error(`Request timeout after ${ms}ms`));
          });
        })
      ]);
      return result;
    } catch (e: any) {
      if (e.message.includes('timeout')) {
        return c.json({ error: 'Request Timeout' }, 408);
      }
      throw e;
    } finally {
      clearTimeout(id);
    }
  };
};
