import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { dnsRouter } from './routes/dns';
import { sendRouter } from './routes/send';
import PostalMime from 'postal-mime';
import { drizzle } from 'drizzle-orm/d1';
import { emails } from './db/schema';
import { desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());
app.route('/api/dns', dnsRouter);
app.route('/api/send', sendRouter);

app.get('/api/inbox', async (c) => {
  const db = drizzle(c.env.DB);
  const inboxEmails = await db.select().from(emails).orderBy(desc(emails.createdAt)).limit(50);
  return c.json(inboxEmails);
});

app.get('/', (c) => {
  return c.text('Mailops API is running!');
});


// Cloudflare Email Routing handler
export default {
  fetch: app.fetch,
  
  async email(message: ForwardableEmailMessage, env: Bindings, ctx: ExecutionContext) {
    try {
      const rawEmail = await new Response(message.raw).arrayBuffer();
      const messageId = message.headers.get('Message-ID') || `msg-${Date.now()}`;
      const r2Key = `${message.to}/${messageId}.eml`;
      
      // Save raw email to R2
      await env.BUCKET.put(r2Key, rawEmail);

      // Parse email with postal-mime
      const parser = new PostalMime();
      const parsedEmail = await parser.parse(rawEmail);

      // Save metadata to D1
      const db = drizzle(env.DB);
      
      await db.insert(emails).values({
        id: nanoid(),
        domainId: message.to.split('@')[1] || 'unknown',
        fromAddr: message.from,
        toAddr: message.to,
        subject: parsedEmail.subject || '(No Subject)',
        textBody: parsedEmail.text || '',
        htmlBody: parsedEmail.html || '',
        r2Key: r2Key,
        direction: 'inbound',
        createdAt: new Date(),
        read: false
      });

      console.log(`Successfully processed inbound email for ${message.to}`);
      
    } catch (err) {
      console.error('Failed to process inbound email:', err);
      message.setReject('Temporary failure processing email');
    }
  }
};

