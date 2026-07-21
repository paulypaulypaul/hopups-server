import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { recordActionShown } from "../../../src/domain/analytics/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { createHopupWithAction } from "../../helpers/analytics.js";
import { createSession } from "../../helpers/sessions.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("GET /api/admin/analytics/rollups", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("passes siteId/hopupId/from/to/interval through to queryRollups", async () => {
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

    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const response = await app.inject({
      method: "GET",
      url: `/api/admin/analytics/rollups?siteId=${site.id}&interval=hour`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].interval).toBe("hour");
    await app.close();
  });
});
