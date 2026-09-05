export enum SnoozePattern {
  EVERY_MONDAY = 'EVERY_MONDAY',
  EVERY_WEEKDAY = 'EVERY_WEEKDAY',
  MONTHLY = 'MONTHLY',
  CUSTOM_CRON = 'CUSTOM_CRON'
}

export interface SnoozeRule {
  id: string;
  emailId: string;
  pattern: SnoozePattern;
  customCron?: string;
  nextTrigger: Date;
  active: boolean;
}

export class RecurringSnoozeManager {
  private rules: Map<string, SnoozeRule> = new Map();

  private calculateNextTrigger(pattern: SnoozePattern, customCron?: string): Date {
    const now = new Date();
    const next = new Date(now);
    
    switch (pattern) {
      case SnoozePattern.EVERY_MONDAY:
        next.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
        next.setHours(9, 0, 0, 0);
        break;
      case SnoozePattern.EVERY_WEEKDAY:
        if (now.getDay() >= 5) {
          next.setDate(now.getDate() + (8 - now.getDay()));
        } else {
          next.setDate(now.getDate() + 1);
        }
        next.setHours(9, 0, 0, 0);
        break;
      case SnoozePattern.MONTHLY:
        next.setMonth(now.getMonth() + 1);
        next.setHours(9, 0, 0, 0);
        break;
      case SnoozePattern.CUSTOM_CRON:
        // Mock parsing for simplicity
        next.setDate(now.getDate() + 1);
        break;
    }
    return next;
  }

  createRecurringSnooze(emailId: string, pattern: SnoozePattern, customCron?: string): SnoozeRule {
    const rule: SnoozeRule = {
      id: Math.random().toString(36).substr(2, 9),
      emailId,
      pattern,
      customCron,
      nextTrigger: this.calculateNextTrigger(pattern, customCron),
      active: true
    };
    
    this.rules.set(rule.id, rule);
    return rule;
  }

  getDueSnoozes(): SnoozeRule[] {
    const now = new Date();
    return Array.from(this.rules.values())
      .filter(rule => rule.active && rule.nextTrigger <= now);
  }

  processSnooze(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      // Unsnooze email logic here
      rule.nextTrigger = this.calculateNextTrigger(rule.pattern, rule.customCron);
    }
  }
}
