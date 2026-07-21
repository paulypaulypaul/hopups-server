import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { recordActionShown } from "../../../src/domain/analytics/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { createHopupWithAction } from "../../helpers/analytics.js";
import { createSession } from "../../helpers/sessions.js";

describe("recordActionShown under concurrency", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("never loses an increment when called concurrently for the same bucket", async () => {
    const site = await createSite();
    const hopup = await createHopupWithAction(site.id);
    const visitor = await createVisitor("v1");
    const session = await createSession(visitor.id, site.id);
    const shownAt = new Date("2026-01-01T10:15:00Z");

    await Promise.all(
      Array.from({ length: 10 }, () =>
        recordActionShown({
          siteId: site.id,
          hopupId: hopup.id,
          actionId: hopup.actions[0].id,
          visitorId: visitor.id,
          sessionId: session.id,
          shownAt
        })
      )
    );

    const bucket = await prisma.rollupBucket.findFirst({ where: { siteId: site.id, hopupId: hopup.id } });
    expect(bucket?.count).toBe(10);
  });
});
