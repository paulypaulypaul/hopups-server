import { describe, expect, it } from "vitest";
import { getIdentityProvider, registerIdentityProvider } from "../../../src/domain/identity/index.js";

describe("registerIdentityProvider", () => {
  it("makes a provider available by name", () => {
    const provider = { name: "test-provider", verifyToken: async () => ({ providerUserId: "1" }) };
    registerIdentityProvider(provider);

    expect(getIdentityProvider("test-provider")).toBe(provider);
  });
});
