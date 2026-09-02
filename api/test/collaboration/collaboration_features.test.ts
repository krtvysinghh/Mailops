import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  hasPermission,
  getRolePermissions,
  canModifyRole,
  canRemoveMember,
  filterAccessibleInboxes,
  SharedInboxManager,
  isValidStatusTransition,
  assignEmailThread,
  filterAssignments,
  calculateTeamWorkload,
  AssignmentManager,
  createInternalNote,
  resolveInternalNote,
  stripInternalNotesFromOutboundEmail,
  buildNoteHierarchy,
  InternalNotesManager,
  recordHeartbeat,
  getActivePresence,
  detectCollision,
  cleanExpiredPresence,
  PresenceManager,
  acquireDraftLock,
  releaseDraftLock,
  updateDraftWithVersion,
  setDraftReviewStatus,
  computeLineDiff,
  threeWayMerge,
  DraftsManager,
  extractMentions,
  createMentionNotifications,
  highlightMentionsInText,
  NotificationManager,
  computeAuditHash,
  createAuditLogEntry,
  verifyAuditChain,
  formatAuditTimelineEntry,
  AuditLogManager,
  generateSecureToken,
  hashPassword,
  createShareLink,
  validateAndAccessShareLink,
  sanitizeThreadForShare,
  ShareLinkManager,
  wouldCreateCycle,
  resolveTagPath,
  buildTagTree,
  getTagWithDescendantIds,
  TagHierarchyManager,
  extractCompanyFromEmail,
  calculateRelationshipHealthScore,
  aggregateContactProfile,
  CRMContactManager,
} from '../../src/modules/collaboration';

// =========================================================================
// FEATURE 21: Shared Team Inboxes & RBAC
// =========================================================================
describe('Feature 21: Shared Team Inboxes & RBAC', () => {
  // Tier 1: Happy Path
  it('F21-T1.1: Owner possesses all RBAC permissions', () => {
    assert.strictEqual(hasPermission('owner', 'inbox:manage'), true);
    assert.strictEqual(hasPermission('owner', 'members:invite'), true);
    assert.strictEqual(hasPermission('owner', 'email:delete'), true);
    assert.strictEqual(hasPermission('owner', 'email:send'), true);
    assert.strictEqual(hasPermission('owner', 'draft:edit'), true);
  });

  it('F21-T1.2: Member possesses standard operation permissions but cannot manage inbox', () => {
    assert.strictEqual(hasPermission('member', 'email:read'), true);
    assert.strictEqual(hasPermission('member', 'email:send'), true);
    assert.strictEqual(hasPermission('member', 'email:assign'), true);
    assert.strictEqual(hasPermission('member', 'notes:create'), true);
    assert.strictEqual(hasPermission('member', 'inbox:manage'), false);
    assert.strictEqual(hasPermission('member', 'members:invite'), false);
    assert.strictEqual(hasPermission('member', 'email:delete'), false);
  });

  it('F21-T1.3: Viewer is restricted to read-only access', () => {
    assert.strictEqual(hasPermission('viewer', 'email:read'), true);
    assert.strictEqual(hasPermission('viewer', 'notes:read'), true);
    assert.strictEqual(hasPermission('viewer', 'email:send'), false);
    assert.strictEqual(hasPermission('viewer', 'email:assign'), false);
    assert.strictEqual(hasPermission('viewer', 'draft:create'), false);
    assert.strictEqual(hasPermission('viewer', 'inbox:manage'), false);
  });

  it('F21-T1.4: Owner creates inbox and is registered as owner in member roster', () => {
    const mgr = new SharedInboxManager();
    const inbox = mgr.createInbox('inbox-1', 'domain-1', 'Support Queue', 'user-owner');
    assert.strictEqual(inbox.name, 'Support Queue');

    const members = mgr.getMembers('inbox-1');
    assert.strictEqual(members.length, 1);
    assert.strictEqual(members[0].userId, 'user-owner');
    assert.strictEqual(members[0].role, 'owner');
  });

  it('F21-T1.5: Owner invites Admin and Member successfully', () => {
    const mgr = new SharedInboxManager();
    mgr.createInbox('inbox-1', 'domain-1', 'Billing Queue', 'user-owner');

    const admin = mgr.addMember('user-owner', 'inbox-1', 'user-admin', 'admin');
    const member = mgr.addMember('user-owner', 'inbox-1', 'user-member', 'member');

    assert.strictEqual(admin.role, 'admin');
    assert.strictEqual(member.role, 'member');
    assert.strictEqual(mgr.getMembers('inbox-1').length, 3);
  });

  // Tier 2: Boundary & Edge Cases
  it('F21-T2.1: Admin cannot promote any user to Owner or Admin', () => {
    assert.strictEqual(canModifyRole('admin', 'member', 'owner'), false);
    assert.strictEqual(canModifyRole('admin', 'member', 'admin'), false);
    assert.strictEqual(canModifyRole('admin', 'viewer', 'member'), true);
  });

  it('F21-T2.2: Admin cannot remove or demote an Owner', () => {
    assert.strictEqual(canRemoveMember('admin', 'owner'), false);
    assert.strictEqual(canModifyRole('admin', 'owner', 'member'), false);
  });

  it('F21-T2.3: Member cannot invite new members or change roles', () => {
    const mgr = new SharedInboxManager();
    mgr.createInbox('inbox-1', 'domain-1', 'Sales', 'user-owner');
    mgr.addMember('user-owner', 'inbox-1', 'user-member', 'member');

    assert.throws(() => {
      mgr.addMember('user-member', 'inbox-1', 'user-guest', 'viewer');
    }, /Permission denied/);
  });

  it('F21-T2.4: Sole owner cannot leave inbox without transferring ownership', () => {
    const mgr = new SharedInboxManager();
    mgr.createInbox('inbox-1', 'domain-1', 'DevOps', 'user-owner');

    assert.throws(() => {
      mgr.removeMember('user-owner', 'inbox-1', 'user-owner');
    }, /Must transfer ownership/);
  });

  it('F21-T2.5: Permission checks gracefully handle null, undefined, or unknown roles', () => {
    assert.strictEqual(hasPermission(null, 'email:read'), false);
    assert.strictEqual(hasPermission(undefined, 'email:read'), false);
    assert.strictEqual(hasPermission('invalid_role', 'email:read'), false);
  });
});

