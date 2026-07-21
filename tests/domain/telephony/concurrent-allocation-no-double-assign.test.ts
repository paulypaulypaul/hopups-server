import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { allocateNumberForSession } from "../../../src/domain/telephony/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";
import { addPoolNumbers, createSession } from "../../helpers/sessions.js";

describe("allocateNumberForSession concurrency", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("never assigns the same dedicated number to two different live sessions under concurrent allocation", async () => {
    const site = await createSite();
    const numbers = ["+1-555-0001", "+1-555-0002", "+1-555-0003", "+1-555-0004"];
    await addPoolNumbers(site.id, numbers);

    const sessions = await Promise.all(
      numbers.map(async (_, i) => {
        const visitor = await createVisitor(`concurrent-v${i}`);
        return createSession(visitor.id, site.id);
      })
    );

    const allocated = await Promise.all(
      sessions.map((session) => allocateNumberForSession(site.id, session.id))
    );

    expect(allocated.every((n) => n !== null)).toBe(true);
    expect(new Set(allocated).size).toBe(numbers.length);
  });
});
