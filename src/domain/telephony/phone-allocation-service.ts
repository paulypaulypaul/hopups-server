import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { SESSION_INACTIVITY_WINDOW_MINUTES } from "../visitors/types.js";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function allocateNumberForSession(siteId: string, sessionId: string): Promise<string | null> {
  const existing = await prisma.phoneNumberAllocation.findUnique({ where: { sessionId } });
  if (existing) {
    return existing.phoneNumber;
  }

  const [site, pool, activeAllocations] = await Promise.all([
    prisma.site.findUniqueOrThrow({ where: { id: siteId } }),
    prisma.phoneNumber.findMany({ where: { siteId } }),
    prisma.phoneNumberAllocation.findMany({ where: { siteId } })
  ]);

  const allocatedNumbers = new Set(activeAllocations.map((allocation) => allocation.phoneNumber));
  const candidates = pool.map((entry) => entry.number).filter((number) => !allocatedNumbers.has(number));

  for (const candidate of candidates) {
    try {
      const created = await prisma.phoneNumberAllocation.create({
        data: { siteId, sessionId, phoneNumber: candidate }
      });
      return created.phoneNumber;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  return site.defaultNumber ?? null;
}

export async function releaseExpiredAllocations(now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - SESSION_INACTIVITY_WINDOW_MINUTES * 60_000);

  const expiredSessions = await prisma.session.findMany({
    where: { lastActiveAt: { lt: cutoff } },
    select: { id: true }
  });

  if (expiredSessions.length === 0) {
    return 0;
  }

  const result = await prisma.phoneNumberAllocation.deleteMany({
    where: { sessionId: { in: expiredSessions.map((session) => session.id) } }
  });

  return result.count;
}
