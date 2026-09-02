/**
 * Feature 27: Activity Audit Log & History Timeline
 * 
 * Provides an append-only, immutable, cryptographically hash-chained audit trail
 * for all collaboration, security, and messaging events with timeline reconstruction.
 */

import { sha256 } from './cryptoUtils';

export type AuditActionType =
  | 'email_read'
  | 'email_sent'
  | 'email_archived'
  | 'email_trashed'
  | 'email_starred'
  | 'assignment_created'
  | 'assignment_updated'
  | 'assignment_status_changed'
  | 'note_added'
  | 'note_resolved'
  | 'tag_added'
  | 'tag_removed'
  | 'draft_created'
  | 'draft_updated'
  | 'draft_approved'
  | 'share_link_created'
  | 'share_link_revoked'
  | 'member_role_changed';

export interface AuditLogRecord {
  id: string;
  userId: string | null;
  userName?: string | null;
  action: AuditActionType | string;
  targetEntity: 'email' | 'thread' | 'draft' | 'inbox' | 'tag' | 'contact' | 'share_link';
  targetId: string;
  ipAddress?: string | null;
  metadata?: Record<string, any>;
  metadataJson?: string | null;
  previousHash: string;
  entryHash: string;
  createdAt: Date;
}

export interface FormattedTimelineItem {
  id: string;
  timestamp: Date;
  actor: string;
  description: string;
  icon: string;
  action: string;
  metadata?: Record<string, any>;
}

export const GENESIS_PREV_HASH = '0'.repeat(64);

/**
 * Computes a SHA-256 hash for an audit log entry to ensure cryptographic chaining.
 */
export function computeAuditHash(entry: {
  id: string;
  previousHash: string;
  timestampMs: number;
  userId: string | null;
  action: string;
  targetEntity: string;
  targetId: string;
  metadataJson?: string | null;
}): string {
  const payload = [
    entry.previousHash,
    entry.id,
    entry.timestampMs.toString(),
    entry.userId || 'anonymous',
    entry.action,
    entry.targetEntity,
    entry.targetId,
    entry.metadataJson || '{}',
  ].join('|');

  return sha256(payload);
}

/**
 * Appends a new tamper-evident audit record to the log stream.
 */
export function createAuditLogEntry(
  params: {
    id: string;
    userId: string | null;
    userName?: string | null;
    action: AuditActionType | string;
    targetEntity: 'email' | 'thread' | 'draft' | 'inbox' | 'tag' | 'contact' | 'share_link';
    targetId: string;
    ipAddress?: string | null;
    metadata?: Record<string, any>;
    createdAt?: Date;
  },
  lastEntry?: AuditLogRecord | null
): AuditLogRecord {
  const now = params.createdAt || new Date();
  const previousHash = lastEntry ? lastEntry.entryHash : GENESIS_PREV_HASH;
  const metadataJson = params.metadata ? JSON.stringify(params.metadata) : null;

  const entryHash = computeAuditHash({
    id: params.id,
    previousHash,
    timestampMs: now.getTime(),
    userId: params.userId,
    action: params.action,
    targetEntity: params.targetEntity,
    targetId: params.targetId,
    metadataJson,
  });

  return {
    id: params.id,
    userId: params.userId,
    userName: params.userName || (params.userId ? `User (${params.userId})` : 'System'),
    action: params.action,
    targetEntity: params.targetEntity,
    targetId: params.targetId,
    ipAddress: params.ipAddress || null,
    metadata: params.metadata,
    metadataJson,
    previousHash,
    entryHash,
    createdAt: now,
  };
}

/**
 * Verifies the cryptographic integrity of the entire audit chain.
 * Returns true if untampered, or flags any corrupted record index.
 */
