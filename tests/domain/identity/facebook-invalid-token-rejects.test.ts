import { describe, expect, it, vi } from "vitest";
import { FacebookIdentityProvider } from "../../../src/domain/identity/index.js";

describe("FacebookIdentityProvider.verifyToken with an invalid token", () => {
  it("rejects when the Graph API returns an error", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: "Invalid OAuth access token." } }), { status: 400 })
    ) as unknown as typeof fetch;

    const provider = new FacebookIdentityProvider({ fetchImpl });

    await expect(provider.verifyToken("bad-token")).rejects.toThrow("Invalid OAuth access token.");
  });
});
