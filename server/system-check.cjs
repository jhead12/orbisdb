const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const logDir = path.join(__dirname, "logs");
const logFilePath = path.join(logDir, "system-check.log");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `${timestamp} - ${message}\n`);
  console.log(message);
}

function checkBinary(bin) {
  try {
    execSync(`command -v ${bin}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function checkFile(relativePath) {
  return fs.existsSync(path.join(__dirname, "..", relativePath));
}

function systemCheck() {
  const checks = [
    { label: "node", ok: checkBinary("node"), required: true },
    { label: "yarn", ok: checkBinary("yarn"), required: true },
    { label: "ipfs (Kubo daemon)", ok: checkBinary("ipfs"), required: false },
    { label: "ceramic CLI", ok: checkBinary("ceramic"), required: false },
    { label: ".env file", ok: checkFile(".env"), required: false },
    {
      label: "orbisdb-settings.json",
      ok: checkFile("orbisdb-settings.json"),
      required: false,
    },
  ];

  let hasRequiredFailure = false;

  for (const check of checks) {
    const status = check.ok ? "OK" : check.required ? "MISSING (required)" : "MISSING";
    log(`${check.label}: ${status}`);
    if (!check.ok && check.required) hasRequiredFailure = true;
  }

  log(
    hasRequiredFailure
      ? "System check failed: required dependencies are missing."
      : "System check completed successfully."
  );

  process.exit(hasRequiredFailure ? 1 : 0);
}

systemCheck();
