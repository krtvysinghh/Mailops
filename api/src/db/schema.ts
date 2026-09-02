import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// ==========================================
// 1. Core Users & Domains
// ==========================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

export const domains = sqliteTable('domains', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  hostname: text('hostname').notNull().unique(),
  status: text('status').notNull().default('active'),
  dkimPublicKey: text('dkim_public_key'),
  dkimPrivateKey: text('dkim_private_key'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  userIdIdx: index('domains_user_id_idx').on(table.userId),
  hostnameIdx: index('domains_hostname_idx').on(table.hostname),
}));

// ==========================================
// 2. Emails & Threads (All 50-Feature Master Fields)
// ==========================================
export const emails = sqliteTable('emails', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  threadId: text('thread_id'),
  messageId: text('message_id'),
  inReplyTo: text('in_reply_to'),
  references: text('references'),
  fromAddr: text('from_addr').notNull(),
  toAddr: text('to_addr').notNull(),
  ccAddr: text('cc_addr'),
  bccAddr: text('bcc_addr'),
  replyToAddr: text('reply_to_addr'),
  subject: text('subject'),
  textBody: text('text_body'),
  htmlBody: text('html_body'),
  r2Key: text('r2_key'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
  trashed: integer('trashed', { mode: 'boolean' }).notNull().default(false),
  folderId: text('folder_id').default('inbox'),
  direction: text('direction', { enum: ['inbound', 'outbound'] }).notNull().default('inbound'),
  hasAttachments: integer('has_attachments', { mode: 'boolean' }).default(false),

  // AI & Smart Features (Features #1 - #10)
  category: text('category').default('primary'),
  priorityScore: integer('priority_score').default(0),
  isUrgent: integer('is_urgent', { mode: 'boolean' }).default(false),
  sentiment: text('sentiment').default('neutral'),
  sentimentScore: real('sentiment_score').default(0),
  urgencyScore: integer('urgency_score').default(0),
  spamScore: real('spam_score').default(0),
  isSpam: integer('is_spam', { mode: 'boolean' }).default(false),

  // Productivity & Workflows (Features #11 - #20)
  snoozedUntil: integer('snoozed_until', { mode: 'timestamp' }),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),

  // Collaboration & Multiplayer (Features #21 - #30)
  assignedTo: text('assigned_to'),
  assignmentStatus: text('assignment_status').default('unassigned'),

  // Security & Compliance (Features #31 - #40)
  isEncrypted: integer('is_encrypted', { mode: 'boolean' }).default(false),
  isConfidential: integer('is_confidential', { mode: 'boolean' }).default(false),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  passcodeHash: text('passcode_hash'),
  spfStatus: text('spf_status'),
  dkimStatus: text('dkim_status'),
  dmarcStatus: text('dmarc_status'),
  authStatus: text('auth_status'),
  dkimResult: text('dkim_result'),
  spfResult: text('spf_result'),
  dmarcResult: text('dmarc_result'),
  isPhishing: integer('is_phishing', { mode: 'boolean' }).default(false),
  phishingRiskScore: real('phishing_risk_score').default(0),
  rawHeaders: text('raw_headers'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('emails_domain_id_idx').on(table.domainId),
  threadIdIdx: index('emails_thread_id_idx').on(table.threadId),
  messageIdIdx: index('emails_message_id_idx').on(table.messageId),
  toAddrIdx: index('emails_to_addr_idx').on(table.toAddr),
  fromAddrIdx: index('emails_from_addr_idx').on(table.fromAddr),
  createdAtIdx: index('emails_created_at_idx').on(table.createdAt),
  folderIdIdx: index('emails_folder_id_idx').on(table.folderId),
  categoryIdx: index('emails_category_idx').on(table.category),
  snoozedUntilIdx: index('emails_snoozed_until_idx').on(table.snoozedUntil),
  scheduledAtIdx: index('emails_scheduled_at_idx').on(table.scheduledAt),
  assignedToIdx: index('emails_assigned_to_idx').on(table.assignedTo),
}));

// ==========================================
// 3. AI & Smart Features (Features #1 - #10)
// ==========================================
export const aiMetadata = sqliteTable('ai_metadata', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  category: text('category'),
  priorityScore: integer('priority_score'),
  sentiment: text('sentiment'),
  sentimentScore: real('sentiment_score'),
  urgencyScore: integer('urgency_score'),
  spamScore: real('spam_score'),
  confidence: real('confidence'),
  reasoning: text('reasoning'),
  processedAt: integer('processed_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('ai_metadata_email_id_idx').on(table.emailId),
}));

export const emailSummaries = sqliteTable('email_summaries', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  threadId: text('thread_id'),
  summaryText: text('summary_text').notNull(),
  tldr: text('tldr').notNull(),
  keyPointsJson: text('key_points_json'),
  wordCount: integer('word_count'),
  readingTimeSec: integer('reading_time_sec'),
  algorithm: text('algorithm').default('textrank'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('email_summaries_email_id_idx').on(table.emailId),
  threadIdIdx: index('email_summaries_thread_id_idx').on(table.threadId),
}));

