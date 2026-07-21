import { describe, expect, it } from "vitest";
import { validateActionPayload } from "../../../src/domain/hopups/index.js";

describe("redirect payload validation", () => {
  it("accepts a valid url payload", () => {
    expect(() => validateActionPayload("redirect", { url: "/thanks", delayMs: 500 })).not.toThrow();
  });

  it("rejects a payload without a url", () => {
    expect(() => validateActionPayload("redirect", { delayMs: 500 })).toThrow();
  });
});
