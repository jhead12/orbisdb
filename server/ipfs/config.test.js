import { describe, it, expect, vi, beforeEach } from "vitest";

const addMock = vi.fn();
const catMock = vi.fn();
const pinLsMock = vi.fn();

vi.mock("kubo-rpc-client", () => ({
  create: vi.fn(() => ({
    add: addMock,
    cat: catMock,
    pin: { ls: pinLsMock },
  })),
}));

describe("server/ipfs/config", () => {
  beforeEach(() => {
    vi.resetModules();
    addMock.mockReset();
    catMock.mockReset();
    pinLsMock.mockReset();
  });

  it("add() stores content on the daemon and returns the CID string", async () => {
    addMock.mockResolvedValue({ cid: { toString: () => "bafyTestCid" } });

    const { initIPFS } = await import("./config.js");
    const ipfs = await initIPFS();
    const cid = await ipfs.add("Hello IPFS!");

    expect(cid).toBe("bafyTestCid");
    expect(addMock).toHaveBeenCalledWith("Hello IPFS!");
  });

  it("get() concatenates streamed chunks into a Buffer", async () => {
    catMock.mockImplementation(async function* () {
      yield Buffer.from("hel");
      yield Buffer.from("lo");
    });

    const { initIPFS } = await import("./config.js");
    const ipfs = await initIPFS();
    const result = await ipfs.get("bafyTestCid");

    expect(result.toString()).toBe("hello");
  });

  it("list() returns pinned CIDs as strings", async () => {
    pinLsMock.mockImplementation(async function* () {
      yield { cid: { toString: () => "cid1" } };
      yield { cid: { toString: () => "cid2" } };
    });

    const { initIPFS } = await import("./config.js");
    const ipfs = await initIPFS();
    const pins = await ipfs.list();

    expect(pins).toEqual(["cid1", "cid2"]);
  });
});
