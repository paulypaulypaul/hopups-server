import { describe, expect, it, vi } from "vitest";
import { FacebookIdentityProvider } from "../../../src/domain/identity/index.js";

describe("FacebookIdentityProvider token cache", () => {
  it("does not re-call the Graph API for a repeat call within the cache window", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: "fb-123", name: "Jane Doe" }), { status: 200 })
    ) as unknown as typeof fetch;

    let currentTime = 1_000_000;
    const provider = new FacebookIdentityProvider({ fetchImpl, now: () => currentTime });

    await provider.verifyToken("token-a");
    currentTime += 30 * 60 * 1000; // 30 minutes later, still within the 1h window
    await provider.verifyToken("token-a");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