export const smartReplies = sqliteTable('smart_replies', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  repliesJson: text('replies_json').notNull(),
  selectedTone: text('selected_tone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('smart_replies_email_id_idx').on(table.emailId),
}));

export const extractedTasks = sqliteTable('extracted_tasks', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  taskText: text('task_text').notNull(),
  assignee: text('assignee'),
  deadline: integer('deadline', { mode: 'timestamp' }),
  priority: text('priority').default('normal'),
  status: text('status').default('pending'), // pending, completed, cancelled
  confidence: real('confidence'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('extracted_tasks_email_id_idx').on(table.emailId),
  statusIdx: index('extracted_tasks_status_idx').on(table.status),
}));
export const tasksExtracted = extractedTasks;

export const emailSearchIndex = sqliteTable('email_search_index', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  domainId: text('domain_id').notNull(),
  subjectTokens: text('subject_tokens'),
  bodyTokens: text('body_tokens'),
  senderTokens: text('sender_tokens'),
  indexedAt: integer('indexed_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('email_search_index_email_id_idx').on(table.emailId),
  domainIdIdx: index('email_search_index_domain_id_idx').on(table.domainId),
}));
export const searchIndex = emailSearchIndex;

export const threadDecisions = sqliteTable('thread_decisions', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  emailId: text('email_id').notNull(),
  decisionText: text('decision_text').notNull(),
  decider: text('decider').notNull(),
  consensusStatus: text('consensus_status').default('agreed'),
  decidedAt: integer('decided_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  threadIdIdx: index('thread_decisions_thread_id_idx').on(table.threadId),
  emailIdIdx: index('thread_decisions_email_id_idx').on(table.emailId),
}));

export const followUpNudges = sqliteTable('follow_up_nudges', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  threadId: text('thread_id'),
  domainId: text('domain_id').notNull(),
  senderEmail: text('sender_email').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  nudgeReason: text('nudge_reason').notNull(),
  daysElapsed: integer('days_elapsed').notNull().default(0),
  status: text('status').notNull().default('active'), // active, dismissed, replied
  dueDate: integer('due_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('follow_up_nudges_domain_id_idx').on(table.domainId),
  emailIdIdx: index('follow_up_nudges_email_id_idx').on(table.emailId),
  statusIdx: index('follow_up_nudges_status_idx').on(table.status),
}));

export const draftToneHistory = sqliteTable('draft_tone_history', {
  id: text('id').primaryKey(),
  draftId: text('draft_id').notNull(),
  originalText: text('original_text').notNull(),
  transformedText: text('transformed_text').notNull(),
  targetTone: text('target_tone').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  draftIdIdx: index('draft_tone_history_draft_id_idx').on(table.draftId),
}));

export const unsubscribeLinks = sqliteTable('unsubscribe_links', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  emailId: text('email_id'),
  senderEmail: text('sender_email').notNull(),
  listId: text('list_id'),
  unsubscribeHttpsUrl: text('unsubscribe_https_url'),
  unsubscribeMailto: text('unsubscribe_mailto'),
  oneClickPostUrl: text('one_click_post_url'),
  status: text('status').notNull().default('active'), // active, unsubscribed, failed
  unsubscribedAt: integer('unsubscribed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('unsubscribe_links_domain_id_idx').on(table.domainId),
  senderEmailIdx: index('unsubscribe_links_sender_email_idx').on(table.senderEmail),
}));

// ==========================================
// 4. Productivity & Workflows (Features #11 - #20)
// ==========================================
export const scheduledEmails = sqliteTable('scheduled_emails', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  threadId: text('thread_id'),
  fromAddr: text('from_addr').notNull(),
  toAddr: text('to_addr').notNull(),
  ccAddr: text('cc_addr'),
  bccAddr: text('bcc_addr'),
  subject: text('subject').notNull(),
  textBody: text('text_body'),
  htmlBody: text('html_body'),
  sendAt: integer('send_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('pending'), // pending, sent, cancelled, failed
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('scheduled_emails_domain_id_idx').on(table.domainId),
  statusIdx: index('scheduled_emails_status_idx').on(table.status),
  sendAtIdx: index('scheduled_emails_send_at_idx').on(table.sendAt),
}));

export const undoSendBuffer = sqliteTable('undo_send_buffer', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  domainId: text('domain_id').notNull(),
  fromAddr: text('from_addr').notNull(),
  toAddr: text('to_addr').notNull(),
  emailPayloadJson: text('email_payload_json').notNull(),
  gracePeriodSeconds: integer('grace_period_seconds').notNull().default(10),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('buffered'), // buffered, dispatched, cancelled
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  tokenIdx: index('undo_send_buffer_token_idx').on(table.token),
  expiresAtIdx: index('undo_send_buffer_expires_at_idx').on(table.expiresAt),
  statusIdx: index('undo_send_buffer_status_idx').on(table.status),
}));