// =========================================================================
// FEATURE 22: Email Assignment & Delegation
// =========================================================================
describe('Feature 22: Email Assignment & Delegation', () => {
  // Tier 1: Happy Path
  it('F22-T1.1: Assigns unassigned email to team member, transitioning to in_progress', () => {
    const { assignment, historyItem } = assignEmailThread(null, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedToUserId: 'user-alex',
      assignedByUserId: 'user-sarah',
      note: 'Please look into this priority bug',
    });

    assert.strictEqual(assignment.assignedToUserId, 'user-alex');
    assert.strictEqual(assignment.status, 'in_progress');
    assert.strictEqual(historyItem.previousAssignee, null);
    assert.strictEqual(historyItem.newAssignee, 'user-alex');
  });

  it('F22-T1.2: Reassigns email to new user and appends to immutable history chain', () => {
    const initial = assignEmailThread(null, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedToUserId: 'user-alex',
      assignedByUserId: 'user-sarah',
    }).assignment;

    const updated = assignEmailThread(initial, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedToUserId: 'user-dave',
      assignedByUserId: 'user-alex',
      note: 'Transferring to Dave for frontend triage',
    }).assignment;

    assert.strictEqual(updated.assignedToUserId, 'user-dave');
    assert.strictEqual(updated.history.length, 2);
    assert.strictEqual(updated.history[1].previousAssignee, 'user-alex');
    assert.strictEqual(updated.history[1].newAssignee, 'user-dave');
  });

  it('F22-T1.3: Transitions status from in_progress to waiting', () => {
    const initial = assignEmailThread(null, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedToUserId: 'user-alex',
      assignedByUserId: 'user-alex',
    }).assignment;

    const waiting = assignEmailThread(initial, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedByUserId: 'user-alex',
      status: 'waiting',
      note: 'Waiting on customer reproduction steps',
    }).assignment;

    assert.strictEqual(waiting.status, 'waiting');
    assert.strictEqual(waiting.assignedToUserId, 'user-alex');
  });

  it('F22-T1.4: Resolves assignment status', () => {
    const initial = assignEmailThread(null, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedToUserId: 'user-alex',
      assignedByUserId: 'user-alex',
    }).assignment;

    const resolved = assignEmailThread(initial, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedByUserId: 'user-alex',
      status: 'resolved',
    }).assignment;

    assert.strictEqual(resolved.status, 'resolved');
  });

  it('F22-T1.5: Filters assignments by assignee and status', () => {
    const list = [
      assignEmailThread(null, { id: '1', emailId: 'e1', assignedToUserId: 'alex', assignedByUserId: 's', status: 'in_progress' }).assignment,
      assignEmailThread(null, { id: '2', emailId: 'e2', assignedToUserId: 'alex', assignedByUserId: 's', status: 'resolved' }).assignment,
      assignEmailThread(null, { id: '3', emailId: 'e3', assignedToUserId: 'dave', assignedByUserId: 's', status: 'in_progress' }).assignment,
      assignEmailThread(null, { id: '4', emailId: 'e4', assignedToUserId: null, assignedByUserId: 's', status: 'unassigned' }).assignment,
    ];

    const alexActive = filterAssignments(list, { userId: 'alex', status: 'in_progress' });
    assert.strictEqual(alexActive.length, 1);
    assert.strictEqual(alexActive[0].emailId, 'e1');

    const unassigned = filterAssignments(list, { unassignedOnly: true });
    assert.strictEqual(unassigned.length, 1);
    assert.strictEqual(unassigned[0].emailId, 'e4');
  });

  // Tier 2: Boundary & Edge Cases
  it('F22-T2.1: Re-opens resolved email thread back to in_progress', () => {
    assert.strictEqual(isValidStatusTransition('resolved', 'in_progress'), true);
  });

  it('F22-T2.2: Unassigns email setting assignedToUserId to null', () => {
    const initial = assignEmailThread(null, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedToUserId: 'user-alex',
      assignedByUserId: 'user-sarah',
    }).assignment;

    const unassigned = assignEmailThread(initial, {
      id: 'asgn-1',
      emailId: 'email-101',
      assignedToUserId: null,
      assignedByUserId: 'user-alex',
    }).assignment;

    assert.strictEqual(unassigned.assignedToUserId, null);
    assert.strictEqual(unassigned.status, 'unassigned');
  });

  it('F22-T2.3: Computes workload balance metrics across team', () => {
    const list = [
      assignEmailThread(null, { id: '1', emailId: 'e1', assignedToUserId: 'alex', assignedByUserId: 's', status: 'in_progress' }).assignment,
      assignEmailThread(null, { id: '2', emailId: 'e2', assignedToUserId: 'alex', assignedByUserId: 's', status: 'waiting' }).assignment,
      assignEmailThread(null, { id: '3', emailId: 'e3', assignedToUserId: 'alex', assignedByUserId: 's', status: 'resolved' }).assignment,
      assignEmailThread(null, { id: '4', emailId: 'e4', assignedToUserId: 'sarah', assignedByUserId: 's', status: 'in_progress' }).assignment,
    ];

    const workload = calculateTeamWorkload(list);
    assert.strictEqual(workload['alex'].totalAssigned, 3);
    assert.strictEqual(workload['alex'].activeLoad, 2);
    assert.strictEqual(workload['alex'].resolved, 1);
    assert.strictEqual(workload['sarah'].activeLoad, 1);
  });

  it('F22-T2.4: Reject empty assignment filtering returns empty array without throwing', () => {
    const filtered = filterAssignments([], { userId: 'non-existent' });
    assert.deepStrictEqual(filtered, []);
  });

  it('F22-T2.5: Identical status transition is always valid', () => {
    assert.strictEqual(isValidStatusTransition('in_progress', 'in_progress'), true);
    assert.strictEqual(isValidStatusTransition('waiting', 'waiting'), true);
    assert.strictEqual(isValidStatusTransition('resolved', 'resolved'), true);
  });
});

