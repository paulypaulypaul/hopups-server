import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession, releaseExpiredAllocations } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";

describe("releaseExpiredAllocations with a recently active session", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("leaves the allocation untouched", async () => {
    const site = await createSite();
    await addPoolNumbers(site.id, ["+1-555-0001"]);
    const visitor = await createVisitor("v1");
    const session = await createSession(visitor.id, site.id, new Date());
    await allocateNumberForSession(site.id, session.id);

    const releasedCount = await releaseExpiredAllocations(new Date());

    expect(releasedCount).toBe(0);
    const allocation = await prisma.phoneNumberAllocation.findUnique({ where: { sessionId: session.id } });
    expect(allocation).not.toBeNull();
  });
});
