import { prisma } from "../../db/prisma.js";
import type { Visitor } from "./types.js";

export async function findOrCreateVisitor(externalId: string): Promise<Visitor> {
  const existing = await prisma.visitor.findUnique({ where: { id: externalId } });
  if (existing) {
    return existing;
  }

  return prisma.visitor.create({ data: { id: externalId } });
}
