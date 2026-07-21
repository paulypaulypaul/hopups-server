import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync session touching", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("resets the session's inactivity window on every call", async () => {
    const site = await createSite();
    const app = await buildSyncTestApp();

    const first = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });
    const sessionId = first.json().sessionId;

    const before = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
    await new Promise((resolve) => setTimeout(resolve, 20));

    await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });

    const after = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
    expect(after.lastActiveAt.getTime()).toBeGreaterThan(before.lastActiveAt.getTime());
    await app.close();
  });
});
