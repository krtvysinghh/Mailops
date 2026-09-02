/**
 * Feature 7: Key Takeaways & Decision Tracker
 * Pure TypeScript discourse pattern parser for consensus, agreements,
 * and managerial action conclusions across email threads. Zero external dependencies.
 */

export interface ThreadMessage {
  id: string;
  author: string;
  body: string;
  timestamp: string;
}

export interface ExtractedDecision {
  text: string;
  decider: string;
  emailId: string;
  timestamp: string;
}

export function extractDecisions(messages: ThreadMessage[]): ExtractedDecision[] {
  if (!messages || messages.length === 0) return [];

  const decisionPatterns: RegExp[] = [
    /(?:we agreed that|we have decided to|decision is to|consensus is to|confirmed that|let's proceed with|approved:?)\s+([^.\n]+(?:\.[0-9]+[^.\n]*)*)/i,
    /(?:I approve|approved by [A-Za-z]+)\s*(?:the\s+)?([^.\n]+(?:\.[0-9]+[^.\n]*)*)/i,
    /(?:Final decision:?)\s*([^.\n]+(?:\.[0-9]+[^.\n]*)*)/i,
  ];

  const decisions: ExtractedDecision[] = [];

  for (const msg of messages) {
    if (!msg.body || !msg.body.trim()) continue;

    for (const pattern of decisionPatterns) {
      const match = pattern.exec(msg.body);
      if (match && match[1]?.trim()) {
        const text = match[1].trim().replace(/\.$/, '');
        if (text) {
          decisions.push({
            text,
            decider: msg.author,
            emailId: msg.id,
            timestamp: msg.timestamp,
          });
          break; // Avoid duplicate extractions for the same message
        }
      }
    }
  }

  return decisions;
}
