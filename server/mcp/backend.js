// Connection layer for the MCP server. Kept separate from the protocol
// wiring in index.js so it can be exercised without spinning up stdio.
//
// This intentionally does NOT import "../index.js" (the app's Fastify
// entrypoint), which boots a full HTTP server as a side effect of being
// imported. Instead it composes the same building blocks that entrypoint
// uses (getOrbisDBSettings / Postgre / Ceramic / initIPFS) so it can
// connect on its own, independent of whether `yarn start` is running.

import { graphql } from "graphql";
import { getOrbisDBSettings } from "../utils/helpers.js";
import Postgre from "../db/postgre.js";
import Ceramic from "../ceramic/config.js";
import { initIPFS } from "../ipfs/config.js";

const PORT = process.env.PORT || 7008;

// Cached per slot: { db, ceramic, schema }
const slotCache = new Map();

function loadSettings() {
  const settings = getOrbisDBSettings();
  if (!settings?.configuration) {
    throw new Error(
      "OrbisDB isn't configured yet (missing orbisdb-settings.json or its " +
        "`configuration` block). Run the app's setup (see README) first."
    );
  }
  return settings;
}

/** Lists the known database slots ("global" plus any shared slots). */
export function listSlots() {
  const settings = loadSettings();
  const slots = new Set(["global"]);
  if (settings.is_shared && settings.slots) {
    for (const key of Object.keys(settings.slots)) slots.add(key);
  }
  return [...slots];
}

async function initSlot(slotName, settings) {
  const globalDbConfig = settings.configuration.db;
  const globalCeramicConfig = settings.configuration.ceramic;
  const serverUrl = `http://${process.env.HOST || "localhost"}:${PORT}`;

  let databaseName = globalDbConfig.database;
  let seed = globalCeramicConfig.seed;

  if (slotName !== "global") {
    const slot = settings.slots?.[slotName];
    if (!slot?.configuration) {
      throw new Error(`Unknown or unconfigured slot: ${slotName}`);
    }
    databaseName = slot.configuration.db.database;
    seed = slot.configuration.ceramic.seed;
  }

  const db = await Postgre.initialize(
    globalDbConfig.user,
    databaseName,
    globalDbConfig.password,
    globalDbConfig.host,
    globalDbConfig.port,
    slotName
  );

  const ceramic = new Ceramic(globalCeramicConfig.node, serverUrl, seed);

  return { db, ceramic, schema: null };
}

/** Lazily connects (and caches) the Postgres + Ceramic clients for a slot. */
export async function getSlot(slotName) {
  if (slotCache.has(slotName)) return slotCache.get(slotName);

  const settings = loadSettings();
  const entry = await initSlot(slotName, settings);
  slotCache.set(slotName, entry);
  return entry;
}

async function getSchema(slotName) {
  const entry = await getSlot(slotName);
  if (!entry.schema) {
    entry.schema = await entry.db.generateGraphQLSchema();
  }
  return entry.schema;
}

/** Executes a GraphQL query/mutation against a slot's generated schema. */
export async function runGraphQL(slotName, query, variables) {
  const schema = await getSchema(slotName);
  return graphql({ schema, source: query, variableValues: variables });
}

async function checkIPFS() {
  try {
    const ipfs = await initIPFS();
    return (await ipfs.isConnected()) ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
}

async function checkDatabase() {
  try {
    const { db } = await getSlot("global");
    await db.adminPool.query("SELECT 1");
    return "connected";
  } catch {
    return "disconnected";
  }
}

async function checkCeramic() {
  try {
    const { ceramic } = await getSlot("global");
    const response = await fetch(`${ceramic.node}/api/v0/node/healthcheck`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.status === 200 ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
}

/** Same shape as the app's GET /health route, computed independently. */
export async function checkHealth() {
  let settings;
  try {
    settings = loadSettings();
  } catch (e) {
    return {
      status: "not_configured",
      timestamp: new Date().toISOString(),
      services: {
        database: "not_initialized",
        ceramic: "not_initialized",
        ipfs: await checkIPFS(),
      },
      message: e.message,
    };
  }
  void settings;

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
}

export { initIPFS };
