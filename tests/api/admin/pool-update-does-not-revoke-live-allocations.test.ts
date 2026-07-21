import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("PUT /api/admin/sites/:siteId/phone-pool with a live allocation", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("does not forcibly revoke a number allocated to a live session even if removed from the pool", async () => {
    const site = await createSite();
    await addPoolNumbers(site.id, ["+1-555-0001"]);
    const visitor = await createVisitor("v1");
    const session = await createSession(visitor.id, site.id);
    const allocated = await allocateNumberForSession(site.id, session.id);

    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    await app.inject({
      method: "PUT",
      url: `/api/admin/sites/${site.id}/phone-pool`,
      headers: { authorization: `Bearer ${token}` },
      payload: { numbers: [], defaultNumber: null }
    });

    const allocation = await prisma.phoneNumberAllocation.findUnique({ where: { sessionId: session.id } });
    expect(allocation?.phoneNumber).toBe(allocated);
    await app.close();
  });
});
