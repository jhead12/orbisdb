import ApiRoutes from "./api/index.js";
import GraphQLRoute from "./graphql/index.js";
import { initIPFS } from "../ipfs/config.js";

const checkDatabase = async () => {
  try {
    if (!global.indexingService?.database?.adminPool) return "not_initialized";
    await global.indexingService.database.adminPool.query("SELECT 1");
    return "connected";
  } catch {
    return "disconnected";
  }
};

const checkCeramic = async () => {
  try {
    const node = global.indexingService?.ceramic?.node;
    if (!node) return "not_initialized";
    const response = await fetch(`${node}/api/v0/node/healthcheck`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.status === 200 ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
};

const checkIPFS = async () => {
  try {
    const ipfs = await initIPFS();
    return (await ipfs.isConnected()) ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
};

export default async function (server, opts) {
  await server.register(ApiRoutes, { prefix: "/api" });

  await server.register(GraphQLRoute);

  // Healthcheck endpoint
  // TODO: Deprecate and replace with a prefixed /api/ping
  server.get("/health", async () => {
    const [database, ceramic, ipfs] = await Promise.all([
      checkDatabase(),
      checkCeramic(),
      checkIPFS(),
    ]);

    return {
      status: [database, ceramic, ipfs].every((s) => s === "connected")
        ? "healthy"
        : "degraded",
      timestamp: new Date().toISOString(),
      services: { database, ceramic, ipfs },
    };
  });
}
