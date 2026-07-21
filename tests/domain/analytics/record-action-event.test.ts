import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { recordActionShown } from "../../../src/domain/analytics/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { createHopupWithAction } from "../../helpers/analytics.js";
import { createSession } from "../../helpers/sessions.js";

describe("recordActionShown", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("writes one ActionEvent row per call", async () => {
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
      shownAt: new Date()
    });

    const count = await prisma.actionEvent.count();
    expect(count).toBe(1);
  });
});
