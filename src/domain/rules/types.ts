export type Operator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "matches";

export interface Condition {
  signal: string;
  operator: Operator;
  value: unknown;
}

export interface SignalContext {
  page: { path: string };
  visit: { count: number };
  session: { inactivityMinutes: number };
  query: Record<string, string>;
  clientVars: Record<string, unknown>;
}

export interface SignalResolver {
  key: string; // exact key, or "prefix.*" for dynamic keys
  resolve(context: SignalContext, signal: string): unknown;
}
