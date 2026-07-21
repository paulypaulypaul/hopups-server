import type { ExternalIdentity, IdentityProvider } from "./types.js";

interface FacebookMeResponse {
  id: string;
  name?: string;
  email?: string;
  error?: { message: string };
}

interface CacheEntry {
  identity: ExternalIdentity;
  expiresAt: number;
}

export interface FacebookIdentityProviderOptions {
  graphApiUrl?: string;
  ttlMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export class FacebookIdentityProvider implements IdentityProvider {
  readonly name = "facebook";

  private readonly cache = new Map<string, CacheEntry>();
  private readonly graphApiUrl: string;
  private readonly ttlMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(options: FacebookIdentityProviderOptions = {}) {
    this.graphApiUrl = options.graphApiUrl ?? process.env.FACEBOOK_GRAPH_API_URL ?? "https://graph.facebook.com";
    this.ttlMs = options.ttlMs ?? ONE_HOUR_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  async verifyToken(token: string): Promise<ExternalIdentity> {
    const cached = this.cache.get(token);
    if (cached && cached.expiresAt > this.now()) {
      return cached.identity;
    }

    const url = `${this.graphApiUrl}/me?fields=id,name,email&access_token=${encodeURIComponent(token)}`;
    const response = await this.fetchImpl(url);
    const data = (await response.json()) as FacebookMeResponse;

    if (!response.ok || data.error) {
      throw new Error(data.error?.message ?? `Facebook token verification failed with status ${response.status}`);
    }

    const identity: ExternalIdentity = {
      providerUserId: data.id,
      displayName: data.name,
      email: data.email
    };

    this.cache.set(token, { identity, expiresAt: this.now() + this.ttlMs });
    return identity;
  }
}
