// client/pages/api/settings.js
import { CeramicClient } from "@ceramicnetwork/http-client";
import { ComposeClient } from "@composedb/client";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import jwt from "jsonwebtoken";
import { StreamID } from "@ceramicnetwork/streamid";
import { Model } from "@ceramicnetwork/stream-model";

// JWT secret - in production, use an environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to convert hex string to Uint8Array (replacement for uint8arrays/from-string)
function fromString(hexString, encoding) {
  if (encoding === "base16") {
    // Remove 0x prefix if present
    const cleanHex = hexString.replace(/^0x/, "");
    // Convert hex string to Uint8Array
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  }
  throw new Error(`Unsupported encoding: ${encoding}`);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Return default settings for now
      res.status(200).json({
        settings: {
          // Add your default settings here
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
