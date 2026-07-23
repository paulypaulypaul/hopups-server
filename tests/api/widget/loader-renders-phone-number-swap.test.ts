import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createDom } from "../../helpers/dom.js";

describe("widget loader phoneNumberSwap rendering", () => {
  it("sets the textContent of every matching element to the sync response's phoneNumber", () => {
    const { renderPhoneNumberSwap } = loadLoaderModule();
    const { document } = createDom();
    document.body.innerHTML = '<span class="phone-number">Call us</span><span class="phone-number">or here</span>';

    renderPhoneNumberSwap(document, { selector: ".phone-number" }, "+1-555-0001");

    const spans = document.querySelectorAll(".phone-number");
    expect(spans[0].textContent).toBe("+1-555-0001");
    expect(spans[1].textContent).toBe("+1-555-0001");
  });
});