export const snoozeRecords = sqliteTable('snooze_records', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  threadId: text('thread_id'),
  domainId: text('domain_id').notNull(),
  userId: text('user_id'),
  snoozedUntil: integer('snoozed_until', { mode: 'timestamp' }).notNull(),
  reminderReason: text('reminder_reason'),
  status: text('status').notNull().default('snoozed'), // snoozed, restored, dismissed
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  restoredAt: integer('restored_at', { mode: 'timestamp' }),
}, (table) => ({
  emailIdIdx: index('snooze_records_email_id_idx').on(table.emailId),
  domainIdIdx: index('snooze_records_domain_id_idx').on(table.domainId),
  snoozedUntilIdx: index('snooze_records_snoozed_until_idx').on(table.snoozedUntil),
  statusIdx: index('snooze_records_status_idx').on(table.status),
}));

export const rules = sqliteTable('rules', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  name: text('name').notNull(),
  conditionField: text('condition_field').notNull(), // from, to, subject, body, score
  conditionOperator: text('condition_operator').notNull(), // contains, equals, startsWith, greaterThan, matchesRegex
  conditionValue: text('condition_value').notNull(),
  conditionTreeJson: text('condition_tree_json'),
  actionType: text('action_type').notNull(), // applyTag, moveToFolder, markRead, autoReply, webhook
  actionValue: text('action_value').notNull(),
  actionsJson: text('actions_json'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  orderPriority: integer('order_priority').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  domainIdIdx: index('rules_domain_id_idx').on(table.domainId),
  isActiveIdx: index('rules_is_active_idx').on(table.isActive),
}));
export const automationRules = rules;

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  title: text('title').notNull(),
  shortcutKey: text('shortcut_key'),
  subject: text('subject'),
  body: text('body').notNull(),
  variablesJson: text('variables_json'),
  category: text('category').default('general'),
  usageCount: integer('usage_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  domainIdIdx: index('templates_domain_id_idx').on(table.domainId),
  shortcutKeyIdx: index('templates_shortcut_key_idx').on(table.shortcutKey),
}));

export const userShortcuts = sqliteTable('user_shortcuts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  keybindingsJson: text('keybindings_json').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('user_shortcuts_user_id_idx').on(table.userId),
}));

export const threadTrees = sqliteTable('thread_trees', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  messageId: text('message_id').notNull(),
  parentMessageId: text('parent_message_id'),
  rootMessageId: text('root_message_id'),
  depth: integer('depth').notNull().default(0),
  orderIndex: integer('order_index').notNull().default(0),
  subject: text('subject'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  threadIdIdx: index('thread_trees_thread_id_idx').on(table.threadId),
  messageIdIdx: index('thread_trees_message_id_idx').on(table.messageId),
}));

export const batchOperations = sqliteTable('batch_operations', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  userId: text('user_id'),
  operationType: text('operation_type').notNull(),
  targetIdsJson: text('target_ids_json').notNull(),
  affectedCount: integer('affected_count').notNull().default(0),
  status: text('status').notNull().default('completed'), // pending, completed, failed
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
}, (table) => ({
  domainIdIdx: index('batch_operations_domain_id_idx').on(table.domainId),
  userIdIdx: index('batch_operations_user_id_idx').on(table.userId),
}));

export const outOfOffice = sqliteTable('out_of_office', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  userId: text('user_id'),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('out_of_office_domain_id_idx').on(table.domainId),
  isActiveIdx: index('out_of_office_is_active_idx').on(table.isActive),
}));
export const autoresponders = outOfOffice;
export const vacationResponders = outOfOffice;

export const autoresponderCooldowns = sqliteTable('autoresponder_cooldowns', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  responderId: text('responder_id'),
  senderEmail: text('sender_email').notNull(),
  lastSentAt: integer('last_sent_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('autoresponder_cooldowns_domain_id_idx').on(table.domainId),
  senderEmailIdx: index('autoresponder_cooldowns_sender_email_idx').on(table.senderEmail),
}));

export const offlineQueue = sqliteTable('offline_queue', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  clientMutationId: text('client_mutation_id').notNull().unique(),
  entityType: text('entity_type').notNull(), // email, draft, tag, rule, note
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(), // create, update, delete, markRead, snooze
  mutationPayloadJson: text('mutation_payload_json'),
  status: text('status').notNull().default('pending'), // pending, synced, conflict, rejected
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('offline_queue_user_id_idx').on(table.userId),
  statusIdx: index('offline_queue_status_idx').on(table.status),
}));
export const offlineSyncQueue = offlineQueue;

