export interface AutoArchiveConfig {
  domainId: string;
  daysThreshold: number;
  isActive: boolean;
}

export class SmartArchiveManager {
  private configs: Map<string, AutoArchiveConfig> = new Map();

  configureAutoArchive(domainId: string, daysThreshold: number): void {
    this.configs.set(domainId, {
      domainId,
      daysThreshold,
      isActive: true
    });
  }

  runAutoArchive(domainId: string, emails: any[]): string[] {
    const config = this.configs.get(domainId);
    if (!config || !config.isActive) return [];

    const now = new Date();
    const thresholdTime = now.getTime() - (config.daysThreshold * 24 * 60 * 60 * 1000);
    const archivedIds: string[] = [];

    emails.forEach(email => {
      if (!email.isArchived && !email.hasReply) {
        const receivedTime = new Date(email.receivedAt).getTime();
        if (receivedTime < thresholdTime) {
          email.isArchived = true;
          archivedIds.push(email.id);
        }
      }
    });

    return archivedIds;
  }
}
