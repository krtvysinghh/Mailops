import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ScheduledSendManager,
  validateSendTime,
  UndoSendManager,
  validateGracePeriod,
  SnoozeReminderManager,
  calculateSnoozeTimestamp,
  evaluateConditionNode,
  evaluateRule,
  evaluateRuleSet,
  validateRule,
  parsePlaceholder,
  applyFilters,
  extractPlaceholders,
  interpolateString,
  renderTemplate,
  TemplateManager,
  ShortcutsRegistry,
  fuzzyMatch,
  KeySequenceBuffer,
  buildJwzThreads,
  normalizeSubject,
  parseMessageIds,
  flattenThread,
  BatchProcessor,
  applyOperationToItem,
  VacationResponder,
  isAutoSubmittedOrMailingList,
  normalizeEmail,
  OfflineSyncManager,
  applyOptimisticMutation,
  resolveConflict,
  type AutomationRule,
  type ThreadableEmail,
  type VacationSettings,
  type InboundEmailMetadata,
  type SyncMutation,
} from '../../src/modules/productivity';

// ==========================================
// FEATURE 11: Scheduled Send (Send Later)
// ==========================================
describe('Feature 11: Scheduled Send (Send Later)', () => {
  // Tier 1: Happy Path Tests
  it('1.1 should schedule an email with future timestamp successfully', () => {
    const manager = new ScheduledSendManager();
    const future = Date.now() + 100000;
    const res = manager.schedule(
      {
        domainId: 'domain.com',
        fromAddr: 'sender@domain.com',
        toAddr: 'recipient@domain.com',
        subject: 'Scheduled Subject',
        textBody: 'Body text',
      },
      { sendAt: future }
    );

    assert.equal(res.success, true);
    assert.ok(res.item);
    assert.equal(res.item.status, 'pending');
    assert.equal(res.item.sendAt, future);
    assert.equal(res.item.subject, 'Scheduled Subject');
  });

  it('1.2 should cancel a pending scheduled email', () => {
    const manager = new ScheduledSendManager();
    const future = Date.now() + 100000;
    const res = manager.schedule(
      {
        domainId: 'domain.com',
        fromAddr: 'sender@domain.com',
        toAddr: 'recipient@domain.com',
        subject: 'To Cancel',
      },
      { sendAt: future }
    );

    const cancelRes = manager.cancel(res.item!.id);
    assert.equal(cancelRes.success, true);
    assert.equal(cancelRes.item?.status, 'cancelled');

    const updated = manager.get(res.item!.id);
    assert.equal(updated?.status, 'cancelled');
  });

  it('1.3 should reschedule a pending email to a new valid timestamp', () => {
    const manager = new ScheduledSendManager();
    const t1 = Date.now() + 50000;
    const t2 = Date.now() + 200000;

    const res = manager.schedule(
      {
        domainId: 'domain.com',
        fromAddr: 'sender@domain.com',
        toAddr: 'recipient@domain.com',
        subject: 'To Reschedule',
      },
      { sendAt: t1 }
    );

    const resched = manager.reschedule(res.item!.id, t2);
    assert.equal(resched.success, true);
    assert.equal(resched.item?.sendAt, t2);
    assert.equal(manager.get(res.item!.id)?.sendAt, t2);
  });

  it('1.4 should identify due emails based on reference timestamp', () => {
    const manager = new ScheduledSendManager();
    const now = 1000000;
    manager.schedule(
      { domainId: 'd', fromAddr: 'a@d.com', toAddr: 'b@d.com', subject: 'Due 1' },
      { sendAt: now - 5000, allowPast: true }
    );
    manager.schedule(
      { domainId: 'd', fromAddr: 'a@d.com', toAddr: 'b@d.com', subject: 'Due 2' },
      { sendAt: now, allowPast: true }
    );
    manager.schedule(
      { domainId: 'd', fromAddr: 'a@d.com', toAddr: 'b@d.com', subject: 'Future' },
      { sendAt: now + 5000, allowPast: true }
    );

    const due = manager.getDueEmails(now);
    assert.equal(due.length, 2);
    assert.equal(due[0].subject, 'Due 1');
    assert.equal(due[1].subject, 'Due 2');
  });

  it('1.5 should process and dispatch due scheduled emails', async () => {
    const manager = new ScheduledSendManager();
    const now = 2000000;
    manager.schedule(
      { domainId: 'd', fromAddr: 'a@d.com', toAddr: 'b@d.com', subject: 'Dispatch 1' },
      { sendAt: now - 100, allowPast: true }
    );

    const result = await manager.processDueEmails(now, async (item) => {
      return item.subject.includes('Dispatch');
    });

    assert.equal(result.dueCount, 1);
    assert.equal(result.dispatched.length, 1);
    assert.equal(result.dispatched[0].status, 'sent');
    assert.equal(result.remainingPending, 0);
  });

  // Tier 2: Boundary & Corner Cases
  it('1.6 should reject scheduling with past timestamp when allowPast is false', () => {
    const manager = new ScheduledSendManager();
    const past = Date.now() - 50000;
    const res = manager.schedule(
      { domainId: 'd', fromAddr: 'a@d.com', toAddr: 'b@d.com', subject: 'Past' },
      { sendAt: past, allowPast: false }
    );

    assert.equal(res.success, false);
    assert.ok(res.error?.includes('in the future'));
  });

  it('1.7 should reject scheduling with missing required fields', () => {
    const manager = new ScheduledSendManager();
    const res = manager.schedule(
      { domainId: 'd', fromAddr: '', toAddr: 'b@d.com', subject: 'No From' },
      { sendAt: Date.now() + 10000 }
    );
    assert.equal(res.success, false);
    assert.ok(res.error?.includes('Missing required fields'));
  });

  it('1.8 should reject cancellation of non-existent ID or already sent email', async () => {
    const manager = new ScheduledSendManager();
    const notFound = manager.cancel('invalid_id_999');
    assert.equal(notFound.success, false);

    const now = 5000;
    const sched = manager.schedule(
      { domainId: 'd', fromAddr: 'a@d.com', toAddr: 'b@d.com', subject: 'Already Sent' },
      { sendAt: now - 100, allowPast: true }
    );
    await manager.processDueEmails(now);

    const cancelSent = manager.cancel(sched.item!.id);
    assert.equal(cancelSent.success, false);
    assert.ok(cancelSent.error?.includes("status 'sent'"));
  });

  it('1.9 should support ISO date string and Date object inputs in validateSendTime', () => {
    const d = new Date(Date.now() + 100000);
    const iso = d.toISOString();

    const v1 = validateSendTime(d);
    assert.equal(v1.valid, true);
    assert.equal(v1.targetTimestamp, d.getTime());

    const v2 = validateSendTime(iso);
    assert.equal(v2.valid, true);
    assert.equal(v2.targetTimestamp, d.getTime());

    const vInvalid = validateSendTime('invalid-date-string');
    assert.equal(vInvalid.valid, false);
  });

  it('1.10 should handle send hook failure gracefully and transition status to failed', async () => {
    const manager = new ScheduledSendManager();
    const now = 10000;
    const sched = manager.schedule(
      { domainId: 'd', fromAddr: 'a@d.com', toAddr: 'b@d.com', subject: 'Will Fail' },
      { sendAt: now - 10, allowPast: true }
    );

    const res = await manager.processDueEmails(now, async () => {
      throw new Error('SMTP connection timeout');
    });

    assert.equal(res.failed.length, 1);
    assert.ok(res.failed[0].error.includes('SMTP connection timeout'));
    assert.equal(manager.get(sched.item!.id)?.status, 'failed');
  });
});