// ==========================================
// 5. Collaboration & Multiplayer (Features #21 - #30)
// ==========================================
export const sharedInboxes = sqliteTable('shared_inboxes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  domainId: text('domain_id').notNull(),
  emailAddress: text('email_address'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  domainIdIdx: index('shared_inboxes_domain_id_idx').on(table.domainId),
}));

export const inboxMembers = sqliteTable('inbox_members', {
  id: text('id').primaryKey(),
  inboxId: text('inbox_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'member', 'viewer'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  inboxIdIdx: index('inbox_members_inbox_id_idx').on(table.inboxId),
  userIdIdx: index('inbox_members_user_id_idx').on(table.userId),
}));

export const emailAssignments = sqliteTable('email_assignments', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  threadId: text('thread_id'),
  assignedToUserId: text('assigned_to_user_id').notNull(),
  assignedByUserId: text('assigned_by_user_id').notNull(),
  status: text('status', { enum: ['unassigned', 'in_progress', 'waiting', 'resolved'] }).notNull().default('in_progress'),
  priority: text('priority').default('normal'),
  dueAt: integer('due_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
}, (table) => ({
  emailIdIdx: index('email_assignments_email_id_idx').on(table.emailId),
  threadIdIdx: index('email_assignments_thread_id_idx').on(table.threadId),
  assignedToUserIdIdx: index('email_assignments_assigned_to_user_id_idx').on(table.assignedToUserId),
  statusIdx: index('email_assignments_status_idx').on(table.status),
}));

export const internalNotes = sqliteTable('internal_notes', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  threadId: text('thread_id'),
  userId: text('user_id').notNull(),
  authorName: text('author_name').notNull(),
  authorAvatar: text('author_avatar'),
  content: text('content').notNull(),
  isResolved: integer('is_resolved', { mode: 'boolean' }).default(false),
  resolvedByUserId: text('resolved_by_user_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  emailIdIdx: index('internal_notes_email_id_idx').on(table.emailId),
  threadIdIdx: index('internal_notes_thread_id_idx').on(table.threadId),
  userIdIdx: index('internal_notes_user_id_idx').on(table.userId),
}));
export const comments = internalNotes;

export const presence = sqliteTable('presence', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  threadId: text('thread_id'),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userAvatar: text('user_avatar'),
  action: text('action', { enum: ['viewing', 'drafting'] }).notNull(),
  lastHeartbeat: integer('last_heartbeat', { mode: 'timestamp' }).notNull(),
  clientSessionId: text('client_session_id'),
}, (table) => ({
  emailIdIdx: index('presence_email_id_idx').on(table.emailId),
  threadIdIdx: index('presence_thread_id_idx').on(table.threadId),
  userIdIdx: index('presence_user_id_idx').on(table.userId),
}));
export const userPresence = presence;

export const emailDrafts = sqliteTable('email_drafts', {
  id: text('id').primaryKey(),
  threadId: text('thread_id'),
  authorUserId: text('author_user_id').notNull(),
  lockedByUserId: text('locked_by_user_id'),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  toAddr: text('to_addr'),
  ccAddr: text('cc_addr'),
  bccAddr: text('bcc_addr'),
  subject: text('subject'),
  body: text('body'),
  reviewStatus: text('review_status', { enum: ['draft', 'in_review', 'approved'] }).default('draft'),
  version: integer('version').default(1),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  threadIdIdx: index('email_drafts_thread_id_idx').on(table.threadId),
  authorUserIdIdx: index('email_drafts_author_user_id_idx').on(table.authorUserId),
}));
export const drafts = emailDrafts;

export const draftVersions = sqliteTable('draft_versions', {
  id: text('id').primaryKey(),
  draftId: text('draft_id').notNull(),
  version: integer('version').notNull(),
  authorUserId: text('author_user_id').notNull(),
  patchJson: text('patch_json'),
  bodySnapshot: text('body_snapshot'),
  subjectSnapshot: text('subject_snapshot'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  draftIdIdx: index('draft_versions_draft_id_idx').on(table.draftId),
  versionIdx: index('draft_versions_version_idx').on(table.version),
}));

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  mentionedByUserId: text('mentioned_by_user_id'),
  entityType: text('entity_type').default('email'),
  entityId: text('entity_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  linkUrl: text('link_url'),
  type: text('type').default('mention'), // mention, assignment, reminder, security
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
}));
export const userMentions = notifications;

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  domainId: text('domain_id'),
  userId: text('user_id'),
  action: text('action').notNull(),
  targetEntity: text('target_entity').notNull(),
  targetId: text('target_id').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadataJson: text('metadata_json'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('audit_logs_domain_id_idx').on(table.domainId),
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  targetEntityIdx: index('audit_logs_target_entity_idx').on(table.targetEntity),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));
export const activityAuditLogs = auditLogs;

