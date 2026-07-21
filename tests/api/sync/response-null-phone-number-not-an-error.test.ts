import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync with no phone pool configured", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 200 with phoneNumber: null rather than an error", async () => {
    const site = await createSite();
    const app = await buildSyncTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().phoneNumber).toBeNull();
    await app.close();
  });
});