// ==========================================
// FEATURE 12: Undo Send Grace Buffer
// ==========================================
describe('Feature 12: Undo Send Grace Buffer', () => {
  // Tier 1: Happy Path
  it('2.1 should enqueue email and return cancellation token with default 10s grace', () => {
    const manager = new UndoSendManager();
    const res = manager.enqueue({
      fromAddr: 'sender@test.com',
      toAddr: 'rcpt@test.com',
      subject: 'Grace Buffer Test',
    });

    assert.equal(res.success, true);
    assert.ok(res.ticket.token.startsWith('undo_'));
    assert.equal(res.ticket.gracePeriodSeconds, 10);
    assert.equal(res.ticket.status, 'buffered');
    assert.equal(res.ticket.expiresAt, res.ticket.bufferedAt + 10000);
  });

  it('2.2 should cancel send when token is submitted within grace period', () => {
    const manager = new UndoSendManager();
    const { ticket } = manager.enqueue({
      fromAddr: 'sender@test.com',
      toAddr: 'rcpt@test.com',
      subject: 'Will Undo',
    });

    const cancelRes = manager.cancel(ticket.token, ticket.bufferedAt + 3000);
    assert.equal(cancelRes.success, true);
    assert.equal(cancelRes.ticket?.status, 'cancelled');
    assert.ok(cancelRes.message.includes('cancelled'));
  });

  it('2.3 should calculate accurate remaining grace milliseconds', () => {
    const manager = new UndoSendManager();
    const { ticket } = manager.enqueue(
      {
        fromAddr: 'sender@test.com',
        toAddr: 'rcpt@test.com',
        subject: 'Time Remaining',
      },
      15
    );

    const rem = manager.getRemainingTime(ticket.token, ticket.bufferedAt + 5000);
    assert.equal(rem.status, 'buffered');
    assert.equal(rem.remainingMs, 10000);
  });

  it('2.4 should flush expired tickets and transition them to dispatched', () => {
    const manager = new UndoSendManager();
    const { ticket } = manager.enqueue(
      {
        fromAddr: 's@t.com',
        toAddr: 'r@t.com',
        subject: 'Auto Flush',
      },
      5
    );

    const flushedBefore = manager.flushExpired(ticket.bufferedAt + 2000);
    assert.equal(flushedBefore.length, 0);

    const flushedAfter = manager.flushExpired(ticket.bufferedAt + 6000);
    assert.equal(flushedAfter.length, 1);
    assert.equal(flushedAfter[0].status, 'dispatched');
  });

  it('2.5 should allow configuring custom grace period between 5s and 30s', () => {
    const manager = new UndoSendManager();
    const setRes = manager.setGracePeriod(20);
    assert.equal(setRes.success, true);
    assert.equal(manager.getGracePeriod(), 20);

    const { ticket } = manager.enqueue({
      fromAddr: 's@t.com',
      toAddr: 'r@t.com',
      subject: 'Custom 20s',
    });
    assert.equal(ticket.gracePeriodSeconds, 20);
  });

  // Tier 2: Boundary & Corner Cases
  it('2.6 should clamp grace period values outside 5-30s bounds in validateGracePeriod', () => {
    const low = validateGracePeriod(2);
    assert.equal(low.valid, false);
    assert.equal(low.clampedSeconds, 5);

    const high = validateGracePeriod(60);
    assert.equal(high.valid, false);
    assert.equal(high.clampedSeconds, 30);

    const normal = validateGracePeriod(15);
    assert.equal(normal.valid, true);
    assert.equal(normal.clampedSeconds, 15);
  });

  it('2.7 should reject cancellation after grace period has expired', () => {
    const manager = new UndoSendManager();
    const { ticket } = manager.enqueue(
      { fromAddr: 's@t.com', toAddr: 'r@t.com', subject: 'Too Late' },
      5
    );

    const cancelRes = manager.cancel(ticket.token, ticket.bufferedAt + 5500);
    assert.equal(cancelRes.success, false);
    assert.equal(cancelRes.ticket?.status, 'dispatched');
    assert.ok(cancelRes.message.includes('expired'));
  });

  it('2.8 should prevent double cancellation of the same token', () => {
    const manager = new UndoSendManager();
    const { ticket } = manager.enqueue({ fromAddr: 's@t.com', toAddr: 'r@t.com', subject: 'Double' });

    const c1 = manager.cancel(ticket.token, ticket.bufferedAt + 1000);
    assert.equal(c1.success, true);

    const c2 = manager.cancel(ticket.token, ticket.bufferedAt + 2000);
    assert.equal(c2.success, false);
    assert.ok(c2.message.includes('already cancelled'));
  });

  it('2.9 should return remaining time 0 for unknown or cancelled tickets', () => {
    const manager = new UndoSendManager();
    const remUnknown = manager.getRemainingTime('non_existent_token');
    assert.equal(remUnknown.remainingMs, 0);

    const { ticket } = manager.enqueue({ fromAddr: 's@t.com', toAddr: 'r@t.com', subject: 'X' });
    manager.cancel(ticket.token);
    const remCancelled = manager.getRemainingTime(ticket.token);
    assert.equal(remCancelled.status, 'cancelled');
    assert.equal(remCancelled.remainingMs, 0);
  });

  it('2.10 should list active buffered tickets correctly', () => {
    const manager = new UndoSendManager();
    const t1 = manager.enqueue({ fromAddr: 'a@t.com', toAddr: 'b@t.com', subject: 'Active 1' }, 10);
    const t2 = manager.enqueue({ fromAddr: 'a@t.com', toAddr: 'b@t.com', subject: 'Active 2' }, 10);

    manager.cancel(t1.ticket.token);
    const active = manager.listActive();
    assert.equal(active.length, 1);
    assert.equal(active[0].token, t2.ticket.token);
  });
});

// ==========================================
// FEATURE 13: Email Snooze & Reminder System
// ==========================================
describe('Feature 13: Email Snooze & Reminder System', () => {
  // Tier 1: Happy Path
  it('3.1 should calculate later_today snooze preset as +4 hours', () => {
    const ref = 1700000000000;
    const res = calculateSnoozeTimestamp('later_today', { referenceTime: ref });
    assert.equal(res.timestamp, ref + 4 * 60 * 60 * 1000);
  });

  it('3.2 should calculate tomorrow_morning preset to 9:00 AM next day', () => {
    const ref = new Date('2026-09-02T14:30:00Z').getTime();
    const res = calculateSnoozeTimestamp('tomorrow_morning', { referenceTime: ref });
    const target = new Date(res.timestamp);

    assert.equal(target.getDate(), 3);
    assert.equal(target.getHours(), 9);
    assert.equal(target.getMinutes(), 0);
  });

  it('3.3 should snooze an email and record state', () => {
    const manager = new SnoozeReminderManager();
    const ref = 1000000;
    const res = manager.snooze('msg_123', 'later_today', {
      referenceTime: ref,
      reason: 'Waiting on client feedback',
      originalFolderId: 'inbox',
    });

    assert.equal(res.success, true);
    assert.equal(res.state?.emailId, 'msg_123');
    assert.equal(res.state?.reason, 'Waiting on client feedback');
    assert.equal(res.state?.snoozedUntil, ref + 4 * 60 * 60 * 1000);
  });

  it('3.4 should manually unsnooze an email', () => {
    const manager = new SnoozeReminderManager();
    manager.snooze('msg_456', 'tomorrow_morning');
    const unsnoozeRes = manager.unsnooze('msg_456');

    assert.equal(unsnoozeRes.success, true);
    assert.equal(unsnoozeRes.state?.isWokenUp, true);
    assert.equal(manager.get('msg_456'), undefined);
  });

  it('3.5 should process due wakeups and generate reminder alerts', () => {
    const manager = new SnoozeReminderManager();
    const now = 2000000;
    manager.snooze('msg_due', 'custom', {
      referenceTime: now - 50000,
      customTimestamp: now - 1000,
      reason: 'Urgent task deadline',
    });

    const wakeResult = manager.processDueWakeups(now);
    assert.equal(wakeResult.dueCount, 1);
    assert.equal(wakeResult.wokenUp[0].emailId, 'msg_due');
    assert.equal(wakeResult.alerts.length, 1);
    assert.ok(wakeResult.alerts[0].message.includes('Urgent task deadline'));
  });

  // Tier 2: Boundary & Corner Cases
  it('3.6 should reject custom snooze timestamp in the past', () => {
    const ref = 1000000;
    const past = 500000;
    const res = calculateSnoozeTimestamp('custom', {
      referenceTime: ref,
      customTimestamp: past,
    });

    assert.equal(res.timestamp, 0);
    assert.ok(res.error?.includes('in the future'));
  });

  it('3.7 should compute this_weekend preset to Saturday 9:00 AM', () => {
    // Wednesday 2026-09-02
    const ref = new Date('2026-09-02T10:00:00Z').getTime();
    const res = calculateSnoozeTimestamp('this_weekend', { referenceTime: ref });
    const target = new Date(res.timestamp);

    assert.equal(target.getDay(), 6); // Saturday
    assert.equal(target.getHours(), 9);
  });

  it('3.8 should compute next_week preset to Monday 9:00 AM', () => {
    const ref = new Date('2026-09-02T10:00:00Z').getTime();
    const res = calculateSnoozeTimestamp('next_week', { referenceTime: ref });
    const target = new Date(res.timestamp);

    assert.equal(target.getDay(), 1); // Monday
    assert.equal(target.getHours(), 9);
  });

  it('3.9 should handle missing emailId or invalid preset gracefully', () => {
    const manager = new SnoozeReminderManager();
    const r1 = manager.snooze('', 'later_today');
    assert.equal(r1.success, false);

    const r2 = manager.unsnooze('non_existent');
    assert.equal(r2.success, false);
    assert.ok(r2.error?.includes('not snoozed'));
  });

  it('3.10 should list only currently active snoozed emails', () => {
    const manager = new SnoozeReminderManager();
    manager.snooze('e1', 'later_today');
    manager.snooze('e2', 'tomorrow_morning');
    manager.unsnooze('e1');

    const active = manager.listActive();
    assert.equal(active.length, 1);
    assert.equal(active[0].emailId, 'e2');
  });
});

