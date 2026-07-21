import { prisma } from "../../src/db/prisma.js";

export async function createSession(visitorId: string, siteId: string, lastActiveAt: Date = new Date()) {
  return prisma.session.create({
    data: { visitorId, siteId, lastActiveAt, completedActionIds: [] }
  });
}

export async function addPoolNumbers(siteId: string, numbers: string[]) {
  await prisma.phoneNumber.createMany({
    data: numbers.map((number) => ({ siteId, number }))
  });
}