export const shareLinks = sqliteTable('share_links', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  token: text('token').notNull().unique(),
  passwordHash: text('password_hash'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  viewCount: integer('view_count').notNull().default(0),
  maxViews: integer('max_views'),
  createdByUserId: text('created_by_user_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  threadIdIdx: index('share_links_thread_id_idx').on(table.threadId),
  tokenIdx: index('share_links_token_idx').on(table.token),
}));
export const shareableLinks = shareLinks;

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  domainId: text('domain_id'),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3b82f6'),
  parentId: text('parent_id'),
  path: text('path'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('tags_domain_id_idx').on(table.domainId),
  parentIdIdx: index('tags_parent_id_idx').on(table.parentId),
}));

export const emailTags = sqliteTable('email_tags', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  tagId: text('tag_id').notNull(),
  addedByUserId: text('added_by_user_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
}, (table) => ({
  emailIdIdx: index('email_tags_email_id_idx').on(table.emailId),
  tagIdIdx: index('email_tags_tag_id_idx').on(table.tagId),
}));

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  domainId: text('domain_id'),
  email: text('email').notNull().unique(),
  name: text('name'),
  company: text('company'),
  jobTitle: text('job_title'),
  notes: text('notes'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  linkedinUrl: text('linkedin_url'),
  dealsJson: text('deals_json'),
  interactionCount: integer('interaction_count').notNull().default(0),
  lastContactedAt: integer('last_contacted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  domainIdIdx: index('contacts_domain_id_idx').on(table.domainId),
  emailIdx: index('contacts_email_idx').on(table.email),
}));
export const crmContacts = contacts;

// ==========================================
// 6. Security & Compliance (Features #31 - #40)
// ==========================================
export const emailSecurityMeta = sqliteTable('email_security_meta', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  spfStatus: text('spf_status'),
  spfResult: text('spf_result'),
  dkimStatus: text('dkim_status'),
  dkimResult: text('dkim_result'),
  dmarcStatus: text('dmarc_status'),
  dmarcResult: text('dmarc_result'),
  authStatus: text('auth_status'),
  rawAuthResultsHeader: text('raw_auth_results_header'),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('email_security_meta_email_id_idx').on(table.emailId),
}));

export const phishingAssessments = sqliteTable('phishing_assessments', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  riskScore: real('risk_score').notNull(),
  isPhishing: integer('is_phishing', { mode: 'boolean' }).notNull().default(false),
  punycodeDetected: integer('punycode_detected', { mode: 'boolean' }).default(false),
  mismatchedUrlsJson: text('mismatched_urls_json'),
  suspiciousKeywordsJson: text('suspicious_keywords_json'),
  flaggedAt: integer('flagged_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('phishing_assessments_email_id_idx').on(table.emailId),
}));

export const encryptionKeys = sqliteTable('encryption_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  publicKeyArmored: text('public_key_armored').notNull(),
  encryptedPrivateKey: text('encrypted_private_key').notNull(),
  keyFingerprint: text('key_fingerprint').notNull(),
  algorithm: text('algorithm').notNull().default('RSA-OAEP-256'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('encryption_keys_user_id_idx').on(table.userId),
}));

export const attachmentScans = sqliteTable('attachment_scans', {
  id: text('id').primaryKey(),
  attachmentId: text('attachment_id').notNull(),
  emailId: text('email_id').notNull(),
  filename: text('filename').notNull(),
  magicBytes: text('magic_bytes'),
  mimeDetected: text('mime_detected'),
  isQuarantined: integer('is_quarantined', { mode: 'boolean' }).notNull().default(false),
  scanResult: text('scan_result'),
  scannedAt: integer('scanned_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  attachmentIdIdx: index('attachment_scans_attachment_id_idx').on(table.attachmentId),
  emailIdIdx: index('attachment_scans_email_id_idx').on(table.emailId),
}));

export const dlpScanLogs = sqliteTable('dlp_scan_logs', {
  id: text('id').primaryKey(),
  emailId: text('email_id'),
  draftId: text('draft_id'),
  dlpRulesViolatedJson: text('dlp_rules_violated_json'),
  creditCardMatchesCount: integer('credit_card_matches_count').default(0),
  ssnMatchesCount: integer('ssn_matches_count').default(0),
  apiKeyMatchesCount: integer('api_key_matches_count').default(0),
  isBlocked: integer('is_blocked', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('dlp_scan_logs_email_id_idx').on(table.emailId),
  draftIdIdx: index('dlp_scan_logs_draft_id_idx').on(table.draftId),
}));

export const trackingPixelBlocks = sqliteTable('tracking_pixel_blocks', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  strippedPixelsCount: integer('stripped_pixels_count').notNull().default(0),
  strippedUrlsJson: text('stripped_urls_json'),
  sanitizedAt: integer('sanitized_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('tracking_pixel_blocks_email_id_idx').on(table.emailId),
}));

