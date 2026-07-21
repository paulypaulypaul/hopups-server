---
name: Visitor & Session Identity
description: Anonymous visitor identity and session lifecycle used by the sync flow and phone allocation
targets:
  - ../src/domain/visitors/**/*.ts
---

# Visitor & Session Identity

A "visitor" is an anonymous browser identified by a UUID the widget generates client-side and
persists (no server-issued IDs, no server-set cookies — see [Sync API](./sync-api.spec.md)). A
"session" tracks one visitor's activity on one site within a rolling window, and is the unit that
call-tracking phone numbers (see [Phone Allocation](./phone-allocation.spec.md)) and completed-hopup
de-duplication (see [Hopups & Actions](./hopups-actions.spec.md)) are scoped to.

```typescript
interface Visitor {
  id: string;        // matches the client-generated UUID
  createdAt: Date;
}

interface Session {
  id: string;
  visitorId: string;
  siteId: string;
  lastActiveAt: Date;
  completedActionIds: string[];
}

interface VisitorEvent {
  type: string;                      // "pageview" or a custom event name
  path?: string;                     // present for "pageview" events
  payload?: Record<string, unknown>; // present for custom events
  occurredAt: Date;
}

function findOrCreateVisitor(externalId: string): Promise<Visitor>;
function findOrCreateSession(visitorId: string, siteId: string): Promise<Session>;
function touchSession(sessionId: string): Promise<Session>;
function isSessionExpired(session: Session, now: Date): boolean;
function markActionsCompleted(sessionId: string, actionIds: string[]): Promise<void>;
function recordEvents(visitorId: string, siteId: string, sessionId: string, events: VisitorEvent[]): Promise<void>;
function countPageViews(visitorId: string, siteId: string): Promise<number>;
```

## Visitor lookup

- `findOrCreateVisitor` returns the existing `Visitor` when `externalId` matches a known visitor.
  `[@test] ../tests/domain/visitors/find-existing-visitor.test.ts`
- `findOrCreateVisitor` creates and returns a new `Visitor` with `id === externalId` when no match
  exists.
  `[@test] ../tests/domain/visitors/create-new-visitor.test.ts`

## Session lifecycle

- `findOrCreateSession` returns the visitor's current session for that site if one exists and is
  not expired (per `isSessionExpired`); otherwise it creates a new session with `completedActionIds`
  empty.
  `[@test] ../tests/domain/visitors/find-or-create-session.test.ts`
- A session is scoped to exactly one `(visitorId, siteId)` pair — activity on a second site never
  reuses or extends a session created for a different site.
  `[@test] ../tests/domain/visitors/session-scoped-per-site.test.ts`
- Sessions use a **30-minute sliding inactivity window**: `isSessionExpired` is true when
  `now > lastActiveAt + 30 minutes`.
  `[@test] ../tests/domain/visitors/session-expiry-window.test.ts`
- `touchSession` sets `lastActiveAt` to the current time, resetting the 30-minute window. Every
  sync call touches the session.
  `[@test] ../tests/domain/visitors/touch-session-resets-window.test.ts`
- An expired session is never returned by `findOrCreateSession` — a fresh session (with empty
  `completedActionIds`, and eligible for a newly allocated phone number) is created instead.
  `[@test] ../tests/domain/visitors/expired-session-replaced.test.ts`

## Completed actions

- `markActionsCompleted` appends the given action IDs to `session.completedActionIds`, deduplicated
  (no repeated IDs even if called multiple times with overlapping sets).
  `[@test] ../tests/domain/visitors/mark-actions-completed.test.ts`
- `completedActionIds` is used by the hopup-matching flow to exclude already-shown hopups; see
  [Hopups & Actions](./hopups-actions.spec.md) for the repeat-allowance exception.

## Event history

Raw visitor activity (page views and custom events, see [Sync API](./sync-api.spec.md)) is persisted
so `visit.count` can be resolved by the [Rules Engine](./rules-engine.spec.md).

- `recordEvents` persists every event in the given list against `(visitorId, siteId, sessionId)`,
  regardless of `type`.
  `[@test] ../tests/domain/visitors/record-events-persists-all-types.test.ts`
- `countPageViews` returns the number of persisted events with `type === "pageview"` for the given
  `(visitorId, siteId)`, across all of that visitor's sessions on the site.
  `[@test] ../tests/domain/visitors/count-page-views.test.ts`
