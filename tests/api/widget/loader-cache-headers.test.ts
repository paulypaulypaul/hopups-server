import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../../src/db/prisma.js";
import { buildWidgetTestApp } from "../../helpers/widgetApp.js";

describe("GET /widget/loader.js", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("serves the loader with a long-lived Cache-Control header", async () => {
    const app = await buildWidgetTestApp();

    const response = await app.inject({ method: "GET", url: "/widget/loader.js" });

    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toContain("max-age=86400");
    await app.close();
  });
});
