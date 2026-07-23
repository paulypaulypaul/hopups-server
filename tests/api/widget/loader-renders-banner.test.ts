import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createDom } from "../../helpers/dom.js";

describe("widget loader banner rendering", () => {
  it("appends a bar with the message and an optional CTA link to document.body", () => {
    const { renderBanner } = loadLoaderModule();
    const { document } = createDom();

    renderBanner(document, { message: "Sale ends soon!", ctaLabel: "Shop now", ctaUrl: "/sale" });

    const bar = document.querySelector(".hopups-banner");
    expect(bar).not.toBeNull();
    expect(bar!.textContent).toContain("Sale ends soon!");
    const link = bar!.querySelector("a");
    expect(link!.getAttribute("href")).toBe("/sale");
    expect(link!.textContent).toBe("Shop now");
  });
});
