import { nanoid } from 'nanoid';
import { D1Database } from '@cloudflare/workers-types';

export interface ForwardingRule {
  id: string;
  domainId: string;
  conditions: any;
  targetEmail: string[];
  keepCopy: boolean;
  isActive: boolean;
}

export class ForwardingModule {
  constructor(private db: D1Database) {}

  async createForwardingRule(domainId: string, conditions: any, targetEmail: string[], keepCopy: boolean): Promise<ForwardingRule> {
    const id = nanoid();
    
    // basic loop prevention
    for (const email of targetEmail) {
      if (conditions?.sender === email || conditions?.recipient === email) {
        throw new Error('Potential loop detected in forwarding rule');
      }
    }

    await this.db.prepare(
      \`INSERT INTO forwarding_rules (id, domain_id, conditions, target_email, keep_copy, is_active)
       VALUES (?, ?, ?, ?, ?, ?)\`
    ).bind(id, domainId, JSON.stringify(conditions), JSON.stringify(targetEmail), keepCopy ? 1 : 0, 1).run();
    
    return { id, domainId, conditions, targetEmail, keepCopy, isActive: true };
  }

  async listForwardingRules(domainId: string): Promise<ForwardingRule[]> {
    const { results } = await this.db.prepare(
      \`SELECT id, domain_id as domainId, conditions, target_email as targetEmail, keep_copy as keepCopy, is_active as isActive
       FROM forwarding_rules WHERE domain_id = ?\`
    ).bind(domainId).all();

    return results.map((r: any) => ({
      ...r,
      conditions: JSON.parse(r.conditions),
      targetEmail: JSON.parse(r.targetEmail),
      keepCopy: Boolean(r.keepCopy),
      isActive: Boolean(r.isActive)
    }));
  }

  async toggleRule(ruleId: string, isActive: boolean): Promise<boolean> {
    const result = await this.db.prepare(\`UPDATE forwarding_rules SET is_active = ? WHERE id = ?\`)
      .bind(isActive ? 1 : 0, ruleId).run();
    return result.success;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const result = await this.db.prepare(\`DELETE FROM forwarding_rules WHERE id = ?\`).bind(ruleId).run();
    return result.success;
  }

  async evaluateForwardingRules(email: any, domainId: string): Promise<{ targets: string[], keepCopy: boolean }> {
    const rules = await this.listForwardingRules(domainId);
    const activeRules = rules.filter(r => r.isActive);
    
    let targets = new Set<string>();
    let keepCopy = true; // default
    
    for (const rule of activeRules) {
      let matches = false;
      if (rule.conditions.sender && email.from === rule.conditions.sender) matches = true;
      if (rule.conditions.subjectContains && email.subject?.includes(rule.conditions.subjectContains)) matches = true;
      if (rule.conditions.recipient && email.to === rule.conditions.recipient) matches = true;
      
      if (matches) {
        rule.targetEmail.forEach(t => targets.add(t));
        if (!rule.keepCopy) keepCopy = false; // if any rule says don't keep, don't keep
      }
    }
    
    return { targets: Array.from(targets), keepCopy };
  }
}
