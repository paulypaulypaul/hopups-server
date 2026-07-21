import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";

describe("allocateNumberForSession", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("assigns a pool number not currently allocated to another live session", async () => {
    const site = await createSite();
    await addPoolNumbers(site.id, ["+1-555-0001", "+1-555-0002"]);
    const visitor = await createVisitor("v1");
    const session = await createSession(visitor.id, site.id);

    const number = await allocateNumberForSession(site.id, session.id);

    expect(["+1-555-0001", "+1-555-0002"]).toContain(number);
    const allocation = await prisma.phoneNumberAllocation.findUnique({ where: { sessionId: session.id } });
    expect(allocation?.phoneNumber).toBe(number);
  });
});
