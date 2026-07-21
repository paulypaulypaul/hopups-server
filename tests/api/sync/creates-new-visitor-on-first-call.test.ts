import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync visitor creation", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a new visitor on the first call with a given visitorId", async () => {
    const site = await createSite();
    const app = await buildSyncTestApp();

    await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "brand-new", siteId: site.id, events: [] }
    });

    const visitor = await prisma.visitor.findUnique({ where: { id: "brand-new" } });
    expect(visitor).not.toBeNull();
    await app.close();
  });
});
