export interface EmailFeature {
  senderFrequency: number;
  containsImportantKeywords: boolean;
  timeOfDay: number;
  isDirectReply: boolean;
  historicalReadRate: number;
}

export class PriorityInboxLearner {
  private keywords = ['urgent', 'important', 'action required', 'asap'];
  
  extractFeatures(email: { sender: string, subject: string, date: Date, inReplyTo?: string }, userHistory: any): EmailFeature {
    const subjectLower = email.subject.toLowerCase();
    const hasKeyword = this.keywords.some(kw => subjectLower.includes(kw));
    
    return {
      senderFrequency: userHistory.getSenderFrequency(email.sender) || 0,
      containsImportantKeywords: hasKeyword,
      timeOfDay: email.date.getHours(),
      isDirectReply: !!email.inReplyTo,
      historicalReadRate: userHistory.getSenderReadRate(email.sender) || 0.5
    };
  }

  scoreEmail(features: EmailFeature): number {
    let score = 0;
    
    // Naive Bayes simplified scoring
    if (features.isDirectReply) score += 30;
    if (features.containsImportantKeywords) score += 20;
    
    // Weight sender interaction
    score += (features.senderFrequency * 10);
    score += (features.historicalReadRate * 40);
    
    return Math.min(100, Math.max(0, score));
  }

  processInbox(emails: any[], userHistory: any): any[] {
    return emails.map(email => {
      const features = this.extractFeatures(email, userHistory);
      const score = this.scoreEmail(features);
      return { ...email, priorityScore: score };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
