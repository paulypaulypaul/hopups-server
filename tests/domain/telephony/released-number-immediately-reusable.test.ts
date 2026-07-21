import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession, releaseExpiredAllocations } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";

describe("released numbers are immediately reusable", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("makes a released number available to the very next allocation call", async () => {
    const site = await createSite();
    await addPoolNumbers(site.id, ["+1-555-0001"]);
    const visitorA = await createVisitor("v1");
    const staleSession = await createSession(visitorA.id, site.id, new Date(Date.now() - 31 * 60_000));
    const firstNumber = await allocateNumberForSession(site.id, staleSession.id);

    await releaseExpiredAllocations(new Date());

    const visitorB = await createVisitor("v2");
    const newSession = await createSession(visitorB.id, site.id);
    const secondNumber = await allocateNumberForSession(site.id, newSession.id);

    expect(secondNumber).toBe(firstNumber);
  });
});
