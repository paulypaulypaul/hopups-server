---
name: Phone Number Allocation & Call Tracking
description: Per-site tracking number pool, allocation to sessions, and release on expiry
targets:
  - ../src/domain/telephony/**/*.ts
---

# Phone Number Allocation & Call Tracking

Each site owns a self-managed pool of tracking phone numbers (no telephony provider integration —
numbers are plain strings configured via the [Admin API](./admin-api.spec.md)) plus one configured
default/fallback number. One dedicated number is allocated per
[session](./visitor-session.spec.md) so the widget can perform dynamic number insertion
(`phoneNumberSwap` action, see [Hopups & Actions](./hopups-actions.spec.md)); the number is released
back to the pool when the session's 30-minute inactivity window expires.

```typescript
interface PhoneNumberPool {
  siteId: string;
  numbers: string[];          // dedicated tracking numbers owned by this site
  defaultNumber: string | null;
}

interface PhoneNumberAllocation {
  id: string;
  siteId: string;
  sessionId: string;
  phoneNumber: string;
  allocatedAt: Date;
}

function allocateNumberForSession(siteId: string, sessionId: string): Promise<string | null>;
function releaseExpiredAllocations(now: Date): Promise<number>; // count released
```

## Allocation

- When a session has no active (non-expired) allocation, `allocateNumberForSession` assigns a
  number from the site's pool that is not currently allocated to any other live session, and
  records a `PhoneNumberAllocation`.
  `[@test] ../tests/domain/telephony/allocate-new-number.test.ts`
- When the session already has an active allocation, `allocateNumberForSession` returns the same
  number again (sticky for the life of the session) rather than allocating a new one.
  `[@test] ../tests/domain/telephony/allocation-sticky-per-session.test.ts`
- When every number in the site's pool is currently allocated to a live session,
  `allocateNumberForSession` returns the site's `defaultNumber` instead of failing or blocking.
  `[@test] ../tests/domain/telephony/pool-exhausted-uses-default.test.ts`
- When the pool is exhausted and `defaultNumber` is not configured (`null`),
  `allocateNumberForSession` returns `null` — the sync response surfaces no phone number rather
  than erroring (see [Sync API](./sync-api.spec.md)).
  `[@test] ../tests/domain/telephony/pool-exhausted-no-default-returns-null.test.ts`
- Concurrent allocation requests for the same site never assign the same dedicated number to two
  different live sessions; this is enforced at the database level (e.g. a uniqueness constraint on
  `(siteId, phoneNumber)` among non-expired allocations), not by application-level locking alone.
  `[@test] ../tests/domain/telephony/concurrent-allocation-no-double-assign.test.ts`

## Release

- `releaseExpiredAllocations` releases every allocation whose session has passed the 30-minute
  sliding inactivity window (per [Visitor & Session Identity](./visitor-session.spec.md)), making
  its number immediately available for a new allocation.
  `[@test] ../tests/domain/telephony/release-expired-allocations.test.ts`
- An allocation belonging to a session that has been touched within the last 30 minutes is left
  untouched by `releaseExpiredAllocations`.
  `[@test] ../tests/domain/telephony/active-allocation-not-released.test.ts`
- A number released by expiry is available to `allocateNumberForSession` on the very next call for
  that site.
  `[@test] ../tests/domain/telephony/released-number-immediately-reusable.test.ts`
