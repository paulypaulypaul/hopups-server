import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { resetDb } from "../../helpers/db.js";
import { buildAdminTestApp } from "../../helpers/adminApp.js";

describe("POST /api/admin/login with wrong credentials", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 401 and issues no token", async () => {
    const app = await buildAdminTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/login",
      payload: { username: "wrong", password: "wrong" }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().token).toBeUndefined();
    await app.close();
  });
});
