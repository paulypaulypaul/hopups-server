import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("PUT /api/admin/sites/:siteId/phone-pool", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("replaces the site's numbers and defaultNumber", async () => {
    const site = await createSite();
    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const response = await app.inject({
      method: "PUT",
      url: `/api/admin/sites/${site.id}/phone-pool`,
      headers: { authorization: `Bearer ${token}` },
      payload: { numbers: ["+1-555-0001", "+1-555-0002"], defaultNumber: "+1-555-9999" }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.numbers).toEqual(["+1-555-0001", "+1-555-0002"]);
    expect(body.defaultNumber).toBe("+1-555-9999");

    const site2 = await prisma.site.findUniqueOrThrow({ where: { id: site.id } });
    expect(site2.defaultNumber).toBe("+1-555-9999");
    await app.close();
  });
});
