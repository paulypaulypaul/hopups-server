import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";

describe("widget loader site id extraction", () => {
  it("reads the site id from data-site-id on its own script tag", () => {
    const { getCurrentSiteId } = loadLoaderModule();
    const scriptEl = { getAttribute: (name: string) => (name === "data-site-id" ? "site-123" : null) };

    expect(getCurrentSiteId(scriptEl)).toBe("site-123");
  });

  it("returns null when there is no script tag", () => {
    const { getCurrentSiteId } = loadLoaderModule();
    expect(getCurrentSiteId(null)).toBeNull();
  });
});
