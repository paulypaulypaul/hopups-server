import { describe, expect, it } from "vitest";
import { evaluateHopupConditions } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("evaluateHopupConditions", () => {
  it("returns true only when every condition matches (AND semantics)", () => {
    const context = makeContext({ page: { path: "/jackets" }, visit: { count: 3 } });

    expect(
      evaluateHopupConditions(
        [
          { signal: "page.path", operator: "eq", value: "/jackets" },
          { signal: "visit.count", operator: "gte", value: 2 }
        ],
        context
      )
    ).toBe(true);

    expect(
      evaluateHopupConditions(
        [
          { signal: "page.path", operator: "eq", value: "/jackets" },
          { signal: "visit.count", operator: "gte", value: 10 }
        ],
        context
      )
    ).toBe(false);
  });
});
