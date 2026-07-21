import { prisma } from "../../src/db/prisma.js";

export async function createHopupWithAction(siteId: string) {
  return prisma.hopup.create({
    data: {
      siteId,
      actions: { create: [{ type: "banner", payload: { message: "hi" } }] }
    },
    include: { actions: true }
  });
}
