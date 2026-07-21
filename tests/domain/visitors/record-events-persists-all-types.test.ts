import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { findOrCreateSession, recordEvents } from "../../../src/domain/visitors/index.js";
import { createSite, createVisitor, resetDb } from "../../helpers/db.js";

describe("recordEvents", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists every event regardless of type", async () => {
    const site = await createSite();
    const visitor = await createVisitor("v1");
    const session = await findOrCreateSession(visitor.id, site.id);

    await recordEvents(visitor.id, site.id, session.id, [
      { type: "pageview", path: "/jackets", occurredAt: new Date() },
      { type: "added_to_cart", payload: { sku: "abc" }, occurredAt: new Date() }
    ]);

    const events = await prisma.visitorEvent.findMany({ where: { visitorId: visitor.id } });
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.type).sort()).toEqual(["added_to_cart", "pageview"]);
  });
});