export const expiringMessages = sqliteTable('expiring_messages', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  encryptedPayload: text('encrypted_payload').notNull(),
  iv: text('iv').notNull(),
  salt: text('salt').notNull(),
  authTag: text('auth_tag'),
  pinHash: text('pin_hash'),
  maxViews: integer('max_views').default(1),
  viewCount: integer('view_count').default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  destroyedAt: integer('destroyed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  tokenIdx: index('expiring_messages_token_idx').on(table.token),
  expiresAtIdx: index('expiring_messages_expires_at_idx').on(table.expiresAt),
}));
export const expiringEmails = expiringMessages;

export const totpSecrets = sqliteTable('totp_secrets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  secret: text('secret').notNull(),
  backupCodesJson: text('backup_codes_json').notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(false),
  recoveryEmail: text('recovery_email'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastVerifiedAt: integer('last_verified_at', { mode: 'timestamp' }),
}, (table) => ({
  userIdIdx: index('totp_secrets_user_id_idx').on(table.userId),
}));

export const rateLimitBuckets = sqliteTable('rate_limit_buckets', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  tokens: real('tokens').notNull(),
  maxCapacity: real('max_capacity').default(60),
  refillRatePerSec: real('refill_rate_per_sec').default(1),
  lastRefill: integer('last_refill', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  keyIdx: index('rate_limit_buckets_key_idx').on(table.key),
}));
export const rateLimits = rateLimitBuckets;

export const gdprRequests = sqliteTable('gdpr_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  domainId: text('domain_id'),
  requestType: text('request_type', { enum: ['export', 'purge'] }).notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  archiveR2Key: text('archive_r2_key'),
  purgedRecordCount: integer('purged_record_count').default(0),
  requestedAt: integer('requested_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
}, (table) => ({
  userIdIdx: index('gdpr_requests_user_id_idx').on(table.userId),
  statusIdx: index('gdpr_requests_status_idx').on(table.status),
}));

// ==========================================
// 7. Customization & UX (Features #41 - #50)
// ==========================================
export const userPreferences = sqliteTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  theme: text('theme').default('light'),
  accentColor: text('accent_color').default('#2563eb'),
  layoutMode: text('layout_mode').default('split-3pane'),
  density: text('density').default('normal'),
  keyboardShortcutsJson: text('keyboard_shortcuts_json'),
  soundEnabled: integer('sound_enabled', { mode: 'boolean' }).default(true),
  soundTheme: text('sound_theme').default('classic'),
  soundVolume: real('sound_volume').default(0.5),
  quietHoursStart: text('quiet_hours_start'), // e.g. "22:00"
  quietHoursEnd: text('quiet_hours_end'),     // e.g. "08:00"
  quietHoursTimezone: text('quiet_hours_timezone').default('UTC'),
  customCssVariablesJson: text('custom_css_variables_json'),
  defaultComposerMode: text('default_composer_mode').default('markdown'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('user_preferences_user_id_idx').on(table.userId),
}));

export const customFolders = sqliteTable('custom_folders', {
  id: text('id').primaryKey(),
  domainId: text('domain_id'),
  userId: text('user_id'),
  name: text('name').notNull(),
  parentId: text('parent_id'),
  icon: text('icon').default('folder'),
  color: text('color'),
  orderPriority: integer('order_priority').default(0),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('custom_folders_domain_id_idx').on(table.domainId),
  parentIdIdx: index('custom_folders_parent_id_idx').on(table.parentId),
}));
export const folders = customFolders;

export const emailAttachments = sqliteTable('email_attachments', {
  id: text('id').primaryKey(),
  emailId: text('email_id').notNull(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  r2Key: text('r2_key').notNull(),
  extractedText: text('extracted_text'),
  searchVectorJson: text('search_vector_json'),
  quarantineStatus: text('quarantine_status').default('clean'), // clean, quarantined
  mimeVerified: integer('mime_verified', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdIdx: index('email_attachments_email_id_idx').on(table.emailId),
  contentTypeIdx: index('email_attachments_content_type_idx').on(table.contentType),
}));
export const attachments = emailAttachments;
export const attachmentIndex = emailAttachments;

export const signatures = sqliteTable('signatures', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  userId: text('user_id'),
  aliasId: text('alias_id'),
  name: text('name').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  domainIdIdx: index('signatures_domain_id_idx').on(table.domainId),
  userIdIdx: index('signatures_user_id_idx').on(table.userId),
}));
export const customSignatures = signatures;

export const aliases = sqliteTable('aliases', {
  id: text('id').primaryKey(),
  domainId: text('domain_id').notNull(),
  userId: text('user_id'),
  aliasName: text('alias_name').notNull(), // e.g. "support" -> support@domain.com
  aliasEmail: text('alias_email'),
  forwardToEmail: text('forward_to_email'),
  targetFolderId: text('target_folder_id'),
  autoTagId: text('auto_tag_id'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  domainIdIdx: index('aliases_domain_id_idx').on(table.domainId),
  aliasNameIdx: index('aliases_alias_name_idx').on(table.aliasName),
}));
export const userAliases = aliases;

