import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("query.<key> signal", () => {
  it("resolves to the named query string parameter's value", () => {
    const context = makeContext({ query: { utm_source: "facebook" } });
    expect(evaluateCondition({ signal: "query.utm_source", operator: "eq", value: "facebook" }, context)).toBe(
      true
    );
    expect(evaluateCondition({ signal: "query.utm_source", operator: "eq", value: "google" }, context)).toBe(
      false
    );
  });
});
