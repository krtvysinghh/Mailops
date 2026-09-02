import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { emails } from '../db/schema';
import { nanoid } from 'nanoid';

export const sendRouter = new Hono<{ Bindings: { DB: D1Database } }>();

// POST /api/send
// Expects JSON: { to: '...', subject: '...', text: '...', html: '...', from: '...', resendApiKey: '...' }
sendRouter.post('/', async (c) => {
  const body = await c.req.json();
  const { to, subject, text, html, from, resendApiKey } = body;

  if (!to || !subject || !from || !resendApiKey) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  try {
    // 1. Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: html || text,
        text
      })
    });

    const resendResult = await resendResponse.json() as any;
    
    if (!resendResponse.ok) {
      throw new Error(resendResult.message || 'Failed to send email via Resend');
    }

    // 2. Save to D1 Database
    const db = drizzle(c.env.DB);
    await db.insert(emails).values({
      id: nanoid(),
      domainId: from.split('@')[1],
      fromAddr: from,
      toAddr: to,
      subject,
      textBody: text || '',
      htmlBody: html || '',
      direction: 'outbound',
      createdAt: new Date(),
      read: true
    });

    return c.json({ success: true, id: resendResult.id });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
