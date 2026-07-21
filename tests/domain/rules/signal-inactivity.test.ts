import { describe, expect, it } from "vitest";
import { evaluateCondition } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("session.inactivityMinutes signal", () => {
  it("resolves to minutes since the session's previous activity", () => {
    const context = makeContext({ session: { inactivityMinutes: 12 } });
    expect(evaluateCondition({ signal: "session.inactivityMinutes", operator: "gte", value: 10 }, context)).toBe(
      true
    );
    expect(evaluateCondition({ signal: "session.inactivityMinutes", operator: "lt", value: 10 }, context)).toBe(
      false
    );
  });
});
