import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync signal context", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("matches a hopup based on page path, query, and client vars from the request", async () => {
    const site = await createSite();
    const hopup = await createHopup({
      siteId: site.id,
      conditions: [
        { signal: "page.path", operator: "eq", value: "/jackets" },
        { signal: "query.utm_source", operator: "eq", value: "facebook" },
        { signal: "clientVar.plan", operator: "eq", value: "pro" }
      ],
      actions: [{ type: "banner", payload: { message: "hi" } }]
    });
    const app = await buildSyncTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: {
        visitorId: "v1",
        siteId: site.id,
        events: [{ type: "pageview", path: "/jackets", timestamp: new Date().toISOString() }],
        query: { utm_source: "facebook" },
        clientVars: { plan: "pro" }
      }
    });

    const body = response.json();
    expect(body.actions.map((a: { hopupId: string }) => a.hopupId)).toContain(hopup.id);
    await app.close();
  });
});
