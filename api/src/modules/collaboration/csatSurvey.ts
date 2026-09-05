export interface CSATResponse {
  threadId: string;
  domainId: string;
  score: number; // 1-5
  feedback?: string;
  submittedAt: Date;
}

export class CSATSurveyManager {
  private responses: CSATResponse[] = [];

  appendSurveyLink(emailHtml: string, threadId: string): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const surveyLink = `${baseUrl}/survey/${threadId}`;
    
    const surveyHtml = `
      <div class="csat-survey" style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
        <p>How did we do? Rate our support:</p>
        <div>
          <a href="${surveyLink}?score=1">1 - Poor</a> | 
          <a href="${surveyLink}?score=5">5 - Excellent</a>
        </div>
      </div>
    `;
    
    return emailHtml + surveyHtml;
  }

  recordRating(threadId: string, domainId: string, score: number, feedback?: string): void {
    if (score < 1 || score > 5) throw new Error('Score must be between 1 and 5');
    
    this.responses.push({
      threadId,
      domainId,
      score,
      feedback,
      submittedAt: new Date()
    });
  }

  getCSATReport(domainId: string): { averageScore: number, totalResponses: number } {
    const domainResponses = this.responses.filter(r => r.domainId === domainId);
    
    if (domainResponses.length === 0) {
      return { averageScore: 0, totalResponses: 0 };
    }
    
    const totalScore = domainResponses.reduce((sum, r) => sum + r.score, 0);
    
    return {
      averageScore: totalScore / domainResponses.length,
      totalResponses: domainResponses.length
    };
  }
}
