export interface ExternalIdentity {
  providerUserId: string;
  displayName?: string;
  email?: string;
}

export interface IdentityProvider {
  name: string;
  verifyToken(token: string): Promise<ExternalIdentity>;
}

export interface User {
  id: string;
  provider: string;
  providerUserId: string;
  displayName: string | null;
  email: string | null;
  visitorId: string | null;
}
