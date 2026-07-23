import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { buildFullTestApp } from "../../helpers/fullApp.js";

describe("OpenAPI document security requirements", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("documents protected admin routes as requiring bearer auth, and login/sync/widget as public", async () => {
    const app = await buildFullTestApp();
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/docs/json" });
    const doc = response.json();

    expect(doc.paths["/api/admin/sites"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(doc.paths["/api/admin/login"].post.security ?? []).toEqual([]);
    expect(doc.paths["/api/sync"].post.security ?? []).toEqual([]);
    expect(doc.paths["/api/widget/{siteId}/config"].get.security ?? []).toEqual([]);
    await app.close();
  });
});
