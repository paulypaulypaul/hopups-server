import { describe, expect, it } from "vitest";
import { pickAction } from "../../../src/domain/hopups/index.js";
import type { Hopup } from "../../../src/domain/hopups/index.js";

describe("pickAction with a single action", () => {
  it("returns that action directly", () => {
    const hopup: Hopup = {
      id: "h1",
      siteId: "s1",
      active: true,
      conditions: [],
      repeatAllowance: 1,
      actions: [{ id: "a1", hopupId: "h1", type: "banner", payload: {} }]
    };

    expect(pickAction(hopup).id).toBe("a1");
  });
});
