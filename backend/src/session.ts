import { randomBytes } from "node:crypto";

type Session = { userId: number; expiresAt: number };

// A Map stores each login token and the user it belongs to.
const sessions = new Map<string, Session>();
const sessionLifetimeMs = 24 * 60 * 60 * 1000;

export function createSession(userId: number): string {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + sessionLifetimeMs,
  });
  return token;
}

export function getSessionUserId(token: string): number | null {
  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() >= session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  return session.userId;
}
