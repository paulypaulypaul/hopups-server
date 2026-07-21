import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { resetDb } from "../../helpers/db.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("GET /api/admin/sites/:id", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 404 for an unknown site", async () => {
    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/sites/does-not-exist",
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});
