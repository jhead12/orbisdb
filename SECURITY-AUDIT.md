# Security Audit Report

**Date:** 2025-05-30

## Overview

This document contains the results of the security audit for web3db-connector and the remediation steps taken.

## Fixed Vulnerabilities

The following direct dependencies were patched to secure versions:

- ws@8.17.1
- axios@0.30.0
- nanoid@5.0.9
- @babel/runtime@7.26.10
- parse-duration@2.1.3
- secp256k1@5.0.1

## Transitive Dependencies

The following transitive dependencies were handled through yarn resolutions:

- ws:8.17.1
- secp256k1:5.0.1
- parse-duration:2.1.3
- axios:0.30.0
- nanoid:5.0.9
- @babel/runtime:7.26.10

## Remaining Vulnerabilities

Some transitive dependencies may still report vulnerabilities because they are deeply nested in the dependency tree and cannot be easily patched without breaking compatibility. These are documented below:

1. Some dependencies within @composedb/devtools and @ceramicnetwork/cli packages may still report vulnerabilities.
2. The project team should consider upgrading these dependencies in a future minor release.
3. Most critical security issues have been addressed in the current version.

## Update: 2026-08-21

Root `package.json`'s `dependencies`/`devDependencies` block had been accidentally destroyed by a botched merge (commit `22c7e6a`) and was never restored, so `yarn audit` had effectively nothing to check. Restoring the full dependency list (74 deps + 24 devDeps, recovered from the last-known-good `package-lock.json`) surfaced the real audit surface for the first time: 646 findings across 2995 packages (8 critical, 279 high, 303 moderate, 56 low).

**Fixed this pass:**
- Removed `helia`/`@helia/strings` and `mercurius` — confirmed unused anywhere in the codebase (IPFS now goes through `kubo-rpc-client` against the real Kubo daemon; GraphQL is served via `graphql-yoga`, not Mercurius). This alone eliminated the `@libp2p/kad-dht` advisory.
- Bumped direct dependencies to patched versions: `@fastify/static` (8.x → 10.1.2), `axios` (0.30.0 → ^1.18.0), `nanoid` (→ ^5.1.16), `uuid` (→ ^11.1.1), `parse-duration`, `secp256k1`, `@babel/runtime`, `ws` (→ ^8.21.0).
- Added/extended `resolutions` to force these patched versions across *all* transitive copies (yarn classic doesn't dedupe across divergent semver ranges otherwise, which is why the original 2025-05-30 pins above weren't fully propagating): `ws`, `axios`, `nanoid`, `uuid`, `parse-duration`, `secp256k1`, `@babel/runtime`, plus newly identified `tar`, `bn.js`, `postcss`, `undici`, `@opentelemetry/core`, `@opentelemetry/exporter-prometheus`, `@eslint/plugin-kit`, `@tootallnate/once`.
- Bumped `next` from `^13.5.6` to `^14.2.35` — clears every "high" severity Next.js advisory (SSRF, auth bypass, DoS via Server Components). Verified the custom Fastify+Next server integration (`server/index.js`) still boots correctly after the bump.

**Result:** 646 → 48 findings (0 critical, 8 high, 16 moderate, 24 low).

**Remaining, no patch available (`patched_versions: <0.0.0` in the advisory data):**
- `elliptic` (low) — via `secp256k1` → `elliptic`, used for the project's crypto/wallet operations.
- `@stablelib/ed25519` (moderate) — via `did-session` → `key-did-resolver`, part of the required DID-auth chain.
- `aws-sdk` (low) — via `@ceramicnetwork/cli` → `aws-sdk`. `@ceramicnetwork/cli` only provides the `ceramic` CLI binary for dev scripts (confirmed never imported as a JS module), so this is dev/ops-path exposure only.

**Remaining, deliberately not chased this pass:**
- `next` (8 findings) — several of the newest Next.js advisories (cache-poisoning, XSS) are only fixed at 15.5.x. A 14.2.x → 15.x jump was deferred as a separate, larger follow-up requiring more integration testing.

Re-run `yarn audit` periodically to check whether upstream fixes have landed for the no-patch-available items above.

## Update: 2026-08-22 — client/ dependency remediation

`client/package.json` has its own separate dependency tree and `resolutions` block that hadn't been touched in the pass above — it was still pinned to the original 2025-05-30 versions (`ws@8.17.1`, `axios@0.30.0`, `nanoid@5.0.9`, `secp256k1@5.0.1`). Running `yarn audit` inside `client/` for the first time with its real tree surfaced 569 findings (21 critical, 264 high, 241 moderate, 43 low) across 953 packages — the same pattern as the root audit, just not yet remediated.

