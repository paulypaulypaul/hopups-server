---
name: Identity Provider Linking
description: Pluggable external-identity verification and linking an anonymous visitor to a persistent User
targets:
  - ../src/domain/identity/**/*.ts
---

# Identity Provider Linking

A visitor can link their anonymous [session](./visitor-session.spec.md) to a persistent `User` by
authenticating with an external identity provider. The linking mechanism is provider-agnostic;
Facebook is the only provider implemented for v1.

```typescript
interface ExternalIdentity {
  providerUserId: string;
  displayName?: string;
  email?: string;
}

interface IdentityProvider {
  name: string; // e.g. "facebook"
  verifyToken(token: string): Promise<ExternalIdentity>;
}

interface User {
  id: string;
  provider: string;
  providerUserId: string;
  displayName?: string;
  email?: string;
}

function registerIdentityProvider(provider: IdentityProvider): void;
function linkVisitorToIdentity(
  visitorId: string,
  providerName: string,
  token: string
): Promise<User>;
```

## Provider registry

- `registerIdentityProvider` makes a provider available to `linkVisitorToIdentity` by `name`,
  without requiring changes to `linkVisitorToIdentity` itself.
  `[@test] ../tests/domain/identity/register-provider.test.ts`
- `linkVisitorToIdentity` called with a `providerName` that has no registered provider rejects with
  an "unknown provider" error and makes no external API call.
  `[@test] ../tests/domain/identity/unknown-provider-rejects.test.ts`

## Facebook provider

- `FacebookIdentityProvider.verifyToken` calls the Facebook Graph API `me` endpoint with the given
  token and maps the response into `id → providerUserId`, `name → displayName`,
  `email → email`.
  `[@test] ../tests/domain/identity/facebook-verify-token-maps-fields.test.ts`
- An invalid or expired Facebook token causes `verifyToken` to reject; no `User` is created or
  linked.
  `[@test] ../tests/domain/identity/facebook-invalid-token-rejects.test.ts`
- A successful verification result is cached per token for up to **1 hour**; a repeat call with the
  same token within that window resolves from cache without calling the Graph API again.
  `[@test] ../tests/domain/identity/facebook-token-cached-one-hour.test.ts`
- After the 1-hour cache window elapses, the next `verifyToken` call for that token re-calls the
  Graph API.
  `[@test] ../tests/domain/identity/facebook-cache-expires-revalidates.test.ts`

## Linking

- `linkVisitorToIdentity` verifies the token via the named provider, then finds an existing `User`
  by `(provider, providerUserId)` or creates one, and associates it with `visitorId`.
  `[@test] ../tests/domain/identity/link-visitor-creates-user.test.ts`
  `[@test] ../tests/domain/identity/link-visitor-reuses-existing-user.test.ts`
- A token verification failure propagates from `linkVisitorToIdentity` without creating or linking
  any `User`.
  `[@test] ../tests/domain/identity/link-visitor-propagates-verify-failure.test.ts`
