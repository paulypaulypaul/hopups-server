---
name: fastify-best-practices
description: >-
  Fastify patterns — schema-first validation, encapsulated plugins, hooks
  lifecycle, decorators, structured error handling, TypeScript type providers,
  async handler patterns, and production hardening with CORS, helmet, rate
  limiting, logging, and graceful shutdown. Use when building or reviewing
  Fastify APIs, when migrating from Express, or when setting up a new Node.js
  API with Fastify.
keywords: fastify, fastify plugin, fastify schema, json schema validation,
  fastify hooks, fastify error handling, fastify serialization, fastify typescript,
  fastify routes, fastify decorators, fastify register, fastify encapsulation,
  fastify type provider, fastify cors, fastify helmet, fastify rate limit,
  fastify graceful shutdown, fastify pino, fastify async, reply send, preHandler,
  onRequest, preSerialization, setErrorHandler, decorateRequest
license: MIT
---

# Fastify Best Practices

**The Core Principle: Schema-first, plugin-encapsulated, async-native.**

Fastify is built around three ideas that distinguish it from Express: (1) JSON Schema validation runs before your handler -- invalid requests never reach your code, (2) the plugin system provides true encapsulation -- each plugin gets its own scope for hooks, decorators, and routes, (3) async/await is native -- no callback adapters, no middleware signature confusion. Every Fastify API should leverage all three.

---

## Rule 1: JSON Schema on Every Route

Fastify compiles JSON Schema into optimized validation functions at startup. This gives you: automatic request validation (body, querystring, params, headers), 2-3x faster response serialization than JSON.stringify, and auto-generated TypeScript types when using Type Providers.

**Always define schemas for body, querystring, params, AND response.**

```typescript
// CORRECT: full schema on route -- body validated, response serialized fast
const createOrderSchema = {
  body: {
    type: 'object',
    required: ['customerName', 'items'],
    properties: {
      customerName: { type: 'string', minLength: 1, maxLength: 100 },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer', minimum: 1, maximum: 100 },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        customerName: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              quantity: { type: 'integer' },
            },
          },
        },
        status: { type: 'string' },
        createdAt: { type: 'string' },
      },
    },
  },
} as const;

app.post('/api/orders', { schema: createOrderSchema }, async (request, reply) => {
  // request.body is already validated -- no manual checks needed
  const order = await orderService.create(request.body);
  reply.status(201);
  return { ...order };
});

// WRONG: no schema -- no validation, no fast serialization, no type safety
app.post('/api/orders', async (request, reply) => {
  const body = request.body as any; // No validation, no types
  // Must manually validate everything...
});
```

### Schema tips

- Use `additionalProperties: false` to reject unexpected fields (prevents mass assignment)
- Use `format: 'uuid'` and `format: 'email'` with `@fastify/type-provider-json-schema-to-ts` or `ajv-formats`
- Define shared schemas with `app.addSchema({ $id: 'Order', ... })` and reference with `{ $ref: 'Order#' }`
- Response schemas also strip unknown properties from the response -- this prevents accidental data leaks (e.g., password hashes)

---

## Rule 2: Organize Routes into Plugins with `app.register()`

Every group of related routes should be a Fastify plugin registered with `app.register()`. This gives you encapsulation: hooks, decorators, and schemas registered inside a plugin are scoped to that plugin and its children. The parent scope is not polluted.

```typescript
// plugins/orders.ts
import { FastifyPluginAsync } from 'fastify';

const ordersPlugin: FastifyPluginAsync = async (app) => {
  // This hook only runs for routes in THIS plugin
  app.addHook('preHandler', async (request) => {
    // e.g., verify order ownership
  });

  app.get('/api/orders', { schema: listOrdersSchema }, async (request) => {
    const { page, limit } = request.query;
    return { data: await orderService.list(page, limit), page, limit };
  });

  app.get('/api/orders/:id', { schema: getOrderSchema }, async (request) => {
    const order = await orderService.get(request.params.id);
    if (!order) throw new NotFoundError('Order', request.params.id);
    return { data: order };
  });

  app.post('/api/orders', { schema: createOrderSchema }, async (request, reply) => {
    const order = await orderService.create(request.body);
    reply.status(201);
    return { data: order };
  });
};

export default ordersPlugin;

// app.ts -- register plugins to compose the app
import ordersPlugin from './plugins/orders.js';
import usersPlugin from './plugins/users.js';
import authPlugin from './plugins/auth.js';

// Auth plugin decorates the app -- register it first, OUTSIDE route plugins
app.register(authPlugin);

// Route plugins get their own scope
app.register(ordersPlugin);
app.register(usersPlugin);

// Use prefix option to avoid repeating path prefixes
app.register(ordersPlugin, { prefix: '/api/v2' });
```

### Encapsulation rules

- Plugins registered with `app.register()` get an encapsulated child context
- Decorators and hooks in a child plugin do NOT leak to the parent or siblings
- To share something across ALL plugins (e.g., a database connection), use `fastify-plugin` to break encapsulation intentionally:

