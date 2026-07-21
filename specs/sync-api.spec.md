---
name: Sync API
description: The widget-facing endpoint that reports visitor activity and returns matched hopup actions
targets:
  - ../src/api/sync/**/*.ts
---

# Sync API

`POST /api/sync` is the widget's single point of contact with the server. Every call reports what
the visitor has done and gets back the actions the visitor should now see, orchestrating
[visitor/session lookup](./visitor-session.spec.md), [phone allocation](./phone-allocation.spec.md),
[hopup matching](./hopups-actions.spec.md), and [analytics logging](./analytics.spec.md).

```typescript
interface SyncEvent {
  type: "pageview" | string;         // "pageview" or a custom event name
  path?: string;                     // required when type === "pageview"
  payload?: Record<string, unknown>; // arbitrary data for custom events
  timestamp: string;                 // ISO 8601
}

interface SyncRequestBody {
  visitorId: string;                 // client-generated UUID
  siteId: string;
  events: SyncEvent[];
  query?: Record<string, string>;
  clientVars?: Record<string, unknown>;
  location?: { country?: string; region?: string; city?: string };
  completedActionIds?: string[];
}

interface SyncActionResult {
  hopupId: string;
  actionId: string;
  type: ActionType;    // see hopups-actions.spec.md
  payload: unknown;
}

interface SyncResponseBody {
  visitorId: string;
  sessionId: string;
  phoneNumber: string | null;
  actions: SyncActionResult[];
}
```

## Request validation

- `visitorId` and `siteId` are required strings; a request missing either, or with an empty
  `events` array of the wrong shape, is rejected with `400` before any domain logic runs.
  `[@test] ../tests/api/sync/reject-missing-visitor-id.test.ts`
  `[@test] ../tests/api/sync/reject-missing-site-id.test.ts`
- An event with `type: "pageview"` and no `path` is rejected with `400`.
  `[@test] ../tests/api/sync/reject-pageview-without-path.test.ts`
- `siteId` referring to a site that doesn't exist returns `404` and performs no writes.
  `[@test] ../tests/api/sync/unknown-site-returns-404.test.ts`

## Orchestration

On a valid request, in order:

1. Find-or-create the `Visitor` for `visitorId`.
   `[@test] ../tests/api/sync/creates-new-visitor-on-first-call.test.ts`
2. Find-or-create (and touch) the `Session` for `(visitorId, siteId)`, resetting its 30-minute
   inactivity window.
   `[@test] ../tests/api/sync/touches-session-on-every-call.test.ts`
3. Record every item in `events` (page views feed `visit.count`; custom events are available to
   the rules engine as future signals but do not themselves gate matching beyond what's registered).
   `[@test] ../tests/api/sync/records-pageview-events.test.ts`
   `[@test] ../tests/api/sync/records-custom-events.test.ts`
4. Mark any `completedActionIds` from the request as completed on the session.
   `[@test] ../tests/api/sync/marks-completed-actions.test.ts`
5. Allocate (or reuse) a phone number for the session via `allocateNumberForSession`.
   `[@test] ../tests/api/sync/allocates-phone-number.test.ts`
6. Build the `SignalContext` from the request (`page.path` from the latest pageview event, `query`,
   `clientVars`, `visit.count`, `session.inactivityMinutes`) and call `selectMatchingHopups`.
   `[@test] ../tests/api/sync/builds-signal-context-from-request.test.ts`
7. For each matching hopup, call `pickAction` and call `recordActionShown` for the chosen action.
   `[@test] ../tests/api/sync/logs-analytics-for-each-shown-action.test.ts`
8. Return `visitorId`, `sessionId`, the allocated `phoneNumber` (possibly `null`), and the list of
   chosen actions.
   `[@test] ../tests/api/sync/response-shape.test.ts`

## Behavior notes

- `phoneNumber` in the response is `null` only when the site's pool is exhausted and no default
  number is configured (see [Phone Allocation](./phone-allocation.spec.md)) — this is never treated
  as an error.
  `[@test] ../tests/api/sync/response-null-phone-number-not-an-error.test.ts`
- `actions` is an empty array (not an error) when no hopup matches.
  `[@test] ../tests/api/sync/empty-actions-when-no-match.test.ts`
- Repeated calls with the same `visitorId`/`siteId` within the 30-minute window reuse the same
  `sessionId` and the same allocated `phoneNumber`.
  `[@test] ../tests/api/sync/repeated-calls-reuse-session-and-number.test.ts`
