export interface OutboundEmail {
  headers: Record<string, string>;
  body: string;
}

export function scoreOutboundEmail(email: OutboundEmail): { score: number, recommendations: string[] } {
  let score = 100;
  const recommendations: string[] = [];
  
  if (!email.headers['List-Unsubscribe']) {
    score -= 20;
    recommendations.push('Add List-Unsubscribe header to improve deliverability.');
  }
  
  if (!email.headers['Reply-To']) {
    score -= 10;
    recommendations.push('Add Reply-To header.');
  }
  
  const from = email.headers['From'] || '';
  const returnPath = email.headers['Return-Path'] || '';
  if (from && returnPath && !from.includes(returnPath)) {
    score -= 30;
    recommendations.push('From domain does not align with Return-Path.');
  }
  
  return { score: Math.max(score, 0), recommendations };
}