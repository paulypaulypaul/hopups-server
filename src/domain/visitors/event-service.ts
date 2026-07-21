import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import type { VisitorEvent } from "./types.js";

export async function recordEvents(
  visitorId: string,
  siteId: string,
  sessionId: string,
  events: VisitorEvent[]
): Promise<void> {
  if (events.length === 0) {
    return;
  }

  await prisma.visitorEvent.createMany({
    data: events.map((event) => ({
      visitorId,
      siteId,
      sessionId,
      type: event.type,
      path: event.path,
      payload: event.payload as Prisma.InputJsonValue | undefined,
      occurredAt: event.occurredAt
    }))
  });
}

export async function countPageViews(visitorId: string, siteId: string): Promise<number> {
  return prisma.visitorEvent.count({
    where: { visitorId, siteId, type: "pageview" }
  });
}
