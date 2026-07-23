import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createDom } from "../../helpers/dom.js";

describe("widget loader modal rendering", () => {
  it("appends a closable overlay with title/body and an optional CTA link to document.body", () => {
    const { renderModal } = loadLoaderModule();
    const { document } = createDom();

    renderModal(document, { title: "Welcome", body: "Enjoy 10% off", ctaLabel: "Claim", ctaUrl: "/claim" });

    const overlay = document.querySelector(".hopups-modal-overlay");
    expect(overlay).not.toBeNull();
    expect(overlay!.querySelector("h2")!.textContent).toBe("Welcome");
    expect(overlay!.querySelector("p")!.textContent).toBe("Enjoy 10% off");
    expect(overlay!.querySelector("a")!.getAttribute("href")).toBe("/claim");

    const closeButton = overlay!.querySelector("button")!;
    closeButton.dispatchEvent(new document.defaultView!.MouseEvent("click"));
    expect(document.querySelector(".hopups-modal-overlay")).toBeNull();
  });
});
