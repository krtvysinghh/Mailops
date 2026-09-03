import { nanoid } from 'nanoid';
import { D1Database } from '@cloudflare/workers-types';

export interface Domain {
  id: string;
  userId: string;
  hostname: string;
  cfApiToken: string; // encrypted in reality
  cfZoneId: string;
  isActive: boolean;
}

export class MultiDomainModule {
  constructor(private db: D1Database) {}

  async addDomain(userId: string, hostname: string, cfApiToken: string, cfZoneId: string): Promise<Domain> {
    const id = nanoid();
    // simple "encryption" simulation for example purposes
    const encryptedToken = btoa(cfApiToken); 
    
    await this.db.prepare(
      \`INSERT INTO domains (id, user_id, hostname, cf_api_token, cf_zone_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?)\`
    ).bind(id, userId, hostname, encryptedToken, cfZoneId, 1).run();
    
    return { id, userId, hostname, cfApiToken, cfZoneId, isActive: true };
  }

  async removeDomain(domainId: string): Promise<boolean> {
    const result = await this.db.prepare(\`DELETE FROM domains WHERE id = ?\`).bind(domainId).run();
    return result.success;
  }

  async listDomains(userId: string): Promise<Domain[]> {
    const { results } = await this.db.prepare(
      \`SELECT id, user_id as userId, hostname, cf_api_token as cfApiToken, cf_zone_id as cfZoneId, is_active as isActive
       FROM domains WHERE user_id = ?\`
    ).bind(userId).all();
    return (results || []) as any as Domain[];
  }

  async switchActiveDomain(userId: string, domainId: string): Promise<void> {
    await this.db.prepare(\`UPDATE domains SET is_active = 0 WHERE user_id = ?\`).bind(userId).run();
    await this.db.prepare(\`UPDATE domains SET is_active = 1 WHERE id = ? AND user_id = ?\`).bind(domainId, userId).run();
  }

  async getDomainHealth(domainId: string): Promise<{ mx: boolean; spf: boolean; dkim: boolean; dmarc: boolean }> {
    // In a real app, you would make DNS queries here.
    return {
      mx: true,
      spf: true,
      dkim: true,
      dmarc: false,
    };
  }

  async verifyDomainOwnership(domainId: string): Promise<boolean> {
    // Look up TXT record
    // Mocking success
    return true;
  }
}
