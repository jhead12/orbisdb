import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { spawn } from "child_process";

/** Initialize dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Builds the client/ Next.js app for production.
 *
 * This spawns client/'s own `next` binary as a child process rather than
 * calling into next/dist/build/index.js in-process. Root and client/ each
 * have their own separate node_modules with their own copy of `next`
 * (and of `react`/`react-dom`); calling the build API in-process would load
 * root's copy of Next.js, whose SSR runtime does plain `require("react")`
 * calls that bypass webpack aliasing, pulling in root's React alongside
 * client's and crashing prerendering with "Cannot read properties of null
 * (reading 'useContext')". Spawning client's own `next build` avoids ever
 * loading root's copy for this.
 */
export default async function buildNextApp() {
  const clientDir = path.resolve(__dirname, "../client");
  const nextBin = path.resolve(clientDir, "node_modules/.bin/next");

  return new Promise((resolve, reject) => {
    const child = spawn(nextBin, ["build"], {
      cwd: clientDir,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve(true) : reject(new Error(`next build exited with code: ${code}`))
    );
  });
}
