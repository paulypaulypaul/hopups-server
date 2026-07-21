import { describe, expect, it } from "vitest";
import { validateActionPayload } from "../../../src/domain/hopups/index.js";

describe("phoneNumberSwap payload validation", () => {
  it("accepts a valid selector payload", () => {
    expect(() => validateActionPayload("phoneNumberSwap", { selector: ".phone-number" })).not.toThrow();
  });

  it("rejects a payload without a selector", () => {
    expect(() => validateActionPayload("phoneNumberSwap", {})).toThrow();
  });
});
