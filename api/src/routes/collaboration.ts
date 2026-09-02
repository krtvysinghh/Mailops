import { Hono } from 'hono';
import {
  hasPermission,
  assignEmailThread,
  createInternalNote,
  recordHeartbeat,
  detectCollision,
  acquireDraftLock,
  updateDraftWithVersion,
  threeWayMerge,
  extractMentions,
  createAuditLogEntry,
  verifyAuditChain,
  createShareLink,
  TagHierarchyManager,
  CRMContactManager,
} from '../modules/collaboration';

export const collaborationRouter = new Hono();

// Feature 21: Shared Inboxes & RBAC
collaborationRouter.post('/rbac/check', async (c) => {
  try {
    const body = await c.req.json<{ role: any; permission: any }>();
    const allowed = hasPermission(body.role, body.permission);
    return c.json({ allowed });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to check RBAC permission' }, 400);
  }
});

// Feature 22: Email Assignment & Delegation
collaborationRouter.post('/assignments', async (c) => {
  try {
    const body = await c.req.json();
    const result = assignEmailThread(body.current || null, body.params);
    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to assign email' }, 400);
  }
});

// Feature 23: Internal Notes & Inline Comments
collaborationRouter.post('/notes', async (c) => {
  try {
    const body = await c.req.json();
    const note = createInternalNote(body);
    return c.json({ success: true, note });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to create internal note' }, 400);
  }
});

// Feature 24: Live Presence & Collision Detection
collaborationRouter.post('/presence/heartbeat', async (c) => {
  try {
    const body = await c.req.json();
    const records = recordHeartbeat(body.currentRecords || [], body.input);
    const collision = detectCollision(records, body.input.emailId, body.input.userId);
    return c.json({ records, collision });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to update presence' }, 400);
  }
});

// Feature 25: Collaborative Drafts & Co-Authoring
collaborationRouter.post('/drafts/lock', async (c) => {
  try {
    const body = await c.req.json();
    const draft = acquireDraftLock(body.draft, body.userId, body.leaseDurationMs);
    return c.json({ draft });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to lock draft' }, 400);
  }
});

collaborationRouter.post('/drafts/update', async (c) => {
  try {
    const body = await c.req.json();
    const draft = updateDraftWithVersion(body.draft, body.expectedVersion, body.updates);
    return c.json({ draft });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to update draft' }, 400);
  }
});

collaborationRouter.post('/drafts/merge', async (c) => {
  try {
    const body = await c.req.json<{ baseText: string; userAText: string; userBText: string }>();
    const result = threeWayMerge(body.baseText, body.userAText, body.userBText);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to merge drafts' }, 400);
  }
});

// Feature 26: Email Mentions (`@user`)
collaborationRouter.post('/mentions/extract', async (c) => {
  try {
    const body = await c.req.json<{ text: string }>();
    const result = extractMentions(body.text || '');
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to extract mentions' }, 400);
  }
});

// Feature 27: Activity Audit Log
collaborationRouter.post('/audit-logs', async (c) => {
  try {
    const body = await c.req.json();
    const entry = createAuditLogEntry(body.params, body.lastEntry);
    return c.json({ entry });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to create audit log entry' }, 400);
  }
});

collaborationRouter.post('/audit-logs/verify', async (c) => {
  try {
    const body = await c.req.json<{ logs: any[] }>();
    const valid = verifyAuditChain(body.logs || []);
    return c.json({ valid });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to verify audit chain' }, 400);
  }
});

// Feature 28: Shareable Email Thread Links
collaborationRouter.post('/share-links', async (c) => {
  try {
    const body = await c.req.json();
    const link = createShareLink(body.threadId, body.options || {});
    return c.json({ link });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to create share link' }, 400);
  }
});

// Feature 29: Team Tagging & Shared Label Hierarchy
collaborationRouter.post('/tags', async (c) => {
  try {
    const body = await c.req.json();
    const manager = new TagHierarchyManager();
    const tag = manager.createTag(body);
    return c.json({ tag });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to manage tags' }, 400);
  }
});

// Feature 30: Customer Context / Mini CRM Sidebar
collaborationRouter.post('/crm/contact', async (c) => {
  try {
    const body = await c.req.json();
    const manager = new CRMContactManager();
    const contact = manager.upsertContact(body.email, body.updates || {});
    return c.json({ contact });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to upsert CRM contact' }, 400);
  }
});
