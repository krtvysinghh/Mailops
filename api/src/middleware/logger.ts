import { Context, Next } from 'hono';

export const logger = () => {
  return async (c: Context, next: Next) => {
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);
    
    const method = c.req.method;
    const path = c.req.path;
    const startTime = Date.now();
    
    console.log(JSON.stringify({
      level: 'info',
      message: 'Request started',
      requestId,
      method,
      path,
      timestamp: new Date().toISOString()
    }));

    try {
      await next();
    } finally {
      const duration = Date.now() - startTime;
      const status = c.res.status;
      
      console.log(JSON.stringify({
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
        message: 'Request completed',
        requestId,
        method,
        path,
        status,
        durationMs: duration,
        timestamp: new Date().toISOString()
      }));
    }
  };
};
