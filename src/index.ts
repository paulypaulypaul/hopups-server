import { buildServer } from "./api/server.js";
import { config } from "./config.js";
import { releaseExpiredAllocations } from "./domain/telephony/index.js";

async function main(): Promise<void> {
  const app = await buildServer();

  setInterval(() => {
    releaseExpiredAllocations(new Date()).catch((error) => app.log.error(error));
  }, 60_000).unref();

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
