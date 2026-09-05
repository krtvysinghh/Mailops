export class ReadTimeEstimator {
  private readonly WPM = 238; // Average words per minute
  
  estimateReadTime(email: { body: string, attachmentCount?: number }): number {
    if (!email.body) return 0;
    
    // Strip HTML if present (simple approximation)
    const plainText = email.body.replace(/<[^>]+>/g, ' ');
    
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    
    // Time in seconds
    let estimatedSeconds = (wordCount / this.WPM) * 60;
    
    // Add penalty for complexity (long words)
    const longWords = words.filter(w => w.length > 8).length;
    if (longWords / wordCount > 0.2) {
      estimatedSeconds *= 1.2;
    }
    
    // Add time for attachments (e.g. 10s per attachment)
    if (email.attachmentCount) {
      estimatedSeconds += email.attachmentCount * 10;
    }
    
    return Math.round(estimatedSeconds);
  }
}