**Fixed this pass (mirrors the root remediation):**
- Removed `helia`/`@helia/strings` — confirmed unused in `client/` as well (nothing imports them). This alone eliminated the `@libp2p/kad-dht` advisory, same as in root.
- Bumped `axios` (0.30.0 → ^1.18.0), `nanoid` (→ ^5.1.16), `ws` (→ ^8.21.0), `secp256k1` (→ ^4.0.4), `next` (^14.1.0, locked to 14.2.29 → ^14.2.35, matching root).
- Extended `resolutions` to force patched versions across all transitive copies: `uuid`, `tar`, `tar-fs`, `postcss`, `bn.js`, `undici`, `@opentelemetry/core`, `@opentelemetry/exporter-prometheus`, `@tootallnate/once`, `pbkdf2`, `sha.js`, `form-data`, `protobufjs`, `@protobufjs/utf8`, `node-forge`, `jws`, `minimatch`, `lodash`, `fast-uri`, `ip-address`, `ajv`, `follow-redirects`, `brace-expansion`.
- Verified `next build` still resolves and runs against 14.2.35 (fails only on the same pre-existing, unrelated `@useorbis/db-sdk/auth` TypeScript error already known and made non-blocking in the root `typecheck` script — not something these bumps introduced).

**Result:** 569 → 41 findings (0 critical, down from 21).

**Remaining, no patch available:**
- `elliptic` and `@stablelib/ed25519` — same DID-auth chain, same status as root.

**Remaining, deliberately not chased (same as root):**
- `next` — the rest of the findings are all fixed only at various 15.x patch levels (`>=15.0.8` through `>=15.5.21`). The 14.2.x → 15.x jump is deferred as a separate follow-up, consistent with the root decision.

Root and `client/` are now in sync on dependency remediation status.

## Update: 2026-08-21 (2) — Exposed private key material

While preparing the 1.8.7 npm release, `npm pack --dry-run` surfaced two committed files containing real, non-placeholder private key seed material that had been published to npm in every prior release:

- `server/Orbisdb-connection/admin.sk`
- `server/ceramic-app/admin.sk`

Each contained a 32-byte hex seed. Neither file is read by any code in the repository — the actual Ceramic admin seed used at runtime comes from `orbisdb-settings.json` (gitignored, generated locally by the setup flow), so these were dead artifacts, not live configuration. Both files were removed, and `*.sk` was added to `.gitignore` and `.npmignore` to prevent recurrence. **This only stops future exposure** — the specific seed values in git history are already public and should be treated as compromised if they were ever used for anything beyond local testing.

Also found and fixed while auditing what the npm package actually contains:
- `.npmignore`'s `scripts/` exclusion was also silently excluding `scripts/nextBuild.js`, which `server/index.js` imports unconditionally — every published version back through 1.8.6 was missing a file required at import time. Added an explicit exception.
- `server/wheel` (a 15MB arm64-only dev CLI binary) and `client/public/uploads/` (1.9MB of unreferenced leftover files) were also shipping in every release; both are now excluded/removed. Package size dropped from 10.9MB to 3.5MB compressed.

## Update: 2026-08-22 (3) — Next.js 15 upgrade in client/

The previous pass deferred the `next` 14.2.x → 15.x jump in `client/` because it required integration testing beyond just `yarn audit`. That testing is now done: `next` was bumped from `^14.2.35` to `^15.5.21` (installed: 15.5.23) in both `client/package.json` and root `package.json` (root imports `next` directly for the custom Fastify+Next server in `server/index.js`).

**Fixed this pass:**
- Bumped `next` to `^15.5.21` in both `client/` and root; `react`/`react-dom` stay on `^18.2.0` (Next 15's peer range still supports React 18, no React 19 migration needed since the app uses the Pages Router).
- Verified the custom-server integration (`next({ dev, dir }).prepare()` / `getRequestHandler()` in `server/index.js`) still works under Next 15 — this API is unchanged.
- Along the way, found and fixed a real, pre-existing `npm run build` failure that predated this upgrade (confirmed by reproducing the identical failure after temporarily reinstalling Next 14): `client/tsconfig.json`'s `moduleResolution: "node"` couldn't resolve `@useorbis/db-sdk/auth`'s types (fixed by switching to `"bundler"`); `react-ace`/`ace-builds` were declared as root-only dependencies but used exclusively in `client/`, causing a duplicate/unresolvable `react` type identity for `AceEditor` (fixed by moving both to `client/package.json` and bumping `react-ace` 14.0.1 → 15.0.0); and `react-ace`/`ace-builds` were statically imported at module scope, crashing static-page generation with `ReferenceError: ace is not defined` because they touch browser globals during server-side page-data collection (fixed by wrapping all three usage sites — `components/PluginVariables.tsx`, `pages/data/index.tsx`, `pages/playground/index.tsx` — in `next/dynamic(..., { ssr: false })`). `npm run build` now completes and prerenders all 18 pages.

**Result:** `client/` audit findings dropped from 41 → 21 (0 critical, 1 high — down from 8; the remaining high is `sharp`'s inherited libvips CVEs, unrelated to Next.js).

**Remaining, no patch available:** unchanged — `elliptic` and `@stablelib/ed25519`.

## Recommendation

Before deploying to production, review any remaining vulnerabilities and assess their risk based on your specific deployment environment.