// ==========================================
// FEATURE 14: Automation Rules & Filter Engine
// ==========================================
describe('Feature 14: Automation Rules & Filter Engine', () => {
  // Tier 1: Happy Path
  it('4.1 should evaluate simple predicate on email subject (contains)', () => {
    const node = {
      type: 'predicate' as const,
      field: 'subject',
      operator: 'contains' as const,
      value: 'Invoice',
    };

    assert.equal(evaluateConditionNode(node, { fromAddr: 'a@b.com', toAddr: 'c@d.com', subject: 'Your Monthly Invoice #102' }), true);
    assert.equal(evaluateConditionNode(node, { fromAddr: 'a@b.com', toAddr: 'c@d.com', subject: 'Team Meeting' }), false);
  });

  it('4.2 should evaluate composite AND/OR logical AST nodes', () => {
    const ast = {
      type: 'logical' as const,
      operator: 'AND' as const,
      children: [
        { type: 'predicate' as const, field: 'from', operator: 'ends_with' as const, value: '@acme.com' },
        {
          type: 'logical' as const,
          operator: 'OR' as const,
          children: [
            { type: 'predicate' as const, field: 'subject', operator: 'contains' as const, value: 'Urgent' },
            { type: 'predicate' as const, field: 'priorityScore', operator: 'greater_than' as const, value: 80 },
          ],
        },
      ],
    };

    assert.equal(
      evaluateConditionNode(ast, {
        fromAddr: 'ceo@acme.com',
        toAddr: 'user@mailops.dev',
        subject: 'Urgent update',
        priorityScore: 50,
      }),
      true
    );

    assert.equal(
      evaluateConditionNode(ast, {
        fromAddr: 'ceo@acme.com',
        toAddr: 'user@mailops.dev',
        subject: 'Casual hello',
        priorityScore: 90,
      }),
      true
    );

    assert.equal(
      evaluateConditionNode(ast, {
        fromAddr: 'external@gmail.com',
        toAddr: 'user@mailops.dev',
        subject: 'Urgent update',
        priorityScore: 95,
      }),
      false
    );
  });

  it('4.3 should execute actions: star, apply_label, and move_folder in rule set', () => {
    const rules: AutomationRule[] = [
      {
        id: 'r1',
        name: 'VIP Label Rule',
        trigger: 'on_inbound',
        condition: { type: 'predicate', field: 'from', operator: 'contains', value: 'vip' },
        actions: [
          { type: 'star' },
          { type: 'apply_label', value: 'VIP' },
          { type: 'move_folder', value: 'important' },
        ],
        isActive: true,
        orderPriority: 1,
      },
    ];

    const result = evaluateRuleSet(rules, {
      fromAddr: 'vip-client@example.com',
      toAddr: 'me@mailops.dev',
      subject: 'Deal update',
    });

    assert.equal(result.matchedRules.length, 1);
    assert.equal(result.finalEmailState.starred, true);
    assert.deepEqual(result.finalEmailState.labels, ['VIP']);
    assert.equal(result.finalEmailState.folderId, 'important');
  });

  it('4.4 should support stop_processing action to short-circuit lower priority rules', () => {
    const rules: AutomationRule[] = [
      {
        id: 'r1',
        name: 'Spam Filter',
        trigger: 'on_inbound',
        condition: { type: 'predicate', field: 'subject', operator: 'contains', value: 'Viagra' },
        actions: [{ type: 'trash' }, { type: 'stop_processing' }],
        isActive: true,
        orderPriority: 1,
      },
      {
        id: 'r2',
        name: 'Star All Inbound',
        trigger: 'on_inbound',
        condition: { type: 'predicate', field: 'from', operator: 'is_not_empty' },
        actions: [{ type: 'star' }],
        isActive: true,
        orderPriority: 2,
      },
    ];

    const result = evaluateRuleSet(rules, {
      fromAddr: 'spammer@bad.com',
      toAddr: 'me@mailops.dev',
      subject: 'Cheap Viagra now',
    });

    assert.equal(result.stoppedEarly, true);
    assert.equal(result.matchedRules.length, 1);
    assert.equal(result.finalEmailState.folderId, 'trash');
    assert.equal(result.finalEmailState.starred, undefined); // r2 never ran
  });

  it('4.5 should extract and evaluate custom email headers like List-Unsubscribe', () => {
    const rule: AutomationRule = {
      id: 'r_newsletter',
      name: 'Newsletter Auto-Archive',
      trigger: 'on_inbound',
      condition: {
        type: 'predicate',
        field: 'header:List-Unsubscribe',
        operator: 'is_not_empty',
      },
      actions: [{ type: 'archive' }, { type: 'apply_label', value: 'Newsletters' }],
      isActive: true,
      orderPriority: 1,
    };

    const result = evaluateRuleSet([rule], {
      fromAddr: 'newsletter@tech.com',
      toAddr: 'me@mailops.dev',
      headers: {
        'List-Unsubscribe': '<mailto:unsub@tech.com>',
      },
    });

    assert.equal(result.matchedRules.length, 1);
    assert.equal(result.finalEmailState.archived, true);
    assert.deepEqual(result.finalEmailState.labels, ['Newsletters']);
  });

  // Tier 2: Boundary & Corner Cases
  it('4.6 should evaluate regex predicate safely and catch invalid regexes in validation', () => {
    const validRegexNode = {
      type: 'predicate' as const,
      field: 'subject',
      operator: 'matches_regex' as const,
      value: 'Order\\s+#\\d{4,6}',
    };

    assert.equal(
      evaluateConditionNode(validRegexNode, {
        fromAddr: 'a@b.com',
        toAddr: 'c@d.com',
        subject: 'Receipt for Order #59421',
      }),
      true
    );

    const invalidRule: AutomationRule = {
      id: 'bad_regex',
      name: 'Bad Regex Rule',
      trigger: 'on_inbound',
      condition: {
        type: 'predicate',
        field: 'subject',
        operator: 'matches_regex',
        value: '[a-z', // Unclosed bracket
      },
      actions: [{ type: 'star' }],
      isActive: true,
      orderPriority: 1,
    };

    const val = validateRule(invalidRule);
    assert.equal(val.valid, false);
    assert.ok(val.errors.some((e) => e.includes('Invalid regex')));
  });

  it('4.7 should evaluate numeric comparisons on priorityScore and spamScore', () => {
    const gtNode = {
      type: 'predicate' as const,
      field: 'priorityScore',
      operator: 'greater_than_or_equal' as const,
      value: 75,
    };

    assert.equal(evaluateConditionNode(gtNode, { fromAddr: 'a@b.com', toAddr: 'c@d.com', priorityScore: 80 }), true);
    assert.equal(evaluateConditionNode(gtNode, { fromAddr: 'a@b.com', toAddr: 'c@d.com', priorityScore: 75 }), true);
    assert.equal(evaluateConditionNode(gtNode, { fromAddr: 'a@b.com', toAddr: 'c@d.com', priorityScore: 70 }), false);
  });

  it('4.8 should evaluate in_list and not_in_list operators', () => {
    const inListNode = {
      type: 'predicate' as const,
      field: 'category',
      operator: 'in_list' as const,
      value: ['updates', 'promotions', 'social'],
    };

    assert.equal(evaluateConditionNode(inListNode, { fromAddr: 'a@b.com', toAddr: 'c@d.com', category: 'promotions' }), true);
    assert.equal(evaluateConditionNode(inListNode, { fromAddr: 'a@b.com', toAddr: 'c@d.com', category: 'primary' }), false);
  });

  it('4.9 should handle empty rules array or inactive rules without mutating email state', () => {
    const inactiveRule: AutomationRule = {
      id: 'r_off',
      name: 'Disabled Rule',
      trigger: 'on_inbound',
      condition: { type: 'predicate', field: 'from', operator: 'contains', value: 'a' },
      actions: [{ type: 'star' }],
      isActive: false,
      orderPriority: 1,
    };

    const res = evaluateRuleSet([inactiveRule], { fromAddr: 'a@b.com', toAddr: 'c@d.com' });
    assert.equal(res.matchedRules.length, 0);
    assert.equal(res.finalEmailState.starred, undefined);
  });

  it('4.10 should accumulate forward recipients and auto replies from matching rules', () => {
    const rules: AutomationRule[] = [
      {
        id: 'r_forward',
        name: 'Auto Forward Support',
        trigger: 'on_inbound',
        condition: { type: 'predicate', field: 'subject', operator: 'contains', value: 'Help' },
        actions: [
          { type: 'forward_to', value: 'support-tier2@company.com' },
          { type: 'auto_reply', value: 'We received your help request.' },
        ],
        isActive: true,
        orderPriority: 1,
      },
    ];

    const res = evaluateRuleSet(rules, {
      fromAddr: 'user@test.com',
      toAddr: 'support@company.com',
      subject: 'Need Help with account',
    });

    assert.deepEqual(res.forwardRecipients, ['support-tier2@company.com']);
    assert.deepEqual(res.autoReplies, [{ templateOrText: 'We received your help request.' }]);
  });
});

