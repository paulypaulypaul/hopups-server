import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createDom } from "../../helpers/dom.js";

describe("widget loader with an empty actions array", () => {
  it("renders nothing into the document", () => {
    const { applyActions } = loadLoaderModule();
    const { document, window } = createDom();

    applyActions(document, window, { actions: [], phoneNumber: null });

    expect(document.body.innerHTML).toBe("");
  });
});
