import { nanoid } from 'nanoid';
import { D1Database } from '@cloudflare/workers-types';

export interface Webhook {
  id: string;
  domainId: string;
  url: string;
  events: string[];
  secret?: string;
}

export class WebhookModule {
  constructor(private db: D1Database) {}

  async registerWebhook(domainId: string, url: string, events: string[], secret?: string): Promise<Webhook> {
    const id = nanoid();
    const eventsStr = JSON.stringify(events);
    
    await this.db.prepare(
      \`INSERT INTO webhooks (id, domain_id, url, events, secret, created_at)
       VALUES (?, ?, ?, ?, ?, ?)\`
    ).bind(id, domainId, url, eventsStr, secret || null, Date.now()).run();
    
    return { id, domainId, url, events, secret };
  }

  async listWebhooks(domainId: string): Promise<Webhook[]> {
    const { results } = await this.db.prepare(
      \`SELECT id, domain_id as domainId, url, events, secret FROM webhooks WHERE domain_id = ?\`
    ).bind(domainId).all();
    
    return results.map((r: any) => ({
      ...r,
      events: JSON.parse(r.events)
    }));
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const result = await this.db.prepare(\`DELETE FROM webhooks WHERE id = ?\`).bind(id).run();
    return result.success;
  }

  async verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBuf = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return await crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(payload));
  }

  async fireWebhook(webhook: Webhook, event: string, payload: any): Promise<boolean> {
    if (!webhook.events.includes(event)) return false;

    const body = JSON.stringify({ event, payload, timestamp: Date.now() });
    let signature = '';
    
    if (webhook.secret) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', enc.encode(webhook.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(body));
      signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (signature) headers['X-Mailops-Signature'] = signature;

    let attempts = 0;
    while (attempts < 3) {
      try {
        const resp = await fetch(webhook.url, { method: 'POST', body, headers });
        if (resp.ok) return true;
      } catch (e) {
        // failed
      }
      attempts++;
      await new Promise(r => setTimeout(r, Math.pow(2, attempts) * 1000));
    }
    return false;
  }
}
