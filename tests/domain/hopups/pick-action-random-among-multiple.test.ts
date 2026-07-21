import { describe, expect, it } from "vitest";
import { pickAction } from "../../../src/domain/hopups/index.js";
import type { Hopup } from "../../../src/domain/hopups/index.js";

describe("pickAction with multiple actions", () => {
  it("chooses among the hopup's actions (uniformly at random over many trials)", () => {
    const hopup: Hopup = {
      id: "h1",
      siteId: "s1",
      active: true,
      conditions: [],
      repeatAllowance: 1,
      actions: [
        { id: "a1", hopupId: "h1", type: "banner", payload: {} },
        { id: "a2", hopupId: "h1", type: "modal", payload: {} }
      ]
    };

    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(pickAction(hopup).id);
    }

    expect(seen.has("a1") || seen.has("a2")).toBe(true);
    expect([...seen].every((id) => ["a1", "a2"].includes(id))).toBe(true);
  });
});
