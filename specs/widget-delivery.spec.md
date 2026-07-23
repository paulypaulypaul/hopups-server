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

## Visitor identity

- On first load, the loader generates a UUID and persists it in `localStorage`; on subsequent loads
  it reuses the stored value rather than generating a new one (see
  [Sync API](./sync-api.spec.md) — `visitorId` is client-generated and must stay stable).
  `[@test] ../tests/api/widget/loader-generates-and-persists-visitor-id.test.ts`
  `[@test] ../tests/api/widget/loader-reuses-persisted-visitor-id.test.ts`

## Sync reporting

- After fetching config, the loader `POST`s to `config.syncUrl` with `visitorId`, `siteId`, and a
  single `pageview` event for the current `window.location.pathname`.
  `[@test] ../tests/api/widget/loader-posts-pageview-sync-with-visitor-and-site.test.ts`
- Reporting a visitor's own action-completion state back to the server (so a hopup with
  `repeatAllowance: 1` isn't re-shown) is out of scope for this pass — the loader only ever sends
  the initial pageview sync.

## Action rendering

The loader applies whatever `actions` come back in the sync response, dispatching by `type`:

- `phoneNumberSwap` — sets the `textContent` of every element matching `payload.selector` to the
  sync response's `phoneNumber`. Does nothing if `phoneNumber` is `null`.
  `[@test] ../tests/api/widget/loader-renders-phone-number-swap.test.ts`
  `[@test] ../tests/api/widget/loader-phone-number-swap-noop-when-number-null.test.ts`
- `banner` — appends a dismissible bar with `payload.message` (and an optional CTA link) to
  `document.body`.
  `[@test] ../tests/api/widget/loader-renders-banner.test.ts`
- `modal` — appends a closable overlay with `payload.title`/`payload.body` (and an optional CTA
  link) to `document.body`.
  `[@test] ../tests/api/widget/loader-renders-modal.test.ts`
- `customHtml` — appends a container with `payload.html` set as its `innerHTML` to `document.body`.
  `[@test] ../tests/api/widget/loader-renders-custom-html.test.ts`
- `redirect` — sets `window.location.href` to `payload.url` after `payload.delayMs` (default `0`).
  `[@test] ../tests/api/widget/loader-performs-redirect.test.ts`
- `sidebar` — appends a closable panel docked to `payload.position` (`"left"` or `"right"`) with
  `payload.title` (optional), `payload.message`, and an optional CTA link, to `document.body`.
  `[@test] ../tests/api/widget/loader-renders-sidebar.test.ts`
- An empty `actions` array renders nothing.
  `[@test] ../tests/api/widget/loader-empty-actions-renders-nothing.test.ts`

## Config endpoint

- `GET /api/widget/:siteId/config` returns `200` with a `WidgetConfig` JSON body for a known site.
  `[@test] ../tests/api/widget/config-returns-site-config.test.ts`
- `GET /api/widget/:siteId/config` returns `404` for an unknown `siteId`.
  `[@test] ../tests/api/widget/config-unknown-site-404.test.ts`
- The config response sets `Cache-Control: no-store` (or equivalent no-cache directive) since site
  config can change between admin edits and must not be served stale.
  `[@test] ../tests/api/widget/config-no-cache-headers.test.ts`