// =========================================================================
// FEATURE 23: Internal Notes & Inline Comments
// =========================================================================
describe('Feature 23: Internal Notes & Inline Comments', () => {
  // Tier 1: Happy Path
  it('F23-T1.1: Creates internal note attached to email thread', () => {
    const note = createInternalNote({
      id: 'note-1',
      emailId: 'email-1',
      threadId: 'th-1',
      userId: 'user-alex',
      authorName: 'Alex Chen',
      content: 'Discussed with product lead, approving 20% discount.',
    });

    assert.strictEqual(note.content, 'Discussed with product lead, approving 20% discount.');
    assert.strictEqual(note.isResolved, false);
    assert.strictEqual(note.parentNoteId, null);
  });

  it('F23-T1.2: Creates inline comment with quoted highlight range', () => {
    const note = createInternalNote({
      id: 'note-2',
      emailId: 'email-1',
      userId: 'user-sarah',
      authorName: 'Sarah Connor',
      content: 'This paragraph needs legal review before sending.',
      highlight: {
        quotedSnippet: 'Guaranteed 99.999% uptime SLA with uncapped penalty clauses',
        startOffset: 120,
        endOffset: 180,
      },
    });

    assert.ok(note.highlight);
    assert.strictEqual(note.highlight.quotedSnippet.includes('99.999%'), true);
  });

  it('F23-T1.3: Creates nested reply to an internal note', () => {
    const parent = createInternalNote({
      id: 'note-1',
      emailId: 'email-1',
      userId: 'user-alex',
      authorName: 'Alex',
      content: 'Should we expedite this ticket?',
    });

    const reply = createInternalNote({
      id: 'note-2',
      emailId: 'email-1',
      userId: 'user-sarah',
      authorName: 'Sarah',
      content: 'Yes, expedited.',
      parentNoteId: parent.id,
    });

    assert.strictEqual(reply.parentNoteId, 'note-1');
  });

  it('F23-T1.4: Resolves internal note discussion', () => {
    const note = createInternalNote({
      id: 'note-1',
      emailId: 'email-1',
      userId: 'user-alex',
      authorName: 'Alex',
      content: 'Clarify shipping address',
    });

    const resolved = resolveInternalNote(note, 'user-sarah');
    assert.strictEqual(resolved.isResolved, true);
    assert.strictEqual(resolved.resolvedByUserId, 'user-sarah');
    assert.ok(resolved.resolvedAt instanceof Date);
  });

  it('F23-T1.5: Builds nested discussion hierarchy tree', () => {
    const n1 = createInternalNote({ id: '1', emailId: 'e', userId: 'u1', authorName: 'Alex', content: 'Root 1' });
    const n2 = createInternalNote({ id: '2', emailId: 'e', userId: 'u2', authorName: 'Sarah', content: 'Reply to 1', parentNoteId: '1' });
    const n3 = createInternalNote({ id: '3', emailId: 'e', userId: 'u1', authorName: 'Alex', content: 'Root 2' });

    const tree = buildNoteHierarchy([n1, n2, n3]);
    assert.strictEqual(tree.length, 2);
    assert.strictEqual(tree[0].id, '1');
    assert.strictEqual(tree[0].replies.length, 1);
    assert.strictEqual(tree[0].replies[0].id, '2');
    assert.strictEqual(tree[1].id, '3');
  });

  // Tier 2: Boundary & Edge Cases
  it('F23-T2.1: Strips <internal-note> XML tags before sending outbound email', () => {
    const raw = 'Hello Customer,\n<internal-note>Customer is high risk</internal-note>\nPlease find your invoice attached.';
    const sanitized = stripInternalNotesFromOutboundEmail(raw);
    assert.strictEqual(sanitized.includes('Customer is high risk'), false);
    assert.strictEqual(sanitized.includes('Hello Customer'), true);
    assert.strictEqual(sanitized.includes('invoice attached'), true);
  });

  it('F23-T2.2: Strips [[INTERNAL NOTE: ...]] and HTML comments from outbound email', () => {
    const raw = '<p>Dear Partner,</p>\n<!-- INTERNAL NOTE: Do not mention the discount yet -->\n[[INTERNAL NOTE: Check with CEO]]\n<p>Looking forward to our call.</p>';
    const sanitized = stripInternalNotesFromOutboundEmail(raw);
    assert.strictEqual(sanitized.includes('Do not mention'), false);
    assert.strictEqual(sanitized.includes('Check with CEO'), false);
    assert.strictEqual(sanitized.includes('Dear Partner'), true);
  });

  it('F23-T2.3: Rejects empty note content', () => {
    assert.throws(() => {
      createInternalNote({
        id: 'n1',
        emailId: 'e1',
        userId: 'u1',
        authorName: 'Alex',
        content: '   ',
      });
    }, /cannot be empty/);
  });

  it('F23-T2.4: Handles deep recursive note reply nesting', () => {
    const n1 = createInternalNote({ id: '1', emailId: 'e', userId: 'u', authorName: 'A', content: 'Level 1' });
    const n2 = createInternalNote({ id: '2', emailId: 'e', userId: 'u', authorName: 'B', content: 'Level 2', parentNoteId: '1' });
    const n3 = createInternalNote({ id: '3', emailId: 'e', userId: 'u', authorName: 'C', content: 'Level 3', parentNoteId: '2' });

    const tree = buildNoteHierarchy([n1, n2, n3]);
    assert.strictEqual(tree.length, 1);
    assert.strictEqual(tree[0].replies[0].replies[0].id, '3');
  });

  it('F23-T2.5: Stripping clean text without notes returns identical string', () => {
    const clean = 'Hello world, this is a normal email.';
    assert.strictEqual(stripInternalNotesFromOutboundEmail(clean), clean);
  });
});

// =========================================================================
// FEATURE 24: Live Presence & Collision Detection
// =========================================================================
describe('Feature 24: Live Presence & Collision Detection', () => {
  // Tier 1: Happy Path
  it('F24-T1.1: Records viewing heartbeat for user', () => {
    const list = recordHeartbeat([], {
      emailId: 'e-1',
      userId: 'u-alex',
      userName: 'Alex',
      action: 'viewing',
    });

    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].action, 'viewing');
    assert.strictEqual(list[0].userName, 'Alex');
  });

  it('F24-T1.2: Records drafting heartbeat for active responder', () => {
    const list = recordHeartbeat([], {
      emailId: 'e-1',
      userId: 'u-sarah',
      userName: 'Sarah',
      action: 'drafting',
    });

    assert.strictEqual(list[0].action, 'drafting');
  });

  it('F24-T1.3: Retrieves active viewers within TTL window', () => {
    const now = new Date();
    const list = [
      { id: '1', emailId: 'e-1', userId: 'u1', userName: 'A', action: 'viewing' as const, lastHeartbeat: now },
      { id: '2', emailId: 'e-1', userId: 'u2', userName: 'B', action: 'viewing' as const, lastHeartbeat: new Date(now.getTime() - 60000) }, // Expired (>30s)
    ];

    const active = getActivePresence(list, 'e-1', now, 30000);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].userId, 'u1');
  });

  it('F24-T1.4: Detects collision when another user is drafting on thread', () => {
    const now = new Date();
    const list = [
      { id: '1', emailId: 'e-1', userId: 'u-sarah', userName: 'Sarah', action: 'drafting' as const, lastHeartbeat: now },
      { id: '2', emailId: 'e-1', userId: 'u-alex', userName: 'Alex', action: 'viewing' as const, lastHeartbeat: now },
    ];

    const collision = detectCollision(list, 'e-1', 'u-alex', now, 30000);
    assert.strictEqual(collision.hasCollision, true);
    assert.strictEqual(collision.activeDraftingUsers.length, 1);
    assert.strictEqual(collision.activeDraftingUsers[0].userName, 'Sarah');
    assert.ok(collision.warningMessage?.includes('Sarah is currently drafting'));
  });

  it('F24-T1.5: Cleans expired presence records across all threads', () => {
    const now = new Date();
    const list = [
      { id: '1', emailId: 'e-1', userId: 'u1', userName: 'A', action: 'viewing' as const, lastHeartbeat: now },
      { id: '2', emailId: 'e-2', userId: 'u2', userName: 'B', action: 'viewing' as const, lastHeartbeat: new Date(now.getTime() - 40000) },
    ];

    const cleaned = cleanExpiredPresence(list, now, 30000);
    assert.strictEqual(cleaned.length, 1);
    assert.strictEqual(cleaned[0].userId, 'u1');
  });

  // Tier 2: Boundary & Edge Cases
  it('F24-T2.1: Repeated heartbeats from same user update in-place without duplicating', () => {
    let list = recordHeartbeat([], { emailId: 'e1', userId: 'u1', userName: 'Alex', action: 'viewing' });
    list = recordHeartbeat(list, { emailId: 'e1', userId: 'u1', userName: 'Alex', action: 'drafting' });

    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].action, 'drafting');
  });

  it('F24-T2.2: Viewing users do not trigger collision warnings for each other', () => {
    const now = new Date();
    const list = [
      { id: '1', emailId: 'e-1', userId: 'u-sarah', userName: 'Sarah', action: 'viewing' as const, lastHeartbeat: now },
      { id: '2', emailId: 'e-1', userId: 'u-alex', userName: 'Alex', action: 'viewing' as const, lastHeartbeat: now },
    ];

    const collision = detectCollision(list, 'e-1', 'u-alex', now, 30000);
    assert.strictEqual(collision.hasCollision, false);
    assert.strictEqual(collision.activeViewingUsers.length, 1);
  });

  it('F24-T2.3: User drafting does not trigger self-collision warning', () => {
    const now = new Date();
    const list = [
      { id: '1', emailId: 'e-1', userId: 'u-alex', userName: 'Alex', action: 'drafting' as const, lastHeartbeat: now },
    ];

    const collision = detectCollision(list, 'e-1', 'u-alex', now, 30000);
    assert.strictEqual(collision.hasCollision, false);
  });

  it('F24-T2.4: Heartbeat on different emailId is isolated', () => {
    const now = new Date();
    const list = [
      { id: '1', emailId: 'e-1', userId: 'u-sarah', userName: 'Sarah', action: 'drafting' as const, lastHeartbeat: now },
    ];

    const collisionOnOtherThread = detectCollision(list, 'e-2', 'u-alex', now, 30000);
    assert.strictEqual(collisionOnOtherThread.hasCollision, false);
    assert.strictEqual(collisionOnOtherThread.activeDraftingUsers.length, 0);
  });

  it('F24-T2.5: PresenceManager handles full lifecycle with removal', () => {
    const mgr = new PresenceManager(30000);
    mgr.heartbeat({ emailId: 'e1', userId: 'u1', userName: 'Alex', action: 'viewing' });
    assert.strictEqual(mgr.getActive('e1').length, 1);

    mgr.remove('e1', 'u1');
    assert.strictEqual(mgr.getActive('e1').length, 0);
  });
});

