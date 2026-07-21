import { describe, expect, it } from "vitest";
import { validateActionPayload } from "../../../src/domain/hopups/index.js";

describe("customHtml payload validation", () => {
  it("accepts a valid html payload", () => {
    expect(() => validateActionPayload("customHtml", { html: "<div>Hi</div>" })).not.toThrow();
  });

  it("rejects a payload without html", () => {
    expect(() => validateActionPayload("customHtml", {})).toThrow();
  });
});
