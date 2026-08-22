#!/usr/bin/env node
// MCP (Model Context Protocol) server for web3.db-fileconnector.
//
// Runs standalone over stdio: it connects to Postgres/Ceramic/IPFS itself
// (see backend.js) rather than proxying an already-running `yarn start`
// server, so an agent can just spawn `node server/mcp/index.js` directly.
//
// IMPORTANT: the stdio transport requires stdout to carry ONLY JSON-RPC
// frames. Several modules this file pulls in transitively (Postgre's
// bootstrapTables/createTable paths, the GraphQL schema builder, the
// shared winston logger) write plain console.log/console.info/console.debug
// straight to stdout. Those calls are fine for the HTTP server (server/index.js)
// but would corrupt this process's protocol stream, so stdout is redirected
// to stderr for those methods before anything else is imported/run.
for (const method of ["log", "info", "debug"]) {
  console[method] = (...args) => process.stderr.write(`${args.join(" ")}\n`);
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import * as backend from "./backend.js";

const server = new McpServer({
  name: "web3db-fileconnector",
  version: "1.0.0",
});

function textResult(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: "text", text }] };
}

function errorResult(error) {
  return {
    content: [{ type: "text", text: `Error: ${error.message || String(error)}` }],
    isError: true,
  };
}

/** Wraps a tool handler so thrown/rejected errors become MCP error results
 *  instead of crashing the process or losing the underlying message. */
function safeTool(fn) {
  return async (...args) => {
    try {
      return textResult(await fn(...args));
    } catch (error) {
      return errorResult(error);
    }
  };
}

server.registerTool(
  "system_health",
  {
    title: "System health",
    description:
      "Checks connectivity to Postgres, Ceramic, and IPFS for the global slot. " +
      "Mirrors the app's GET /health route.",
    inputSchema: {},
  },
  safeTool(() => backend.checkHealth())
);

server.registerTool(
  "list_slots",
  {
    title: "List database slots",
    description:
      "Lists the known OrbisDB slots (\"global\" plus any configured shared slots). " +
      "Use this to find valid `slot` values for graphql_query.",
    inputSchema: {},
  },
  safeTool(() => backend.listSlots())
);

server.registerTool(
  "graphql_query",
  {
    title: "Run a GraphQL query or mutation",
    description:
      "Executes a GraphQL query or mutation against a database slot's generated " +
      "Orbis schema. Call list_slots first if you don't know a valid slot name.",
    inputSchema: {
      slot: z.string().describe("Slot name, e.g. \"global\" or one from list_slots"),
      query: z.string().describe("GraphQL query or mutation document"),
      variables: z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Variables for the query, if any"),
    },
  },
  safeTool(({ slot, query, variables }) => backend.runGraphQL(slot, query, variables))
);

server.registerTool(
  "ipfs_add",
  {
    title: "Add content to IPFS",
    description: "Adds content to the local IPFS node and returns its CID.",
    inputSchema: {
      content: z.string().describe("Content to store"),
      encoding: z
        .enum(["utf8", "base64"])
        .default("utf8")
        .describe("How `content` is encoded"),
    },
  },
  safeTool(async ({ content, encoding }) => {
    const ipfs = await backend.initIPFS();
    const cid = await ipfs.add(Buffer.from(content, encoding));
    return { cid };
  })
);

server.registerTool(
  "ipfs_get",
  {
    title: "Get content from IPFS",
    description: "Fetches content from the local IPFS node by CID.",
    inputSchema: {
      cid: z.string().describe("Content identifier to fetch"),
      encoding: z
        .enum(["utf8", "base64"])
        .default("utf8")
        .describe("How to encode the returned content"),
    },
  },
  safeTool(async ({ cid, encoding }) => {
    const ipfs = await backend.initIPFS();
    const buffer = await ipfs.get(cid);
    return { cid, content: buffer.toString(encoding) };
  })
);

server.registerTool(
  "ipfs_list",
  {
    title: "List pinned IPFS content",
    description: "Lists CIDs currently pinned on the local IPFS node.",
    inputSchema: {},
  },
  safeTool(async () => {
    const ipfs = await backend.initIPFS();
    return { cids: await ipfs.list() };
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`Fatal error starting MCP server: ${error.stack || error}\n`);
  process.exit(1);
});
