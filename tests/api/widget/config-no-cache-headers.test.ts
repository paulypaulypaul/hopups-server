import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildWidgetTestApp } from "../../helpers/widgetApp.js";

describe("GET /api/widget/:siteId/config cache headers", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sets a no-cache directive since config can change between admin edits", async () => {
    const site = await createSite();
    const app = await buildWidgetTestApp();

    const response = await app.inject({ method: "GET", url: `/api/widget/${site.id}/config` });

    expect(response.headers["cache-control"]).toContain("no-store");
    await app.close();
  });
});
