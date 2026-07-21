import type { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "../../../public");

export async function registerWidgetLoaderRoute(app: FastifyInstance): Promise<void> {
  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: "/widget/",
    cacheControl: true,
    maxAge: "1d"
  });
}