export const soundSettings = sqliteTable('sound_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  volume: real('volume').notNull().default(0.5),
  theme: text('theme').notNull().default('classic'),
  eventSoundsJson: text('event_sounds_json'),
  muteInQuietHours: integer('mute_in_quiet_hours', { mode: 'boolean' }).default(true),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('sound_settings_user_id_idx').on(table.userId),
}));

export const dndSettings = sqliteTable('dnd_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  dndEnabled: integer('dnd_enabled', { mode: 'boolean' }).notNull().default(false),
  dndUntil: integer('dnd_until', { mode: 'timestamp' }),
  quietHoursStart: text('quiet_hours_start'),
  quietHoursEnd: text('quiet_hours_end'),
  timezone: text('timezone').default('UTC'),
  allowVipBypass: integer('allow_vip_bypass', { mode: 'boolean' }).default(true),
  badgeFeedsJson: text('badge_feeds_json'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('dnd_settings_user_id_idx').on(table.userId),
}));

export const exportJobs = sqliteTable('export_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  emailId: text('email_id'),
  threadId: text('thread_id'),
  format: text('format', { enum: ['eml', 'pdf', 'json', 'zip'] }).notNull(),
  status: text('status', { enum: ['pending', 'ready', 'failed'] }).notNull().default('ready'),
  r2Key: text('r2_key'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdIdx: index('export_jobs_user_id_idx').on(table.userId),
  statusIdx: index('export_jobs_status_idx').on(table.status),
}));

