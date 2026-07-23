---
name: API Documentation
description: OpenAPI schema generation and an interactive docs UI for the sync, admin, and widget APIs
targets:
  - ../src/api/server.ts
  - ../src/api/sync/**/*.ts
  - ../src/api/admin/**/*.ts
  - ../src/api/widget/**/*.ts
---

# API Documentation

The server generates an OpenAPI 3 document directly from the Zod schemas already used for request
validation (via `fastify-type-provider-zod`), so the documentation and the actual validation logic
can never drift apart. An interactive Swagger UI is served at `GET /docs`.

```typescript
// GET /docs                  -> interactive Swagger UI (publicly accessible, no auth gate)
// GET /docs/json             -> the raw OpenAPI 3 document
```

## Schema-driven validation

- Every route that previously called `schema.safeParse(request.body)` manually is migrated to
  attach its Zod schema via Fastify's route `schema` option (using the Zod type provider), so
  Fastify performs validation and Fastify/Swagger can introspect the schema for docs generation.
  `[@test] ../tests/api/sync/reject-missing-visitor-id.test.ts`
  `[@test] ../tests/api/admin/create-action-invalid-payload-400.test.ts`
- Validation error responses keep the same shape and status codes as before this change — this is
  an internal mechanism swap, not a contract change. Existing sync/admin/widget tests continue to
  pass unmodified.

## Documentation coverage

- Every route under `/api/sync`, `/api/admin` (including `/api/admin/login`), and `/api/widget` is
  registered with a Zod-derived request schema (body/params/querystring as applicable) and appears
  in the generated OpenAPI document.
  `[@test] ../tests/api/docs/openapi-document-lists-all-routes.test.ts`
- Protected admin routes are documented with a bearer JWT security requirement, so Swagger UI's
  "Authorize" flow can be used to call them interactively.
  `[@test] ../tests/api/docs/admin-routes-require-bearer-auth-in-spec.test.ts`

## Docs endpoint

- `GET /docs` returns `200` and serves the Swagger UI HTML, without requiring authentication.
  `[@test] ../tests/api/docs/docs-ui-accessible-without-auth.test.ts`
- `GET /docs/json` returns `200` with a valid OpenAPI 3 document (`openapi: "3.0.x"` or higher).
  `[@test] ../tests/api/docs/openapi-json-is-valid.test.ts`
