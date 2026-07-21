import { prisma } from "../../src/db/prisma.js";

export async function resetDb(): Promise<void> {
  await prisma.actionEvent.deleteMany();
  await prisma.rollupBucket.deleteMany();
  await prisma.phoneNumberAllocation.deleteMany();
  await prisma.action.deleteMany();
  await prisma.hopup.deleteMany();
  await prisma.phoneNumber.deleteMany();
  await prisma.user.deleteMany();
  await prisma.visitorEvent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.site.deleteMany();
  await prisma.visitor.deleteMany();
}

export async function createSite(overrides: Partial<{ name: string; defaultNumber: string | null }> = {}) {
  return prisma.site.create({
    data: {
      name: overrides.name ?? "Test Site",
      defaultNumber: overrides.defaultNumber ?? null
    }
  });
}

export async function createVisitor(id: string) {
  return prisma.visitor.create({ data: { id } });
}
