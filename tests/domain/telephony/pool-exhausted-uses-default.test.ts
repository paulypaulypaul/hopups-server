import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";

describe("allocateNumberForSession pool exhaustion", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("falls back to the site's default number when the pool is fully allocated", async () => {
    const site = await createSite({ defaultNumber: "+1-555-9999" });
    await addPoolNumbers(site.id, ["+1-555-0001"]);
    const visitor = await createVisitor("v1");

    const sessionA = await createSession(visitor.id, site.id);
    const numberA = await allocateNumberForSession(site.id, sessionA.id);
    expect(numberA).toBe("+1-555-0001");

    const visitorB = await createVisitor("v2");
    const sessionB = await createSession(visitorB.id, site.id);
    const numberB = await allocateNumberForSession(site.id, sessionB.id);

    expect(numberB).toBe("+1-555-9999");
  });
});
