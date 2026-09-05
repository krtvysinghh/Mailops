export interface Session {
  id: string;
  userId: string;
  metadata: any;
  expiresAt: number;
}
const sessions: Map<string, Session> = new Map();

export function createSession(userId: string, metadata: any): string {
  const id = Math.random().toString(36).substr(2, 9);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  sessions.set(id, { id, userId, metadata, expiresAt });
  return id;
}

export function listActiveSessions(userId: string): Session[] {
  const now = Date.now();
  return Array.from(sessions.values()).filter(s => s.userId === userId && s.expiresAt > now);
}

export function revokeSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function revokeAllSessions(userId: string): void {
  for (const [id, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(id);
    }
  }
}