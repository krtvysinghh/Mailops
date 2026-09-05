import { Context, Next } from 'hono';

export const securityHeaders = () => {
  return async (c: Context, next: Next) => {
    await next();

    const headers = c.res.headers;
    
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'"
    ].join('; ');
    
    headers.set('Content-Security-Policy', csp);
  };
};
