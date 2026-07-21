import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { linkVisitorToIdentity, registerIdentityProvider } from "../../../src/domain/identity/index.js";
import { createVisitor, resetDb } from "../../helpers/db.js";

describe("linkVisitorToIdentity when verification fails", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("propagates the failure and creates no User", async () => {
    registerIdentityProvider({
      name: "facebook",
      verifyToken: async () => {
        throw new Error("invalid token");
      }
    });
    const visitor = await createVisitor("v1");

    await expect(linkVisitorToIdentity(visitor.id, "facebook", "bad-token")).rejects.toThrow("invalid token");

    const count = await prisma.user.count();
    expect(count).toBe(0);
  });
});
