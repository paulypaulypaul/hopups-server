import { resolveSignal } from "./resolvers.js";
import type { Condition, SignalContext } from "./types.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compilePattern(signal: string, pattern: string): RegExp {
  if (signal === "page.path" && pattern.includes("*")) {
    const escaped = pattern.split("*").map(escapeRegex).join(".*");
    return new RegExp(`^${escaped}$`);
  }
  return new RegExp(pattern);
}

function matchesOperator(signal: string, resolved: unknown, value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const regex = compilePattern(signal, value);
  return regex.test(String(resolved));
}

function applyOperator(condition: Condition, resolved: unknown): boolean {
  const { operator, value } = condition;

  switch (operator) {
    case "eq":
      return resolved === value;
    case "neq":
      return resolved !== value;
    case "gt":
      return typeof resolved === "number" && typeof value === "number" && resolved > value;
    case "gte":
      return typeof resolved === "number" && typeof value === "number" && resolved >= value;
    case "lt":
      return typeof resolved === "number" && typeof value === "number" && resolved < value;
    case "lte":
      return typeof resolved === "number" && typeof value === "number" && resolved <= value;
    case "in":
      return Array.isArray(value) && value.includes(resolved);
    case "matches":
      return matchesOperator(condition.signal, resolved, value);
    default:
      return false;
  }
}

export function evaluateCondition(condition: Condition, context: SignalContext): boolean {
  const resolved = resolveSignal(condition.signal, context);
  if (resolved === undefined) {
    return false;
  }
  return applyOperator(condition, resolved);
}

export function evaluateHopupConditions(conditions: Condition[], context: SignalContext): boolean {
  return conditions.every((condition) => evaluateCondition(condition, context));
}