// ==========================================
// FEATURE 15: Templates & Canned Responses
// ==========================================
describe('Feature 15: Templates & Canned Responses', () => {
  // Tier 1: Happy Path
  it('5.1 should extract placeholder tags from template text', () => {
    const tpl = 'Hello {{name}}, welcome to {{company | uppercase}} on {{date}}!';
    const tags = extractPlaceholders(tpl);

    assert.equal(tags.length, 3);
    assert.equal(tags[0].key, 'name');
    assert.equal(tags[1].key, 'company');
    assert.equal(tags[1].filters[0].name, 'uppercase');
    assert.equal(tags[2].key, 'date');
  });

  it('5.2 should interpolate basic placeholder values into string', () => {
    const tpl = 'Hi {{name}}, your balance is {{balance}}.';
    const res = interpolateString(tpl, { name: 'Alice', balance: '$150.00' });

    assert.equal(res.text, 'Hi Alice, your balance is $150.00.');
    assert.equal(res.missing.length, 0);
  });

  it('5.3 should apply filter pipeline (uppercase, lowercase, capitalize, trim)', () => {
    assert.equal(applyFilters('hello world', [{ name: 'uppercase', args: [] }]), 'HELLO WORLD');
    assert.equal(applyFilters('HELLO WORLD', [{ name: 'lowercase', args: [] }]), 'hello world');
    assert.equal(applyFilters('john doe', [{ name: 'capitalize', args: [] }]), 'John Doe');
    assert.equal(applyFilters('  clean me  ', [{ name: 'trim', args: [] }]), 'clean me');
  });

  it('5.4 should support fallback default values when context variable is missing', () => {
    const tpl = "Hello {{recipient.name | default: 'Friend'}}, thank you!";
    const res = interpolateString(tpl, {});

    assert.equal(res.text, 'Hello Friend, thank you!');
    assert.equal(res.resolved['recipient.name'], 'Friend');
  });

  it('5.5 should render full canned template with subject and body interpolation', () => {
    const template = {
      id: 'tpl_meeting',
      title: 'Meeting Confirmation',
      shortcutKey: '!meeting',
      subject: 'Confirmed: Meeting with {{client.name | capitalize}} on {{date}}',
      body: "Hi {{client.name | capitalize | default: 'there'}},\nLooking forward to {{agenda}}.",
    };

    const rendered = renderTemplate(template, {
      client: { name: 'sarah connor' },
      date: '2026-09-10',
      agenda: 'discussing the quarterly roadmap',
    });

    assert.equal(rendered.subject, 'Confirmed: Meeting with Sarah Connor on 2026-09-10');
    assert.equal(rendered.body, 'Hi Sarah Connor,\nLooking forward to discussing the quarterly roadmap.');
  });

  // Tier 2: Boundary & Corner Cases
  it('5.6 should resolve deeply nested paths safely (e.g. sender.company.address.city)', () => {
    const tpl = 'Ship to {{order.shipping.city}}, {{order.shipping.zip}}';
    const context = {
      order: {
        shipping: {
          city: 'San Francisco',
          zip: '94105',
        },
      },
    };

    const res = interpolateString(tpl, context);
    assert.equal(res.text, 'Ship to San Francisco, 94105');
  });

  it('5.7 should format dates using date_format filter', () => {
    const tpl = "{{eventDate | format: 'YYYY-MM-DD'}}";
    const res = interpolateString(tpl, { eventDate: '2026-12-25T15:30:00Z' });
    assert.equal(res.text, '2026-12-25');
  });

  it('5.8 should manage template registry: register, search, find by shortcut, delete', () => {
    const reg = new TemplateManager();
    reg.register({
      id: 't1',
      title: 'Intro Pitch',
      shortcutKey: '!intro',
      body: 'Hi, here is our pitch.',
      category: 'sales',
    });
    reg.register({
      id: 't2',
      title: 'Support Followup',
      shortcutKey: '!sup',
      body: 'How can we help?',
      category: 'support',
    });

    const foundByShortcut = reg.getByShortcut('!INTRO');
    assert.ok(foundByShortcut);
    assert.equal(foundByShortcut.id, 't1');

    const searchResults = reg.search('pitch');
    assert.equal(searchResults.length, 1);
    assert.equal(searchResults[0].id, 't1');

    reg.delete('t1');
    assert.equal(reg.get('t1'), undefined);
  });

  it('5.9 should handle empty template or string with no variables', () => {
    const empty = interpolateString('', {});
    assert.equal(empty.text, '');
    assert.equal(empty.missing.length, 0);

    const staticStr = interpolateString('Pure static content without braces.', {});
    assert.equal(staticStr.text, 'Pure static content without braces.');
  });

  it('5.10 should track all unresolved missing variables without default', () => {
    const tpl = 'Hi {{missingA}}, your {{missingB}} is ready.';
    const res = interpolateString(tpl, {});
    assert.deepEqual(res.missing, ['missingA', 'missingB']);
  });
});

