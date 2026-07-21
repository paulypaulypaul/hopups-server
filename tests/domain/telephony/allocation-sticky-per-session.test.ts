import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";

describe("allocateNumberForSession stickiness", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns the same number on repeated calls for the same session", async () => {
    const site = await createSite();
    await addPoolNumbers(site.id, ["+1-555-0001", "+1-555-0002"]);
    const visitor = await createVisitor("v1");
    const session = await createSession(visitor.id, site.id);

    const first = await allocateNumberForSession(site.id, session.id);
    const second = await allocateNumberForSession(site.id, session.id);

    expect(second).toBe(first);
    const count = await prisma.phoneNumberAllocation.count({ where: { sessionId: session.id } });
    expect(count).toBe(1);
  });
});
