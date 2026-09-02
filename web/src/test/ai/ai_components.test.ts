import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSmartReplies,
  summarizeEmail,
  categorizeEmail,
  analyzeSentiment,
  extractTasks,
  BM25SearchEngine,
  extractDecisions,
  detectFollowUpNudges,
  rephraseDraft,
  parseUnsubscribe,
} from '../../../../api/src/modules/ai';

describe('Web Client AI Features Integration', () => {
  it('Verifies Smart Reply Generator produces expected format for UI', () => {
    const replies = generateSmartReplies('Could we meet on Friday afternoon?', { senderName: 'David' });
    assert.strictEqual(replies.length, 3);
    assert.ok(replies.every(r => typeof r.text === 'string' && typeof r.tone === 'string'));
  });

  it('Verifies Summarizer returns structured data for UI card', () => {
    const summary = summarizeEmail('We successfully launched the 50 features. Client performance is stellar.');
    assert.ok(summary.tldr);
    assert.ok(Array.isArray(summary.keyPoints));
    assert.ok(summary.wordCount > 0);
  });

  it('Verifies Categorization and Priority for badges', () => {
    const res = categorizeEmail({ from: 'boss@corp.com', to: 'me@corp.com', subject: 'Urgent meeting', isVip: true });
    assert.strictEqual(res.category, 'Primary');
    assert.strictEqual(res.isUrgent, true);
    assert.ok(res.priorityScore >= 80);
  });

  it('Verifies Sentiment and Urgency analyzer for badges', () => {
    const res = analyzeSentiment('Thanks a lot for the great turnaround! Please submit by tomorrow 5pm.');
    assert.strictEqual(res.sentiment, 'positive');
    assert.strictEqual(res.isUrgent, true);
    assert.ok(res.detectedDeadlines.length >= 1);
  });

  it('Verifies Task Extractor for task list drawer', () => {
    const tasks = extractTasks('- [ ] Test AI components\n- [x] Write integration tests');
    assert.strictEqual(tasks.length, 2);
    assert.strictEqual(tasks[0].completed, false);
    assert.strictEqual(tasks[1].completed, true);
  });

  it('Verifies Decision Tracker for timeline component', () => {
    const decisions = extractDecisions([
      { id: '1', author: 'Team Lead', body: 'We agreed that release date is next week.', timestamp: '2026-09-02T10:00:00Z' }
    ]);
    assert.strictEqual(decisions.length, 1);
    assert.strictEqual(decisions[0].decider, 'Team Lead');
  });

  it('Verifies Follow-up Nudges for banner', () => {
    const now = Date.now();
    const nudges = detectFollowUpNudges([
      { threadId: 't1', lastSentByMe: true, lastMessageTimestamp: now - 4 * 86400000, subject: 'Quote request', hasQuestionOrCommitment: true, replied: false }
    ], now, 3);
    assert.strictEqual(nudges.length, 1);
    assert.strictEqual(nudges[0].type, 'need_followup');
  });

  it('Verifies Tone Polish for selector toolbar', () => {
    const res = rephraseDraft("hey, won't make it, thanks", 'professional');
    assert.ok(res.polishedText.includes('Dear'));
    assert.ok(res.polishedText.includes('will not'));
    assert.ok(res.polishedText.includes('Thank you'));
  });

  it('Verifies Unsubscribe Parser for banner', () => {
    const res = parseUnsubscribe({ 'List-Unsubscribe': '<https://newsletter.com/unsubscribe>' });
    assert.strictEqual(res.canOneClick, true);
    assert.strictEqual(res.unsubscribeUrl, 'https://newsletter.com/unsubscribe');
  });
});
