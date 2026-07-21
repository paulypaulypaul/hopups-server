import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { selectMatchingHopups } from "../../../src/domain/hopups/index.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";

const context = { page: { path: "/" }, visit: { count: 1 }, session: { inactivityMinutes: 0 }, query: {}, clientVars: {} };

describe("selectMatchingHopups", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("only considers active hopups for the given site", async () => {
    const site = await createSite();
    await createHopup({ siteId: site.id, active: false, actions: [{ type: "banner", payload: { message: "hi" } }] });
    const active = await createHopup({
      siteId: site.id,
      active: true,
      actions: [{ type: "banner", payload: { message: "hi" } }]
    });

    const matched = await selectMatchingHopups(site.id, context, { completedActionIds: [] });

    expect(matched.map((h) => h.id)).toEqual([active.id]);
  });
});
