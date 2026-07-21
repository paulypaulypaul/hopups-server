import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildWidgetTestApp } from "../../helpers/widgetApp.js";

describe("GET /api/widget/:siteId/config", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 200 with site config for a known site", async () => {
    const site = await createSite();
    const app = await buildWidgetTestApp();

    const response = await app.inject({ method: "GET", url: `/api/widget/${site.id}/config` });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.siteId).toBe(site.id);
    expect(typeof body.syncUrl).toBe("string");
    await app.close();
  });
});
