import { D1Database } from '@cloudflare/workers-types';

export class DashboardEngine {
  constructor(private db: D1Database) {}

  async getVolumeStats(domainId: string, days: number = 30) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const { results } = await this.db.prepare(
      \`SELECT date(created_at/1000, 'unixepoch') as day, type, COUNT(*) as count
       FROM emails 
       WHERE domain_id = ? AND created_at > ?
       GROUP BY day, type
       ORDER BY day ASC\`
    ).bind(domainId, since).all();
    return results;
  }

  async getResponseTimeStats(domainId: string) {
    const { results } = await this.db.prepare(
      \`SELECT AVG(response_time_ms) as avgResponseMs
       FROM email_threads 
       WHERE domain_id = ? AND response_time_ms IS NOT NULL\`
    ).bind(domainId).all();
    
    const ms = results?.[0]?.avgResponseMs as number || 0;
    return ms / (1000 * 60 * 60); // in hours
  }

  async getTopContacts(domainId: string, limit: number = 5) {
    const { results } = await this.db.prepare(
      \`SELECT contact_email, COUNT(*) as interactions
       FROM email_participants
       WHERE domain_id = ?
       GROUP BY contact_email
       ORDER BY interactions DESC
       LIMIT ?\`
    ).bind(domainId, limit).all();
    return results;
  }

  async getBusiestHours(domainId: string) {
    const { results } = await this.db.prepare(
      \`SELECT strftime('%H', created_at/1000, 'unixepoch') as hourOfDay, 
              strftime('%w', created_at/1000, 'unixepoch') as dayOfWeek,
              COUNT(*) as count
       FROM emails
       WHERE domain_id = ?
       GROUP BY dayOfWeek, hourOfDay\`
    ).bind(domainId).all();
    return results;
  }

  async getCategoryBreakdown(domainId: string) {
    const { results } = await this.db.prepare(
      \`SELECT category, COUNT(*) as count
       FROM emails
       WHERE domain_id = ?
       GROUP BY category\`
    ).bind(domainId).all();
    return results;
  }

  async getThreadDepthStats(domainId: string) {
    const { results } = await this.db.prepare(
      \`SELECT AVG(message_count) as avgDepth, MAX(message_count) as maxDepth
       FROM email_threads
       WHERE domain_id = ?\`
    ).bind(domainId).all();
    return results?.[0] || { avgDepth: 0, maxDepth: 0 };
  }
}
