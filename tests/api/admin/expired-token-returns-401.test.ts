import { afterAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { prisma } from "../../../src/db/prisma.js";
import { config } from "../../../src/config.js";
import { resetDb } from "../../helpers/db.js";
import { buildAdminTestApp } from "../../helpers/adminApp.js";

describe("Admin routes with an expired token", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401", async () => {
    const app = await buildAdminTestApp();
    const expiredToken = jwt.sign({ sub: "admin" }, config.jwtSecret, { expiresIn: -10 });

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/sites",
      headers: { authorization: `Bearer ${expiredToken}` }
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
