export class EmailPinningService {
  private pinnedItems: Map<string, Set<string>> = new Map(); // domainId -> Set<emailId>

  pinEmail(domainId: string, emailId: string): void {
    if (!this.pinnedItems.has(domainId)) {
      this.pinnedItems.set(domainId, new Set());
    }
    this.pinnedItems.get(domainId)!.add(emailId);
  }

  unpinEmail(domainId: string, emailId: string): void {
    const domainPins = this.pinnedItems.get(domainId);
    if (domainPins) {
      domainPins.delete(emailId);
    }
  }

  getPinnedEmails(domainId: string): string[] {
    const domainPins = this.pinnedItems.get(domainId);
    return domainPins ? Array.from(domainPins) : [];
  }
}
