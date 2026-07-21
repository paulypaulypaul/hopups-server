import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { selectMatchingHopups } from "../../../src/domain/hopups/index.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";

const context = { page: { path: "/" }, visit: { count: 1 }, session: { inactivityMinutes: 0 }, query: {}, clientVars: {} };

describe("selectMatchingHopups repeatAllowance", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("keeps matching a hopup shown fewer times than its repeatAllowance", async () => {
    const site = await createSite();
    const hopup = await createHopup({
      siteId: site.id,
      repeatAllowance: 2,
      actions: [
        { type: "banner", payload: { message: "hi" } },
        { type: "modal", payload: { title: "t", body: "b" } }
      ]
    });

    const matched = await selectMatchingHopups(site.id, context, {
      completedActionIds: [hopup.actions[0].id]
    });

    expect(matched.map((h) => h.id)).toEqual([hopup.id]);
  });
});
