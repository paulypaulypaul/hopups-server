import type { FastifyInstance } from "fastify";
import { prisma } from "../../db/prisma.js";
import {
  findOrCreateVisitor,
  findOrCreateSession,
  touchSession,
  markActionsCompleted,
  recordEvents,
  countPageViews
} from "../../domain/visitors/index.js";
import { allocateNumberForSession } from "../../domain/telephony/index.js";
import { selectMatchingHopups, pickAction } from "../../domain/hopups/index.js";
import { recordActionShown } from "../../domain/analytics/index.js";
import type { SignalContext } from "../../domain/rules/index.js";
import { syncRequestSchema } from "./schema.js";

export async function registerSyncRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/sync", async (request, reply) => {
    const parseResult = syncRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Invalid request", details: parseResult.error.flatten() });
    }
    const body = parseResult.data;

    const site = await prisma.site.findUnique({ where: { id: body.siteId } });
    if (!site) {
      return reply.status(404).send({ error: "Unknown site" });
    }

    const visitor = await findOrCreateVisitor(body.visitorId);

    const sessionBeforeTouch = await findOrCreateSession(visitor.id, site.id);
    const now = new Date();
    const inactivityMinutes = Math.max(
      0,
      (now.getTime() - sessionBeforeTouch.lastActiveAt.getTime()) / 60_000
    );
    const session = await touchSession(sessionBeforeTouch.id);

    if (body.events.length > 0) {
      await recordEvents(
        visitor.id,
        site.id,
        session.id,
        body.events.map((event) => ({
          type: event.type,
          path: event.path,
          payload: event.payload,
          occurredAt: new Date(event.timestamp)
        }))
      );
    }

    const completedActionIds = Array.from(
      new Set([...sessionBeforeTouch.completedActionIds, ...(body.completedActionIds ?? [])])
    );
    if (body.completedActionIds && body.completedActionIds.length > 0) {
      await markActionsCompleted(session.id, body.completedActionIds);
    }

    const phoneNumber = await allocateNumberForSession(site.id, session.id);

    const latestPageview = [...body.events].reverse().find((event) => event.type === "pageview");
    const visitCount = await countPageViews(visitor.id, site.id);

    const context: SignalContext = {
      page: { path: latestPageview?.path ?? "" },
      visit: { count: visitCount },
      session: { inactivityMinutes },
      query: body.query ?? {},
      clientVars: body.clientVars ?? {}
    };

    const matchingHopups = await selectMatchingHopups(site.id, context, { completedActionIds });

    const actions: { hopupId: string; actionId: string; type: string; payload: unknown }[] = [];
    for (const hopup of matchingHopups) {
      const action = pickAction(hopup);
      await recordActionShown({
        siteId: site.id,
        hopupId: hopup.id,
        actionId: action.id,
        visitorId: visitor.id,
        sessionId: session.id,
        shownAt: new Date()
      });
      actions.push({ hopupId: hopup.id, actionId: action.id, type: action.type, payload: action.payload });
    }

    return reply.send({
      visitorId: visitor.id,
      sessionId: session.id,
      phoneNumber,
      actions
    });
  });
}
