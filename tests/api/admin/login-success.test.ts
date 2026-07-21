import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { config } from "../../../src/config.js";
import { resetDb } from "../../helpers/db.js";
import { buildAdminTestApp } from "../../helpers/adminApp.js";

describe("POST /api/admin/login", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 200 with a JWT valid for 24 hours on correct credentials", async () => {
    const app = await buildAdminTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/login",
      payload: { username: config.adminUsername, password: config.adminPassword }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(typeof body.token).toBe("string");
    const expiresAt = new Date(body.expiresAt).getTime();
    const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000;
    expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(5000);
    await app.close();
  });
});
