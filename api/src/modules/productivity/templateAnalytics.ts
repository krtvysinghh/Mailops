export interface TemplateStats {
  templateId: string;
  domainId: string;
  usageCount: number;
  replyCount: number;
  lastUsed?: Date;
}

export class TemplateAnalytics {
  private statsMap: Map<string, TemplateStats> = new Map();

  recordTemplateUsage(templateId: string, domainId: string): void {
    const stats = this.statsMap.get(templateId) || {
      templateId,
      domainId,
      usageCount: 0,
      replyCount: 0
    };
    
    stats.usageCount += 1;
    stats.lastUsed = new Date();
    this.statsMap.set(templateId, stats);
  }

  recordTemplateReply(templateId: string): void {
    const stats = this.statsMap.get(templateId);
    if (stats) {
      stats.replyCount += 1;
    }
  }

  getTemplateStats(domainId: string): TemplateStats[] {
    return Array.from(this.statsMap.values())
      .filter(stat => stat.domainId === domainId);
  }

  getConversionRate(templateId: string): number {
    const stats = this.statsMap.get(templateId);
    if (!stats || stats.usageCount === 0) return 0;
    return stats.replyCount / stats.usageCount;
  }
}
