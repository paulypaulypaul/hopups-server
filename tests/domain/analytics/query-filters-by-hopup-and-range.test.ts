import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { queryEvents, recordActionShown } from "../../../src/domain/analytics/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { createHopupWithAction } from "../../helpers/analytics.js";
import { createSession } from "../../helpers/sessions.js";

describe("queryEvents filtering", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("filters by hopupId and by [from, to) range", async () => {
    const site = await createSite();
    const hopupA = await createHopupWithAction(site.id);
    const hopupB = await createHopupWithAction(site.id);
    const visitor = await createVisitor("v1");
    const session = await createSession(visitor.id, site.id);

    await recordActionShown({
      siteId: site.id,
      hopupId: hopupA.id,
      actionId: hopupA.actions[0].id,
      visitorId: visitor.id,
      sessionId: session.id,
      shownAt: new Date("2026-01-01T10:00:00Z")
    });
    await recordActionShown({
      siteId: site.id,
      hopupId: hopupB.id,
      actionId: hopupB.actions[0].id,
      visitorId: visitor.id,
      sessionId: session.id,
      shownAt: new Date("2026-01-01T12:00:00Z")
    });

    const filteredByHopup = await queryEvents({ siteId: site.id, hopupId: hopupA.id });
    expect(filteredByHopup).toHaveLength(1);
    expect(filteredByHopup[0].hopupId).toBe(hopupA.id);

    const filteredByRange = await queryEvents({
      siteId: site.id,
      from: new Date("2026-01-01T09:00:00Z"),
      to: new Date("2026-01-01T11:00:00Z")
    });
    expect(filteredByRange).toHaveLength(1);
    expect(filteredByRange[0].hopupId).toBe(hopupA.id);
  });
});
