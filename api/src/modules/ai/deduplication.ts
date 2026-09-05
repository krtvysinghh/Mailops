export interface EmailDocument {
  id: string;
  domainId: string;
  subject: string;
  body: string;
  sender: string;
  timestamp: Date;
}

export class DeduplicationEngine {
  private async generateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private normalizeContent(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  async findDuplicates(emails: EmailDocument[], domainId: string): Promise<string[][]> {
    const domainEmails = emails.filter(e => e.domainId === domainId);
    const hashToIds = new Map<string, string[]>();

    for (const email of domainEmails) {
      const normalizedSubject = this.normalizeContent(email.subject);
      const normalizedBody = this.normalizeContent(email.body);
      const combined = `${email.sender}:${normalizedSubject}:${normalizedBody}`;
      
      const hash = await this.generateHash(combined);
      
      if (!hashToIds.has(hash)) {
        hashToIds.set(hash, []);
      }
      hashToIds.get(hash)!.push(email.id);
    }

    const duplicates: string[][] = [];
    for (const ids of hashToIds.values()) {
      if (ids.length > 1) {
        duplicates.push(ids);
      }
    }

    return duplicates;
  }

  mergeDuplicates(ids: string[]): string {
    if (ids.length === 0) return '';
    // Typically keep the first one, soft-delete or merge metadata of others
    const primaryId = ids[0];
    const toMerge = ids.slice(1);
    
    // Simulate merge action
    console.log(`Merging ${toMerge.join(', ')} into ${primaryId}`);
    
    return primaryId;
  }
}