```typescript
import fp from 'fastify-plugin';

// This decorator will be visible to ALL plugins because of fastify-plugin
const dbPlugin: FastifyPluginAsync = async (app) => {
  const pool = new Pool(config);
  app.decorate('db', pool);

  app.addHook('onClose', async () => {
    await pool.end();
  });
};

export default fp(dbPlugin);
```

---

## Rule 3: Use Decorators for Shared State, Not Global Variables

Use `app.decorate()` for app-level state (database pools, service instances) and `app.decorateRequest()` for per-request state (current user, request ID). Never use module-level globals for state that should be tied to the Fastify lifecycle.

```typescript
// CORRECT: decorate the app with services
app.decorate('db', pool);
app.decorate('orderService', new OrderService(pool));

// CORRECT: decorateRequest for per-request state
app.decorateRequest('user', null); // Initialize with null

app.addHook('preHandler', async (request) => {
  if (request.headers.authorization) {
    request.user = await verifyToken(request.headers.authorization);
  }
});

// TypeScript: extend the type definitions
declare module 'fastify' {
  interface FastifyInstance {
    db: Pool;
    orderService: OrderService;
  }
  interface FastifyRequest {
    user: User | null;
  }
}

// WRONG: global mutable state
let db: Pool; // Lives outside Fastify lifecycle, not cleaned up on close
```

---

## Rule 4: Structured Error Handling with setErrorHandler

Set a custom error handler at the app level. Handle validation errors (from schema), known application errors (with status codes), and unexpected errors separately. Always return structured error responses.

```typescript
import createError from '@fastify/error';

// Define application errors with codes and status
const NotFoundError = createError('NOT_FOUND', '%s not found', 404);
const ConflictError = createError('CONFLICT', '%s', 409);
const ForbiddenError = createError('FORBIDDEN', '%s', 403);

// Global error handler
app.setErrorHandler((error, request, reply) => {
  // Always log the error with request context
  request.log.error({ err: error, reqId: request.id }, 'request_error');

  // Schema validation errors (Ajv)
  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation,
      },
    });
  }

  // Known application errors (created with @fastify/error)
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code || 'ERROR',
        message: error.message,
      },
    });
  }

  // Unexpected errors -- never expose internals to client
  reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// Usage in routes:
app.get('/api/orders/:id', async (request) => {
  const order = await orderService.get(request.params.id);
  if (!order) throw new NotFoundError('Order');
  return { data: order };
});
```

---

## Rule 5: Hooks Lifecycle -- Use the Right Hook for the Job

Fastify hooks run in a specific order. Use the right hook for each concern:

| Hook | When it runs | Use for |
|------|-------------|---------|
| `onRequest` | First, before parsing | Request ID, early auth check, rate limiting |
| `preParsing` | Before body parsing | Decompression, raw body access |
| `preValidation` | Before schema validation | Transforming body before validation |
| `preHandler` | After validation, before handler | Authorization, loading resources, auth checks |
| `preSerialization` | After handler, before response serialization | Transforming response data, adding metadata |
| `onSend` | After serialization, before sending | Modifying headers, compression |
| `onResponse` | After response sent | Logging, metrics, cleanup |
| `onError` | When an error is thrown | Error logging (use setErrorHandler for responses) |

```typescript
// Authentication: use preHandler (runs after validation, before business logic)
app.addHook('preHandler', async (request, reply) => {
  if (!request.user) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }
});

// Request logging: use onResponse (runs after response is sent, non-blocking)
app.addHook('onResponse', async (request, reply) => {
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: reply.elapsedTime,
  }, 'request_completed');
});

// Request ID: use onRequest (runs first)
app.addHook('onRequest', async (request) => {
  request.requestId = request.headers['x-request-id'] as string || request.id;
});
```

---

## Rule 6: Production Hardening -- CORS, Helmet, Rate Limiting

Always register security plugins in production Fastify apps:

```typescript
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

// CORS -- configure allowed origins explicitly in production
await app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
});

// Helmet -- sets security headers (CSP, HSTS, X-Frame-Options, etc.)
await app.register(helmet, {
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
});

// Rate limiting -- prevent abuse
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  // Custom key generator (e.g., by API key or user ID)
  keyGenerator: (request) => request.headers['x-api-key'] as string || request.ip,
});
```

---

## Rule 7: Graceful Shutdown

Always handle process signals and use `app.close()` for clean shutdown. This drains in-flight requests and runs `onClose` hooks (where you close database connections, flush logs, etc.).

```typescript
// Register cleanup in onClose hooks
app.addHook('onClose', async () => {
  await app.db.end();       // Close database pool
  await app.cache.quit();   // Close Redis connection
});

// Handle process signals
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info({ signal }, 'shutdown_signal_received');
    await app.close();       // Drains requests, runs onClose hooks
    process.exit(0);
  });
}

// Start server
try {
  await app.listen({ port: 3000, host: '0.0.0.0' });
  app.log.info('server_started');
} catch (err) {
  app.log.fatal(err, 'server_start_failed');
  process.exit(1);
}
```

