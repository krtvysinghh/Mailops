export interface EmailContent {
  subject: string;
  textBody: string;
  htmlBody: string;
  headers: Record<string, string>;
}

export interface SpamScoreBreakdown {
  allCapsScore: number;
  exclamationScore: number;
  triggerWordsScore: number;
  linksScore: number;
  unsubscribeScore: number;
  shortenerScore: number;
  imageTextScore: number;
}

export interface SpamScoreReport {
  totalScore: number;
  breakdown: SpamScoreBreakdown;
  suggestions: string[];
  isLikelyToPass: boolean;
  confidence: 'High' | 'Medium' | 'Low';
}

const SPAM_TRIGGER_WORDS = [
  "free", "urgent", "act now", "click here", "winner", "prize", "cash", "guarantee",
  "buy now", "discount", "viagra", "casino", "lottery", "make money", "work from home"
]; // Mock dictionary of 200+ words

export function calculateSpamScore(email: EmailContent): SpamScoreReport {
  let score = 0;
  const breakdown: SpamScoreBreakdown = {
    allCapsScore: 0,
    exclamationScore: 0,
    triggerWordsScore: 0,
    linksScore: 0,
    unsubscribeScore: 0,
    shortenerScore: 0,
    imageTextScore: 0
  };

  const fullText = (email.subject + " " + email.textBody).toLowerCase();
  
  // All Caps
  const capsRatio = (email.subject.match(/[A-Z]/g)?.length || 0) / (email.subject.length || 1);
  if (capsRatio > 0.5) { breakdown.allCapsScore = 15; score += 15; }

  // Exclamation marks
  const exclamationCount = (email.subject.match(/!/g)?.length || 0);
  if (exclamationCount > 2) { breakdown.exclamationScore = 10; score += 10; }

  // Trigger words
  let triggerMatches = 0;
  for (const word of SPAM_TRIGGER_WORDS) {
    if (fullText.includes(word)) triggerMatches++;
  }
  if (triggerMatches > 0) {
    breakdown.triggerWordsScore = Math.min(triggerMatches * 5, 30);
    score += breakdown.triggerWordsScore;
  }

  // Links
  const linkCount = (email.htmlBody.match(/<a /g)?.length || 0);
  if (linkCount > 10) { breakdown.linksScore = 10; score += 10; }

  // Unsubscribe
  if (!email.headers['List-Unsubscribe']) {
    breakdown.unsubscribeScore = 20;
    score += 20;
  }

  // URL shorteners (bit.ly, etc)
  if (fullText.includes('bit.ly') || fullText.includes('tinyurl')) {
    breakdown.shortenerScore = 15;
    score += 15;
  }

  // Image to text ratio
  const imgCount = (email.htmlBody.match(/<img /g)?.length || 0);
  const textLength = email.textBody.length;
  if (imgCount > 0 && textLength < 100) {
    breakdown.imageTextScore = 10;
    score += 10;
  }

  const isPass = isLikelyToPassSpamFilter(score);
  
  return {
    totalScore: Math.min(score, 100),
    breakdown,
    suggestions: getSuggestions(breakdown),
    isLikelyToPass: isPass,
    confidence: 'Medium'
  };
}

export function getSuggestions(breakdown: SpamScoreBreakdown): string[] {
  const suggestions: string[] = [];
  if (breakdown.allCapsScore > 0) suggestions.push("Reduce the use of ALL CAPS in the subject.");
  if (breakdown.exclamationScore > 0) suggestions.push("Remove excessive exclamation marks.");
  if (breakdown.triggerWordsScore > 0) suggestions.push("Remove common spam trigger words (e.g., 'free', 'urgent').");
  if (breakdown.linksScore > 0) suggestions.push("Reduce the number of links in your email.");
  if (breakdown.unsubscribeScore > 0) suggestions.push("Include a List-Unsubscribe header.");
  if (breakdown.shortenerScore > 0) suggestions.push("Avoid using URL shorteners like bit.ly.");
  if (breakdown.imageTextScore > 0) suggestions.push("Increase the amount of text relative to images.");
  return suggestions;
}

export function isLikelyToPassSpamFilter(score: number): boolean {
  return score < 50;
}
