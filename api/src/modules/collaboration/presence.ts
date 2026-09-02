/**
 * Feature 24: Live Presence & Collision Detection
 * 
 * Provides ephemeral thread viewer heartbeats, composing lock indicators,
 * and collision detection to prevent duplicate team replies on the same thread.
 */

export type PresenceAction = 'viewing' | 'drafting' | 'idle';

export interface PresenceRecord {
  id: string;
  emailId: string;
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  action: PresenceAction;
  lastHeartbeat: Date;
}

export interface CollisionAlert {
  hasCollision: boolean;
  activeDraftingUsers: PresenceRecord[];
  activeViewingUsers: PresenceRecord[];
  warningMessage?: string | null;
}

export const DEFAULT_PRESENCE_TTL_MS = 30_000; // 30 seconds TTL for heartbeats

/**
 * Updates or registers a user's heartbeat in the presence state list.
 */
export function recordHeartbeat(
  currentRecords: PresenceRecord[],
  input: {
    id?: string;
    emailId: string;
    userId: string;
    userName: string;
    avatarUrl?: string | null;
    action: PresenceAction;
    timestamp?: Date;
  }
): PresenceRecord[] {
  const now = input.timestamp || new Date();
  const index = currentRecords.findIndex(
    r => r.emailId === input.emailId && r.userId === input.userId
  );

  const newRecord: PresenceRecord = {
    id: input.id || (index >= 0 ? currentRecords[index].id : `pres-${input.emailId}-${input.userId}`),
    emailId: input.emailId,
    userId: input.userId,
    userName: input.userName,
    avatarUrl: input.avatarUrl || null,
    action: input.action,
    lastHeartbeat: now,
  };

  if (index >= 0) {
    const copy = [...currentRecords];
    copy[index] = newRecord;
    return copy;
  }

  return [...currentRecords, newRecord];
}

/**
 * Filters the presence state to return only active viewers and writers within the TTL window.
 */
export function getActivePresence(
  records: PresenceRecord[],
  emailId: string,
  now: Date = new Date(),
  ttlMs: number = DEFAULT_PRESENCE_TTL_MS
): PresenceRecord[] {
  const cutoff = now.getTime() - ttlMs;
  return records.filter(
    r => r.emailId === emailId && r.lastHeartbeat.getTime() >= cutoff
  );
}

/**
 * Detects presence collisions for a given user viewing/drafting an email.
 * If another user is actively drafting a response, a collision alert is triggered.
 */
export function detectCollision(
  records: PresenceRecord[],
  emailId: string,
  currentUserId: string,
  now: Date = new Date(),
  ttlMs: number = DEFAULT_PRESENCE_TTL_MS
): CollisionAlert {
  const active = getActivePresence(records, emailId, now, ttlMs);
  const otherUsers = active.filter(r => r.userId !== currentUserId);

  const activeDrafting = otherUsers.filter(r => r.action === 'drafting');
  const activeViewing = otherUsers.filter(r => r.action === 'viewing');

  const hasCollision = activeDrafting.length > 0;
  let warningMessage: string | null = null;

  if (activeDrafting.length > 0) {
    const drafterNames = activeDrafting.map(u => u.userName).join(', ');
    warningMessage = `Collision Warning: ${drafterNames} is currently drafting a reply on this thread!`;
  } else if (activeViewing.length > 0) {
    const viewerNames = activeViewing.map(u => u.userName).join(', ');
    warningMessage = `Note: ${viewerNames} is also viewing this thread.`;
  }

  return {
    hasCollision,
    activeDraftingUsers: activeDrafting,
    activeViewingUsers: activeViewing,
    warningMessage,
  };
}

/**
 * Removes expired presence records beyond the TTL window across all threads.
 */
export function cleanExpiredPresence(
  records: PresenceRecord[],
  now: Date = new Date(),
  ttlMs: number = DEFAULT_PRESENCE_TTL_MS
): PresenceRecord[] {
  const cutoff = now.getTime() - ttlMs;
  return records.filter(r => r.lastHeartbeat.getTime() >= cutoff);
}

/**
 * In-memory manager for live presence tracking.
 */
export class PresenceManager {
  private records: PresenceRecord[] = [];
  private ttlMs: number;

  constructor(ttlMs: number = DEFAULT_PRESENCE_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  heartbeat(input: {
    id?: string;
    emailId: string;
    userId: string;
    userName: string;
    avatarUrl?: string | null;
    action: PresenceAction;
  }): PresenceRecord[] {
    this.records = cleanExpiredPresence(this.records, new Date(), this.ttlMs);
    this.records = recordHeartbeat(this.records, input);
    return this.getActive(input.emailId);
  }

  remove(emailId: string, userId: string): void {
    this.records = this.records.filter(r => !(r.emailId === emailId && r.userId === userId));
  }

  getActive(emailId: string): PresenceRecord[] {
    return getActivePresence(this.records, emailId, new Date(), this.ttlMs);
  }

  checkCollision(emailId: string, currentUserId: string): CollisionAlert {
    return detectCollision(this.records, emailId, currentUserId, new Date(), this.ttlMs);
  }
}
