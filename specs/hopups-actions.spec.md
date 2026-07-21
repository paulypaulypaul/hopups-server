---
name: Hopups & Action Catalog
description: Hopup entity, matching selection against a session, and the typed action catalog
targets:
  - ../src/domain/hopups/**/*.ts
---

# Hopups & Action Catalog

A **hopup** is a site-scoped rule (a list of [conditions](./rules-engine.spec.md)) plus one or more
candidate **actions**. When a hopup's conditions all match a visitor's session, one of its actions
is picked and returned to the widget (see [Sync API](./sync-api.spec.md)).

```typescript
type ActionType = "modal" | "banner" | "phoneNumberSwap" | "redirect" | "customHtml";

interface ModalActionPayload {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

interface BannerActionPayload {
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

interface PhoneNumberSwapActionPayload {
  selector: string; // CSS selector(s) whose text the widget replaces with the allocated number
}

interface RedirectActionPayload {
  url: string;
  delayMs?: number;
}

interface CustomHtmlActionPayload {
  html: string;
}

type ActionPayload =
  | ModalActionPayload
  | BannerActionPayload
  | PhoneNumberSwapActionPayload
  | RedirectActionPayload
  | CustomHtmlActionPayload;

interface Action {
  id: string;
  hopupId: string;
  type: ActionType;
  payload: ActionPayload;
}

interface Hopup {
  id: string;
  siteId: string;
  active: boolean;
  conditions: Condition[];       // see rules-engine.spec.md
  repeatAllowance: number;       // max times this hopup may be shown per session; 1 = once
  actions: Action[];              // at least one
}

function selectMatchingHopups(
  siteId: string,
  context: SignalContext,
  session: Session
): Promise<Hopup[]>;

function pickAction(hopup: Hopup): Action;
```

## Action payload validation

- Each `ActionType` has its own schema; creating or updating an action with a payload that doesn't
  match its declared type's schema is rejected (see [Admin API](./admin-api.spec.md) for the HTTP
  contract).
  `[@test] ../tests/domain/hopups/validate-modal-payload.test.ts`
  `[@test] ../tests/domain/hopups/validate-banner-payload.test.ts`
  `[@test] ../tests/domain/hopups/validate-phone-swap-payload.test.ts`
  `[@test] ../tests/domain/hopups/validate-redirect-payload.test.ts`
  `[@test] ../tests/domain/hopups/validate-custom-html-payload.test.ts`
- A hopup must have at least one action; a hopup with zero actions is rejected at create/update
  time.
  `[@test] ../tests/domain/hopups/reject-hopup-without-actions.test.ts`

## Matching selection

- `selectMatchingHopups` only considers hopups where `active === true` for the given `siteId`.
  `[@test] ../tests/domain/hopups/only-active-hopups-considered.test.ts`
- A hopup is included only when `evaluateHopupConditions(hopup.conditions, context)` is `true`
  (see [Rules Engine](./rules-engine.spec.md)).
  `[@test] ../tests/domain/hopups/matching-uses-rules-engine.test.ts`
- A hopup's "times shown this session" is the count of its own action IDs present in
  `session.completedActionIds` (each distinct completed action of the hopup counts as one showing).
  A hopup is excluded once that count reaches `repeatAllowance`.
  `[@test] ../tests/domain/hopups/exclude-completed-hopup.test.ts`
  `[@test] ../tests/domain/hopups/repeat-allowance-permits-redisplay.test.ts`
- `repeatAllowance` defaults to `1` (show once per session) when not explicitly set higher.
  `[@test] ../tests/domain/hopups/default-repeat-allowance-is-one.test.ts`

## Action selection

- `pickAction` chooses uniformly at random among `hopup.actions` when more than one exists.
  `[@test] ../tests/domain/hopups/pick-action-random-among-multiple.test.ts`
- `pickAction` returns the single action directly when a hopup has exactly one.
  `[@test] ../tests/domain/hopups/pick-action-single.test.ts`
