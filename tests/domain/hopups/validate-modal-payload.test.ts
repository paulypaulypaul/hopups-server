import { describe, expect, it } from "vitest";
import { validateActionPayload } from "../../../src/domain/hopups/index.js";

describe("modal payload validation", () => {
  it("accepts a valid modal payload", () => {
    expect(() =>
      validateActionPayload("modal", { title: "Hi", body: "Welcome", ctaLabel: "Go", ctaUrl: "/go" })
    ).not.toThrow();
  });

  it("rejects a payload missing required fields", () => {
    expect(() => validateActionPayload("modal", { title: "Hi" })).toThrow();
  });
});
