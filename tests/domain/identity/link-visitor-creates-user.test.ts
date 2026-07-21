import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { linkVisitorToIdentity, registerIdentityProvider } from "../../../src/domain/identity/index.js";
import { createVisitor, resetDb } from "../../helpers/db.js";

describe("linkVisitorToIdentity", () => {
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a new User tied to the verified identity and the visitor", async () => {
    registerIdentityProvider({
      name: "facebook",
      verifyToken: async () => ({ providerUserId: "fb-1", displayName: "Jane", email: "jane@example.com" })
    });
    const visitor = await createVisitor("v1");

    const user = await linkVisitorToIdentity(visitor.id, "facebook", "token");

    expect(user.provider).toBe("facebook");
    expect(user.providerUserId).toBe("fb-1");
    expect(user.visitorId).toBe(visitor.id);
  });
});
