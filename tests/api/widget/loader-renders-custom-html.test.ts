import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createDom } from "../../helpers/dom.js";

describe("widget loader customHtml rendering", () => {
  it("appends a container with the given html set as innerHTML", () => {
    const { renderCustomHtml } = loadLoaderModule();
    const { document } = createDom();

    renderCustomHtml(document, { html: "<strong>Hello</strong>" });

    const container = document.querySelector(".hopups-custom-html");
    expect(container).not.toBeNull();
    expect(container!.innerHTML).toBe("<strong>Hello</strong>");
  });
});
