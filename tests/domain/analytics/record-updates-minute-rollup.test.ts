import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { recordActionShown } from "../../../src/domain/analytics/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { createHopupWithAction } from "../../helpers/analytics.js";
import { createSession } from "../../helpers/sessions.js";

describe("recordActionShown rollup creation", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a RollupBucket with count 1 when none existed", async () => {
    const site = await createSite();
    const hopup = await createHopupWithAction(site.id);
    const visitor = await createVisitor("v1");
    const session = await createSession(visitor.id, site.id);

    await recordActionShown({
      siteId: site.id,
      hopupId: hopup.id,
      actionId: hopup.actions[0].id,
      visitorId: visitor.id,
      sessionId: session.id,
      shownAt: new Date("2026-01-01T10:15:30Z")
    });

    const buckets = await prisma.rollupBucket.findMany({ where: { siteId: site.id, hopupId: hopup.id } });
    expect(buckets).toHaveLength(1);
    expect(buckets[0].count).toBe(1);
    expect(buckets[0].intervalStart.toISOString()).toBe("2026-01-01T10:15:00.000Z");
  });
});
