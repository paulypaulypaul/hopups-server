---
name: Rules & Segment Matching Engine
description: Extensible condition evaluation used to decide which hopups match a visitor
targets:
  - ../src/domain/rules/**/*.ts
---

# Rules & Segment Matching Engine

Whether a hopup should be shown is decided by evaluating a list of **conditions** against a
**signal context** built from the current sync request (see [Sync API](./sync-api.spec.md)) and
the visitor's session state (see [Visitor & Session Identity](./visitor-session.spec.md)). The
engine is deliberately not a fixed plugin list: new signal types are added by registering a
resolver, not by editing the evaluator.

```typescript
type Operator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "matches";

interface Condition {
  signal: string;   // e.g. "page.path", "visit.count", "session.inactivityMinutes",
                     // "query.<key>", "clientVar.<key>"
  operator: Operator;
  value: unknown;
}

interface SignalContext {
  page: { path: string };
  visit: { count: number };
  session: { inactivityMinutes: number };
  query: Record<string, string>;
  clientVars: Record<string, unknown>;
}

interface SignalResolver {
  key: string;                              // exact key, or "prefix.*" for dynamic keys
  resolve(context: SignalContext, signal: string): unknown;
}

function registerSignalResolver(resolver: SignalResolver): void;
function evaluateCondition(condition: Condition, context: SignalContext): boolean;
function evaluateHopupConditions(conditions: Condition[], context: SignalContext): boolean;
```

## Built-in signals

Registered by default, resolvable via `evaluateCondition`:

- `page.path` — the current page path from the sync request.
  `[@test] ../tests/domain/rules/signal-page-path.test.ts`
- `visit.count` — the visitor's total recorded page-view count on the site.
  `[@test] ../tests/domain/rules/signal-visit-count.test.ts`
- `session.inactivityMinutes` — minutes since the session's previous `lastActiveAt`, before the
  current touch.
  `[@test] ../tests/domain/rules/signal-inactivity.test.ts`
- `query.<key>` — the value of query string parameter `<key>` from the sync request.
  `[@test] ../tests/domain/rules/signal-query-param.test.ts`
- `clientVar.<key>` — the value of client variable `<key>` from the sync request.
  `[@test] ../tests/domain/rules/signal-client-var.test.ts`
- An unregistered/unknown signal key resolves to `undefined` rather than throwing.
  `[@test] ../tests/domain/rules/signal-unknown-key.test.ts`

## Extensibility

- `registerSignalResolver` adds a new resolver without requiring changes to
  `evaluateCondition` or `evaluateHopupConditions`.
  `[@test] ../tests/domain/rules/register-custom-resolver.test.ts`
- Registering a resolver for a key that's already registered replaces the existing resolver
  (last write wins), so built-ins can be overridden in tests.
  `[@test] ../tests/domain/rules/register-resolver-override.test.ts`

## Operators

- `eq` / `neq` — strict equality / inequality.
  `[@test] ../tests/domain/rules/operator-eq-neq.test.ts`
- `gt` / `gte` / `lt` / `lte` — numeric comparison; non-numeric resolved values always evaluate
  to `false`.
  `[@test] ../tests/domain/rules/operator-numeric-comparison.test.ts`
- `in` — `condition.value` must be an array; true when the resolved signal is a member of it.
  `[@test] ../tests/domain/rules/operator-in.test.ts`
- `matches` — `condition.value` is a regex pattern string; true when the resolved signal (coerced
  to string) matches it. Used for free-form matching, and for `page.path` also accepts a simple
  wildcard form where `*` matches any path segment sequence (e.g. `/products/*`), translated to a
  regex internally.
  `[@test] ../tests/domain/rules/operator-matches-regex.test.ts`
  `[@test] ../tests/domain/rules/operator-matches-wildcard-path.test.ts`

## Condition evaluation

- `evaluateCondition` resolves the signal via the registered resolver for `condition.signal`, then
  applies `condition.operator` against `condition.value`.
- A resolved signal value of `undefined` (missing query param, missing client var, unknown signal)
  makes the condition evaluate `false` for every operator — there is no "not set" comparison.
  `[@test] ../tests/domain/rules/undefined-signal-always-false.test.ts`

## Hopup-level matching

- `evaluateHopupConditions` returns `true` only when **every** condition in the list evaluates
  `true` (AND semantics) — a single failing condition disqualifies the hopup.
  `[@test] ../tests/domain/rules/all-conditions-must-match.test.ts`
- An empty condition list evaluates `true` (a hopup with no segments matches everyone).
  `[@test] ../tests/domain/rules/empty-conditions-match-all.test.ts`
