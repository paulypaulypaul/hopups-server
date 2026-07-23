import { describe, expect, it } from "vitest";
import { validateActionPayload } from "../../../src/domain/hopups/index.js";

describe("sidebar payload validation", () => {
  it("accepts a valid sidebar payload", () => {
    expect(() =>
      validateActionPayload("sidebar", { position: "right", title: "Hi", message: "Check this out", ctaLabel: "Go", ctaUrl: "/go" })
    ).not.toThrow();
  });

  it("rejects a payload missing the required message field", () => {
    expect(() => validateActionPayload("sidebar", { position: "left" })).toThrow();
  });

  it("rejects a payload with an invalid position value", () => {
    expect(() => validateActionPayload("sidebar", { position: "top", message: "Hi" })).toThrow();
  });
});
