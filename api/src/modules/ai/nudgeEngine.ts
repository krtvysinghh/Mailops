/**
 * Feature 8: Smart Follow-Up Nudge Engine
 * Pure TypeScript response expectation tracker identifying unanswered sent
 * and inbound emails needing replies after N days. Zero external dependencies.
 */

export interface ThreadRecord {
  threadId: string;
  lastSentByMe: boolean;
  lastMessageTimestamp: number; // Epoch ms
  subject: string;
  hasQuestionOrCommitment: boolean;
  replied: boolean;
}

export type NudgeType = 'need_followup' | 'need_reply';

export interface NudgeAlert {
  threadId: string;
  subject: string;
  daysWaiting: number;
  type: NudgeType;
}

export function detectFollowUpNudges(
  threads: ThreadRecord[],
  nowMs: number = Date.now(),
  daysThreshold: number = 3
): NudgeAlert[] {
  if (!threads || threads.length === 0) return [];

  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
  const nudges: NudgeAlert[] = [];

  for (const thread of threads) {
    if (thread.replied) continue;

    const elapsedMs = nowMs - thread.lastMessageTimestamp;
    if (elapsedMs < 0) continue; // Future timestamp safeguard

    if (elapsedMs >= thresholdMs) {
      const daysWaiting = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
      if (thread.lastSentByMe && thread.hasQuestionOrCommitment) {
        nudges.push({
          threadId: thread.threadId,
          subject: thread.subject,
          daysWaiting,
          type: 'need_followup',
        });
      } else if (!thread.lastSentByMe && thread.hasQuestionOrCommitment) {
        nudges.push({
          threadId: thread.threadId,
          subject: thread.subject,
          daysWaiting,
          type: 'need_reply',
        });
      }
    }
  }

  return nudges;
}
