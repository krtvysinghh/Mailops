export class SmartCompose {
  private ngrams: Map<string, Map<string, number>> = new Map();

  train(sentEmails: string[]): void {
    sentEmails.forEach(text => {
      const words = text.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        const current = words[i];
        const next = words[i + 1];
        
        if (!this.ngrams.has(current)) {
          this.ngrams.set(current, new Map());
        }
        
        const followMap = this.ngrams.get(current)!;
        followMap.set(next, (followMap.get(next) || 0) + 1);
      }
    });
  }

  predictNextWords(partialText: string, context?: string): string[] {
    const words = partialText.trim().toLowerCase().split(/\s+/);
    if (words.length === 0) return [];
    
    const lastWord = words[words.length - 1];
    const followMap = this.ngrams.get(lastWord);
    
    if (!followMap) return [];
    
    const candidates = Array.from(followMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
      
    return candidates.slice(0, 3);
  }
}
