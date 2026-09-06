import { buildServer } from "./api/server.js";
import { config } from "./config.js";
import { releaseExpiredAllocations } from "./domain/telephony/index.js";

async function main(): Promise<void> {
  const app = await buildServer();

  setInterval(() => {
    releaseExpiredAllocations(new Date()).catch((error) => app.log.error(error));
  }, 60_000).unref();

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, () => {
      app.log.info({ signal }, "shutdown_signal_received");
      app.close().then(
        () => process.exit(0),
        (error) => {
          app.log.error(error);
          process.exit(1);
        }
      );
    });
  }

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
