import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { buildFullTestApp } from "../../helpers/fullApp.js";

describe("OpenAPI document route coverage", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists the sync, admin, and widget routes", async () => {
    const app = await buildFullTestApp();
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/docs/json" });
    const doc = response.json();
    const paths = Object.keys(doc.paths);

    expect(paths).toContain("/api/sync");
    expect(paths).toContain("/api/admin/login");
    expect(paths).toContain("/api/admin/sites");
    expect(paths).toContain("/api/admin/sites/{siteId}/hopups");
    expect(paths).toContain("/api/admin/actions/{id}");
    expect(paths).toContain("/api/admin/sites/{siteId}/phone-pool");
    expect(paths).toContain("/api/admin/analytics/events");
    expect(paths).toContain("/api/admin/analytics/rollups");
    expect(paths).toContain("/api/widget/{siteId}/config");
    await app.close();
  });
});
