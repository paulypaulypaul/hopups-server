import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync validation", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects a pageview event without a path with 400", async () => {
    const site = await createSite();
    const app = await buildSyncTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: {
        visitorId: "visitor-1",
        siteId: site.id,
        events: [{ type: "pageview", timestamp: new Date().toISOString() }]
      }
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
