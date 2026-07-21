---
name: Analytics — Event Log & Rollups
description: Per-event logging and time-series rollups for action-shown events
targets:
  - ../src/domain/analytics/**/*.ts
---

# Analytics — Event Log & Rollups

Every time a hopup action is shown to a visitor, an individual `ActionEvent` is logged and a
per-minute `RollupBucket` count is updated, so the [Admin API](./admin-api.spec.md) can serve both
raw event queries and fast aggregate queries without scanning the full event log.

```typescript
interface ActionEvent {
  id: string;
  siteId: string;
  hopupId: string;
  actionId: string;
  visitorId: string;
  sessionId: string;
  shownAt: Date;
}

interface RollupBucket {
  siteId: string;
  hopupId: string;
  interval: "minute";
  intervalStart: Date; // shownAt truncated to the minute
  count: number;
}

function recordActionShown(event: Omit<ActionEvent, "id">): Promise<void>;

function queryEvents(filter: {
  siteId: string;
  hopupId?: string;
  from?: Date;
  to?: Date;
}): Promise<ActionEvent[]>;

function queryRollups(filter: {
  siteId: string;
  hopupId?: string;
  from?: Date;
  to?: Date;
  interval?: "minute" | "hour" | "day"; // default "minute"
}): Promise<RollupBucket[]>;
```

## Recording

- `recordActionShown` writes one `ActionEvent` row per call.
  `[@test] ../tests/domain/analytics/record-action-event.test.ts`
- `recordActionShown` atomically increments (upserts) the `RollupBucket` for
  `(siteId, hopupId, minute-truncated shownAt)`, creating it with `count: 1` if it doesn't yet
  exist.
  `[@test] ../tests/domain/analytics/record-updates-minute-rollup.test.ts`
- Two events in the same site/hopup/minute increment the same bucket rather than creating a
  duplicate.
  `[@test] ../tests/domain/analytics/rollup-aggregates-same-minute.test.ts`
- Concurrent `recordActionShown` calls for the same bucket never lose an increment (no lost
  updates under concurrency).
  `[@test] ../tests/domain/analytics/concurrent-rollup-increments.test.ts`

## Querying

- `queryEvents` and `queryRollups` both require `siteId` and never return data for a different
  site, even if `hopupId` alone would otherwise match — this scoping is enforced regardless of
  the single-tenant admin model in [Admin API](./admin-api.spec.md), for forward compatibility.
  `[@test] ../tests/domain/analytics/query-events-scoped-to-site.test.ts`
  `[@test] ../tests/domain/analytics/query-rollups-scoped-to-site.test.ts`
- `queryEvents`/`queryRollups` filter by `hopupId` and by `[from, to)` when provided.
  `[@test] ../tests/domain/analytics/query-filters-by-hopup-and-range.test.ts`
- `queryRollups` with `interval: "hour"` or `"day"` re-aggregates the stored per-minute buckets
  into the coarser interval on read, rather than requiring separate stored hourly/daily buckets.
  `[@test] ../tests/domain/analytics/query-rollups-reaggregates-coarser-interval.test.ts`
- `queryRollups` defaults to `interval: "minute"` when not specified.
  `[@test] ../tests/domain/analytics/query-rollups-default-interval.test.ts`
