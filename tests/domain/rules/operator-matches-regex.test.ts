import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("matches operator with a regex pattern", () => {
  it("tests the resolved signal (coerced to string) against the pattern", () => {
    const context = makeContext({ clientVars: { email: "user@example.com" } });
    expect(
      evaluateCondition({ signal: "clientVar.email", operator: "matches", value: "^user@.*\\.com$" }, context)
    ).toBe(true);
    expect(
      evaluateCondition({ signal: "clientVar.email", operator: "matches", value: "^admin@" }, context)
    ).toBe(false);
  });
});
