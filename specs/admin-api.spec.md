---
name: Admin API
description: Single-admin JWT auth and CRUD management of sites, hopups, actions, phone pools, and analytics
targets:
  - ../src/api/admin/**/*.ts
---

# Admin API

A single global admin account (no multi-tenant accounts) manages all sites through a JWT-protected
REST API. This spec covers the HTTP surface; the underlying entities are defined in
[Hopups & Actions](./hopups-actions.spec.md), [Phone Allocation](./phone-allocation.spec.md), and
[Analytics](./analytics.spec.md).

```typescript
// POST /api/admin/login
interface LoginRequest { username: string; password: string; }
interface LoginResponse { token: string; expiresAt: string; } // JWT, 24h validity

// Sites
// GET    /api/admin/sites
// POST   /api/admin/sites
// GET    /api/admin/sites/:id
// PUT    /api/admin/sites/:id
// DELETE /api/admin/sites/:id

// Hopups
// GET    /api/admin/sites/:siteId/hopups
// POST   /api/admin/sites/:siteId/hopups
// GET    /api/admin/hopups/:id
// PUT    /api/admin/hopups/:id
// DELETE /api/admin/hopups/:id

// Actions
// GET    /api/admin/hopups/:hopupId/actions
// POST   /api/admin/hopups/:hopupId/actions
// PUT    /api/admin/actions/:id
// DELETE /api/admin/actions/:id

// Phone pool
// GET    /api/admin/sites/:siteId/phone-pool
// PUT    /api/admin/sites/:siteId/phone-pool   // { numbers: string[], defaultNumber: string | null }

// Analytics (read-only)
// GET    /api/admin/analytics/events?siteId=&hopupId=&from=&to=
// GET    /api/admin/analytics/rollups?siteId=&hopupId=&from=&to=&interval=
```

## Authentication

- `POST /api/admin/login` with correct credentials returns `200` with a JWT valid for 24 hours,
  signed with a server-configured secret.
  `[@test] ../tests/api/admin/login-success.test.ts`
- `POST /api/admin/login` with incorrect credentials returns `401` and issues no token.
  `[@test] ../tests/api/admin/login-invalid-credentials.test.ts`
- Every route under `/api/admin` except `/api/admin/login` requires `Authorization: Bearer <jwt>`;
  a missing, malformed, or expired token returns `401`.
  `[@test] ../tests/api/admin/missing-token-returns-401.test.ts`
  `[@test] ../tests/api/admin/expired-token-returns-401.test.ts`

## Sites

- `POST /api/admin/sites` creates a site and returns `201` with the created resource.
  `[@test] ../tests/api/admin/create-site.test.ts`
- `GET /api/admin/sites/:id` returns `404` for an unknown site.
  `[@test] ../tests/api/admin/get-unknown-site-404.test.ts`
- `DELETE /api/admin/sites/:id` cascades: deleting a site also deletes its hopups, actions, and
  phone pool.
  `[@test] ../tests/api/admin/delete-site-cascades.test.ts`

## Hopups & actions

- `POST /api/admin/sites/:siteId/hopups` creates a hopup scoped to that site; `conditions` and
  `repeatAllowance` are optional and default per [Hopups & Actions](./hopups-actions.spec.md).
  `[@test] ../tests/api/admin/create-hopup.test.ts`
- `POST /api/admin/hopups/:hopupId/actions` validates the payload against the schema for the given
  `type` and returns `400` on mismatch (see [Hopups & Actions](./hopups-actions.spec.md)).
  `[@test] ../tests/api/admin/create-action-invalid-payload-400.test.ts`
- `DELETE /api/admin/actions/:id` on a hopup's last remaining action is rejected with `400` — a
  hopup may not be left with zero actions.
  `[@test] ../tests/api/admin/delete-last-action-rejected.test.ts`

## Phone pool

- `PUT /api/admin/sites/:siteId/phone-pool` replaces the site's `numbers` list and `defaultNumber`.
  `[@test] ../tests/api/admin/update-phone-pool.test.ts`
- Numbers currently allocated to a live session are not forcibly revoked by a pool update; they
  remain valid until the session expires, even if removed from `numbers`.
  `[@test] ../tests/api/admin/pool-update-does-not-revoke-live-allocations.test.ts`

## Analytics

- `GET /api/admin/analytics/events` and `.../rollups` require `siteId` as a query parameter;
  omitting it returns `400`.
  `[@test] ../tests/api/admin/analytics-requires-site-id.test.ts`
- Both endpoints pass `hopupId`, `from`, `to` (and `interval` for rollups) straight through to
  `queryEvents`/`queryRollups` (see [Analytics](./analytics.spec.md)).
  `[@test] ../tests/api/admin/analytics-events-endpoint.test.ts`
  `[@test] ../tests/api/admin/analytics-rollups-endpoint.test.ts`
