import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { countPageViews, findOrCreateSession, recordEvents } from "../../../src/domain/visitors/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";

describe("countPageViews", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("counts only pageview events across all of the visitor's sessions on the site", async () => {
    const site = await createSite();
    const visitor = await createVisitor("v1");
    const session = await findOrCreateSession(visitor.id, site.id);

    await recordEvents(visitor.id, site.id, session.id, [
      { type: "pageview", path: "/a", occurredAt: new Date() },
      { type: "pageview", path: "/b", occurredAt: new Date() },
      { type: "added_to_cart", occurredAt: new Date() }
    ]);

    const count = await countPageViews(visitor.id, site.id);
    expect(count).toBe(2);
  });
});
