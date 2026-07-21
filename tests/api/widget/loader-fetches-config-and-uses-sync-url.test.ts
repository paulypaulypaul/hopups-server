import { describe, expect, it, vi } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";

describe("widget loader config fetching", () => {
  it("fetches config using the discovered site id and stores it for later sync calls", async () => {
    const { init } = loadLoaderModule();
    const scriptEl = {
      getAttribute: (name: string) => (name === "data-site-id" ? "site-123" : null),
      src: "http://localhost:3000/widget/loader.js"
    };
    const doc = { currentScript: scriptEl };
    const win: { location: { origin: string }; __hopupsConfig?: unknown } = {
      location: { origin: "http://localhost:3000" }
    };
    const fetchImpl = vi.fn(async () => ({
      json: async () => ({ siteId: "site-123", syncUrl: "http://localhost:3000/api/sync" })
    }));

    await init(doc, win, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("http://localhost:3000/api/widget/site-123/config");
    expect((win.__hopupsConfig as { syncUrl: string }).syncUrl).toBe("http://localhost:3000/api/sync");
  });
});
