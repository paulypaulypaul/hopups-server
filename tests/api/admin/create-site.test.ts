import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { resetDb } from "../../helpers/db.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("POST /api/admin/sites", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a site and returns 201 with the created resource", async () => {
    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/admin/sites",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Coats N Stuff" }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().name).toBe("Coats N Stuff");
    await app.close();
  });
});
