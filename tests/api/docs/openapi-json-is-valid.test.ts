import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { buildFullTestApp } from "../../helpers/fullApp.js";

describe("GET /docs/json", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns a valid OpenAPI 3 document", async () => {
    const app = await buildFullTestApp();
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/docs/json" });

    expect(response.statusCode).toBe(200);
    const doc = response.json();
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info.title).toBe("Hopups Server API");
    await app.close();
  });
});
