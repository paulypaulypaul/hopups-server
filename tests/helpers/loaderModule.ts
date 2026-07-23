import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export interface LoaderModule {
  getConfigEndpoint: (siteId: string, origin: string) => string;
  getCurrentSiteId: (scriptEl: { getAttribute(name: string): string | null } | null) => string | null;
  getOrigin: (scriptEl: { src?: string } | null, win: { location: { origin: string } }) => string;
  getOrCreateVisitorId: (storage: { getItem(key: string): string | null; setItem(key: string, value: string): void }) => string;
  buildSyncPayload: (siteId: string, visitorId: string, path: string) => unknown;
  applyActions: (doc: any, win: any, syncResponse: { actions?: unknown[]; phoneNumber?: string | null }) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  renderPhoneNumberSwap: (doc: any, payload: { selector: string }, phoneNumber: string | null) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  renderBanner: (doc: any, payload: { message: string; ctaLabel?: string; ctaUrl?: string }) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  renderModal: (doc: any, payload: { title: string; body: string; ctaLabel?: string; ctaUrl?: string }) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  renderCustomHtml: (doc: any, payload: { html: string }) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  performRedirect: (win: any, payload: { url: string; delayMs?: number }) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  init: (
    doc: { currentScript: unknown },
    win: { location: { origin: string; pathname?: string }; localStorage: unknown; __hopupsConfig?: unknown },
    fetchImpl: (url: string, options?: unknown) => Promise<{ json(): Promise<unknown> }>
  ) => Promise<unknown>;
}

export function loadLoaderModule(): LoaderModule {
  const code = fs.readFileSync(path.resolve(currentDir, "../../public/loader.js"), "utf-8");
  const moduleObj = { exports: {} as LoaderModule };
  const context = { module: moduleObj, exports: moduleObj.exports, console, URL };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.module.exports;
}
