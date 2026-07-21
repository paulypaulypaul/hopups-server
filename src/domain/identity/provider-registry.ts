import type { IdentityProvider } from "./types.js";

const providers = new Map<string, IdentityProvider>();

export function registerIdentityProvider(provider: IdentityProvider): void {
  providers.set(provider.name, provider);
}

export function getIdentityProvider(name: string): IdentityProvider | undefined {
  return providers.get(name);
}
