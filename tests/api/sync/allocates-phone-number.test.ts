import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { addPoolNumbers } from "../../helpers/sessions.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync phone number allocation", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("allocates a phone number for the session and returns it", async () => {
    const site = await createSite();
    await addPoolNumbers(site.id, ["+1-555-0001"]);
    const app = await buildSyncTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });

    expect(response.json().phoneNumber).toBe("+1-555-0001");
    await app.close();
  });
});
