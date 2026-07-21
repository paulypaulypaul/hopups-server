import { prisma } from "../../db/prisma.js";
import { SESSION_INACTIVITY_WINDOW_MINUTES, type Session } from "./types.js";

export function isSessionExpired(session: Session, now: Date): boolean {
  const expiresAt = new Date(session.lastActiveAt.getTime() + SESSION_INACTIVITY_WINDOW_MINUTES * 60_000);
  return now.getTime() > expiresAt.getTime();
}

export async function findOrCreateSession(visitorId: string, siteId: string): Promise<Session> {
  const latest = await prisma.session.findFirst({
    where: { visitorId, siteId },
    orderBy: { lastActiveAt: "desc" }
  });

  if (latest && !isSessionExpired(latest, new Date())) {
    return latest;
  }

  return prisma.session.create({
    data: { visitorId, siteId, completedActionIds: [] }
  });
}

export async function touchSession(sessionId: string): Promise<Session> {
  return prisma.session.update({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() }
  });
}

export async function markActionsCompleted(sessionId: string, actionIds: string[]): Promise<void> {
  if (actionIds.length === 0) {
    return;
  }

  const session = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
  const merged = Array.from(new Set([...session.completedActionIds, ...actionIds]));

  await prisma.session.update({
    where: { id: sessionId },
    data: { completedActionIds: merged }
  });
}
