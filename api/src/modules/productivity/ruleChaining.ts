export type RuleAction = 'MARK_READ' | 'ADD_LABEL' | 'FORWARD' | 'ARCHIVE';

export interface AutomationRule {
  id: string;
  condition: (email: any) => boolean;
  action: RuleAction;
  actionPayload?: any;
  nextRuleIds?: string[];
}

export class RuleChainEngine {
  private rules: Map<string, AutomationRule> = new Map();

  buildRuleChain(rulesList: AutomationRule[]): void {
    rulesList.forEach(rule => this.rules.set(rule.id, rule));
  }

  private async executeAction(email: any, action: RuleAction, payload?: any): Promise<any> {
    const modifiedEmail = { ...email };
    switch (action) {
      case 'MARK_READ':
        modifiedEmail.isRead = true;
        break;
      case 'ADD_LABEL':
        modifiedEmail.labels = modifiedEmail.labels || [];
        modifiedEmail.labels.push(payload.label);
        break;
      case 'FORWARD':
        // Forwarding logic here
        break;
      case 'ARCHIVE':
        modifiedEmail.isArchived = true;
        break;
    }
    return modifiedEmail;
  }

  async executeChain(email: any, startRuleId: string): Promise<any> {
    let currentEmailState = { ...email };
    const queue = [startRuleId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const ruleId = queue.shift()!;
      if (visited.has(ruleId)) continue; // Prevent infinite loops in DAG
      
      visited.add(ruleId);
      const rule = this.rules.get(ruleId);
      
      if (!rule) continue;

      if (rule.condition(currentEmailState)) {
        currentEmailState = await this.executeAction(currentEmailState, rule.action, rule.actionPayload);
        
        if (rule.nextRuleIds) {
          queue.push(...rule.nextRuleIds);
        }
      }
    }
    
    return currentEmailState;
  }
}
