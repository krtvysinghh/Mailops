/**
 * Feature 4: Sentiment & Urgency Analyzer
 * Pure TypeScript lexicon-based sentiment polarity analyzer (-1 to +1),
 * negation-window modifier, urgency detector, and temporal deadline extractor.
 * Zero external dependencies.
 */

export type SentimentType = 'positive' | 'neutral' | 'negative' | 'urgent';

export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  score: number;
  isUrgent: boolean;
  detectedDeadlines: string[];
}

const POSITIVE_LEXICON = new Map<string, number>([
  ['great', 2], ['excellent', 3], ['awesome', 3], ['love', 2], ['happy', 2],
  ['pleased', 2], ['thank', 1], ['thanks', 1], ['good', 1], ['resolved', 2],
  ['helpful', 2], ['perfect', 3], ['appreciate', 2], ['congratulations', 3],
  ['fantastic', 3], ['wonderful', 3], ['glad', 2], ['delighted', 3], ['brilliant', 3],
  ['superb', 3], ['terrific', 3], ['outstanding', 3], ['success', 2], ['successful', 2],
  ['kudos', 2], ['fabulous', 3], ['positive', 1], ['valuable', 2], ['promising', 2]
]);

const NEGATIVE_LEXICON = new Map<string, number>([
  ['broken', -2], ['terrible', -3], ['horrible', -3], ['unacceptable', -3],
  ['frustrated', -2], ['angry', -2], ['failed', -2], ['bug', -1], ['error', -1],
  ['worst', -3], ['hate', -2], ['disappointed', -2], ['useless', -2], ['cancelled', -2],
  ['poor', -2], ['bad', -1], ['crash', -2], ['crashed', -2], ['failure', -2],
  ['flawed', -2], ['slow', -1], ['down', -1], ['outage', -3], ['disaster', -3],
  ['awful', -3], ['annoying', -2], ['confusing', -1], ['wrong', -1], ['downtime', -2]
]);

const NEGATION_WORDS = new Set(['not', 'never', 'no', 'hardly', 'barely', 'scarcely', 'cannot', 'cant', "can't", "don't", "didn't", "won't", "isn't"]);

export function analyzeSentiment(text: string): SentimentAnalysisResult {
  if (!text || !text.trim()) {
    return {
      sentiment: 'neutral',
      score: 0,
      isUrgent: false,
      detectedDeadlines: [],
    };
  }

  const clean = text
    .replace(/^>.*$/gm, '')
    .replace(/On .* wrote:[\s\S]*/gi, '')
    .trim();

  if (!clean) {
    return {
      sentiment: 'neutral',
      score: 0,
      isUrgent: false,
      detectedDeadlines: [],
    };
  }

  const words = clean.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
  let totalScore = 0;
  let hitCount = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';
    const isNegated = NEGATION_WORDS.has(prevWord);
    const multiplier = isNegated ? -1 : 1;

    if (POSITIVE_LEXICON.has(word)) {
      totalScore += POSITIVE_LEXICON.get(word)! * multiplier;
      hitCount++;
    } else if (NEGATIVE_LEXICON.has(word)) {
      totalScore += NEGATIVE_LEXICON.get(word)! * multiplier;
      hitCount++;
    }
  }

  const normalizedScore = hitCount > 0 ? Math.max(-1, Math.min(1, totalScore / (hitCount * 2))) : 0;

  // Urgency & Deadline extraction
  const deadlineMatches: string[] = [];
  const deadlineRegex = /(?:by|before|until|due)\s+(?:(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|eod|noon|\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?))/gi;
  let match: RegExpExecArray | null;
  while ((match = deadlineRegex.exec(clean)) !== null) {
    deadlineMatches.push(match[0].trim());
  }

  const urgencyKeywords = /(urgent|asap|critical|immediate|emergency|time-sensitive|action required|priority 1|p0|sev 1)/i;
  const isUrgent = urgencyKeywords.test(clean) || deadlineMatches.length > 0;

  let sentiment: SentimentType = 'neutral';
  if (isUrgent && normalizedScore < 0) {
    sentiment = 'urgent';
  } else if (normalizedScore > 0.2) {
    sentiment = 'positive';
  } else if (normalizedScore < -0.2) {
    sentiment = 'negative';
  }

  return {
    sentiment,
    score: Number(normalizedScore.toFixed(2)),
    isUrgent,
    detectedDeadlines: deadlineMatches,
  };
}
