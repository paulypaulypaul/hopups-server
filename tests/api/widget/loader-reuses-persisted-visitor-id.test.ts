import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createMemoryStorage } from "../../helpers/dom.js";

describe("widget loader visitor id reuse", () => {
  it("reuses the stored visitor id on subsequent loads rather than generating a new one", () => {
    const { getOrCreateVisitorId } = loadLoaderModule();
    const storage = createMemoryStorage();

    const first = getOrCreateVisitorId(storage);
    const second = getOrCreateVisitorId(storage);

    expect(second).toBe(first);
  });
});
