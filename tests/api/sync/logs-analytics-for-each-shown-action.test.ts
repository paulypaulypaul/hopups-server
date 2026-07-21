import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";
import { buildSyncTestApp } from "../../helpers/app.js";

describe("POST /api/sync analytics logging", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("logs an ActionEvent for every action shown", async () => {
    const site = await createSite();
    await createHopup({ siteId: site.id, actions: [{ type: "banner", payload: { message: "hi" } }] });
    const app = await buildSyncTestApp();

    await app.inject({
      method: "POST",
      url: "/api/sync",
      payload: { visitorId: "v1", siteId: site.id, events: [] }
    });

    const events = await prisma.actionEvent.findMany({ where: { siteId: site.id } });
    expect(events).toHaveLength(1);
    await app.close();
  });
});
