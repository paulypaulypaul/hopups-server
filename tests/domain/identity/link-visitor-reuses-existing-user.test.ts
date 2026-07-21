import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { linkVisitorToIdentity, registerIdentityProvider } from "../../../src/domain/identity/index.js";
import { createVisitor, resetDb } from "../../helpers/db.js";

describe("linkVisitorToIdentity with an existing user", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("finds the existing User by (provider, providerUserId) instead of creating a duplicate", async () => {
    registerIdentityProvider({
      name: "facebook",
      verifyToken: async () => ({ providerUserId: "fb-1", displayName: "Jane" })
    });
    const visitorA = await createVisitor("v1");
    const visitorB = await createVisitor("v2");

    const first = await linkVisitorToIdentity(visitorA.id, "facebook", "token-a");
    const second = await linkVisitorToIdentity(visitorB.id, "facebook", "token-b");

    expect(second.id).toBe(first.id);
    expect(second.visitorId).toBe(visitorB.id);
    const count = await prisma.user.count();
    expect(count).toBe(1);
  });
});
