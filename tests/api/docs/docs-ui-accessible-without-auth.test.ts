import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { buildFullTestApp } from "../../helpers/fullApp.js";

describe("GET /docs", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 200 without requiring authentication", async () => {
    const app = await buildFullTestApp();
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/docs" });

    expect(response.statusCode).toBe(200);
    await app.close();
  });
});
