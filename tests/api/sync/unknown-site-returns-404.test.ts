import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync with an unknown site", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 404 and performs no writes", async () => {
    const app = await buildSyncTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "visitor-1", siteId: "does-not-exist", events: [] }
    });

    expect(response.statusCode).toBe(404);
    const visitorCount = await prisma.visitor.count();
    expect(visitorCount).toBe(0);
    await app.close();
  });
});
