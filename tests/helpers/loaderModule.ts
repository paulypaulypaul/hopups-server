import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export interface LoaderModule {
  getConfigEndpoint: (siteId: string, origin: string) => string;
  getCurrentSiteId: (scriptEl: { getAttribute(name: string): string | null } | null) => string | null;
  getOrigin: (scriptEl: { src?: string } | null, win: { location: { origin: string } }) => string;
  init: (
    doc: { currentScript: unknown },
    win: { location: { origin: string }; __hopupsConfig?: unknown },
    fetchImpl: (url: string) => Promise<{ json(): Promise<unknown> }>
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
