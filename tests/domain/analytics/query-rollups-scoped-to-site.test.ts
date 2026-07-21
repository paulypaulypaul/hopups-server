import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { queryRollups, recordActionShown } from "../../../src/domain/analytics/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { createHopupWithAction } from "../../helpers/analytics.js";
import { createSession } from "../../helpers/sessions.js";

describe("queryRollups site scoping", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("never returns data for a different site", async () => {
    const siteA = await createSite({ name: "A" });
    const siteB = await createSite({ name: "B" });
    const hopupA = await createHopupWithAction(siteA.id);
    const hopupB = await createHopupWithAction(siteB.id);
    const visitor = await createVisitor("v1");
    const sessionA = await createSession(visitor.id, siteA.id);
    const sessionB = await createSession(visitor.id, siteB.id);

    await recordActionShown({
      siteId: siteA.id,
      hopupId: hopupA.id,
      actionId: hopupA.actions[0].id,
      visitorId: visitor.id,
      sessionId: sessionA.id,
      shownAt: new Date()
    });
    await recordActionShown({
      siteId: siteB.id,
      hopupId: hopupB.id,
      actionId: hopupB.actions[0].id,
      visitorId: visitor.id,
      sessionId: sessionB.id,
      shownAt: new Date()
    });

    const rollupsForA = await queryRollups({ siteId: siteA.id });

    expect(rollupsForA).toHaveLength(1);
    expect(rollupsForA[0].siteId).toBe(siteA.id);
  });
});
