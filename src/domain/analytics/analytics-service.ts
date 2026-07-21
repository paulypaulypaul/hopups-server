import { prisma } from "../../db/prisma.js";
import type { ActionEvent, RollupBucket, RollupInterval } from "./types.js";

function truncateToMinute(date: Date): Date {
  const truncated = new Date(date);
  truncated.setUTCSeconds(0, 0);
  return truncated;
}

function truncateToInterval(date: Date, interval: RollupInterval): Date {
  const truncated = truncateToMinute(date);
  if (interval === "hour" || interval === "day") {
    truncated.setUTCMinutes(0);
  }
  if (interval === "day") {
    truncated.setUTCHours(0);
  }
  return truncated;
}

export async function recordActionShown(event: Omit<ActionEvent, "id">): Promise<void> {
  await prisma.actionEvent.create({
    data: {
      siteId: event.siteId,
      hopupId: event.hopupId,
      actionId: event.actionId,
      visitorId: event.visitorId,
      sessionId: event.sessionId,
      shownAt: event.shownAt
    }
  });

  const intervalStart = truncateToMinute(event.shownAt);

  await prisma.rollupBucket.upsert({
    where: {
      siteId_hopupId_intervalStart: { siteId: event.siteId, hopupId: event.hopupId, intervalStart }
    },
    update: { count: { increment: 1 } },
    create: { siteId: event.siteId, hopupId: event.hopupId, intervalStart, count: 1 }
  });
}

export async function queryEvents(filter: {
  siteId: string;
  hopupId?: string;
  from?: Date;
  to?: Date;
}): Promise<ActionEvent[]> {
  return prisma.actionEvent.findMany({
    where: {
      siteId: filter.siteId,
      ...(filter.hopupId ? { hopupId: filter.hopupId } : {}),
      ...(filter.from || filter.to
        ? {
            shownAt: {
              ...(filter.from ? { gte: filter.from } : {}),
              ...(filter.to ? { lt: filter.to } : {})
            }
          }
        : {})
    },
    orderBy: { shownAt: "asc" }
  });
}

export async function queryRollups(filter: {
  siteId: string;
  hopupId?: string;
  from?: Date;
  to?: Date;
  interval?: RollupInterval;
}): Promise<RollupBucket[]> {
  const interval = filter.interval ?? "minute";

  const buckets = await prisma.rollupBucket.findMany({
    where: {
      siteId: filter.siteId,
      ...(filter.hopupId ? { hopupId: filter.hopupId } : {}),
      ...(filter.from || filter.to
        ? {
            intervalStart: {
              ...(filter.from ? { gte: filter.from } : {}),
              ...(filter.to ? { lt: filter.to } : {})
            }
          }
        : {})
    }
  });

  if (interval === "minute") {
    return buckets
      .map((bucket) => ({
        siteId: bucket.siteId,
        hopupId: bucket.hopupId,
        interval,
        intervalStart: bucket.intervalStart,
        count: bucket.count
      }))
      .sort((a, b) => a.intervalStart.getTime() - b.intervalStart.getTime());
  }

  const aggregated = new Map<string, RollupBucket>();
  for (const bucket of buckets) {
    const truncated = truncateToInterval(bucket.intervalStart, interval);
    const key = `${bucket.siteId}:${bucket.hopupId}:${truncated.toISOString()}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.count += bucket.count;
    } else {
      aggregated.set(key, {
        siteId: bucket.siteId,
        hopupId: bucket.hopupId,
        interval,
        intervalStart: truncated,
        count: bucket.count
      });
    }
  }

  return [...aggregated.values()].sort((a, b) => a.intervalStart.getTime() - b.intervalStart.getTime());
}
