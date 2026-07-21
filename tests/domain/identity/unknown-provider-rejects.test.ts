import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { linkVisitorToIdentity, UnknownProviderError } from "../../../src/domain/identity/index.js";
import { createVisitor, resetDb } from "../../helpers/db.js";

describe("linkVisitorToIdentity with an unknown provider", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects without calling any external API", async () => {
    const visitor = await createVisitor("v1");

    await expect(linkVisitorToIdentity(visitor.id, "does-not-exist", "token")).rejects.toBeInstanceOf(
      UnknownProviderError
    );
  });
});
