---
name: Widget Delivery
description: Static site-agnostic loader script and the per-site JSON config it fetches at runtime
targets:
  - ../src/api/widget/**/*.ts
  - ../public/loader.js
---

# Widget Delivery

Client sites embed one static, site-agnostic loader script. At runtime the loader reads the site
ID from its own script tag and fetches that site's config as JSON, then drives
[Sync API](./sync-api.spec.md) calls and renders matched actions.

```typescript
// GET /widget/loader.js               -> static asset, long-lived cache
// GET /api/widget/:siteId/config       -> per-site JSON config, no-cache

interface WidgetConfig {
  siteId: string;
  syncUrl: string; // absolute URL to POST /api/sync, supports multi-environment deployments
}
```

## Loader script

- `GET /widget/loader.js` serves the same file content regardless of site, with
  `Cache-Control: public, max-age=86400` (or longer) since it is site-agnostic.
  `[@test] ../tests/api/widget/loader-cache-headers.test.ts`
- The loader reads its site ID from a `data-site-id` attribute on its own `<script>` tag at
  runtime — no site ID is baked into the served file.
  `[@test] ../tests/api/widget/loader-reads-site-id-from-script-tag.test.ts`
- On load, the loader fetches `GET /api/widget/:siteId/config` using the site ID it read, then uses
  the returned `syncUrl` for subsequent sync calls rather than a hardcoded URL.
  `[@test] ../tests/api/widget/loader-fetches-config-and-uses-sync-url.test.ts`

## Config endpoint

- `GET /api/widget/:siteId/config` returns `200` with a `WidgetConfig` JSON body for a known site.
  `[@test] ../tests/api/widget/config-returns-site-config.test.ts`
- `GET /api/widget/:siteId/config` returns `404` for an unknown `siteId`.
  `[@test] ../tests/api/widget/config-unknown-site-404.test.ts`
- The config response sets `Cache-Control: no-store` (or equivalent no-cache directive) since site
  config can change between admin edits and must not be served stale.
  `[@test] ../tests/api/widget/config-no-cache-headers.test.ts`
