import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { findOrCreateVisitor } from "../../../src/domain/visitors/index.js";
import { resetDb } from "../../helpers/db.js";

describe("findOrCreateVisitor", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a new visitor with id === externalId when no match exists", async () => {
    const visitor = await findOrCreateVisitor("brand-new-visitor");
    expect(visitor.id).toBe("brand-new-visitor");

    const inDb = await prisma.visitor.findUnique({ where: { id: "brand-new-visitor" } });
    expect(inDb).not.toBeNull();
  });
});
