import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { resetDb } from "../../helpers/db.js";
import { buildAdminTestApp, getAdminToken } from "../../helpers/adminApp.js";

describe("Admin analytics endpoints without siteId", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 400 for events and rollups when siteId is omitted", async () => {
    const app = await buildAdminTestApp();
    const token = await getAdminToken(app);

    const eventsResponse = await app.inject({
      method: "GET",
      url: "/api/admin/analytics/events",
      headers: { authorization: `Bearer ${token}` }
    });
    const rollupsResponse = await app.inject({
      method: "GET",
      url: "/api/admin/analytics/rollups",
      headers: { authorization: `Bearer ${token}` }
    });

    expect(eventsResponse.statusCode).toBe(400);
    expect(rollupsResponse.statusCode).toBe(400);
    await app.close();
  });
});
