import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync validation", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects a request missing siteId with 400", async () => {
    const app = await buildSyncTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "visitor-1", events: [] }
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
