import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createDom } from "../../helpers/dom.js";

describe("widget loader phoneNumberSwap with a null phoneNumber", () => {
  it("does nothing when phoneNumber is null", () => {
    const { renderPhoneNumberSwap } = loadLoaderModule();
    const { document } = createDom();
    document.body.innerHTML = '<span class="phone-number">Call us</span>';

    renderPhoneNumberSwap(document, { selector: ".phone-number" }, null);

    expect(document.querySelector(".phone-number")!.textContent).toBe("Call us");
  });
});
