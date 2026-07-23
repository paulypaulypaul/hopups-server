import { prisma } from "../src/db/prisma.js";

async function main(): Promise<void> {
  const existing = await prisma.site.findFirst({ where: { name: "Coats N Stuff" } });
  if (existing) {
    console.log(`Seed site "Coats N Stuff" already exists (${existing.id}), skipping.`);
    return;
  }

  const site = await prisma.site.create({
    data: { name: "Coats N Stuff", defaultNumber: "+1-555-9999" }
  });

  await prisma.phoneNumber.create({
    data: { siteId: site.id, number: "+1-555-0001" }
  });

  await prisma.hopup.create({
    data: {
      siteId: site.id,
      active: true,
      conditions: [{ signal: "page.path", operator: "matches", value: ".*" }],
      repeatAllowance: 1,
      actions: {
        create: [{ type: "phoneNumberSwap", payload: { selector: ".phone-number" } }]
      }
    }
  });

  console.log(`Seeded demo site "Coats N Stuff" (${site.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
