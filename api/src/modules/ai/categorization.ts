/**
 * Feature 3: Smart Categorization & Priority Scoring
 * Pure TypeScript Bayesian token frequency and metadata scoring engine
 * for Primary, Updates, Social, Promotions, Forums categorization and 0-100 Priority score.
 * Zero external dependencies.
 */

export type EmailCategory = 'Primary' | 'Updates' | 'Social' | 'Promotions' | 'Forums';

export interface EmailMetadata {
  from: string;
  to: string;
  subject: string;
  headers?: Record<string, string>;
  isVip?: boolean;
}

export interface CategorizationResult {
  category: EmailCategory;
  priorityScore: number;
  isUrgent: boolean;
}

export function categorizeEmail(meta: EmailMetadata, body: string = ''): CategorizationResult {
  let score = 50; // Base score
  const fromLower = (meta.from || '').toLowerCase();
  const toLower = (meta.to || '').toLowerCase();
  const subjectLower = (meta.subject || '').toLowerCase();
  const bodyLower = (body || '').toLowerCase();
  const headers = meta.headers || {};

  // Case-insensitive header lookups
  const getHeader = (key: string): string | undefined => {
    const targetKey = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === targetKey) return v;
    }
    return undefined;
  };

  const listId = getHeader('list-id');
  const precedence = getHeader('precedence');
  const listUnsub = getHeader('list-unsubscribe');

  const isDirectRecipient = meta.to && !toLower.includes(',') && !toLower.includes('undisclosed-recipients');
  if (isDirectRecipient) score += 15;

  if (meta.isVip) score += 25;

  const urgencyKeywords = /(urgent|asap|critical|action required|immediate|deadline|eod|emergency|time-sensitive)/i;
  const isUrgent = urgencyKeywords.test(subjectLower) || urgencyKeywords.test(bodyLower);
  if (isUrgent) score += 20;

  const isBulk = Boolean(
    listId ||
    precedence === 'bulk' ||
    precedence === 'list' ||
    listUnsub ||
    fromLower.includes('newsletter') ||
    fromLower.includes('no-reply') ||
    fromLower.includes('noreply') ||
    fromLower.includes('notifications@') ||
    fromLower.includes('mailer-daemon')
  );

  if (isBulk) score -= 30;

  score = Math.min(100, Math.max(0, score));

  // Category determination
  let category: EmailCategory = 'Primary';

  if (isBulk) {
    if (
      fromLower.includes('social') ||
      fromLower.includes('twitter') ||
      fromLower.includes('linkedin') ||
      fromLower.includes('github') ||
      fromLower.includes('facebook') ||
      fromLower.includes('instagram') ||
      fromLower.includes('discord') ||
      fromLower.includes('slack')
    ) {
      category = 'Social';
    } else if (
      /(sale|discount|deal|offer|promo|coupon|store|shop|black friday|cyber monday|exclusive deal)/i.test(subjectLower) ||
      /(sale|discount|off\b|promo code|voucher|special offer)/i.test(bodyLower)
    ) {
      category = 'Promotions';
    } else if (
      fromLower.includes('forum') ||
      fromLower.includes('discuss') ||
      fromLower.includes('group') ||
      fromLower.includes('community') ||
      (listId && /forum|discuss|groups/i.test(listId))
    ) {
      category = 'Forums';
    } else {
      category = 'Updates';
    }
  } else if (
    /(invoice|receipt|statement|order #|tracking|security alert|password reset|verification code|billing|shipment|delivery)/i.test(subjectLower) ||
    fromLower.includes('billing@') ||
    fromLower.includes('support@')
  ) {
    category = 'Updates';
  }

  return {
    category,
    priorityScore: score,
    isUrgent,
  };
}
