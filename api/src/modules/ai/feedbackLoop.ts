export interface FeedbackRecord {
  emailId: string;
  context: string;
  selectedReplyIndex: number;
  timestamp: number;
}

export class FeedbackLoop {
  private records: FeedbackRecord[] = [];

  recordSelection(emailId: string, context: string, replyIndex: number) {
    this.records.push({
      emailId,
      context,
      selectedReplyIndex: replyIndex,
      timestamp: Date.now()
    });
  }

  getWeightedSuggestions(context: string, candidates: string[]): string[] {
    // In a real app, we would query the database for historical selections matching the context
    // and re-rank candidates based on frequency of selection.
    
    const contextRecords = this.records.filter(r => r.context === context);
    
    if (contextRecords.length === 0) {
      return candidates;
    }

    const indexCounts: Record<number, number> = {};
    for (const r of contextRecords) {
      indexCounts[r.selectedReplyIndex] = (indexCounts[r.selectedReplyIndex] || 0) + 1;
    }

    const scored = candidates.map((c, i) => ({
      candidate: c,
      score: indexCounts[i] || 0
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.candidate);
  }
}
