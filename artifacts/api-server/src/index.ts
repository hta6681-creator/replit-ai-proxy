import app from "./app.js";
import { logger } from "./lib/logger.js";
const port = Number(process.env.PORT || 8080);
const server = app.listen(port, () => { logger.info({ port }, "Server listening"); });
server.on("error", (err: Error) => { logger.error({ err }, "Failed to start"); process.exit(1); });
