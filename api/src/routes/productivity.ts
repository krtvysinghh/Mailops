import { Hono } from 'hono';
import {
  ScheduledSendManager,
  UndoSendManager,
  SnoozeReminderManager,
  evaluateRuleSet,
  renderTemplate,
  ShortcutsRegistry,
  buildJwzThreads,
  BatchProcessor,
  VacationResponder,
  OfflineSyncManager,
} from '../modules/productivity';

export const productivityRouter = new Hono();

// Feature 11: Scheduled Send
productivityRouter.post('/schedule', async (c) => {
  try {
    const body = await c.req.json();
    const manager = new ScheduledSendManager();
    const item = manager.schedule(body.email, { sendAt: body.sendAt });
    return c.json({ success: true, scheduled: item });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to schedule email' }, 400);
  }
});

// Feature 12: Undo Send Buffer
productivityRouter.post('/undo/buffer', async (c) => {
  try {
    const body = await c.req.json();
    const manager = new UndoSendManager();
    const ticket = manager.enqueue(body.email, body.gracePeriodSeconds || 10);
    return c.json({ success: true, ticket });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to buffer email' }, 400);
  }
});

productivityRouter.post('/undo/cancel', async (c) => {
  try {
    const body = await c.req.json<{ token: string }>();
    const manager = new UndoSendManager();
    const result = manager.cancel(body.token);
    return c.json({ success: result.success, ticket: result.ticket });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to cancel send' }, 400);
  }
});

// Feature 13: Snooze
productivityRouter.post('/snooze', async (c) => {
  try {
    const body = await c.req.json();
    const manager = new SnoozeReminderManager();
    const result = manager.snooze(body.emailId, body.preset || 'tomorrow_morning', {
      customTimestamp: body.customTimestamp,
      reason: body.reason,
    });
    return c.json({ success: true, record: result });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to snooze email' }, 400);
  }
});

// Feature 14: Automation Rules
productivityRouter.post('/rules/evaluate', async (c) => {
  try {
    const body = await c.req.json();
    const result = evaluateRuleSet(body.rules || [], body.email);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to evaluate rules' }, 400);
  }
});

// Feature 15: Templates
productivityRouter.post('/templates/render', async (c) => {
  try {
    const body = await c.req.json<{ template: any; variables: Record<string, unknown> }>();
    const rendered = renderTemplate(body.template, body.variables || {});
    return c.json(rendered);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to render template' }, 400);
  }
});

// Feature 16: Shortcuts
productivityRouter.post('/shortcuts/search', async (c) => {
  try {
    const body = await c.req.json<{ query: string }>();
    const registry = new ShortcutsRegistry();
    const results = registry.search(body.query || '');
    return c.json({ results });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to search shortcuts' }, 400);
  }
});

// Feature 17: Thread Trees
productivityRouter.post('/threads/tree', async (c) => {
  try {
    const body = await c.req.json<{ emails: any[] }>();
    const tree = buildJwzThreads(body.emails || []);
    return c.json({ tree });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to build thread tree' }, 400);
  }
});

// Feature 18: Batch Actions
productivityRouter.post('/batch/execute', async (c) => {
  try {
    const body = await c.req.json();
    const processor = new BatchProcessor();
    const itemsMap = new Map<string, any>((body.items || []).map((it: any) => [it.id, it]));
    const result = processor.executeBatch(itemsMap, {
      operation: body.operation,
      targetIds: body.targetIds || [],
      value: body.value,
    });
    return c.json({ result });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to execute batch operation' }, 400);
  }
});

// Feature 19: Out of Office Responder
productivityRouter.post('/ooo/evaluate', async (c) => {
  try {
    const body = await c.req.json();
    const responder = new VacationResponder();
    const result = responder.evaluate(body.settings, body.inboundEmail, body.now);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to evaluate OOO' }, 400);
  }
});

// Feature 20: Offline Sync Queue
productivityRouter.post('/offline/sync', async (c) => {
  try {
    const body = await c.req.json<{ mutations: any[] }>();
    const manager = new OfflineSyncManager(body.mutations || []);
    const report = await manager.syncWithServer(async () => ({ success: true }));
    return c.json({ report });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to sync offline mutations' }, 400);
  }
});
