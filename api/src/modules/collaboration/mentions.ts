/**
 * Feature 26: Email Mentions (`@user`) & Alerts
 * 
 * Provides pure regex mention extraction, team member mapping, and notification dispatching
 * for internal notes, comments, and collaborative draft discussions.
 */

export interface TeamMemberProfile {
  id: string;
  username: string;
  displayName?: string | null;
  email: string;
}

export interface MentionMatch {
  raw: string;
  username: string;
  index: number;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  linkUrl: string | null;
  type: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Regex to extract mentions.
 * Matches @username preceded by whitespace, start-of-line, or punctuation,
 * while avoiding email addresses (e.g. "foo@bar.com").
 */
const MENTION_REGEX = /(?:^|\s|[\(\[\{,;:])@([a-zA-Z0-9_\.\-]+)/g;

/**
 * Extracts all unique `@username` mentions and their position metadata from text.
 */
export function extractMentions(text: string): {
  mentions: string[];
  matches: MentionMatch[];
} {
  if (!text) {
    return { mentions: [], matches: [] };
  }

  const matches: MentionMatch[] = [];
  const uniqueSet = new Set<string>();

  let match: RegExpExecArray | null;
  // Reset regex index
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const rawMatch = match[0];
    const username = match[1];

    // Exclude trailing punctuation like "." or "," or "!"
    const cleanedUsername = username.replace(/[\.,;:!\?]+$/, '');
    if (!cleanedUsername) continue;

    // Calculate actual starting index of the '@' symbol
    const atOffset = rawMatch.indexOf('@');
    const actualIndex = match.index + atOffset;

    matches.push({
      raw: `@${cleanedUsername}`,
      username: cleanedUsername.toLowerCase(),
      index: actualIndex,
    });
    uniqueSet.add(cleanedUsername.toLowerCase());
  }

  return {
    mentions: Array.from(uniqueSet),
    matches,
  };
}

/**
 * Formats and processes extracted mentions into concrete user notifications.
 */
export function createMentionNotifications(
  text: string,
  context: {
    idGenerator?: () => string;
    authorUserId: string;
    authorName: string;
    entityType: 'email' | 'note' | 'draft';
    entityId: string;
    threadId?: string | null;
    snippetTitle?: string;
  },
  teamMembers: TeamMemberProfile[]
): NotificationRecord[] {
  const { mentions } = extractMentions(text);
  if (mentions.length === 0) return [];

  const notifications: NotificationRecord[] = [];
  const now = new Date();

  // Create member lookup map (by lowercase username and email prefix)
  const memberMap = new Map<string, TeamMemberProfile>();
  for (const m of teamMembers) {
    memberMap.set(m.username.toLowerCase(), m);
    const emailPrefix = m.email.split('@')[0].toLowerCase();
    if (!memberMap.has(emailPrefix)) {
      memberMap.set(emailPrefix, m);
    }
  }

  const snippet = text.length > 80 ? `${text.slice(0, 77)}...` : text;

  for (const mentionedName of mentions) {
    const targetMember = memberMap.get(mentionedName);
    // Don't notify if user is not in team or if author mentioned themselves
    if (!targetMember || targetMember.id === context.authorUserId) {
      continue;
    }

    const id = context.idGenerator
      ? context.idGenerator()
      : `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const title = `${context.authorName} mentioned you in a ${context.entityType}`;
    const message = `"${snippet}"`;
    const linkUrl = `/inbox/thread/${context.threadId || context.entityId}`;

    notifications.push({
      id,
      userId: targetMember.id,
      title,
      message,
      linkUrl,
      type: 'mention',
      isRead: false,
      metadata: {
        entityType: context.entityType,
        entityId: context.entityId,
        threadId: context.threadId,
        authorUserId: context.authorUserId,
      },
      createdAt: now,
    });
  }

  return notifications;
}

/**
 * Replaces `@user` handles with styled HTML markup for rich rendering in web UI.
 */
export function highlightMentionsInText(text: string): string {
  if (!text) return '';
  return text.replace(
    /(?:^|\s|[\(\[\{,;:])(@[a-zA-Z0-9_\.\-]+)/g,
    (match, p1) => match.replace(p1, `<span class="mention font-semibold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">${p1}</span>`)
  );
}

/**
 * In-memory manager for notifications.
 */
export class NotificationManager {
  private notifications: Map<string, NotificationRecord> = new Map();

  add(record: NotificationRecord): void {
    this.notifications.set(record.id, record);
  }

  addBatch(records: NotificationRecord[]): void {
    for (const r of records) {
      this.notifications.set(r.id, r);
    }
  }

  listForUser(userId: string, unreadOnly: boolean = false): NotificationRecord[] {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && (!unreadOnly || !n.isRead))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUnreadCount(userId: string): number {
    return this.listForUser(userId, true).length;
  }

  markAsRead(notificationId: string): NotificationRecord | undefined {
    const notif = this.notifications.get(notificationId);
    if (notif) {
      notif.isRead = true;
      return notif;
    }
    return undefined;
  }

  markAllAsRead(userId: string): void {
    for (const notif of this.notifications.values()) {
      if (notif.userId === userId) {
        notif.isRead = true;
      }
    }
  }
}
