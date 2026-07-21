import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("DELETE /api/admin/actions/:id", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects deleting a hopup's last remaining action with 400", async () => {
    const site = await createSite();
    const hopup = await createHopup({ siteId: site.id, actions: [{ type: "banner", payload: { message: "hi" } }] });
    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const response = await app.inject({
      method: "DELETE",
      url: `/api/admin/actions/${hopup.actions[0].id}`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(400);
    const stillExists = await prisma.action.findUnique({ where: { id: hopup.actions[0].id } });
    expect(stillExists).not.toBeNull();
    await app.close();
  });
});
