import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("page.path signal", () => {
  it("resolves to the current page path", () => {
    const context = makeContext({ page: { path: "/jackets" } });
    expect(evaluateCondition({ signal: "page.path", operator: "eq", value: "/jackets" }, context)).toBe(true);
    expect(evaluateCondition({ signal: "page.path", operator: "eq", value: "/other" }, context)).toBe(false);
  });
});
