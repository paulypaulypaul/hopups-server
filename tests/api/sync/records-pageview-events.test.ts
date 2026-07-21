import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync page-view recording", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("records pageview events against the visitor", async () => {
    const site = await createSite();
    const app = await buildSyncTestApp();

    await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: {
        visitorId: "v1",
        siteId: site.id,
        events: [{ type: "pageview", path: "/jackets", timestamp: new Date().toISOString() }]
      }
    });

    const events = await prisma.visitorEvent.findMany({ where: { visitorId: "v1", type: "pageview" } });
    expect(events).toHaveLength(1);
    expect(events[0].path).toBe("/jackets");
    await app.close();
  });
});
