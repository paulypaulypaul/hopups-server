import type { FastifyInstance } from "fastify";
import { buildServer } from "../../src/api/server.js";

export async function buildFullTestApp(): Promise<FastifyInstance> {
  return buildServer();
}
