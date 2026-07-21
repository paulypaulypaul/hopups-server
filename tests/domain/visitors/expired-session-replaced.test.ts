import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { findOrCreateSession } from "../../../src/domain/visitors/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";

describe("findOrCreateSession", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a fresh session when the previous one has expired", async () => {
    const site = await createSite();
    const visitor = await createVisitor("v1");

    const original = await findOrCreateSession(visitor.id, site.id);
    await prisma.session.update({
      where: { id: original.id },
      data: {
        lastActiveAt: new Date(Date.now() - 31 * 60_000),
        completedActionIds: ["action-1"]
      }
    });

    const replacement = await findOrCreateSession(visitor.id, site.id);

    expect(replacement.id).not.toBe(original.id);
    expect(replacement.completedActionIds).toEqual([]);
  });
});
