import { Hono } from 'hono';
import {
  verifyInboundAuth,
  scanForPhishing,
  scanAttachment,
  scanDlp,
  stripTrackersFromHtml,
  createConfidentialMessage,
  accessConfidentialMessage,
  generateTotpSecret,
  verifyTotpCode,
  checkRateLimit,
  exportUserData,
  purgeUserData,
} from '../modules/security';

export const securityRouter = new Hono();

// Feature 31: DKIM/SPF/DMARC Verifier
securityRouter.post('/verify-auth', async (c) => {
  try {
    const body = await c.req.json();
    const result = await verifyInboundAuth(body);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to verify email auth headers' }, 400);
  }
});

// Feature 32: Phishing Detector
securityRouter.post('/phishing-check', async (c) => {
  try {
    const body = await c.req.json();
    const result = scanForPhishing(body);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to scan for phishing' }, 400);
  }
});

// Feature 34: Attachment Scanner
securityRouter.post('/scan-attachment', async (c) => {
  try {
    const body = await c.req.json<{ filename: string; base64Content: string; declaredMime?: string }>();
    const binaryStr = atob(body.base64Content || '');
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const result = scanAttachment(bytes, body.filename, body.declaredMime);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to scan attachment' }, 400);
  }
});

// Feature 35: DLP & PII Scanner
securityRouter.post('/dlp-scan', async (c) => {
  try {
    const body = await c.req.json<{ text: string }>();
    const result = scanDlp(body.text || '');
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to scan for DLP violations' }, 400);
  }
});

// Feature 36: Tracking Pixel Blocker
securityRouter.post('/strip-trackers', async (c) => {
  try {
    const body = await c.req.json<{ html: string }>();
    const result = stripTrackersFromHtml(body.html || '');
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to strip tracking pixels' }, 400);
  }
});

// Feature 37: Expiring Emails
securityRouter.post('/expiring', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createConfidentialMessage(body);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to create expiring message' }, 400);
  }
});

securityRouter.post('/expiring/consume', async (c) => {
  try {
    const body = await c.req.json();
    const result = await accessConfidentialMessage(body.record, body.pin);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to consume expiring message' }, 400);
  }
});

// Feature 38: Two-Factor Authentication (TOTP)
securityRouter.post('/totp/setup', async (c) => {
  try {
    const body = await c.req.json<{ email: string; issuer?: string }>();
    const secretData = generateTotpSecret(body.email, body.issuer);
    return c.json(secretData);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to generate TOTP secret' }, 400);
  }
});

securityRouter.post('/totp/verify', async (c) => {
  try {
    const body = await c.req.json<{ secret: string; code: string }>();
    const valid = await verifyTotpCode(body.secret, body.code);
    return c.json({ valid });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to verify TOTP code' }, 400);
  }
});

// Feature 39: Token Bucket Rate Limiter
securityRouter.post('/rate-limit/check', async (c) => {
  try {
    const body = await c.req.json<{ key: string; capacity?: number; refillRate?: number }>();
    const result = checkRateLimit(body.key, {
      capacity: body.capacity || 60,
      refillRate: body.refillRate || 1,
    });
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to check rate limit' }, 400);
  }
});

// Feature 40: GDPR Export & Purge
securityRouter.post('/gdpr/export', async (c) => {
  try {
    const body = await c.req.json<{ userId: string; emails?: any[]; contacts?: any[] }>();
    const bundle = exportUserData(body.userId, body.emails || [], body.contacts || []);
    return c.json(bundle);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to export user data' }, 400);
  }
});

securityRouter.post('/gdpr/purge', async (c) => {
  try {
    const body = await c.req.json<{ userId: string; dataSet?: any }>();
    const result = await purgeUserData(body.userId, body.dataSet);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to purge user data' }, 400);
  }
});