// =========================================================================
// FEATURE 25: Collaborative Drafts & Co-Authoring
// =========================================================================
describe('Feature 25: Collaborative Drafts & Co-Authoring', () => {
  // Tier 1: Happy Path
  it('F25-T1.1: Creates collaborative draft with version 1 and draft status', () => {
    const mgr = new DraftsManager();
    const draft = mgr.create({
      id: 'draft-1',
      authorUserId: 'u-alex',
      subject: 'Agreement Draft',
      body: 'Initial paragraph.',
    });

    assert.strictEqual(draft.version, 1);
    assert.strictEqual(draft.reviewStatus, 'draft');
    assert.strictEqual(draft.body, 'Initial paragraph.');
  });

  it('F25-T1.2: Acquires and releases exclusive edit lock on draft', () => {
    const mgr = new DraftsManager();
    mgr.create({ id: 'draft-1', authorUserId: 'u-alex' });

    const locked = mgr.lock('draft-1', 'u-alex', 60000);
    assert.strictEqual(locked.lockedByUserId, 'u-alex');
    assert.ok(locked.lockedUntil);

    const unlocked = mgr.unlock('draft-1', 'u-alex');
    assert.strictEqual(unlocked.lockedByUserId, null);
  });

  it('F25-T1.3: Updates draft with matching expected version and increments version', () => {
    const mgr = new DraftsManager();
    mgr.create({ id: 'draft-1', authorUserId: 'u-alex', body: 'v1 text' });

    const updated = mgr.update('draft-1', 1, {
      body: 'v2 modified text',
      editorUserId: 'u-alex',
    });

    assert.strictEqual(updated.version, 2);
    assert.strictEqual(updated.body, 'v2 modified text');
  });

  it('F25-T1.4: Progresses draft review workflow to in_review and approved', () => {
    const mgr = new DraftsManager();
    mgr.create({ id: 'draft-1', authorUserId: 'u-alex' });

    const inReview = mgr.setReview('draft-1', 'in_review', 'u-alex');
    assert.strictEqual(inReview.reviewStatus, 'in_review');

    const approved = mgr.setReview('draft-1', 'approved', 'u-sarah');
    assert.strictEqual(approved.reviewStatus, 'approved');
    assert.strictEqual(approved.approvedByUserId, 'u-sarah');
  });

  it('F25-T1.5: 3-way line diff merger merges non-conflicting edits from User A and User B', () => {
    const base = 'Line 1\nLine 2\nLine 3';
    const userA = 'Line 1 (A edit)\nLine 2\nLine 3';
    const userB = 'Line 1\nLine 2\nLine 3 (B edit)';

    const result = threeWayMerge(base, userA, userB);
    assert.strictEqual(result.hasConflicts, false);
    assert.strictEqual(result.mergedText, 'Line 1 (A edit)\nLine 2\nLine 3 (B edit)');
  });

  // Tier 2: Boundary & Edge Cases
  it('F25-T2.1: Stale version update rejected with optimistic concurrency error', () => {
    const mgr = new DraftsManager();
    mgr.create({ id: 'draft-1', authorUserId: 'u-alex' });
    mgr.update('draft-1', 1, { body: 'v2', editorUserId: 'u-alex' });

    assert.throws(() => {
      mgr.update('draft-1', 1, { body: 'v2-stale', editorUserId: 'u-sarah' });
    }, /Version conflict/);
  });

  it('F25-T2.2: Cannot acquire lock held by another active user', () => {
    const mgr = new DraftsManager();
    mgr.create({ id: 'draft-1', authorUserId: 'u-alex' });
    mgr.lock('draft-1', 'u-alex', 60000);

    assert.throws(() => {
      mgr.lock('draft-1', 'u-sarah', 60000);
    }, /currently locked by user u-alex/);
  });

  it('F25-T2.3: 3-way merger flags conflicting edits with conflict markers', () => {
    const base = 'Header\nTarget Line\nFooter';
    const userA = 'Header\nOption Alpha\nFooter';
    const userB = 'Header\nOption Beta\nFooter';

    const result = threeWayMerge(base, userA, userB);
    assert.strictEqual(result.hasConflicts, true);
    assert.strictEqual(result.conflicts.length, 1);
    assert.ok(result.mergedText.includes('<<<<<<< USER_A'));
    assert.ok(result.mergedText.includes('Option Alpha'));
    assert.ok(result.mergedText.includes('======='));
    assert.ok(result.mergedText.includes('Option Beta'));
    assert.ok(result.mergedText.includes('>>>>>>> USER_B'));
  });

  it('F25-T2.4: Editing an approved draft resets review status back to draft', () => {
    const mgr = new DraftsManager();
    mgr.create({ id: 'draft-1', authorUserId: 'u-alex' });
    mgr.setReview('draft-1', 'approved', 'u-sarah');

    const updated = mgr.update('draft-1', 1, { body: 'new changes', editorUserId: 'u-alex' });
    assert.strictEqual(updated.reviewStatus, 'draft');
    assert.strictEqual(updated.approvedByUserId, null);
  });

  it('F25-T2.5: computeLineDiff correctly computes addition and deletion chunks', () => {
    const diff = computeLineDiff('Apple\nBanana\nCherry', 'Apple\nBlueberry\nCherry\nDate');
    assert.ok(diff.some(d => d.type === 'delete' && d.lines.includes('Banana')));
    assert.ok(diff.some(d => d.type === 'add' && d.lines.includes('Blueberry')));
    assert.ok(diff.some(d => d.type === 'add' && d.lines.includes('Date')));
  });
});

