import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("POST /api/admin/hopups/:hopupId/actions", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 400 when the payload doesn't match the declared type's schema", async () => {
    const site = await createSite();
    const hopup = await createHopup({ siteId: site.id, actions: [{ type: "banner", payload: { message: "hi" } }] });
    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const response = await app.inject({
      method: "POST",
      url: `/api/admin/hopups/${hopup.id}/actions`,
      headers: { authorization: `Bearer ${token}` },
      payload: { type: "modal", payload: { title: "missing body" } }
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
