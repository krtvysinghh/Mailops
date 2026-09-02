import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aiRouter } from '../../src/routes/ai';

describe('AI Routes Integration & Endpoints Test Suite', () => {
  it('POST /smart-reply returns contextual reply options', async () => {
    const res = await aiRouter.request('/smart-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Can we sync on the architectural roadmap tomorrow?',
        senderName: 'Michael',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(Array.isArray(data.replies));
    assert.strictEqual(data.replies.length, 3);
    assert.ok(data.replies.some((r: any) => r.text.includes('Michael')));
  });

  it('POST /summarize returns TL;DR and key points', async () => {
    const text = 'The migration to Cloudflare D1 was completed smoothly. Latency dropped by 45% across all edge nodes worldwide. Database connection errors reached zero. Team members should now update their local development environments.';
    const res = await aiRouter.request('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(typeof data.tldr === 'string' && data.tldr.length > 0);
    assert.ok(Array.isArray(data.keyPoints) && data.keyPoints.length >= 2);
    assert.ok(data.wordCount > 15);
    assert.ok(data.readingTimeSeconds >= 1);
  });

  it('POST /categorize returns category, priorityScore, and isUrgent', async () => {
    const res = await aiRouter.request('/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'security@company.com',
        to: 'admin@company.com',
        subject: 'URGENT: Critical security vulnerability patch required',
        body: 'Please patch all servers ASAP before EOD.',
        isVip: true,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.category, 'Primary');
    assert.strictEqual(data.isUrgent, true);
    assert.ok(data.priorityScore >= 90);
  });

  it('POST /sentiment analyzes polarity, urgency and deadlines', async () => {
    const res = await aiRouter.request('/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Awesome progress team! Please deliver final designs by Friday 3pm.',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.sentiment, 'positive');
    assert.ok(data.score > 0);
    assert.strictEqual(data.isUrgent, true);
    assert.ok(data.detectedDeadlines.length >= 1);
  });

  it('POST /extract-tasks extracts action items with assignees and dates', async () => {
    const res = await aiRouter.request('/extract-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: '- [ ] Setup DKIM DNS records\n- [x] Configure worker route\nAlex, please verify staging deployment by tonight.',
        emailId: 'eml-123',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(Array.isArray(data.tasks));
    assert.strictEqual(data.tasks.length, 3);
    assert.strictEqual(data.tasks[0].completed, false);
    assert.strictEqual(data.tasks[1].completed, true);
    assert.strictEqual(data.tasks[2].assignee, 'Alex');
  });

  it('POST /search ranks documents using BM25 and filter operators', async () => {
    const docs = [
      { id: '1', from: 'alice@corp.com', to: 'team@corp.com', subject: 'Budget approval', body: 'The 2026 financial budget is approved.' },
      { id: '2', from: 'bob@corp.com', to: 'team@corp.com', subject: 'Offsite planning', body: 'Let us schedule the team offsite event.' },
    ];
    const res = await aiRouter.request('/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'financial budget',
        documents: docs,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(Array.isArray(data.results));
    assert.strictEqual(data.results.length, 1);
    assert.strictEqual(data.results[0].id, '1');
  });

  it('POST /decisions extracts key takeaways across thread messages', async () => {
    const messages = [
      { id: '1', author: 'lead@corp.com', body: 'We have decided to migrate to Tailwind CSS.', timestamp: '2026-09-01T08:00:00Z' },
    ];
    const res = await aiRouter.request('/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(Array.isArray(data.decisions));
    assert.strictEqual(data.decisions.length, 1);
    assert.ok(data.decisions[0].text.includes('migrate to Tailwind CSS'));
  });

  it('POST /nudges detects overdue threads needing response', async () => {
    const now = Date.now();
    const threads = [
      { threadId: 't1', lastSentByMe: true, lastMessageTimestamp: now - 5 * 86400000, subject: 'Follow up on proposal', hasQuestionOrCommitment: true, replied: false },
    ];
    const res = await aiRouter.request('/nudges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threads, nowMs: now, daysThreshold: 3 }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(Array.isArray(data.nudges));
    assert.strictEqual(data.nudges.length, 1);
    assert.strictEqual(data.nudges[0].type, 'need_followup');
  });

  it('POST /polish-draft transforms text to chosen tone', async () => {
    const res = await aiRouter.request('/polish-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: "hey, can't make it, thanks.",
        tone: 'professional',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(data.polishedText.includes('Dear'));
    assert.ok(data.polishedText.includes('cannot'));
    assert.ok(data.polishedText.includes('Thank you'));
    assert.ok(data.changesCount >= 3);
  });

  it('POST /parse-unsubscribe extracts RFC 8058 header data', async () => {
    const res = await aiRouter.request('/parse-unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headers: {
          'List-Unsubscribe': '<https://service.com/unsub>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.canOneClick, true);
    assert.strictEqual(data.unsubscribeUrl, 'https://service.com/unsub');
    assert.strictEqual(data.method, 'one-click-post');
  });

  it('POST /analyze provides complete unified email analytics', async () => {
    const res = await aiRouter.request('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'msg-99',
        from: 'ceo@tech.com',
        to: 'me@tech.com',
        subject: 'URGENT: Project Alpha launch readiness',
        textBody: 'Great job getting the build ready. Please review the checklist by Friday 5pm.\n- [ ] Final security scan\n- [x] Load testing passed\nWe agreed that launch date is next Monday.',
        isVip: true,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.ok(data.summary.tldr);
    assert.strictEqual(data.categorization.category, 'Primary');
    assert.strictEqual(data.sentiment.sentiment, 'positive');
    assert.ok(data.tasks.length >= 2);
    assert.ok(data.decisions.length >= 1);
    assert.strictEqual(data.smartReplies.length, 3);
  });
});
