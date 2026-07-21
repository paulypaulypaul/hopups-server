import { describe, expect, it } from "vitest";
import { validateActionPayload } from "../../../src/domain/hopups/index.js";

describe("banner payload validation", () => {
  it("accepts a valid banner payload", () => {
    expect(() => validateActionPayload("banner", { message: "Sale!" })).not.toThrow();
  });

  it("rejects a payload missing the message field", () => {
    expect(() => validateActionPayload("banner", { ctaLabel: "Go" })).toThrow();
  });
});
