import { describe, expect, it } from "vitest";
import { isSessionExpired } from "../../../src/domain/visitors/index.js";
import type { Session } from "../../../src/domain/visitors/index.js";

function makeSession(lastActiveAt: Date): Session {
  return {
    id: "s1",
    visitorId: "v1",
    siteId: "site1",
    lastActiveAt,
    completedActionIds: []
  };
}

describe("isSessionExpired", () => {
  it("is false when now is within 30 minutes of lastActiveAt", () => {
    const lastActiveAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-01T00:29:59Z");
    expect(isSessionExpired(makeSession(lastActiveAt), now)).toBe(false);
  });

  it("is true when now is more than 30 minutes past lastActiveAt", () => {
    const lastActiveAt = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-01T00:30:01Z");
    expect(isSessionExpired(makeSession(lastActiveAt), now)).toBe(true);
  });
});
