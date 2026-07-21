import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync custom event recording", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("records custom named events with their payload", async () => {
    const site = await createSite();
    const app = await buildSyncTestApp();

    await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: {
        visitorId: "v1",
        siteId: site.id,
        events: [
          { type: "added_to_cart", payload: { sku: "abc" }, timestamp: new Date().toISOString() }
        ]
      }
    });

    const events = await prisma.visitorEvent.findMany({ where: { visitorId: "v1", type: "added_to_cart" } });
    expect(events).toHaveLength(1);
    expect(events[0].payload).toEqual({ sku: "abc" });
    await app.close();
  });
});
