import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { findOrCreateVisitor } from "../../../src/domain/visitors/index.js";
import { resetDb } from "../../helpers/db.js";

describe("findOrCreateVisitor", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns the existing visitor when the id matches a known visitor", async () => {
    const created = await findOrCreateVisitor("visitor-1");
    const found = await findOrCreateVisitor("visitor-1");

    expect(found.id).toBe(created.id);
    const count = await prisma.visitor.count();
    expect(count).toBe(1);
  });
});