// ==========================================
// FEATURE 16: Keyboard Shortcuts & Command Palette
// ==========================================
describe('Feature 16: Keyboard Shortcuts & Command Palette', () => {
  // Tier 1: Happy Path
  it('6.1 should match exact and prefix queries with high scores in fuzzyMatch', () => {
    const exact = fuzzyMatch('archive', 'Archive Thread');
    assert.equal(exact.matched, true);
    assert.ok(exact.score > 300);

    const prefix = fuzzyMatch('arch', 'Archive Thread');
    assert.equal(prefix.matched, true);
    assert.ok(prefix.score > 500);
  });

  it('6.2 should match subsequence characters in fuzzyMatch', () => {
    const sub = fuzzyMatch('gti', 'Go to Inbox');
    assert.equal(sub.matched, true);
    assert.ok(sub.score > 0);
  });

  it('6.3 should detect single key shortcuts (e.g. j, k, e, r, c)', () => {
    const registry = new ShortcutsRegistry();
    const resJ = registry.handleKeyPress('j');
    assert.equal(resJ.matchedCommand?.id, 'nav.next');

    const resE = registry.handleKeyPress('e');
    assert.equal(resE.matchedCommand?.id, 'action.archive');

    const resC = registry.handleKeyPress('c');
    assert.equal(resC.matchedCommand?.id, 'action.compose');
  });

  it('6.4 should track multi-key sequences (e.g. g then i -> go to inbox)', () => {
    const registry = new ShortcutsRegistry();
    const t1 = 1000;
    const step1 = registry.handleKeyPress('g', t1);
    assert.equal(step1.isPartialSequence, true);
    assert.equal(step1.matchedCommand, undefined);

    const step2 = registry.handleKeyPress('i', t1 + 200);
    assert.equal(step2.isPartialSequence, false);
    assert.equal(step2.matchedCommand?.id, 'nav.inbox');
  });

  it('6.5 should search and rank Command Palette items accurately', () => {
    const registry = new ShortcutsRegistry();
    const results = registry.search('archive');

    assert.ok(results.length > 0);
    assert.equal(results[0].command.id, 'action.archive');
    assert.equal(results[0].command.category, 'Actions');
  });

  // Tier 2: Boundary & Corner Cases
  it('6.6 should timeout key sequence buffer when delay exceeds timeout threshold', () => {
    const buffer = new KeySequenceBuffer(500);
    buffer.push('g', 1000);
    const seq = buffer.push('i', 2000); // 1000ms later > 500ms timeout
    assert.deepEqual(seq, ['i']);
  });

  it('6.7 should filter commands by category in search', () => {
    const registry = new ShortcutsRegistry();
    const navOnly = registry.search('', 'Navigation');
    assert.ok(navOnly.length > 0);
    assert.ok(navOnly.every((r) => r.command.category === 'Navigation'));
  });

  it('6.8 should handle non-matching queries gracefully in fuzzyMatch', () => {
    const res = fuzzyMatch('xyz123', 'Archive Thread');
    assert.equal(res.matched, false);
    assert.equal(res.score, -1);
  });

  it('6.9 should register and unregister custom shortcuts', () => {
    const registry = new ShortcutsRegistry([]);
    registry.register({
      id: 'custom.action',
      title: 'Custom Fast Action',
      category: 'Actions',
      shortcuts: [['x', 'y']],
    });

    assert.equal(registry.list().length, 1);
    const step1 = registry.handleKeyPress('x');
    assert.equal(step1.isPartialSequence, true);
    const step2 = registry.handleKeyPress('y');
    assert.equal(step2.matchedCommand?.id, 'custom.action');

    registry.unregister('custom.action');
    assert.equal(registry.get('custom.action'), undefined);
  });

  it('6.10 should match keyword synonyms in search (e.g. search "delete" matches Trash)', () => {
    const registry = new ShortcutsRegistry();
    const results = registry.search('delete');
    assert.ok(results.some((r) => r.command.id === 'action.trash'));
  });
});

// ==========================================
// FEATURE 17: Email Thread Merging & Tree View (JWZ)
// ==========================================
describe('Feature 17: Email Thread Merging & Tree View (JWZ)', () => {
  // Tier 1: Happy Path
  it('7.1 should normalize email subjects stripping Re:, Fwd:, [tags], and whitespace', () => {
    assert.equal(normalizeSubject('Re: Project Update'), 'project update');
    assert.equal(normalizeSubject('Fwd: Re: [JIRA-102] Project Update'), 'project update');
    assert.equal(normalizeSubject('AW: SV:  Multiple   Spaces  '), 'multiple spaces');
    assert.equal(normalizeSubject(''), '(no subject)');
  });

  it('7.2 should parse Message-ID header tokens with and without angle brackets', () => {
    const ids = parseMessageIds('<msg1@domain.com> <msg2@domain.com>');
    assert.deepEqual(ids, ['msg1@domain.com', 'msg2@domain.com']);

    const csv = parseMessageIds('id_a@d.com, id_b@d.com');
    assert.deepEqual(csv, ['id_a@d.com', 'id_b@d.com']);
  });

  it('7.3 should reconstruct parent-child thread tree from In-Reply-To and References', () => {
    const emails: ThreadableEmail[] = [
      {
        id: '1',
        messageId: 'root@mail.com',
        subject: 'Q3 Planning',
        fromAddr: 'alice@corp.com',
        createdAt: 1000,
      },
      {
        id: '2',
        messageId: 'reply1@mail.com',
        inReplyTo: '<root@mail.com>',
        references: '<root@mail.com>',
        subject: 'Re: Q3 Planning',
        fromAddr: 'bob@corp.com',
        createdAt: 2000,
      },
      {
        id: '3',
        messageId: 'reply2@mail.com',
        inReplyTo: '<reply1@mail.com>',
        references: '<root@mail.com> <reply1@mail.com>',
        subject: 'Re: Q3 Planning',
        fromAddr: 'charlie@corp.com',
        createdAt: 3000,
      },
    ];

    const threads = buildJwzThreads(emails);
    assert.equal(threads.length, 1);
    assert.equal(threads[0].messageCount, 3);
    assert.equal(threads[0].participants.length, 3);

    // Root should have 1 child (reply1), and reply1 should have 1 child (reply2)
    const rootNode = threads[0].tree;
    assert.equal(rootNode.id, '1');
    assert.equal(rootNode.children.length, 1);
    assert.equal(rootNode.children[0].id, '2');
    assert.equal(rootNode.children[0].children.length, 1);
    assert.equal(rootNode.children[0].children[0].id, '3');
  });

  it('7.4 should flatten thread hierarchy into chronological order', () => {
    const emails: ThreadableEmail[] = [
      { id: '1', messageId: 'm1', subject: 'A', fromAddr: 'a', createdAt: 100 },
      { id: '2', messageId: 'm2', inReplyTo: 'm1', subject: 'Re: A', fromAddr: 'b', createdAt: 200 },
    ];

    const threads = buildJwzThreads(emails);
    const flat = flattenThread(threads[0].tree);
    assert.equal(flat.length, 2);
    assert.equal(flat[0].id, '1');
    assert.equal(flat[1].id, '2');
  });

  it('7.5 should group unlinked messages by normalized subject match', () => {
    const emails: ThreadableEmail[] = [
      { id: '1', messageId: 'unlinked_1', subject: 'Budget 2026', fromAddr: 'a@c.com', createdAt: 100 },
      { id: '2', messageId: 'unlinked_2', subject: 'Re: Budget 2026', fromAddr: 'b@c.com', createdAt: 200 },
    ];

    const threads = buildJwzThreads(emails);
    assert.equal(threads.length, 1);
    assert.equal(threads[0].messageCount, 2);
  });

  // Tier 2: Boundary & Corner Cases
  it('7.6 should handle missing root parent by creating dummy container / grafted root', () => {
    const emails: ThreadableEmail[] = [
      {
        id: '2',
        messageId: 'child_1@mail.com',
        inReplyTo: '<missing_parent@mail.com>',
        references: '<missing_parent@mail.com>',
        subject: 'Re: Orphan Discussion',
        fromAddr: 'bob@corp.com',
        createdAt: 2000,
      },
    ];

    const threads = buildJwzThreads(emails);
    assert.equal(threads.length, 1);
    assert.equal(threads[0].messageCount, 1);
    assert.equal(threads[0].tree.id, '2');
  });

  it('7.7 should prevent infinite loops and cycle deadlocks in circular references', () => {
    const emails: ThreadableEmail[] = [
      { id: '1', messageId: 'circ_A', inReplyTo: 'circ_B', subject: 'Cycle', fromAddr: 'a', createdAt: 100 },
      { id: '2', messageId: 'circ_B', inReplyTo: 'circ_A', subject: 'Cycle', fromAddr: 'b', createdAt: 200 },
    ];

    // Must not hang or throw stack overflow
    const threads = buildJwzThreads(emails);
    assert.ok(threads.length > 0);
  });

  it('7.8 should handle empty email list or single email without error', () => {
    const empty = buildJwzThreads([]);
    assert.deepEqual(empty, []);

    const single = buildJwzThreads([
      { id: '1', messageId: 'lone', subject: 'Lone Mail', fromAddr: 'x@y.com', createdAt: 500 },
    ]);
    assert.equal(single.length, 1);
    assert.equal(single[0].messageCount, 1);
  });

  it('7.9 should calculate accurate unread count and date boundaries', () => {
    const emails: ThreadableEmail[] = [
      { id: '1', messageId: 'm1', fromAddr: 'a', createdAt: 1000, read: true },
      { id: '2', messageId: 'm2', inReplyTo: 'm1', fromAddr: 'b', createdAt: 5000, read: false },
    ];

    const threads = buildJwzThreads(emails);
    assert.equal(threads[0].unreadCount, 1);
    assert.equal(threads[0].firstDate, 1000);
    assert.equal(threads[0].lastDate, 5000);
  });

  it('7.10 should sort multiple distinct threads by latest activity descending', () => {
    const emails: ThreadableEmail[] = [
      { id: '1', messageId: 'old', subject: 'Old Thread', fromAddr: 'a', createdAt: 1000 },
      { id: '2', messageId: 'new', subject: 'New Thread', fromAddr: 'b', createdAt: 9000 },
    ];

    const threads = buildJwzThreads(emails);
    assert.equal(threads.length, 2);
    assert.equal(threads[0].rootSubject, 'New Thread');
    assert.equal(threads[1].rootSubject, 'Old Thread');
  });
});