export function verifyAuditChain(chain: AuditLogRecord[]): {
  isValid: boolean;
  brokenIndex?: number;
  reason?: string;
} {
  if (chain.length === 0) return { isValid: true };

  let expectedPrevHash = GENESIS_PREV_HASH;

  for (let i = 0; i < chain.length; i++) {
    const entry = chain[i];

    // Check previous hash link
    if (entry.previousHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Previous hash mismatch at index ${i}: expected ${expectedPrevHash}, got ${entry.previousHash}`,
      };
    }

    // Recompute current hash
    const calculatedHash = computeAuditHash({
      id: entry.id,
      previousHash: entry.previousHash,
      timestampMs: entry.createdAt.getTime(),
      userId: entry.userId,
      action: entry.action,
      targetEntity: entry.targetEntity,
      targetId: entry.targetId,
      metadataJson: entry.metadataJson || (entry.metadata ? JSON.stringify(entry.metadata) : null),
    });

    if (calculatedHash !== entry.entryHash) {
      return {
        isValid: false,
        brokenIndex: i,
        reason: `Hash verification failure at index ${i}: calculated ${calculatedHash}, stored ${entry.entryHash}`,
      };
    }

    expectedPrevHash = entry.entryHash;
  }

  return { isValid: true };
}

/**
 * Formats raw audit log entries into human-readable timeline UI cards.
 */
export function formatAuditTimelineEntry(entry: AuditLogRecord): FormattedTimelineItem {
  const actor = entry.userName || entry.userId || 'System';
  let description = `${actor} performed ${entry.action}`;
  let icon = '📝';

  switch (entry.action) {
    case 'email_read':
      description = `${actor} viewed this thread`;
      icon = '👁️';
      break;
    case 'email_sent':
      description = `${actor} sent an email reply`;
      icon = '🚀';
      break;
    case 'assignment_created':
    case 'assignment_updated':
      description = entry.metadata?.assignedTo
        ? `${actor} assigned this thread to ${entry.metadata.assignedTo}`
        : `${actor} updated the assignment`;
      icon = '👤';
      break;
    case 'assignment_status_changed':
      description = `${actor} changed status to "${entry.metadata?.newStatus || 'unknown'}"`;
      icon = '🔄';
      break;
    case 'note_added':
      description = `${actor} added an internal note`;
      icon = '💬';
      break;
    case 'tag_added':
      description = `${actor} added tag "${entry.metadata?.tagName || 'tag'}"`;
      icon = '🏷️';
      break;
    case 'tag_removed':
      description = `${actor} removed tag "${entry.metadata?.tagName || 'tag'}"`;
      icon = '🗑️';
      break;
    case 'draft_approved':
      description = `${actor} approved collaborative draft`;
      icon = '✅';
      break;
    case 'share_link_created':
      description = `${actor} created a secure shareable link`;
      icon = '🔗';
      break;
  }

  return {
    id: entry.id,
    timestamp: entry.createdAt,
    actor,
    description,
    icon,
    action: entry.action,
    metadata: entry.metadata,
  };
}

/**
 * In-memory manager for audit logs.
 */
export class AuditLogManager {
  private entries: AuditLogRecord[] = [];

  log(params: {
    id: string;
    userId: string | null;
    userName?: string | null;
    action: AuditActionType | string;
    targetEntity: 'email' | 'thread' | 'draft' | 'inbox' | 'tag' | 'contact' | 'share_link';
    targetId: string;
    ipAddress?: string | null;
    metadata?: Record<string, any>;
  }): AuditLogRecord {
    const lastEntry = this.entries.length > 0 ? this.entries[this.entries.length - 1] : null;
    const newEntry = createAuditLogEntry(params, lastEntry);
    this.entries.push(newEntry);
    return newEntry;
  }

  getTimeline(targetId?: string, limit: number = 50): FormattedTimelineItem[] {
    let filtered = this.entries;
    if (targetId) {
      filtered = filtered.filter(e => e.targetId === targetId);
    }
    return filtered
      .slice(-limit)
      .reverse()
      .map(formatAuditTimelineEntry);
  }

  verifyChain(): { isValid: boolean; brokenIndex?: number; reason?: string } {
    return verifyAuditChain(this.entries);
  }

  getAll(): AuditLogRecord[] {
    return [...this.entries];
  }
}
