import jwt from "jsonwebtoken";
import { z } from "zod";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { config } from "../../config.js";
import { errorResponseSchema } from "../shared-schemas.js";

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

export const loginRequestSchema = z.object({
  username: z.string(),
  password: z.string()
});

export const loginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string()
});

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
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/api/admin/login",
    {
      schema: {
        tags: ["admin"],
        summary: "Log in as the global admin",
        body: loginRequestSchema,
        response: { 200: loginResponseSchema, 401: errorResponseSchema }
      }
    },
    async (request, reply) => {
      const { username, password } = request.body;

      if (username === config.adminUsername && password === config.adminPassword) {
        const { token, expiresAt } = issueToken(username);
        return reply.send({ token, expiresAt });
      }

      return reply.status(401).send({ error: "Invalid credentials" });
    }
  );
}
