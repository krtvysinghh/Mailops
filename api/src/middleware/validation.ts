import { Context, Next } from 'hono';

export type Schema = {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'email' | 'domain';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  };
};

export function validate(schema: Schema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const errors: string[] = [];

      for (const [key, rules] of Object.entries(schema)) {
        const value = body[key];

        if (rules.required && (value === undefined || value === null)) {
          errors.push(`Field ${key} is required`);
          continue;
        }

        if (value !== undefined && value !== null) {
          if (rules.type === 'string' && typeof value !== 'string') {
            errors.push(`Field ${key} must be a string`);
          }
          if (rules.type === 'number' && typeof value !== 'number') {
            errors.push(`Field ${key} must be a number`);
          }
          if (rules.type === 'boolean' && typeof value !== 'boolean') {
            errors.push(`Field ${key} must be a boolean`);
          }
          if (rules.type === 'email' && typeof value === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`Field ${key} must be a valid email`);
            }
          }
          if (rules.type === 'domain' && typeof value === 'string') {
            const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!domainRegex.test(value)) {
              errors.push(`Field ${key} must be a valid domain`);
            }
          }
          if (typeof value === 'string' && rules.minLength && value.length < rules.minLength) {
            errors.push(`Field ${key} must be at least ${rules.minLength} characters`);
          }
          if (typeof value === 'string' && rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Field ${key} must be at most ${rules.maxLength} characters`);
          }
        }
      }

      if (errors.length > 0) {
        return c.json({ error: 'Validation failed', details: errors }, 400);
      }
      
      await next();
    } catch (e) {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }
  };
}
