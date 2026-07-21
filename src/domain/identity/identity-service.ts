import { prisma } from "../../db/prisma.js";
import { getIdentityProvider } from "./provider-registry.js";
import type { User } from "./types.js";

export class UnknownProviderError extends Error {}

export async function linkVisitorToIdentity(visitorId: string, providerName: string, token: string): Promise<User> {
  const provider = getIdentityProvider(providerName);
  if (!provider) {
    throw new UnknownProviderError(`Unknown identity provider: ${providerName}`);
  }

  const identity = await provider.verifyToken(token);

  return prisma.user.upsert({
    where: {
      provider_providerUserId: { provider: providerName, providerUserId: identity.providerUserId }
    },
    update: {
      visitorId,
      displayName: identity.displayName ?? null,
      email: identity.email ?? null
    },
    create: {
      provider: providerName,
      providerUserId: identity.providerUserId,
      displayName: identity.displayName ?? null,
      email: identity.email ?? null,
      visitorId
    }
  });
}
