import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { queryRollups, recordActionShown } from "../../../src/domain/analytics/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { createHopupWithAction } from "../../helpers/analytics.js";
import { createSession } from "../../helpers/sessions.js";

describe("queryRollups default interval", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("defaults to minute when interval is not specified", async () => {
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
      shownAt: new Date("2026-01-01T10:05:20Z")
    });

    const rollups = await queryRollups({ siteId: site.id });

    expect(rollups[0].interval).toBe("minute");
    expect(rollups[0].intervalStart.toISOString()).toBe("2026-01-01T10:05:00.000Z");
  });
});
