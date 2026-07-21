import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { findOrCreateSession } from "../../../src/domain/visitors/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";

describe("findOrCreateSession", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("never reuses a session across two different sites for the same visitor", async () => {
    const siteA = await createSite({ name: "Site A" });
    const siteB = await createSite({ name: "Site B" });
    const visitor = await createVisitor("v1");

    const sessionA = await findOrCreateSession(visitor.id, siteA.id);
    const sessionB = await findOrCreateSession(visitor.id, siteB.id);

    expect(sessionA.id).not.toBe(sessionB.id);
    expect(sessionA.siteId).toBe(siteA.id);
    expect(sessionB.siteId).toBe(siteB.id);
  });
});
