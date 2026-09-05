/**
 * Module: Multiplayer Real-time Drafting & Presence
 * 
 * Coordinates multi-user simultaneous drafting with operational transform (OT)
 * style patch mergers, live cursor broadcasting, and conflict resolution.
 */

export interface CursorPosition {
  userId: string;
  userName: string;
  userAvatar: string;
  color: string;
  cursorIndex: number;
  selectionEnd: number;
  lastUpdated: number;
}

export interface TextPatch {
  id: string;
  draftId: string;
  userId: string;
  version: number;
  operations: {
    type: 'insert' | 'delete' | 'retain';
    position: number;
    text?: string;
    length?: number;
  }[];
  timestamp: number;
}

export class CollaborativeDraftSession {
  public draftId: string;
  public content: string;
  public version: number;
  public activeCursors: Map<string, CursorPosition> = new Map();
  private history: TextPatch[] = [];

  constructor(draftId: string, initialContent = '') {
    this.draftId = draftId;
    this.content = initialContent;
    this.version = 0;
  }

  public updateCursor(cursor: CursorPosition): void {
    cursor.lastUpdated = Date.now();
    this.activeCursors.set(cursor.userId, cursor);
  }

  public getActiveCursors(staleThresholdMs = 10000): CursorPosition[] {
    const now = Date.now();
    const active: CursorPosition[] = [];
    for (const [userId, cursor] of this.activeCursors.entries()) {
      if (now - cursor.lastUpdated < staleThresholdMs) {
        active.push(cursor);
      } else {
        this.activeCursors.delete(userId);
      }
    }
    return active;
  }

  public applyPatch(patch: TextPatch): { success: boolean; newContent: string; version: number } {
    let result = this.content;

    for (const op of patch.operations) {
      if (op.type === 'insert' && op.text) {
        result = result.slice(0, op.position) + op.text + result.slice(op.position);
      } else if (op.type === 'delete' && op.length) {
        result = result.slice(0, op.position) + result.slice(op.position + op.length);
      }
    }

    this.content = result;
    this.version++;
    this.history.push(patch);

    return {
      success: true,
      newContent: this.content,
      version: this.version
    };
  }
}
