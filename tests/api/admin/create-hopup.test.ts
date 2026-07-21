import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("POST /api/admin/sites/:siteId/hopups", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a hopup scoped to the site with default conditions and repeatAllowance", async () => {
    const site = await createSite();
    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const response = await app.inject({
      method: "POST",
      url: `/api/admin/sites/${site.id}/hopups`,
      headers: { authorization: `Bearer ${token}` },
      payload: { actions: [{ type: "banner", payload: { message: "hi" } }] }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.siteId).toBe(site.id);
    expect(body.conditions).toEqual([]);
    expect(body.repeatAllowance).toBe(1);
    expect(body.actions).toHaveLength(1);
    await app.close();
  });
});
