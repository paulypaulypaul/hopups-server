import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("matches operator with a wildcard page.path pattern", () => {
  it("treats * as matching any path segment sequence", () => {
    const context = makeContext({ page: { path: "/products/jackets/long" } });
    expect(
      evaluateCondition({ signal: "page.path", operator: "matches", value: "/products/*" }, context)
    ).toBe(true);
    expect(
      evaluateCondition({ signal: "page.path", operator: "matches", value: "/checkout/*" }, context)
    ).toBe(false);
  });
});
