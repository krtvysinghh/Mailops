export interface SLAConfig {
  inboxId: string;
  targetHours: number;
}

export class SLATimerService {
  private configs: Map<string, SLAConfig> = new Map();

  setSLA(inboxId: string, hours: number): void {
    this.configs.set(inboxId, { inboxId, targetHours: hours });
  }

  checkSLABreaches(inboxId: string, openConversations: any[]): string[] {
    const config = this.configs.get(inboxId);
    if (!config) return [];

    const now = new Date().getTime();
    const breachedIds: string[] = [];
    const thresholdMs = config.targetHours * 60 * 60 * 1000;

    for (const conv of openConversations) {
      const elapsed = now - new Date(conv.createdAt).getTime();
      if (elapsed > thresholdMs) {
        breachedIds.push(conv.id);
      }
    }

    return breachedIds;
  }

  getSLAReport(inboxId: string, closedConversations: any[]): { metSLA: number, breachedSLA: number } {
    const config = this.configs.get(inboxId);
    if (!config) return { metSLA: 0, breachedSLA: 0 };

    let metSLA = 0;
    let breachedSLA = 0;
    const thresholdMs = config.targetHours * 60 * 60 * 1000;

    for (const conv of closedConversations) {
      const elapsed = new Date(conv.closedAt).getTime() - new Date(conv.createdAt).getTime();
      if (elapsed <= thresholdMs) {
        metSLA++;
      } else {
        breachedSLA++;
      }
    }

    return { metSLA, breachedSLA };
  }
}
