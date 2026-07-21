import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("DELETE /api/admin/sites/:id", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("cascades to delete the site's hopups and actions", async () => {
    const site = await createSite();
    const hopup = await createHopup({ siteId: site.id, actions: [{ type: "banner", payload: { message: "hi" } }] });
    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const response = await app.inject({
      method: "DELETE",
      url: `/api/admin/sites/${site.id}`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(204);
    const remainingHopup = await prisma.hopup.findUnique({ where: { id: hopup.id } });
    expect(remainingHopup).toBeNull();
    await app.close();
  });
});
