import { Context, Next } from 'hono';

export function csrfProtection() {
  return async (c: Context, next: Next) => {
    if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(c.req.method)) {
      // Generate a new token if not present
      const cookieHeader = c.req.header('Cookie') || '';
      if (!cookieHeader.includes('csrf_token=')) {
        const token = crypto.randomUUID();
        c.header('Set-Cookie', `csrf_token=${token}; Path=/; HttpOnly; SameSite=Strict`);
      }
      return await next();
    }

    // Validate CSRF token for state-changing requests
    const cookieHeader = c.req.header('Cookie') || '';
    const cookieToken = cookieHeader.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
    
    const headerToken = c.req.header('X-CSRF-Token');

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return c.json({ error: 'CSRF token validation failed' }, 403);
    }

    await next();
  };
}
