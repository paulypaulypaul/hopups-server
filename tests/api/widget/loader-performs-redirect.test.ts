import { describe, expect, it, vi } from "vitest";
import { loadLoaderModule } from "../../helpers/loaderModule.js";

describe("widget loader redirect action", () => {
  it("sets window.location.href to payload.url after payload.delayMs", () => {
    vi.useFakeTimers();
    const { performRedirect } = loadLoaderModule();
    const win = { location: { href: "" }, setTimeout, };

    performRedirect(win, { url: "/thanks", delayMs: 500 });
    expect(win.location.href).toBe("");

    vi.advanceTimersByTime(500);
    expect(win.location.href).toBe("/thanks");

    vi.useRealTimers();
  });

  it("defaults delayMs to 0 when not provided", () => {
    vi.useFakeTimers();
    const { performRedirect } = loadLoaderModule();
    const win = { location: { href: "" }, setTimeout };

    performRedirect(win, { url: "/now" });
    vi.advanceTimersByTime(0);

    expect(win.location.href).toBe("/now");
    vi.useRealTimers();
  });
});