// =========================================================================
// FEATURE 26: Email Mentions (`@user`) & Alerts
// =========================================================================
describe('Feature 26: Email Mentions (`@user`) & Alerts', () => {
  const team = [
    { id: 'u1', username: 'alex', email: 'alex@mailops.dev' },
    { id: 'u2', username: 'sarah', email: 'sarah@mailops.dev' },
    { id: 'u3', username: 'dave.bowman', email: 'dbowman@mailops.dev' },
  ];

  // Tier 1: Happy Path
  it('F26-T1.1: Extracts single @username mention from text', () => {
    const { mentions } = extractMentions('Hey @alex, please review this PR.');
    assert.deepStrictEqual(mentions, ['alex']);
  });

  it('F26-T1.2: Extracts multiple unique mentions across multiline text', () => {
    const text = 'Cc @alex and @sarah on this.\nAlso @alex please follow up.';
    const { mentions } = extractMentions(text);
    assert.strictEqual(mentions.length, 2);
    assert.ok(mentions.includes('alex'));
    assert.ok(mentions.includes('sarah'));
  });

  it('F26-T1.3: Creates mention notifications for target team members', () => {
    const notifications = createMentionNotifications(
      'Hey @sarah, check this out!',
      {
        authorUserId: 'u1',
        authorName: 'Alex Chen',
        entityType: 'note',
        entityId: 'note-101',
        threadId: 'th-1',
      },
      team
    );

    assert.strictEqual(notifications.length, 1);
    assert.strictEqual(notifications[0].userId, 'u2');
    assert.strictEqual(notifications[0].title, 'Alex Chen mentioned you in a note');
    assert.strictEqual(notifications[0].isRead, false);
  });

  it('F26-T1.4: NotificationManager tracks unread count and marks as read', () => {
    const mgr = new NotificationManager();
    mgr.add({
      id: 'notif-1',
      userId: 'u2',
      title: 'Mention alert',
      message: 'Hello',
      linkUrl: '/thread/1',
      type: 'mention',
      isRead: false,
      createdAt: new Date(),
    });

    assert.strictEqual(mgr.getUnreadCount('u2'), 1);
    mgr.markAsRead('notif-1');
    assert.strictEqual(mgr.getUnreadCount('u2'), 0);
  });

  it('F26-T1.5: Highlights mentions with styled span markup', () => {
    const highlighted = highlightMentionsInText('Check with @alex today');
    assert.ok(highlighted.includes('<span class="mention'));
    assert.ok(highlighted.includes('@alex'));
  });

  // Tier 2: Boundary & Edge Cases
  it('F26-T2.1: Email addresses are not falsely parsed as @user mentions', () => {
    const { mentions } = extractMentions('Send an email to support@mailops.dev for help.');
    assert.strictEqual(mentions.length, 0);
  });

  it('F26-T2.2: Author mentioning themselves does not trigger self-alert', () => {
    const notifications = createMentionNotifications(
      'I am assigning this to @alex',
      {
        authorUserId: 'u1', // alex
        authorName: 'Alex',
        entityType: 'note',
        entityId: 'n1',
      },
      team
    );

    assert.strictEqual(notifications.length, 0);
  });

  it('F26-T2.3: Non-existent team member mention is ignored gracefully', () => {
    const notifications = createMentionNotifications(
      'Hey @ghostuser, are you there?',
      { authorUserId: 'u1', authorName: 'Alex', entityType: 'note', entityId: 'n1' },
      team
    );
    assert.strictEqual(notifications.length, 0);
  });

  it('F26-T2.4: Cleans trailing punctuation from usernames', () => {
    const { mentions } = extractMentions('Hello @sarah! How is @alex?');
    assert.deepStrictEqual(mentions.sort(), ['alex', 'sarah']);
  });

  it('F26-T2.5: Empty or whitespace text returns zero mentions', () => {
    assert.deepStrictEqual(extractMentions('').mentions, []);
    assert.deepStrictEqual(extractMentions('   ').mentions, []);
  });
});

