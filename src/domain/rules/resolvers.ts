import type { SignalContext, SignalResolver } from "./types.js";

const exactResolvers = new Map<string, SignalResolver>();
const prefixResolvers = new Map<string, SignalResolver>();

export function registerSignalResolver(resolver: SignalResolver): void {
  if (resolver.key.endsWith(".*")) {
    const prefix = resolver.key.slice(0, -1); // keep trailing "."
    prefixResolvers.set(prefix, resolver);
  } else {
    exactResolvers.set(resolver.key, resolver);
  }
}

export function resolveSignal(signal: string, context: SignalContext): unknown {
  const exact = exactResolvers.get(signal);
  if (exact) {
    return exact.resolve(context, signal);
  }

  for (const [prefix, resolver] of prefixResolvers) {
    if (signal.startsWith(prefix)) {
      return resolver.resolve(context, signal);
    }
  }

  return undefined;
}

export function registerBuiltinResolvers(): void {
  registerSignalResolver({ key: "page.path", resolve: (ctx) => ctx.page.path });
  registerSignalResolver({ key: "visit.count", resolve: (ctx) => ctx.visit.count });
  registerSignalResolver({ key: "session.inactivityMinutes", resolve: (ctx) => ctx.session.inactivityMinutes });
  registerSignalResolver({
    key: "query.*",
    resolve: (ctx, signal) => ctx.query[signal.slice("query.".length)]
  });
  registerSignalResolver({
    key: "clientVar.*",
    resolve: (ctx, signal) => ctx.clientVars[signal.slice("clientVar.".length)]
  });
}

registerBuiltinResolvers();
