import jwt from "jsonwebtoken";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { config } from "../../config.js";

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

export function issueToken(username: string): { token: string; expiresAt: string } {
  const token = jwt.sign({ sub: username }, config.jwtSecret, { expiresIn: TOKEN_TTL_SECONDS });
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();
  return { token, expiresAt };
}

export async function requireAdminAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    jwt.verify(token, config.jwtSecret);
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}

export function registerLoginRoute(app: FastifyInstance): void {
  app.post("/api/admin/login", async (request, reply) => {
    const body = request.body as { username?: string; password?: string } | undefined;

    if (body?.username === config.adminUsername && body?.password === config.adminPassword) {
      const { token, expiresAt } = issueToken(body.username);
      return reply.send({ token, expiresAt });
    }

    return reply.status(401).send({ error: "Invalid credentials" });
  });
}