// ==========================================
// FEATURE 18: Batch Actions & Bulk Processing
// ==========================================
describe('Feature 18: Batch Actions & Bulk Processing', () => {
  // Tier 1: Happy Path
  it('8.1 should execute bulk mark_read on multiple items and return affected IDs', () => {
    const map = new Map<string, any>([
      ['e1', { id: 'e1', read: false }],
      ['e2', { id: 'e2', read: false }],
    ]);

    const processor = new BatchProcessor();
    const res = processor.executeBatch(map, {
      operation: 'mark_read',
      targetIds: ['e1', 'e2'],
    });

    assert.equal(res.totalAffected, 2);
    assert.equal(map.get('e1')?.read, true);
    assert.equal(map.get('e2')?.read, true);
  });

  it('8.2 should execute bulk archive and update folderId', () => {
    const map = new Map<string, any>([
      ['e1', { id: 'e1', archived: false, folderId: 'inbox' }],
    ]);

    const processor = new BatchProcessor();
    processor.executeBatch(map, {
      operation: 'archive',
      targetIds: ['e1'],
    });

    assert.equal(map.get('e1')?.archived, true);
    assert.equal(map.get('e1')?.folderId, 'archive');
  });

  it('8.3 should execute bulk star and unstar operations', () => {
    const map = new Map<string, any>([
      ['e1', { id: 'e1', starred: false }],
    ]);

    const processor = new BatchProcessor();
    processor.executeBatch(map, { operation: 'star', targetIds: ['e1'] });
    assert.equal(map.get('e1')?.starred, true);

    processor.executeBatch(map, { operation: 'unstar', targetIds: ['e1'] });
    assert.equal(map.get('e1')?.starred, false);
  });

  it('8.4 should execute bulk add_label and remove_label operations', () => {
    const map = new Map<string, any>([
      ['e1', { id: 'e1', labels: ['Work'] }],
    ]);

    const processor = new BatchProcessor();
    processor.executeBatch(map, {
      operation: 'add_label',
      targetIds: ['e1'],
      value: 'Urgent',
    });
    assert.deepEqual(map.get('e1')?.labels, ['Work', 'Urgent']);

    processor.executeBatch(map, {
      operation: 'remove_label',
      targetIds: ['e1'],
      value: 'Work',
    });
    assert.deepEqual(map.get('e1')?.labels, ['Urgent']);
  });

  it('8.5 should support 1-click batch undo via undoToken', () => {
    const map = new Map<string, any>([
      ['e1', { id: 'e1', read: false, starred: false }],
      ['e2', { id: 'e2', read: false, starred: false }],
    ]);

    const processor = new BatchProcessor();
    const batchRes = processor.executeBatch(map, {
      operation: 'star',
      targetIds: ['e1', 'e2'],
    });

    assert.equal(map.get('e1')?.starred, true);
    assert.ok(batchRes.undoToken);

    const undoRes = processor.undoBatch(map, batchRes.undoToken!);
    assert.equal(undoRes.success, true);
    assert.equal(undoRes.restoredCount, 2);
    assert.equal(map.get('e1')?.starred, false);
    assert.equal(map.get('e2')?.starred, false);
  });

  // Tier 2: Boundary & Corner Cases
  it('8.6 should partition large ID arrays into chunks for safe processing', () => {
    const ids = Array.from({ length: 250 }, (_, i) => `id_${i}`);
    const chunks = BatchProcessor.chunkIds(ids, 100);

    assert.equal(chunks.length, 3);
    assert.equal(chunks[0].length, 100);
    assert.equal(chunks[1].length, 100);
    assert.equal(chunks[2].length, 50);
  });

  it('8.7 should record missing target IDs in failedIds list without aborting batch', () => {
    const map = new Map<string, any>([['e1', { id: 'e1', read: false }]]);
    const processor = new BatchProcessor();

    const res = processor.executeBatch(map, {
      operation: 'mark_read',
      targetIds: ['e1', 'missing_id_99'],
    });

    assert.equal(res.totalAffected, 1);
    assert.equal(res.failedIds.length, 1);
    assert.equal(res.failedIds[0].id, 'missing_id_99');
  });

  it('8.8 should support permanent deletion and undo restoration of deleted items', () => {
    const map = new Map<string, any>([
      ['e1', { id: 'e1', subject: 'Permanent Delete Test' }],
    ]);

    const processor = new BatchProcessor();
    const res = processor.executeBatch(map, {
      operation: 'delete_forever',
      targetIds: ['e1'],
    });

    assert.equal(map.has('e1'), false);
    assert.ok(res.undoToken);

    processor.undoBatch(map, res.undoToken!);
    assert.equal(map.has('e1'), true);
    assert.equal(map.get('e1')?.subject, 'Permanent Delete Test');
  });

  it('8.9 should reject undo with invalid or expired token', () => {
    const map = new Map<string, any>();
    const processor = new BatchProcessor();
    const res = processor.undoBatch(map, 'invalid_token');

    assert.equal(res.success, false);
    assert.equal(res.restoredCount, 0);
  });

  it('8.10 should execute bulk snooze and unsnooze operations', () => {
    const map = new Map<string, any>([
      ['e1', { id: 'e1', folderId: 'inbox', snoozedUntil: null }],
    ]);

    const snoozeTs = Date.now() + 100000;
    const { updated: snoozed } = applyOperationToItem(map.get('e1'), 'snooze', snoozeTs);
    assert.equal(snoozed.folderId, 'snoozed');
    assert.equal(snoozed.snoozedUntil, snoozeTs);

    const { updated: unsnoozed } = applyOperationToItem(snoozed, 'unsnooze');
    assert.equal(unsnoozed.folderId, 'inbox');
    assert.equal(unsnoozed.snoozedUntil, null);
  });
});

