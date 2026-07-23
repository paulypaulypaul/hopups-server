import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { registerIdentityProvider, FacebookIdentityProvider } from "../domain/identity/index.js";
import { registerSyncRoutes } from "./sync/route.js";
import { registerAdminRoutes } from "./admin/index.js";
import { registerWidgetRoutes } from "./widget/index.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true, credentials: true });

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Hopups Server API",
        description: "Sync, admin, and widget delivery APIs for the Hopups targeting engine.",
        version: "0.1.0"
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    },
    transform: jsonSchemaTransform
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs"
  });

  registerIdentityProvider(new FacebookIdentityProvider());

  await app.register(registerSyncRoutes);
  await app.register(registerAdminRoutes);
  await app.register(registerWidgetRoutes);

  return app;
}
