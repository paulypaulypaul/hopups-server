import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync completed action tracking", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("marks completedActionIds from the request on the session", async () => {
    const site = await createSite();
    const app = await buildSyncTestApp();

    const first = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });
    const sessionId = first.json().sessionId;

    await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [], completedActionIds: ["action-1"] }
    });

    const session = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
    expect(session.completedActionIds).toContain("action-1");
    await app.close();
  });
});
