export interface ThreadMessage {
  sender: string;
  body: string;
  timestamp: number;
}

export function summarizeThread(messages: ThreadMessage[]): string {
  if (!messages || messages.length === 0) {
    return 'Empty thread.';
  }

  // Sort messages chronologically
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  
  const participants = new Set(sorted.map(m => m.sender));
  const pList = Array.from(participants).join(', ');

  let summary = `Thread with ${participants.size} participants (${pList}).\n\n`;
  
  // Very simplistic summary: take first sentence of each message
  for (const m of sorted) {
    const firstSentence = (m.body.split('.')[0] || m.body).trim();
    summary += `- ${m.sender} stated: "${firstSentence}..."\n`;
  }

  return summary;
}