// =========================================================================
// FEATURE 27: Activity Audit Log & History Timeline
// =========================================================================
describe('Feature 27: Activity Audit Log & History Timeline', () => {
  // Tier 1: Happy Path
  it('F27-T1.1: Creates cryptographically chained audit log entry', () => {
    const entry = createAuditLogEntry({
      id: 'audit-1',
      userId: 'u-alex',
      action: 'assignment_created',
      targetEntity: 'email',
      targetId: 'msg-101',
      metadata: { assignedTo: 'Sarah' },
    });

    assert.strictEqual(entry.previousHash.length, 64);
    assert.strictEqual(entry.entryHash.length, 64);
    assert.strictEqual(entry.action, 'assignment_created');
  });

  it('F27-T1.2: Chains successive entries using previousHash', () => {
    const mgr = new AuditLogManager();
    const e1 = mgr.log({ id: '1', userId: 'u1', action: 'email_read', targetEntity: 'email', targetId: 'm1' });
    const e2 = mgr.log({ id: '2', userId: 'u1', action: 'note_added', targetEntity: 'email', targetId: 'm1' });

    assert.strictEqual(e2.previousHash, e1.entryHash);
  });

  it('F27-T1.3: Verifies uncompromised audit chain as valid', () => {
    const mgr = new AuditLogManager();
    mgr.log({ id: '1', userId: 'u1', action: 'email_read', targetEntity: 'email', targetId: 'm1' });
    mgr.log({ id: '2', userId: 'u1', action: 'tag_added', targetEntity: 'email', targetId: 'm1' });
    mgr.log({ id: '3', userId: 'u2', action: 'email_sent', targetEntity: 'email', targetId: 'm1' });

    const verification = mgr.verifyChain();
    assert.strictEqual(verification.isValid, true);
  });

  it('F27-T1.4: Formats raw audit entries into human-readable timeline items', () => {
    const entry = createAuditLogEntry({
      id: '1',
      userId: 'u1',
      userName: 'Sarah Connor',
      action: 'assignment_status_changed',
      targetEntity: 'email',
      targetId: 'm1',
      metadata: { newStatus: 'resolved' },
    });

    const timelineItem = formatAuditTimelineEntry(entry);
    assert.strictEqual(timelineItem.actor, 'Sarah Connor');
    assert.ok(timelineItem.description.includes('changed status to "resolved"'));
    assert.strictEqual(timelineItem.icon, '🔄');
  });

  it('F27-T1.5: Retrieves filtered timeline by targetId', () => {
    const mgr = new AuditLogManager();
    mgr.log({ id: '1', userId: 'u1', action: 'email_read', targetEntity: 'email', targetId: 'm1' });
    mgr.log({ id: '2', userId: 'u1', action: 'email_read', targetEntity: 'email', targetId: 'm2' });

    const m1Timeline = mgr.getTimeline('m1');
    assert.strictEqual(m1Timeline.length, 1);
    assert.strictEqual(m1Timeline[0].id, '1');
  });

  // Tier 2: Boundary & Edge Cases
  it('F27-T2.1: Detects payload tampering in intermediate audit record', () => {
    const mgr = new AuditLogManager();
    mgr.log({ id: '1', userId: 'u1', action: 'email_read', targetEntity: 'email', targetId: 'm1' });
    mgr.log({ id: '2', userId: 'u1', action: 'note_added', targetEntity: 'email', targetId: 'm1' });

    const all = mgr.getAll();
    // Tamper with action without recalculating entryHash
    all[0].action = 'tampered_action';

    const verification = verifyAuditChain(all);
    assert.strictEqual(verification.isValid, false);
    assert.strictEqual(verification.brokenIndex, 0);
  });

  it('F27-T2.2: Detects broken previousHash linkage', () => {
    const mgr = new AuditLogManager();
    mgr.log({ id: '1', userId: 'u1', action: 'email_read', targetEntity: 'email', targetId: 'm1' });
    mgr.log({ id: '2', userId: 'u1', action: 'note_added', targetEntity: 'email', targetId: 'm1' });

    const all = mgr.getAll();
    all[1].previousHash = 'bad'.repeat(21) + 'b';

    const verification = verifyAuditChain(all);
    assert.strictEqual(verification.isValid, false);
    assert.strictEqual(verification.brokenIndex, 1);
  });

  it('F27-T2.3: Verifying empty audit log returns valid', () => {
    assert.strictEqual(verifyAuditChain([]).isValid, true);
  });

  it('F27-T2.4: System action with null userId generates valid hash', () => {
    const entry = createAuditLogEntry({
      id: 'sys-1',
      userId: null,
      action: 'auto_purged',
      targetEntity: 'email',
      targetId: 'm1',
    });
    assert.strictEqual(entry.userName, 'System');
    assert.strictEqual(entry.entryHash.length, 64);
  });

  it('F27-T2.5: computeAuditHash is strictly deterministic', () => {
    const params = {
      id: '1',
      previousHash: '0'.repeat(64),
      timestampMs: 1700000000000,
      userId: 'u1',
      action: 'test',
      targetEntity: 'email',
      targetId: 'm1',
    };
    const h1 = computeAuditHash(params);
    const h2 = computeAuditHash(params);
    assert.strictEqual(h1, h2);
  });
});

// =========================================================================
// FEATURE 28: Shareable Email Thread Links
// =========================================================================
describe('Feature 28: Shareable Email Thread Links', () => {
  // Tier 1: Happy Path
  it('F28-T1.1: Generates cryptographically secure URL-safe token', () => {
    const token = generateSecureToken(32);
    assert.ok(token.length >= 32);
    assert.strictEqual(/^[a-zA-Z0-9_\-]+$/.test(token), true);
  });

  it('F28-T1.2: Creates share link and grants access incrementing view count', () => {
    const link = createShareLink('thread-101');
    const access = validateAndAccessShareLink(link);

    assert.strictEqual(access.canAccess, true);
    assert.strictEqual(access.updatedLink?.viewCount, 1);
  });

  it('F28-T1.3: Strips internal notes and BCC addresses from thread snapshot', () => {
    const rawEmails = [
      {
        id: 'msg-1',
        fromAddr: 'alice@external.com',
        toAddr: 'support@mailops.dev',
        bccAddr: 'secret-auditor@mailops.dev',
        subject: 'Support Ticket',
        textBody: 'Please assist.',
        htmlBody: '<p>Please assist.</p>',
        internalNotes: ['Private internal discussion'],
        createdAt: new Date(),
      },
    ];

    const snapshot = sanitizeThreadForShare('thread-101', rawEmails);
    assert.strictEqual(snapshot.messages.length, 1);
    assert.strictEqual((snapshot.messages[0] as any).bccAddr, undefined);
    assert.strictEqual((snapshot.messages[0] as any).internalNotes, undefined);
  });

  it('F28-T1.4: Grants access with correct password on protected share link', () => {
    const link = createShareLink('thread-101', { password: 'secretPassword123' });
    const access = validateAndAccessShareLink(link, 'secretPassword123');

    assert.strictEqual(access.canAccess, true);
    assert.strictEqual(access.updatedLink?.viewCount, 1);
  });

  it('F28-T1.5: Revokes share link blocking further access', () => {
    const mgr = new ShareLinkManager();
    const link = mgr.create('thread-101');

    assert.strictEqual(mgr.access(link.token).canAccess, true);
    mgr.revoke(link.token);
    assert.strictEqual(mgr.access(link.token).canAccess, false);
    assert.ok(mgr.access(link.token).error?.includes('revoked'));
  });

  // Tier 2: Boundary & Edge Cases
  it('F28-T2.1: Expired share link is rejected with expiration message', () => {
    const link = createShareLink('thread-101', { expiresInMs: -1000 }); // Expired in past
    const access = validateAndAccessShareLink(link);

    assert.strictEqual(access.canAccess, false);
    assert.ok(access.error?.includes('expired'));
  });

  it('F28-T2.2: Protected link rejects invalid password attempt', () => {
    const link = createShareLink('thread-101', { password: 'correctPassword' });
    const access = validateAndAccessShareLink(link, 'wrongPassword');

    assert.strictEqual(access.canAccess, false);
    assert.ok(access.error?.includes('Incorrect password'));
  });

  it('F28-T2.3: Enforces max view limit (burn-after-reading)', () => {
    let link = createShareLink('thread-101', { maxViews: 2 });
    link = validateAndAccessShareLink(link).updatedLink!;
    link = validateAndAccessShareLink(link).updatedLink!;

    const thirdAccess = validateAndAccessShareLink(link);
    assert.strictEqual(thirdAccess.canAccess, false);
    assert.ok(thirdAccess.error?.includes('Maximum view limit'));
  });

  it('F28-T2.4: Non-existent token access returns not found error', () => {
    const mgr = new ShareLinkManager();
    const access = mgr.access('non-existent-token');
    assert.strictEqual(access.canAccess, false);
    assert.ok(access.error?.includes('not found'));
  });

  it('F28-T2.5: SHA-256 password hashing handles Unicode securely', () => {
    const h1 = hashPassword('Pässwörd! 🔒');
    const h2 = hashPassword('Pässwörd! 🔒');
    assert.strictEqual(h1, h2);
    assert.strictEqual(h1.length, 64);
  });
});

