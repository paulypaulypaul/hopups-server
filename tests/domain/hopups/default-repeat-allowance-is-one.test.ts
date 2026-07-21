import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { createSite, resetDb } from "../../helpers/db.js";
import { createHopup } from "../../helpers/hopups.js";

describe("hopup repeatAllowance default", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("defaults to 1 when not explicitly set", async () => {
    const site = await createSite();
    const hopup = await prisma.hopup.create({
      data: {
        siteId: site.id,
        actions: { create: [{ type: "banner", payload: { message: "hi" } }] }
      }
    });

    expect(hopup.repeatAllowance).toBe(1);
  });
});
