import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { findOrCreateSession, markActionsCompleted } from "../../../src/domain/visitors/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";

describe("markActionsCompleted", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("appends action ids, deduplicated across repeated calls with overlapping sets", async () => {
    const site = await createSite();
    const visitor = await createVisitor("v1");
    const session = await findOrCreateSession(visitor.id, site.id);

    await markActionsCompleted(session.id, ["action-1", "action-2"]);
    await markActionsCompleted(session.id, ["action-2", "action-3"]);

    const updated = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(new Set(updated.completedActionIds)).toEqual(new Set(["action-1", "action-2", "action-3"]));
    expect(updated.completedActionIds.length).toBe(3);
  });
});
