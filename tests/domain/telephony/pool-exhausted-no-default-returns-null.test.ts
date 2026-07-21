import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";

describe("allocateNumberForSession with no default configured", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns null instead of erroring when the pool is exhausted", async () => {
    const site = await createSite({ defaultNumber: null });
    await addPoolNumbers(site.id, ["+1-555-0001"]);

    const visitorA = await createVisitor("v1");
    const sessionA = await createSession(visitorA.id, site.id);
    await allocateNumberForSession(site.id, sessionA.id);

    const visitorB = await createVisitor("v2");
    const sessionB = await createSession(visitorB.id, site.id);
    const result = await allocateNumberForSession(site.id, sessionB.id);

    expect(result).toBeNull();
  });
});
