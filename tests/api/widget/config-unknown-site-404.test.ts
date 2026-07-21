import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { resetDb } from "../../helpers/db.js";
import { buildWidgetTestApp } from "../../helpers/widgetApp.js";

describe("GET /api/widget/:siteId/config with an unknown site", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 404", async () => {
    const app = await buildWidgetTestApp();

    const response = await app.inject({ method: "GET", url: "/api/widget/does-not-exist/config" });

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});