// =========================================================================
// FEATURE 29: Team Tagging & Shared Label Hierarchy
// =========================================================================
describe('Feature 29: Team Tagging & Shared Label Hierarchy', () => {
  // Tier 1: Happy Path
  it('F29-T1.1: Creates nested hierarchical tag taxonomy', () => {
    const mgr = new TagHierarchyManager();
    const support = mgr.createTag({ id: 'tag-support', name: 'Support', color: '#ef4444' });
    const tier1 = mgr.createTag({ id: 'tag-tier1', name: 'Tier1', parentId: support.id });

    assert.strictEqual(support.parentId, null);
    assert.strictEqual(tier1.parentId, 'tag-support');
  });

  it('F29-T1.2: Reconstructs nested tree hierarchy with computed full paths', () => {
    const tags = [
      { id: '1', name: 'Support', color: '#ef4444', parentId: null, createdAt: new Date() },
      { id: '2', name: 'Tier1', color: '#3b82f6', parentId: '1', createdAt: new Date() },
      { id: '3', name: 'Billing', color: '#3b82f6', parentId: '2', createdAt: new Date() },
    ];

    const tree = buildTagTree(tags);
    assert.strictEqual(tree.length, 1);
    assert.strictEqual(tree[0].fullPath, 'Support');
    assert.strictEqual(tree[0].children[0].fullPath, 'Support/Tier1');
    assert.strictEqual(tree[0].children[0].children[0].fullPath, 'Support/Tier1/Billing');
  });

  it('F29-T1.3: Child tags inherit parent color when default is used', () => {
    const tags = [
      { id: '1', name: 'Sales', color: '#10b981', parentId: null, createdAt: new Date() },
      { id: '2', name: 'Enterprise', color: '#3b82f6', parentId: '1', createdAt: new Date() },
    ];

    const { effectiveColor } = resolveTagPath('2', tags);
    assert.strictEqual(effectiveColor, '#10b981'); // Inherits Sales green
  });

  it('F29-T1.4: Tags email and retrieves applied tags with full paths', () => {
    const mgr = new TagHierarchyManager();
    const sup = mgr.createTag({ id: 't-sup', name: 'Support', color: '#ef4444' });
    const t1 = mgr.createTag({ id: 't-t1', name: 'Tier1', parentId: sup.id });

    mgr.tagEmail('email-1', t1.id);
    const applied = mgr.getTagsForEmail('email-1');

    assert.strictEqual(applied.length, 1);
    assert.strictEqual(applied[0].fullPath, 'Support/Tier1');
  });

  it('F29-T1.5: Hierarchical query matching on parent matches descendant tags', () => {
    const mgr = new TagHierarchyManager();
    const sup = mgr.createTag({ id: 't-sup', name: 'Support' });
    const t1 = mgr.createTag({ id: 't-t1', name: 'Tier1', parentId: sup.id });
    const t2 = mgr.createTag({ id: 't-t2', name: 'Tier2', parentId: sup.id });

    mgr.tagEmail('email-A', t1.id);
    mgr.tagEmail('email-B', t2.id);
    mgr.tagEmail('email-C', sup.id);

    const matches = mgr.filterEmailsByTag(sup.id, true);
    assert.strictEqual(matches.length, 3);
    assert.ok(matches.includes('email-A'));
    assert.ok(matches.includes('email-B'));
    assert.ok(matches.includes('email-C'));
  });

  // Tier 2: Boundary & Edge Cases
  it('F29-T2.1: Prevents direct self-parent cycle', () => {
    const tags = [{ id: '1', name: 'Support', color: '#ef4444', parentId: null, createdAt: new Date() }];
    assert.strictEqual(wouldCreateCycle(tags, '1', '1'), true);
  });

  it('F29-T2.2: Prevents indirect multi-level circular references', () => {
    const tags = [
      { id: '1', name: 'A', color: '#fff', parentId: null, createdAt: new Date() },
      { id: '2', name: 'B', color: '#fff', parentId: '1', createdAt: new Date() },
      { id: '3', name: 'C', color: '#fff', parentId: '2', createdAt: new Date() },
    ];
    // Making A child of C creates cycle C -> B -> A -> C
    assert.strictEqual(wouldCreateCycle(tags, '1', '3'), true);
  });

  it('F29-T2.3: Deleting a parent tag sets child parentId to null instead of orphan loss', () => {
    const mgr = new TagHierarchyManager();
    const sup = mgr.createTag({ id: 't-sup', name: 'Support' });
    const t1 = mgr.createTag({ id: 't-t1', name: 'Tier1', parentId: sup.id });

    mgr.deleteTag(sup.id);
    const tree = mgr.getTagTree();

    assert.strictEqual(tree.length, 1);
    assert.strictEqual(tree[0].id, t1.id);
    assert.strictEqual(tree[0].parentId, null);
  });

  it('F29-T2.4: Tagging an email multiple times is idempotent', () => {
    const mgr = new TagHierarchyManager();
    const tag = mgr.createTag({ id: 't1', name: 'VIP' });
    mgr.tagEmail('e1', tag.id);
    mgr.tagEmail('e1', tag.id);

    const tags = mgr.getTagsForEmail('e1');
    assert.strictEqual(tags.length, 1);
  });

  it('F29-T2.5: Untagging removes mapping cleanly', () => {
    const mgr = new TagHierarchyManager();
    const tag = mgr.createTag({ id: 't1', name: 'VIP' });
    mgr.tagEmail('e1', tag.id);
    mgr.untagEmail('e1', tag.id);

    assert.strictEqual(mgr.getTagsForEmail('e1').length, 0);
  });
});

