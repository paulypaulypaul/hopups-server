import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync with no matching hopup", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns an empty actions array rather than an error", async () => {
    const site = await createSite();
    await createHopup({
      siteId: site.id,
      conditions: [{ signal: "page.path", operator: "eq", value: "/never-matches" }],
      actions: [{ type: "banner", payload: { message: "hi" } }]
    });
    const app = await buildSyncTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().actions).toEqual([]);
    await app.close();
  });
});
