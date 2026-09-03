import { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';

export interface Alias {
  id: string;
  domainId: string;
  aliasName: string;
  targetEmail: string;
  isCatchAll: boolean;
  createdAt: number;
}

export class EmailAliasingModule {
  constructor(private db: D1Database) {}

  async createAlias(domainId: string, aliasName: string, targetEmail: string): Promise<Alias> {
    if (!this.isValidAlias(aliasName) && aliasName !== '*') {
      throw new Error('Invalid alias name');
    }
    const isCatchAll = aliasName === '*';
    const id = nanoid();
    const createdAt = Date.now();
    
    await this.db.prepare(
      `INSERT INTO email_aliases (id, domain_id, alias_name, target_email, is_catch_all, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, domainId, aliasName, targetEmail, isCatchAll ? 1 : 0, createdAt).run();
    
    return { id, domainId, aliasName, targetEmail, isCatchAll, createdAt };
  }

  async resolveAlias(domainId: string, aliasName: string): Promise<string | null> {
    const row = await this.db.prepare(
      `SELECT target_email FROM email_aliases WHERE domain_id = ? AND alias_name = ?`
    ).bind(domainId, aliasName).first<{ target_email: string }>();
    
    if (row) return row.target_email;

    // Check catch-all
    const catchAllRow = await this.db.prepare(
      `SELECT target_email FROM email_aliases WHERE domain_id = ? AND is_catch_all = 1 LIMIT 1`
    ).bind(domainId).first<{ target_email: string }>();

    return catchAllRow ? catchAllRow.target_email : null;
  }

  async listAliases(domainId: string): Promise<Alias[]> {
    const { results } = await this.db.prepare(
      `SELECT id, domain_id as domainId, alias_name as aliasName, target_email as targetEmail, 
       is_catch_all as isCatchAll, created_at as createdAt 
       FROM email_aliases WHERE domain_id = ?`
    ).bind(domainId).all<Alias>();
    return results || [];
  }

  async deleteAlias(id: string): Promise<boolean> {
    const result = await this.db.prepare(`DELETE FROM email_aliases WHERE id = ?`).bind(id).run();
    return result.success;
  }

  async generateRandomAlias(domainId: string, targetEmail: string): Promise<Alias> {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let alias = '';
    for (let i = 0; i < 8; i++) {
      alias += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.createAlias(domainId, alias, targetEmail);
  }

  private isValidAlias(aliasName: string): boolean {
    if (aliasName.length > 50) return false;
    return /^[a-zA-Z0-9.\-_+]+$/.test(aliasName);
  }
}
