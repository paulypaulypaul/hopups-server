import { describe, expect, it } from "vitest";
import { evaluateHopupConditions } from "../../../src/domain/rules/index.js";
import { makeContext } from "./helpers.js";

describe("evaluateHopupConditions with no conditions", () => {
  it("matches everyone", () => {
    expect(evaluateHopupConditions([], makeContext())).toBe(true);
  });
});
