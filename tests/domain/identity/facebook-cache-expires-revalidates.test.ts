import { describe, expect, it, vi } from "vitest";
import { FacebookIdentityProvider } from "../../../src/domain/identity/index.js";

describe("FacebookIdentityProvider cache expiry", () => {
  it("re-calls the Graph API once the 1-hour cache window has elapsed", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: "fb-123", name: "Jane Doe" }), { status: 200 })
    ) as unknown as typeof fetch;

    let currentTime = 1_000_000;
    const provider = new FacebookIdentityProvider({ fetchImpl, now: () => currentTime });

    await provider.verifyToken("token-a");
    currentTime += 61 * 60 * 1000; // just past the 1h window
    await provider.verifyToken("token-a");

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
