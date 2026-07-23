import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createDom } from "../../helpers/dom.js";

describe("widget loader sidebar rendering", () => {
  it("appends a closable panel docked to the given position with title/message and an optional CTA", () => {
    const { renderSidebar } = loadLoaderModule();
    const { document } = createDom();

    renderSidebar(document, { position: "left", title: "Deals", message: "20% off today", ctaLabel: "Shop", ctaUrl: "/shop" });

    const panel = document.querySelector(".hopups-sidebar");
    expect(panel).not.toBeNull();
    expect(panel!.classList.contains("hopups-sidebar-left")).toBe(true);
    expect(panel!.querySelector("h3")!.textContent).toBe("Deals");
    expect(panel!.querySelector("p")!.textContent).toBe("20% off today");
    expect(panel!.querySelector("a")!.getAttribute("href")).toBe("/shop");

    const closeButton = panel!.querySelector("button")!;
    closeButton.dispatchEvent(new document.defaultView!.MouseEvent("click"));
    expect(document.querySelector(".hopups-sidebar")).toBeNull();
  });

  it("defaults to docking right when position is not 'left'", () => {
    const { renderSidebar } = loadLoaderModule();
    const { document } = createDom();

    renderSidebar(document, { position: "right", message: "Hello" });

    const panel = document.querySelector(".hopups-sidebar")!;
    expect(panel.classList.contains("hopups-sidebar-right")).toBe(true);
  });

  it("omits the title element when payload.title is not provided", () => {
    const { renderSidebar } = loadLoaderModule();
    const { document } = createDom();

    renderSidebar(document, { position: "right", message: "No title here" });

    const panel = document.querySelector(".hopups-sidebar")!;
    expect(panel.querySelector("h3")).toBeNull();
  });
});
