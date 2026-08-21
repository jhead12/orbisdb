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

Also worth noting: `client/package.json` has its own separate `resolutions` block still pinned to the original 2025-05-30 versions (`ws@8.17.1`, `axios@0.30.0`, `nanoid@5.0.9`, `secp256k1@5.0.1`) — it wasn't touched in this pass, which was scoped to the root dependency tree only.

Re-run `yarn audit` periodically to check whether upstream fixes have landed for the no-patch-available items above.

## Recommendation

Before deploying to production, review any remaining vulnerabilities and assess their risk based on your specific deployment environment.