// ==========================================
// 8. Inferred TypeScript Types
// ==========================================
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
export type Domain = InferSelectModel<typeof domains>;
export type InsertDomain = InferInsertModel<typeof domains>;
export type Email = InferSelectModel<typeof emails>;
export type InsertEmail = InferInsertModel<typeof emails>;
export type AiMetadata = InferSelectModel<typeof aiMetadata>;
export type InsertAiMetadata = InferInsertModel<typeof aiMetadata>;
export type EmailSummary = InferSelectModel<typeof emailSummaries>;
export type InsertEmailSummary = InferInsertModel<typeof emailSummaries>;
export type SmartReply = InferSelectModel<typeof smartReplies>;
export type InsertSmartReply = InferInsertModel<typeof smartReplies>;
export type ExtractedTask = InferSelectModel<typeof extractedTasks>;
export type InsertExtractedTask = InferInsertModel<typeof extractedTasks>;
export type EmailSearchIndex = InferSelectModel<typeof emailSearchIndex>;
export type InsertEmailSearchIndex = InferInsertModel<typeof emailSearchIndex>;
export type ThreadDecision = InferSelectModel<typeof threadDecisions>;
export type InsertThreadDecision = InferInsertModel<typeof threadDecisions>;
export type FollowUpNudge = InferSelectModel<typeof followUpNudges>;
export type InsertFollowUpNudge = InferInsertModel<typeof followUpNudges>;
export type DraftToneHistory = InferSelectModel<typeof draftToneHistory>;
export type InsertDraftToneHistory = InferInsertModel<typeof draftToneHistory>;
export type UnsubscribeLink = InferSelectModel<typeof unsubscribeLinks>;
export type InsertUnsubscribeLink = InferInsertModel<typeof unsubscribeLinks>;
export type ScheduledEmail = InferSelectModel<typeof scheduledEmails>;
export type InsertScheduledEmail = InferInsertModel<typeof scheduledEmails>;
export type UndoSendBuffer = InferSelectModel<typeof undoSendBuffer>;
export type InsertUndoSendBuffer = InferInsertModel<typeof undoSendBuffer>;
export type SnoozeRecord = InferSelectModel<typeof snoozeRecords>;
export type InsertSnoozeRecord = InferInsertModel<typeof snoozeRecords>;
export type Rule = InferSelectModel<typeof rules>;
export type InsertRule = InferInsertModel<typeof rules>;
export type Template = InferSelectModel<typeof templates>;
export type InsertTemplate = InferInsertModel<typeof templates>;
export type UserShortcut = InferSelectModel<typeof userShortcuts>;
export type InsertUserShortcut = InferInsertModel<typeof userShortcuts>;
export type ThreadTree = InferSelectModel<typeof threadTrees>;
export type InsertThreadTree = InferInsertModel<typeof threadTrees>;
export type BatchOperation = InferSelectModel<typeof batchOperations>;
export type InsertBatchOperation = InferInsertModel<typeof batchOperations>;
export type OutOfOffice = InferSelectModel<typeof outOfOffice>;
export type InsertOutOfOffice = InferInsertModel<typeof outOfOffice>;
export type AutoresponderCooldown = InferSelectModel<typeof autoresponderCooldowns>;
export type InsertAutoresponderCooldown = InferInsertModel<typeof autoresponderCooldowns>;
export type OfflineQueue = InferSelectModel<typeof offlineQueue>;
export type InsertOfflineQueue = InferInsertModel<typeof offlineQueue>;
export type SharedInbox = InferSelectModel<typeof sharedInboxes>;
export type InsertSharedInbox = InferInsertModel<typeof sharedInboxes>;
export type InboxMember = InferSelectModel<typeof inboxMembers>;
export type InsertInboxMember = InferInsertModel<typeof inboxMembers>;
export type EmailAssignment = InferSelectModel<typeof emailAssignments>;
export type InsertEmailAssignment = InferInsertModel<typeof emailAssignments>;
export type InternalNote = InferSelectModel<typeof internalNotes>;
export type InsertInternalNote = InferInsertModel<typeof internalNotes>;
export type Presence = InferSelectModel<typeof presence>;
export type InsertPresence = InferInsertModel<typeof presence>;
export type EmailDraft = InferSelectModel<typeof emailDrafts>;
export type InsertEmailDraft = InferInsertModel<typeof emailDrafts>;
export type DraftVersion = InferSelectModel<typeof draftVersions>;
export type InsertDraftVersion = InferInsertModel<typeof draftVersions>;
export type Notification = InferSelectModel<typeof notifications>;
export type InsertNotification = InferInsertModel<typeof notifications>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type InsertAuditLog = InferInsertModel<typeof auditLogs>;
export type ShareLink = InferSelectModel<typeof shareLinks>;
export type InsertShareLink = InferInsertModel<typeof shareLinks>;
export type Tag = InferSelectModel<typeof tags>;
export type InsertTag = InferInsertModel<typeof tags>;
export type EmailTag = InferSelectModel<typeof emailTags>;
export type InsertEmailTag = InferInsertModel<typeof emailTags>;
export type Contact = InferSelectModel<typeof contacts>;
export type InsertContact = InferInsertModel<typeof contacts>;
export type EmailSecurityMeta = InferSelectModel<typeof emailSecurityMeta>;
export type InsertEmailSecurityMeta = InferInsertModel<typeof emailSecurityMeta>;
export type PhishingAssessment = InferSelectModel<typeof phishingAssessments>;
export type InsertPhishingAssessment = InferInsertModel<typeof phishingAssessments>;
export type EncryptionKey = InferSelectModel<typeof encryptionKeys>;
export type InsertEncryptionKey = InferInsertModel<typeof encryptionKeys>;
export type AttachmentScan = InferSelectModel<typeof attachmentScans>;
export type InsertAttachmentScan = InferInsertModel<typeof attachmentScans>;
export type DlpScanLog = InferSelectModel<typeof dlpScanLogs>;
export type InsertDlpScanLog = InferInsertModel<typeof dlpScanLogs>;
export type TrackingPixelBlock = InferSelectModel<typeof trackingPixelBlocks>;
export type InsertTrackingPixelBlock = InferInsertModel<typeof trackingPixelBlocks>;
export type ExpiringMessage = InferSelectModel<typeof expiringMessages>;
export type InsertExpiringMessage = InferInsertModel<typeof expiringMessages>;
export type TotpSecret = InferSelectModel<typeof totpSecrets>;
export type InsertTotpSecret = InferInsertModel<typeof totpSecrets>;
export type RateLimitBucket = InferSelectModel<typeof rateLimitBuckets>;
export type InsertRateLimitBucket = InferInsertModel<typeof rateLimitBuckets>;
export type GdprRequest = InferSelectModel<typeof gdprRequests>;
export type InsertGdprRequest = InferInsertModel<typeof gdprRequests>;
export type UserPreference = InferSelectModel<typeof userPreferences>;
export type InsertUserPreference = InferInsertModel<typeof userPreferences>;
export type CustomFolder = InferSelectModel<typeof customFolders>;
export type InsertCustomFolder = InferInsertModel<typeof customFolders>;
export type EmailAttachment = InferSelectModel<typeof emailAttachments>;
export type InsertEmailAttachment = InferInsertModel<typeof emailAttachments>;
export type Signature = InferSelectModel<typeof signatures>;
export type InsertSignature = InferInsertModel<typeof signatures>;
export type Alias = InferSelectModel<typeof aliases>;
export type InsertAlias = InferInsertModel<typeof aliases>;
export type SoundSetting = InferSelectModel<typeof soundSettings>;
export type InsertSoundSetting = InferInsertModel<typeof soundSettings>;
export type DndSetting = InferSelectModel<typeof dndSettings>;
export type InsertDndSetting = InferInsertModel<typeof dndSettings>;
export type ExportJob = InferSelectModel<typeof exportJobs>;
export type InsertExportJob = InferInsertModel<typeof exportJobs>;
