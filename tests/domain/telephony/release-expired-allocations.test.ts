import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession, releaseExpiredAllocations } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";

describe("releaseExpiredAllocations", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("releases allocations whose session has passed the 30-minute inactivity window", async () => {
    const site = await createSite();
    await addPoolNumbers(site.id, ["+1-555-0001"]);
    const visitor = await createVisitor("v1");
    const staleLastActive = new Date(Date.now() - 31 * 60_000);
    const session = await createSession(visitor.id, site.id, staleLastActive);
    await allocateNumberForSession(site.id, session.id);

    const releasedCount = await releaseExpiredAllocations(new Date());

    expect(releasedCount).toBe(1);
    const allocation = await prisma.phoneNumberAllocation.findUnique({ where: { sessionId: session.id } });
    expect(allocation).toBeNull();
  });
});
