import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { addPoolNumbers } from "../../helpers/sessions.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync repeated calls", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("reuses the same sessionId and phoneNumber within the 30-minute window", async () => {
    const site = await createSite();
    await addPoolNumbers(site.id, ["+1-555-0001", "+1-555-0002"]);
    const app = await buildSyncTestApp();

    const first = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });

    expect(second.json().sessionId).toBe(first.json().sessionId);
    expect(second.json().phoneNumber).toBe(first.json().phoneNumber);
    await app.close();
  });
});
