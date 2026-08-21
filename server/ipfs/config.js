import { create } from "kubo-rpc-client";

let ipfsInstance;

/** Connects to the local Kubo (go-ipfs) daemon started via `ipfs daemon`
 *  (see setup:ipfs / start:ipfs scripts). Configure the daemon's API
 *  address with IPFS_API_URL (see .env.sample), defaults to the
 *  standard local Kubo API address. */
export const initIPFS = async () => {
  if (!ipfsInstance) {
    const apiUrl = process.env.IPFS_API_URL || "/ip4/127.0.0.1/tcp/5001";
    const client = create({ url: apiUrl });

    ipfsInstance = {
      add: async (content) => {
        const { cid } = await client.add(content);
        return cid.toString();
      },
      get: async (cidString) => {
        const chunks = [];
        for await (const chunk of client.cat(cidString)) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      },
      list: async () => {
        const cids = [];
        for await (const { cid } of client.pin.ls()) {
          cids.push(cid.toString());
        }
        return cids;
      },
      isConnected: async () => {
        try {
          await client.id();
          return true;
        } catch {
          return false;
        }
      },
    };
  }
  return ipfsInstance;
};
