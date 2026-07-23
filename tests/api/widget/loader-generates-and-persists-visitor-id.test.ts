import { describe, expect, it } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";
import { createMemoryStorage } from "../../helpers/dom.js";

describe("widget loader visitor id generation", () => {
  it("generates a UUID and persists it in storage on first load", () => {
    const { getOrCreateVisitorId } = loadLoaderModule();
    const storage = createMemoryStorage();

    const id = getOrCreateVisitorId(storage);

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(storage.getItem("hopups_visitor_id")).toBe(id);
  });
});
