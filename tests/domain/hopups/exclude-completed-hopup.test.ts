import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { selectMatchingHopups } from "../../../src/domain/hopups/index.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";

const context = { page: { path: "/" }, visit: { count: 1 }, session: { inactivityMinutes: 0 }, query: {}, clientVars: {} };

describe("selectMatchingHopups completed exclusion", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("excludes a hopup once its shown count reaches the default repeatAllowance of 1", async () => {
    const site = await createSite();
    const hopup = await createHopup({
      siteId: site.id,
      actions: [{ type: "banner", payload: { message: "hi" } }]
    });

    const matched = await selectMatchingHopups(site.id, context, {
      completedActionIds: [hopup.actions[0].id]
    });

    expect(matched).toEqual([]);
  });
});
