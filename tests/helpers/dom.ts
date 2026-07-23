import { JSDOM } from "jsdom";

export function createDom(): { document: any; window: any } { // eslint-disable-line @typescript-eslint/no-explicit-any
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    url: "http://localhost/"
  });
  return { document: dom.window.document, window: dom.window };
}

export function createMemoryStorage(): { getItem(key: string): string | null; setItem(key: string, value: string): void } {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    }
  };
}
