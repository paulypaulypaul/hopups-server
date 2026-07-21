import { describe, expect, it } from "vitest";
import { assertHasActions, HopupValidationError } from "../../../src/domain/hopups/index.js";

describe("assertHasActions", () => {
  it("throws when a hopup would have zero actions", () => {
    expect(() => assertHasActions(0)).toThrow(HopupValidationError);
  });

  it("does not throw when a hopup has at least one action", () => {
    expect(() => assertHasActions(1)).not.toThrow();
  });
});
