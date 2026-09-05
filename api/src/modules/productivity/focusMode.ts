export type FocusMode = 'UNREAD_ONLY' | 'STARRED_ONLY' | 'ASSIGNED_TO_ME' | 'NONE';

export interface FocusEmail {
  id: string;
  isRead: boolean;
  isStarred: boolean;
  assigneeId?: string;
}

export class FocusModeFilter {
  applyFocusFilter(emails: FocusEmail[], mode: FocusMode, currentUserId?: string): FocusEmail[] {
    switch (mode) {
      case 'UNREAD_ONLY':
        return emails.filter(e => !e.isRead);
      case 'STARRED_ONLY':
        return emails.filter(e => e.isStarred);
      case 'ASSIGNED_TO_ME':
        if (!currentUserId) return [];
        return emails.filter(e => e.assigneeId === currentUserId);
      case 'NONE':
      default:
        return emails;
    }
  }
}
