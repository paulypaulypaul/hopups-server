import { describe, expect, it, vi } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createMemoryStorage } from "../../helpers/dom.js";

describe("widget loader sync reporting", () => {
  it("POSTs to config.syncUrl with visitorId, siteId, and a pageview event for the current path", async () => {
    const { init } = loadLoaderModule();
    const scriptEl = {
      getAttribute: (name: string) => (name === "data-site-id" ? "site-123" : null),
      src: "http://localhost:3000/widget/loader.js"
    };
    const doc = { currentScript: scriptEl };
    const win = {
      location: { origin: "http://localhost:3000", pathname: "/jackets" },
      localStorage: createMemoryStorage()
    };

    const fetchImpl = vi.fn(async (url: string, _options?: unknown) => {
      if (url.includes("/config")) {
        return { json: async () => ({ siteId: "site-123", syncUrl: "http://localhost:3000/api/sync" }) };
      }
      return { json: async () => ({ visitorId: "v1", sessionId: "s1", phoneNumber: null, actions: [] }) };
    });

    await init(doc, win, fetchImpl);

    const syncCall = fetchImpl.mock.calls.find(([url]) => url === "http://localhost:3000/api/sync");
    expect(syncCall).toBeTruthy();
    const [, options] = syncCall!;
    const body = JSON.parse((options as { body: string }).body);
    expect(body.siteId).toBe("site-123");
    expect(typeof body.visitorId).toBe("string");
    expect(body.events).toEqual([{ type: "pageview", path: "/jackets", timestamp: expect.any(String) }]);
  });
});
