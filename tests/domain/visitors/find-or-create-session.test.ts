import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { findOrCreateSession } from "../../../src/domain/visitors/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";

describe("findOrCreateSession", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns the existing non-expired session instead of creating a new one", async () => {
    const site = await createSite();
    const visitor = await createVisitor("v1");

    const first = await findOrCreateSession(visitor.id, site.id);
    const second = await findOrCreateSession(visitor.id, site.id);

    expect(second.id).toBe(first.id);
    const count = await prisma.session.count();
    expect(count).toBe(1);
  });

  it("creates a new session with empty completedActionIds when none exists", async () => {
    const site = await createSite();
    const visitor = await createVisitor("v1");

    const session = await findOrCreateSession(visitor.id, site.id);

    expect(session.completedActionIds).toEqual([]);
    expect(session.visitorId).toBe(visitor.id);
    expect(session.siteId).toBe(site.id);
  });
});