// ==========================================
// FEATURE 19: Out-of-Office / Vacation Responder
// ==========================================
describe('Feature 19: Out-of-Office / Vacation Responder', () => {
  const baseSettings: VacationSettings = {
    domainId: 'corp.com',
    userEmail: 'alice@corp.com',
    subject: 'Out of Office: {{subject}}',
    body: 'I am on vacation until next week.',
    startDate: 1000000,
    endDate: 500000000000,
    isActive: true,
    cooldownHours: 24,
  };

  // Tier 1: Happy Path
  it('9.1 should trigger RFC 3834 auto-response for valid inbound email within date window', () => {
    const responder = new VacationResponder();
    const inbound: InboundEmailMetadata = {
      fromAddr: 'client@external.com',
      toAddr: 'alice@corp.com',
      subject: 'Contract Review',
      messageId: '<msg_contract_123@external.com>',
    };

    const decision = responder.evaluate(baseSettings, inbound, 2000000);
    assert.equal(decision.shouldRespond, true);
    assert.ok(decision.responsePayload);
    assert.equal(decision.responsePayload.to, 'client@external.com');
    assert.equal(decision.responsePayload.subject, 'Out of Office: Contract Review');
    assert.equal(decision.responsePayload.headers['Auto-Submitted'], 'auto-replied');
    assert.equal(decision.responsePayload.headers['Precedence'], 'bulk');
    assert.equal(decision.responsePayload.inReplyTo, '<msg_contract_123@external.com>');
  });

  it('9.2 should enforce 24-hour per-sender cooldown and block immediate repeat auto-responses', () => {
    const responder = new VacationResponder();
    const inbound: InboundEmailMetadata = {
      fromAddr: 'bob@client.com',
      toAddr: 'alice@corp.com',
      subject: 'Hi',
    };

    const t1 = 2000000;
    const d1 = responder.evaluate(baseSettings, inbound, t1);
    assert.equal(d1.shouldRespond, true);

    // 2 hours later (within 24h cooldown)
    const t2 = t1 + 2 * 60 * 60 * 1000;
    const d2 = responder.evaluate(baseSettings, inbound, t2);
    assert.equal(d2.shouldRespond, false);
    assert.ok(d2.reason?.includes('cooldown window'));

    // 25 hours later (after cooldown)
    const t3 = t1 + 25 * 60 * 60 * 1000;
    const d3 = responder.evaluate(baseSettings, inbound, t3);
    assert.equal(d3.shouldRespond, true);
  });

  it('9.3 should suppress auto-response when Auto-Submitted header is present', () => {
    const responder = new VacationResponder();
    const inbound: InboundEmailMetadata = {
      fromAddr: 'automated@service.com',
      toAddr: 'alice@corp.com',
      subject: 'Build Complete',
      headers: { 'Auto-Submitted': 'auto-generated' },
    };

    const decision = responder.evaluate(baseSettings, inbound, 2000000);
    assert.equal(decision.shouldRespond, false);
    assert.ok(decision.reason?.includes('Auto-Submitted'));
  });

  it('9.4 should suppress auto-response for mailing lists with List-Id or Precedence: bulk', () => {
    const responder = new VacationResponder();
    const listMail: InboundEmailMetadata = {
      fromAddr: 'dev-discuss@lists.org',
      toAddr: 'alice@corp.com',
      subject: 'Thread #42',
      headers: { 'List-Id': '<dev-discuss.lists.org>' },
    };

    const decision = responder.evaluate(baseSettings, listMail, 2000000);
    assert.equal(decision.shouldRespond, false);
    assert.ok(decision.reason?.includes('List-Id'));
  });

  it('9.5 should suppress auto-response for bounce and system senders (mailer-daemon, postmaster, noreply)', () => {
    const responder = new VacationResponder();
    const bounce: InboundEmailMetadata = {
      fromAddr: 'mailer-daemon@mx.google.com',
      toAddr: 'alice@corp.com',
      subject: 'Delivery Failure',
    };

    const decision = responder.evaluate(baseSettings, bounce, 2000000);
    assert.equal(decision.shouldRespond, false);
    assert.ok(decision.reason?.includes('system or automated address'));
  });

  // Tier 2: Boundary & Corner Cases
  it('9.6 should suppress auto-response if current time is outside start/end dates', () => {
    const responder = new VacationResponder();
    const inbound: InboundEmailMetadata = { fromAddr: 'c@d.com', toAddr: 'alice@corp.com' };

    const before = responder.evaluate(baseSettings, inbound, baseSettings.startDate - 1000); // Before startDate
    assert.equal(before.shouldRespond, false);
    assert.ok(before.reason?.includes('not started'));

    const after = responder.evaluate(baseSettings, inbound, baseSettings.endDate + 1000); // After endDate
    assert.equal(after.shouldRespond, false);
    assert.ok(after.reason?.includes('ended'));
  });

  it('9.7 should suppress auto-response if settings.isActive is false', () => {
    const responder = new VacationResponder();
    const disabledSettings = { ...baseSettings, isActive: false };
    const res = responder.evaluate(disabledSettings, { fromAddr: 'c@d.com', toAddr: 'alice@corp.com' }, 2000000);
    assert.equal(res.shouldRespond, false);
    assert.ok(res.reason?.includes('inactive'));
  });

  it('9.8 should suppress auto-response if inbound email is marked as spam', () => {
    const responder = new VacationResponder();
    const res = responder.evaluate(
      baseSettings,
      { fromAddr: 'c@d.com', toAddr: 'alice@corp.com', isSpam: true },
      2000000
    );
    assert.equal(res.shouldRespond, false);
    assert.ok(res.reason?.includes('spam'));
  });

  it('9.9 should suppress auto-response if sender is self (loop prevention)', () => {
    const responder = new VacationResponder();
    const res = responder.evaluate(
      baseSettings,
      { fromAddr: 'Alice <alice@corp.com>', toAddr: 'alice@corp.com' },
      2000000
    );
    assert.equal(res.shouldRespond, false);
    assert.ok(res.reason?.includes('recipient account itself'));
  });

  it('9.10 should normalize email addresses and extract pure emails in brackets', () => {
    assert.equal(normalizeEmail('Alice Cooper <alice@corp.com>'), 'alice@corp.com');
    assert.equal(normalizeEmail('BOB@DOMAIN.COM'), 'bob@domain.com');
  });
});

// ==========================================
// FEATURE 20: Offline Support & Sync Queue
// ==========================================
describe('Feature 20: Offline Support & Sync Queue', () => {
  // Tier 1: Happy Path
  it('10.1 should enqueue offline mutations with status pending and client timestamp', () => {
    const manager = new OfflineSyncManager();
    const mut = manager.enqueue('MARK_READ', { id: 'email_1' });

    assert.equal(mut.status, 'pending');
    assert.equal(mut.type, 'MARK_READ');
    assert.ok(mut.id.startsWith('mut_'));
    assert.equal(manager.getPending().length, 1);
  });

  it('10.2 should apply optimistic local mutations to state object', () => {
    const email = { id: 'email_1', read: false, starred: false, folderId: 'inbox' };

    const mutRead: SyncMutation = {
      id: 'm1',
      type: 'MARK_READ',
      payload: { id: 'email_1' },
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      clientVersion: 1,
    };
    const s1 = applyOptimisticMutation(email, mutRead);
    assert.equal(s1.read, true);

    const mutStar: SyncMutation = {
      id: 'm2',
      type: 'STAR',
      payload: { id: 'email_1' },
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      clientVersion: 1,
    };
    const s2 = applyOptimisticMutation(s1, mutStar);
    assert.equal(s2.starred, true);
  });

  it('10.3 should replay and sync pending mutations against server handler', async () => {
    const manager = new OfflineSyncManager();
    manager.enqueue('MARK_READ', { id: 'e1' });
    manager.enqueue('ARCHIVE', { id: 'e2' });

    const report = await manager.syncWithServer(async (mut) => {
      return { success: true };
    });

    assert.equal(report.totalProcessed, 2);
    assert.equal(report.syncedCount, 2);
    assert.equal(report.failedCount, 0);
    assert.equal(report.remainingPending, 0);
  });

  it('10.4 should resolve conflicts with Last-Write-Wins (LWW) strategy', () => {
    const clientMutation: SyncMutation = {
      id: 'm_draft',
      type: 'UPDATE_DRAFT',
      payload: { subject: 'Client Newer Title' },
      timestamp: 5000,
      status: 'pending',
      retryCount: 0,
      clientVersion: 2,
    };

    const serverState = {
      subject: 'Server Older Title',
      updatedAt: 3000,
    };

    const res = resolveConflict(clientMutation, serverState, 'lww');
    assert.equal(res.appliedToServer, true);
    assert.equal(res.resolvedPayload.subject, 'Client Newer Title');
  });

  it('10.5 should resolve conflicts with 3-way Merge strategy (labels & text)', () => {
    const clientMutation: SyncMutation = {
      id: 'm_merge',
      type: 'UPDATE_DRAFT',
      payload: { labels: ['ClientTag'], body: 'Client updated draft content' },
      timestamp: 6000,
      status: 'pending',
      retryCount: 0,
      clientVersion: 2,
    };

    const serverState = {
      labels: ['ServerTag'],
      body: 'Server older content',
      updatedAt: 4000,
    };

    const res = resolveConflict(clientMutation, serverState, 'merge');
    assert.equal(res.strategyUsed, 'merge');
    assert.deepEqual(res.resolvedPayload.labels, ['ServerTag', 'ClientTag']);
    assert.equal(res.resolvedPayload.body, 'Client updated draft content');
  });

  // Tier 2: Boundary & Corner Cases
  it('10.6 should handle server conflict resolution and update mutation payload during sync', async () => {
    const manager = new OfflineSyncManager();
    manager.enqueue('UPDATE_DRAFT', { draftId: 'd1', body: 'Local edits' }, { timestamp: 5000 });

    const report = await manager.syncWithServer(async () => {
      return {
        success: false,
        conflict: true,
        serverState: { body: 'Server conflict content', updatedAt: 6000 },
      };
    }, 'lww');

    assert.equal(report.conflictsResolved, 1);
    assert.equal(report.syncedCount, 1);
  });

  it('10.7 should increment retryCount and mark failed when exceeding maxRetries', async () => {
    const manager = new OfflineSyncManager([], 2);
    manager.enqueue('SEND_EMAIL', { to: 'bad@test.com' });

    // Try 1
    await manager.syncWithServer(async () => ({ success: false, error: 'Network 500' }));
    assert.equal(manager.getPending()[0].status, 'pending');
    assert.equal(manager.getPending()[0].retryCount, 1);

    // Try 2 (exceeds maxRetries 2)
    const r2 = await manager.syncWithServer(async () => ({ success: false, error: 'Network 500' }));
    assert.equal(r2.failedCount, 1);
    assert.equal(manager.getAll()[0].status, 'failed');
  });

  it('10.8 should support server_wins and client_wins explicit strategies', () => {
    const mut: SyncMutation = {
      id: 'm1',
      type: 'UPDATE_DRAFT',
      payload: { title: 'Client' },
      timestamp: 1000,
      status: 'pending',
      retryCount: 0,
      clientVersion: 1,
    };
    const server = { title: 'Server', updatedAt: 2000 };

    const sWins = resolveConflict(mut, server, 'server_wins');
    assert.equal(sWins.resolvedPayload.title, 'Server');

    const cWins = resolveConflict(mut, server, 'client_wins');
    assert.equal(cWins.resolvedPayload.title, 'Client');
  });

  it('10.9 should clear only synced mutations with clearSynced()', () => {
    const manager = new OfflineSyncManager();
    const m1 = manager.enqueue('STAR', { id: '1' });
    const m2 = manager.enqueue('ARCHIVE', { id: '2' });

    m1.status = 'synced';
    manager.clearSynced();

    assert.equal(manager.getAll().length, 1);
    assert.equal(manager.getAll()[0].type, 'ARCHIVE');
  });

  it('10.10 should preserve chronological order when replaying mutations', async () => {
    const manager = new OfflineSyncManager();
    manager.enqueue('MARK_READ', { id: '1' }, { timestamp: 3000 });
    manager.enqueue('STAR', { id: '1' }, { timestamp: 1000 });
    manager.enqueue('ARCHIVE', { id: '1' }, { timestamp: 2000 });

    const order: string[] = [];
    await manager.syncWithServer(async (m) => {
      order.push(m.type);
      return { success: true };
    });

    assert.deepEqual(order, ['STAR', 'ARCHIVE', 'MARK_READ']);
  });
});

