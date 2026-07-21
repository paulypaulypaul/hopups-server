import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { findOrCreateSession, touchSession } from "../../../src/domain/visitors/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";

describe("touchSession", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sets lastActiveAt to the current time", async () => {
    const site = await createSite();
    const visitor = await createVisitor("v1");
    const session = await findOrCreateSession(visitor.id, site.id);

    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date(Date.now() - 20 * 60_000) }
    });

    const before = Date.now();
    const touched = await touchSession(session.id);
    const after = Date.now();

    expect(touched.lastActiveAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(touched.lastActiveAt.getTime()).toBeLessThanOrEqual(after);
  });
});
