import { describe, expect, it, vi } from "vitest";
import { FacebookIdentityProvider } from "../../../src/domain/identity/index.js";

describe("FacebookIdentityProvider.verifyToken", () => {
  it("maps the Graph API response into an ExternalIdentity", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: "fb-123", name: "Jane Doe", email: "jane@example.com" }), { status: 200 })
    ) as unknown as typeof fetch;

    const provider = new FacebookIdentityProvider({ fetchImpl });
    const identity = await provider.verifyToken("valid-token");

    expect(identity).toEqual({ providerUserId: "fb-123", displayName: "Jane Doe", email: "jane@example.com" });
  });
});