// ==========================================
// TIER 3 & 4: Cross-Feature Integration Scenarios
// ==========================================
describe('Productivity Suite: Cross-Feature Integration (Tiers 3 & 4)', () => {
  it('Scenario 1: Inbound email triggers rule -> applies label -> snooze -> vacation exclusion', () => {
    // Step 1: Rule Engine evaluates inbound email
    const rules: AutomationRule[] = [
      {
        id: 'r_client',
        name: 'Label and Star Clients',
        trigger: 'on_inbound',
        condition: { type: 'predicate', field: 'from', operator: 'contains', value: 'client.com' },
        actions: [{ type: 'star' }, { type: 'apply_label', value: 'Client VIP' }],
        isActive: true,
        orderPriority: 1,
      },
    ];

    const ruleRes = evaluateRuleSet(rules, {
      fromAddr: 'director@client.com',
      toAddr: 'me@mailops.dev',
      subject: 'Project Kickoff Q4',
    });

    assert.equal(ruleRes.finalEmailState.starred, true);
    assert.deepEqual(ruleRes.finalEmailState.labels, ['Client VIP']);

    // Step 2: Snooze until tomorrow morning
    const snoozeMgr = new SnoozeReminderManager();
    const snoozeRes = snoozeMgr.snooze('email_q4', 'tomorrow_morning', {
      reason: 'Wait for morning sync',
    });
    assert.equal(snoozeRes.success, true);

    // Step 3: Vacation responder evaluates same email
    const vacation = new VacationResponder();
    const vRes = vacation.evaluate(
      {
        domainId: 'mailops.dev',
        userEmail: 'me@mailops.dev',
        subject: 'Auto: OOO',
        body: 'Out of office',
        startDate: 1000,
        endDate: Date.now() + 1000000000,
        isActive: true,
      },
      {
        fromAddr: 'director@client.com',
        toAddr: 'me@mailops.dev',
        subject: 'Project Kickoff Q4',
      }
    );

    assert.equal(vRes.shouldRespond, true);
  });

  it('Scenario 2: Template interpolation -> Scheduled Send -> Undo Buffer cancellation', async () => {
    // Step 1: Render canned response template
    const tplMgr = new TemplateManager();
    const tpl = tplMgr.register({
      title: 'Quote Followup',
      subject: 'Proposal for {{client.company}}',
      body: 'Hi {{client.name}}, please review proposal {{proposalId}}.',
    });

    const rendered = renderTemplate(tpl, {
      client: { name: 'Bob', company: 'Acme Inc' },
      proposalId: 'PROP-992',
    });

    assert.equal(rendered.subject, 'Proposal for Acme Inc');
    assert.equal(rendered.body, 'Hi Bob, please review proposal PROP-992.');

    // Step 2: Enqueue in Undo Send Buffer with 15s grace
    const undoMgr = new UndoSendManager();
    const undoTicket = undoMgr.enqueue(
      {
        fromAddr: 'sales@mailops.dev',
        toAddr: 'bob@acme.com',
        subject: rendered.subject!,
        textBody: rendered.body,
      },
      15
    );

    assert.equal(undoTicket.ticket.status, 'buffered');

    // Step 3: User realizes error and hits Undo Send
    const cancelRes = undoMgr.cancel(undoTicket.ticket.token);
    assert.equal(cancelRes.success, true);
    assert.equal(cancelRes.ticket?.status, 'cancelled');

    // Step 4: Reschedule for tomorrow morning via Scheduled Send Manager
    const schedMgr = new ScheduledSendManager();
    const schedRes = schedMgr.schedule(
      {
        domainId: 'mailops.dev',
        fromAddr: 'sales@mailops.dev',
        toAddr: 'bob@acme.com',
        subject: rendered.subject!,
        textBody: rendered.body,
      },
      { sendAt: Date.now() + 50000 }
    );

    assert.equal(schedRes.success, true);
    assert.equal(schedRes.item?.status, 'pending');
  });

  it('Scenario 3: Offline multi-operation queue -> reconnect -> online replay & conflict resolution', async () => {
    const offlineMgr = new OfflineSyncManager();

    // User performs actions while in flight / offline
    offlineMgr.enqueue('MARK_READ', { emailId: 'e1' }, { timestamp: 1000 });
    offlineMgr.enqueue('STAR', { emailId: 'e1' }, { timestamp: 1050 });
    offlineMgr.enqueue('ADD_LABEL', { emailId: 'e1', label: 'Important' }, { timestamp: 1100 });

    // Server state has conflicting label applied while user was offline
    const serverDatabase = new Map<string, any>([
      ['e1', { id: 'e1', read: false, starred: false, labels: ['Work'], updatedAt: 1020 }],
    ]);

    // Online reconnect & sync
    const report = await offlineMgr.syncWithServer(async (mutation) => {
      const current = serverDatabase.get(String(mutation.payload.emailId));
      if (mutation.type === 'ADD_LABEL') {
        // Trigger merge conflict
        return {
          success: false,
          conflict: true,
          serverState: current,
        };
      }
      const updated = applyOptimisticMutation(current, mutation);
      serverDatabase.set(String(mutation.payload.emailId), updated);
      return { success: true };
    }, 'merge');

    assert.equal(report.syncedCount, 3);
    assert.equal(report.conflictsResolved, 1);
  });
});
