import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { resetDb } from "../../helpers/db.js";
import { buildAdminTestApp } from "../../helpers/adminApp.js";

describe("Admin routes without a token", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401 for a protected route with no Authorization header", async () => {
    const app = await buildAdminTestApp();

    const response = await app.inject({ method: "GET", url: "/api/admin/sites" });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