---

## Rule 8: TypeScript with Type Providers

Use `@fastify/type-provider-json-schema-to-ts` or `@fastify/type-provider-typebox` to get automatic type inference from your JSON Schemas. This eliminates manual type casting.

```typescript
import Fastify from 'fastify';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';

const app = Fastify({ logger: true }).withTypeProvider<JsonSchemaToTsProvider>();

const getOrderSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
    additionalProperties: false,
  } as const,
  response: {
    200: {
      type: 'object',
      properties: {
        data: { $ref: 'Order#' },
      },
    } as const,
  },
};

// request.params.id is automatically typed as string -- no casting needed
app.get('/api/orders/:id', { schema: getOrderSchema }, async (request) => {
  const { id } = request.params; // TypeScript knows id is string
  const order = await orderService.get(id);
  if (!order) throw new NotFoundError('Order');
  return { data: order };
});
```

---

## Rule 9: Async Handler Patterns -- return vs reply.send()

In Fastify, you have two patterns for sending responses. Pick one per handler -- never mix them.

```typescript
// Pattern 1 (PREFERRED): return the value -- Fastify handles serialization
app.get('/api/orders', async (request) => {
  const orders = await orderService.list();
  return { data: orders };
});

// Pattern 2: use reply.send() -- needed for setting status codes or headers
app.post('/api/orders', async (request, reply) => {
  const order = await orderService.create(request.body);
  reply.status(201);
  return { data: order };
});

// WRONG: mixing return and reply.send() -- causes "Reply already sent" error
app.get('/api/orders', async (request, reply) => {
  const orders = await orderService.list();
  reply.send({ data: orders }); // Sends response
  return { data: orders };      // ERROR: tries to send again
});

// WRONG: forgetting to return or await -- handler resolves before send
app.get('/api/orders', async (request, reply) => {
  orderService.list().then(orders => {
    reply.send({ data: orders }); // Runs after handler resolves -- undefined behavior
  });
  // No return, no await -- Fastify thinks handler is done
});
```

---

## Rule 10: Logging -- Use Built-in Pino, Not console.log

Fastify ships with pino. Use it. It is structured, fast, and automatically includes request context.

```typescript
// Create app with logging enabled
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    // In production: JSON format (default). In dev: pretty print.
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// Use request.log for request-scoped logging (includes reqId automatically)
app.get('/api/orders/:id', async (request) => {
  request.log.info({ orderId: request.params.id }, 'fetching_order');
  const order = await orderService.get(request.params.id);
  if (!order) {
    request.log.warn({ orderId: request.params.id }, 'order_not_found');
    throw new NotFoundError('Order');
  }
  return { data: order };
});

// Use app.log for app-level logging (startup, shutdown, background tasks)
app.log.info({ port: 3000 }, 'server_starting');

// WRONG: never use console.log in a Fastify app
console.log('Order not found'); // Not structured, no request context, not configurable
```

---

## Checklist

- [ ] JSON Schema on all routes (body, querystring, params, response)
- [ ] `additionalProperties: false` on object schemas to reject unknown fields
- [ ] Response schemas defined to prevent data leaks and enable fast serialization
- [ ] Routes organized in plugins via `app.register()`
- [ ] Shared state (DB, services) via `app.decorate()`, not globals
- [ ] Per-request state via `app.decorateRequest()` with TypeScript declarations
- [ ] Custom error handler via `app.setErrorHandler()` with structured responses
- [ ] Validation errors, application errors, and unexpected errors handled separately
- [ ] Application errors defined with `@fastify/error` (code, message, status)
- [ ] Hooks used correctly: `onRequest` for early work, `preHandler` for auth, `onResponse` for logging
- [ ] `@fastify/cors` registered with explicit origins
- [ ] `@fastify/helmet` registered for security headers
- [ ] `@fastify/rate-limit` registered to prevent abuse
- [ ] Graceful shutdown: SIGINT/SIGTERM handlers call `app.close()`
- [ ] `onClose` hooks clean up connections (DB, Redis, etc.)
- [ ] TypeScript type provider configured for schema-to-type inference
- [ ] Async handlers use return (preferred) or reply.send() -- never both
- [ ] Built-in pino logger used (never console.log) with `request.log` for request context

## Verifiers

- [fastify-order-api](../../verifiers/fastify-order-api.json) -- Build a CRUD API with schema validation, plugins, and error handling
- [fastify-auth-hooks](../../verifiers/fastify-auth-hooks.json) -- Build auth middleware using hooks, decorators, and preHandler
- [fastify-microservice](../../verifiers/fastify-microservice.json) -- Build a production microservice with logging, security, and graceful shutdown
- [fastify-typed-api](../../verifiers/fastify-typed-api.json) -- Build a TypeScript API with type providers and proper async patterns
- [fastify-webhook-handler](../../verifiers/fastify-webhook-handler.json) -- Build a webhook ingestion service with validation and plugin encapsulation