// =========================================================================
// FEATURE 30: Customer Context / Mini CRM Sidebar
// =========================================================================
describe('Feature 30: Customer Context / Mini CRM Sidebar', () => {
  // Tier 1: Happy Path
  it('F30-T1.1: Extracts domain and capitalized company name from sender email', () => {
    const { domain, companyName } = extractCompanyFromEmail('sarah@acme.corp');
    assert.strictEqual(domain, 'acme.corp');
    assert.strictEqual(companyName, 'Acme');
  });

  it('F30-T1.2: Aggregates contact interaction count, inbound/outbound ratio and timestamps', () => {
    const emailHistory = [
      { id: '1', fromAddr: 'sarah@acme.corp', toAddr: 'support@mailops.dev', createdAt: new Date(Date.now() - 50000) },
      { id: '2', fromAddr: 'support@mailops.dev', toAddr: 'sarah@acme.corp', createdAt: new Date(Date.now() - 10000) },
    ];

    const profile = aggregateContactProfile('sarah@acme.corp', emailHistory);
    assert.strictEqual(profile.interactionCount, 2);
    assert.strictEqual(profile.inboundCount, 1);
    assert.strictEqual(profile.outboundCount, 1);
    assert.ok(profile.healthScore > 50);
  });

  it('F30-T1.3: Calculates high relationship health score for active responsive contact', () => {
    const score = calculateRelationshipHealthScore(10, new Date(), 5, 5);
    assert.ok(score >= 85);
  });

  it('F30-T1.4: Upserts CRM contact stage and account notes', () => {
    const mgr = new CRMContactManager();
    const contact = mgr.upsertContact('sarah@acme.corp', {
      name: 'Sarah Connor',
      stage: 'vip',
      notes: 'Key decision maker for enterprise SLA renewal.',
    });

    assert.strictEqual(contact.name, 'Sarah Connor');
    assert.strictEqual(contact.stage, 'vip');
    assert.strictEqual(contact.notes, 'Key decision maker for enterprise SLA renewal.');
  });

  it('F30-T1.5: Adds deals to contact opportunity pipeline', () => {
    const mgr = new CRMContactManager();
    const contact = mgr.addDeal('sarah@acme.corp', {
      title: 'Enterprise Annual License',
      value: 60000,
      currency: 'USD',
      stage: 'proposal',
    });

    assert.strictEqual(contact.deals.length, 1);
    assert.strictEqual(contact.deals[0].title, 'Enterprise Annual License');
    assert.strictEqual(contact.deals[0].value, 60000);
  });

  // Tier 2: Boundary & Edge Cases
  it('F30-T2.1: Contact with 0 interactions yields health score 0', () => {
    const score = calculateRelationshipHealthScore(0, null, 0, 0);
    assert.strictEqual(score, 0);
  });

  it('F30-T2.2: Stale contact (>180 days inactive) has reduced recency score', () => {
    const staleDate = new Date(Date.now() - 200 * 86400000);
    const score = calculateRelationshipHealthScore(5, staleDate, 3, 2);
    assert.ok(score < 50);
  });

  it('F30-T2.3: One-sided contact without bidirectional replies receives low balance points', () => {
    const score = calculateRelationshipHealthScore(5, new Date(), 5, 0);
    assert.ok(score < 75);
  });

  it('F30-T2.4: Malformed or domain-less email string handled gracefully', () => {
    const { domain, companyName } = extractCompanyFromEmail('invalid-no-domain');
    assert.strictEqual(domain, 'unknown');
    assert.strictEqual(companyName, 'Unknown');
  });

  it('F30-T2.5: Aggregation limits recent threads list to top 5 newest', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      fromAddr: 'alice@acme.com',
      toAddr: 'support@mailops.dev',
      createdAt: new Date(Date.now() + i * 1000),
    }));

    const profile = aggregateContactProfile('alice@acme.com', history);
    assert.strictEqual(profile.recentThreads.length, 5);
    assert.strictEqual(profile.recentThreads[0].id, 'msg-9'); // Newest first
  });
});

// =========================================================================
// TIER 3 & TIER 4: Cross-Feature Integration & Real-World Application Scenarios
// =========================================================================
describe('Tier 3 & Tier 4: Cross-Feature Collaboration Scenarios', () => {
  it('Scenario 1: Full Support Escalation Workflow', () => {
    // 1. Shared inbox created with RBAC
    const inboxMgr = new SharedInboxManager();
    inboxMgr.createInbox('inbox-support', 'mailops.dev', 'Support', 'user-owner');
    inboxMgr.addMember('user-owner', 'inbox-support', 'user-alex', 'member');
    inboxMgr.addMember('user-owner', 'inbox-support', 'user-sarah', 'admin');

    // 2. Email assigned & delegated
    const asgnMgr = new AssignmentManager();
    const asgn = asgnMgr.assign({
      id: 'asgn-1',
      emailId: 'ticket-900',
      assignedToUserId: 'user-alex',
      assignedByUserId: 'user-sarah',
      note: 'Escalated from tier 1',
    });
    assert.strictEqual(asgn.status, 'in_progress');

    // 3. Internal note posted with mention
    const notesMgr = new InternalNotesManager();
    const note = notesMgr.addNote({
      id: 'note-1',
      emailId: 'ticket-900',
      userId: 'user-alex',
      authorName: 'Alex',
      content: 'Investigated invoice. @sarah can you approve credit note?',
    });

    const notifs = createMentionNotifications(
      note.content,
      { authorUserId: 'user-alex', authorName: 'Alex', entityType: 'note', entityId: note.id },
      [
        { id: 'user-alex', username: 'alex', email: 'alex@mailops.dev' },
        { id: 'user-sarah', username: 'sarah', email: 'sarah@mailops.dev' },
      ]
    );
    assert.strictEqual(notifs.length, 1);
    assert.strictEqual(notifs[0].userId, 'user-sarah');

    // 4. Collision prevention during drafting
    const presMgr = new PresenceManager();
    presMgr.heartbeat({ emailId: 'ticket-900', userId: 'user-alex', userName: 'Alex', action: 'drafting' });
    const collision = presMgr.checkCollision('ticket-900', 'user-sarah');
    assert.strictEqual(collision.hasCollision, true);

    // 5. Audit log trail
    const auditMgr = new AuditLogManager();
    auditMgr.log({ id: '1', userId: 'user-sarah', action: 'assignment_created', targetEntity: 'email', targetId: 'ticket-900' });
    auditMgr.log({ id: '2', userId: 'user-alex', action: 'note_added', targetEntity: 'email', targetId: 'ticket-900' });
    assert.strictEqual(auditMgr.verifyChain().isValid, true);
  });

  it('Scenario 2: Collaborative Enterprise Deal & Public Snapshot Sharing', () => {
    // 1. CRM contact and deals established
    const crmMgr = new CRMContactManager();
    crmMgr.upsertContact('client@acme.com', { name: 'Acme VP', stage: 'opportunity' });
    crmMgr.addDeal('client@acme.com', { title: 'Enterprise Plan', value: 120000, currency: 'USD', stage: 'negotiation' });

    // 2. Draft lock and 3-way merge
    const draftMgr = new DraftsManager();
    const draft = draftMgr.create({
      id: 'd-1',
      authorUserId: 'user-alex',
      subject: 'Acme Enterprise Proposal',
      body: 'Clause 1: 99.9% uptime\nClause 2: Support SLA 4hr',
    });

    draftMgr.lock('d-1', 'user-alex');
    draftMgr.update('d-1', 1, {
      body: 'Clause 1: 99.99% uptime\nClause 2: Support SLA 1hr',
      editorUserId: 'user-alex',
    });
    draftMgr.setReview('d-1', 'approved', 'user-sarah');

    // 3. Shareable expiring public snapshot
    const shareMgr = new ShareLinkManager();
    const link = shareMgr.create('thread-acme', { expiresInMs: 3600000, password: 'acmePassword2026' });

    const access = shareMgr.access(link.token, 'acmePassword2026');
    assert.strictEqual(access.canAccess, true);

    const snapshot = sanitizeThreadForShare('thread-acme', [
      {
        id: 'msg-1',
        fromAddr: 'client@acme.com',
        toAddr: 'sales@mailops.dev',
        subject: 'Acme Enterprise Proposal',
        textBody: 'Please send draft SLA.',
        createdAt: new Date(),
      },
    ]);
    assert.strictEqual(snapshot.messages.length, 1);
    assert.strictEqual(snapshot.messages[0].subject, 'Acme Enterprise Proposal');
  });
});
