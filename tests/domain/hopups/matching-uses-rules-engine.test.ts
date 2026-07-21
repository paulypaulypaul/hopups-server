import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { selectMatchingHopups } from "../../../src/domain/hopups/index.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";

describe("selectMatchingHopups", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("includes a hopup only when all of its conditions match the signal context", async () => {
    const site = await createSite();
    const matching = await createHopup({
      siteId: site.id,
      conditions: [{ signal: "page.path", operator: "eq", value: "/jackets" }],
      actions: [{ type: "banner", payload: { message: "hi" } }]
    });
    await createHopup({
      siteId: site.id,
      conditions: [{ signal: "page.path", operator: "eq", value: "/shoes" }],
      actions: [{ type: "banner", payload: { message: "hi" } }]
    });

    const context = {
      page: { path: "/jackets" },
      visit: { count: 1 },
      session: { inactivityMinutes: 0 },
      query: {},
      clientVars: {}
    };

    const matched = await selectMatchingHopups(site.id, context, { completedActionIds: [] });

    expect(matched.map((h) => h.id)).toEqual([matching.id]);
  });
});
