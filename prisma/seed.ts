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

  // Fires on every page — swaps the nav phone number for a call-tracking one.
  await prisma.hopup.create({
    data: {
      siteId: site.id,
      active: true,
      conditions: [], // empty conditions match every visitor, per the rules engine
      repeatAllowance: 1,
      actions: {
        create: [{ type: "phoneNumberSwap", payload: { selector: ".phone-number" } }]
      }
    }
  });

  // Fires on every page — a persistent promo banner.
  await prisma.hopup.create({
    data: {
      siteId: site.id,
      active: true,
      conditions: [], // empty conditions match every visitor, per the rules engine
      repeatAllowance: 1,
      actions: {
        create: [
          {
            type: "banner",
            payload: { message: "Free shipping on orders over $50 today!", ctaLabel: "Shop now", ctaUrl: "#jackets" }
          }
        ]
      }
    }
  });

  // Fires only on a visitor's first recorded page view — a welcome offer.
  await prisma.hopup.create({
    data: {
      siteId: site.id,
      active: true,
      conditions: [{ signal: "visit.count", operator: "eq", value: 1 }],
      repeatAllowance: 1,
      actions: {
        create: [
          {
            type: "modal",
            payload: {
              title: "Welcome!",
              body: "Get 10% off your first order.",
              ctaLabel: "Claim 10% off",
              ctaUrl: "#jackets"
            }
          }
        ]
      }
    }
  });

  // Fires only with ?promo=html — demonstrates the customHtml action.
  await prisma.hopup.create({
    data: {
      siteId: site.id,
      active: true,
      conditions: [{ signal: "query.promo", operator: "eq", value: "html" }],
      repeatAllowance: 1,
      actions: {
        create: [
          {
            type: "customHtml",
            payload: {
              html: "<div style=\"position:fixed;bottom:1rem;right:1rem;background:#212121;color:#fff;padding:.75rem 1rem;border-radius:4px;font-family:sans-serif;z-index:9999;\">🎉 Custom HTML action demo</div>"
            }
          }
        ]
      }
    }
  });

  // Fires only with ?promo=redirect — demonstrates the redirect action.
  await prisma.hopup.create({
    data: {
      siteId: site.id,
      active: true,
      conditions: [{ signal: "query.promo", operator: "eq", value: "redirect" }],
      repeatAllowance: 1,
      actions: {
        create: [
          {
            type: "redirect",
            payload: { url: "/demo-site.html?promo=landed", delayMs: 1500 }
          }
        ]
      }
    }
  });

  // Fires only with ?promo=sidebar — demonstrates the sidebar action.
  await prisma.hopup.create({
    data: {
      siteId: site.id,
      active: true,
      conditions: [{ signal: "query.promo", operator: "eq", value: "sidebar" }],
      repeatAllowance: 1,
      actions: {
        create: [
          {
            type: "sidebar",
            payload: {
              position: "right",
              title: "Winter Sale",
              message: "20% off all jackets this week.",
              ctaLabel: "Browse jackets",
              ctaUrl: "#jackets"
            }
          }
        ]
      }
    }
  });

  console.log(`Seeded demo site "Coats N Stuff" (${site.id}) with 6 example hopups`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
