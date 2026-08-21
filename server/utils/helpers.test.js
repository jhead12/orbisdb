import { describe, it, expect, vi } from "vitest";

// helpers.js imports startIndexing from ../index.js, which boots the full
// Fastify/Postgres/Ceramic app as a side effect of import — stub it out so
// this test only loads the pure utility functions. Also stub the logger,
// which pulls in winston, to keep this a narrow unit test.
vi.mock("../index.js", () => ({ startIndexing: vi.fn() }));
vi.mock("../logger/index.js", () => ({
  default: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const { toValidDbName, parseDidSeed, findContextById } = await import(
  "./helpers.js"
);

describe("toValidDbName", () => {
  it("replaces invalid characters with underscores", () => {
    expect(toValidDbName("did:pkh:eip155:1:0xabc")).toBe(
      "did_pkh_eip155_1_0xabc"
    );
  });

  it("prefixes names that don't start with a letter or underscore", () => {
    expect(toValidDbName("123table")).toBe("_123table");
  });

  it("truncates to Postgres' 63 character limit", () => {
    const longName = "a".repeat(100);
    expect(toValidDbName(longName)).toHaveLength(63);
  });
});

describe("parseDidSeed", () => {
  it("returns a valid hex seed string unchanged", () => {
    expect(parseDidSeed("0xabc123")).toBe("0xabc123");
  });

  it("parses a JSON-encoded array into a Uint8Array", () => {
    const result = parseDidSeed("[1,2,3]");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([1, 2, 3]);
  });

  it("throws for a non-hex, non-array string", () => {
    expect(() => parseDidSeed("not a valid seed")).toThrow();
  });
});

describe("findContextById (server signature: id, contexts)", () => {
  const contexts = [
    { stream_id: "a", contexts: [{ stream_id: "a-1" }] },
    { stream_id: "b" },
  ];

  it("finds a top-level context by id", () => {
    expect(findContextById("b", contexts)).toEqual({ stream_id: "b" });
  });

  it("finds a nested context by id", () => {
    expect(findContextById("a-1", contexts)).toEqual({ stream_id: "a-1" });
  });

  it("returns null when no context matches", () => {
    expect(findContextById("missing", contexts)).toBeNull();
  });
});
