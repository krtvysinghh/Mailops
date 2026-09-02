/**
 * Feature 1: AI Smart Reply Generator
 * Pure TypeScript implementation generating contextual one-click replies
 * with sentiment, intent, and tone adaptation. Zero external dependencies.
 */

export type SmartReplyTone = 'enthusiastic' | 'neutral' | 'deferral' | 'inquisitive';

export interface SmartReplyOption {
  text: string;
  tone: SmartReplyTone;
}

export interface SmartReplyContext {
  senderName?: string;
  threadHistory?: string[];
}

export function generateSmartReplies(
  text: string,
  context?: SmartReplyContext
): SmartReplyOption[] {
  const cleaned = (text || '')
    .replace(/^>.*$/gm, '') // Strip blockquotes
    .replace(/On .* wrote:[\s\S]*/gi, '') // Strip reply headers
    .replace(/[-_]{2,}[\s\S]*/g, '') // Strip standard signatures
    .trim();

  if (!cleaned || cleaned.length < 3) {
    return [
      { text: 'Received, thank you.', tone: 'neutral' },
      { text: 'Thanks for the update.', tone: 'neutral' },
      { text: 'Got it, will review shortly.', tone: 'deferral' },
    ];
  }

  const lower = cleaned.toLowerCase();
  const sender = context?.senderName ? ` ${context.senderName}` : '';
  const hasQuestion = lower.includes('?') || /(could you|can we|are you|what do you|when can|would you|is it possible)/i.test(lower);
  const isMeeting = /(meet|meeting|call|schedule|sync|zoom|calendar|coffee|discuss|demo)/i.test(lower);
  const isUrgent = /(urgent|asap|today|deadline|critical|immediately|emergency|time-sensitive)/i.test(lower);
  const isGratitude = /(thank you|thanks|appreciate|great job|well done|kudos|grateful)/i.test(lower);

  if (isMeeting) {
    return [
      { text: `Sounds good${sender}, that time works for me!`, tone: 'enthusiastic' },
      { text: `I have a conflict then. Could we try later this week?`, tone: 'deferral' },
      { text: `Let me check my calendar${sender} and get back to you today.`, tone: 'deferral' },
    ];
  }

  if (hasQuestion) {
    return [
      { text: `Yes, absolutely${sender}! I will take care of that.`, tone: 'enthusiastic' },
      { text: `I am looking into this now and will follow up shortly.`, tone: 'deferral' },
      { text: `Could you clarify the specifics on this point?`, tone: 'inquisitive' },
    ];
  }

  if (isUrgent) {
    return [
      { text: `On it right away${sender}!`, tone: 'enthusiastic' },
      { text: `Understood, reviewing as high priority.`, tone: 'neutral' },
      { text: `Will have an update for you by end of day.`, tone: 'deferral' },
    ];
  }

  if (isGratitude) {
    return [
      { text: `You're very welcome${sender}! Glad I could help.`, tone: 'enthusiastic' },
      { text: `Happy to help anytime!`, tone: 'enthusiastic' },
      { text: `Anytime${sender}! Let me know if anything else comes up.`, tone: 'neutral' },
    ];
  }

  return [
    { text: `Thanks for the update${sender}!`, tone: 'neutral' },
    { text: `Sounds good, let's proceed.`, tone: 'enthusiastic' },
    { text: `Received. I will follow up if I have any questions.`, tone: 'deferral' },
  ];
}
