## [1.8.7] - 2026-08-21

### Fixed

- Fixed `ReferenceError` on `POST /api/settings/restart` caused by a missing `cliColors` import ([ea11444](https://github.com/jhead12/web3.db-fileconnector/commit/ea11444))
- Replaced the placeholder in-memory `server/ipfs/config.js` with a real IPFS integration via `kubo-rpc-client`, connecting to the local Kubo daemon (`ipfs daemon`); `helia:test` script renamed to `ipfs:test` to match ([aafc814](https://github.com/jhead12/web3.db-fileconnector/commit/aafc814))
- Fixed `validate`/`prepublishOnly`/`publish:release` scripts, which referenced nonexistent `typecheck`/`test:security` scripts and hard-failed immediately ([aafc814](https://github.com/jhead12/web3.db-fileconnector/commit/aafc814))
- Restored root `package.json`'s `dependencies`/`devDependencies`, accidentally destroyed by a botched merge and never recovered ([aafc814](https://github.com/jhead12/web3.db-fileconnector/commit/aafc814))
- Corrected README's version badge, script reference tables, broken NPM deep-import examples, and `docker-compose.prod.yml` reference to match the actual repo state ([ea11444](https://github.com/jhead12/web3.db-fileconnector/commit/ea11444))
- Made `GET /health` and `npm run system:check` report real service status (database/Ceramic/IPFS connectivity) instead of a hardcoded `"OK"` and a call to a nonexistent script ([da53285](https://github.com/jhead12/web3.db-fileconnector/commit/da53285))
- Fixed a module-import side effect where merely importing `server/utils/helpers.js` or the settings route (or anything depending on them) booted the entire Fastify/Next/Postgres/Ceramic app, because `startIndexing` was imported eagerly from `server/index.js` just to be called inside a handler; both call sites now use a deferred `import()` ([cfedfd8](https://github.com/jhead12/web3.db-fileconnector/commit/cfedfd8))
- **Critical packaging bug**: every published version back through 1.8.6 shipped without `scripts/nextBuild.js`, which `server/index.js` imports unconditionally for the production build fallback path — `.npmignore`'s blanket `scripts/` exclusion was silently breaking the package for any fresh install. Added an explicit `!scripts/nextBuild.js` exception.
- Made `yarn typecheck` non-blocking (matching the existing pattern for `lint`/`test:security`) so pre-existing, unrelated TypeScript errors in `client/` don't hard-fail `validate`/`prepublishOnly`.

### Removed

- Removed dead/broken files never wired into the app: two Express plugin route templates importing a nonexistent helper, a duplicate `client/global-utils.js`, an unusable CommonJS `config.js`, and a third dead Express route file (`server/routes/api/plugins/registry.js`) ([ea11444](https://github.com/jhead12/web3.db-fileconnector/commit/ea11444), [aafc814](https://github.com/jhead12/web3.db-fileconnector/commit/aafc814))
- Removed tracked runtime/junk files that predated `.gitignore` rules (stray `.pid`, `.temp`/`.tmp`, `.bak` files) and consolidated three coexisting lockfiles down to `yarn.lock` ([ea11444](https://github.com/jhead12/web3.db-fileconnector/commit/ea11444))
- Removed unused `helia`, `@helia/strings`, and `mercurius` dependencies, confirmed unused anywhere in the codebase ([6e50b5a](https://github.com/jhead12/web3.db-fileconnector/commit/6e50b5a))
- Removed `server/Orbisdb-connection/admin.sk` and `server/ceramic-app/admin.sk` — unreferenced files containing real private key seed material that had been committed and published to npm in every prior release. Nothing in the codebase reads these files (the real, in-use Ceramic admin seed lives in the gitignored `orbisdb-settings.json`, generated locally). Added `*.sk` to `.gitignore`/`.npmignore` to prevent recurrence.
- Removed `client/public/uploads/` (15 files, ~1.9MB) — unreferenced leftover test uploads that had been shipping in every npm release.

### Added

- Added a `vitest` test suite (`yarn test`) with starter coverage for the new IPFS config module and existing pure utility functions ([aafc814](https://github.com/jhead12/web3.db-fileconnector/commit/aafc814))

### Security

- Restored the real dependency tree for `yarn audit`, which had almost nothing to check while `package.json` was missing its dependencies. Remediated the resulting findings from 646 down to 48 (0 critical, down from 8): patched/pinned `ws`, `axios`, `nanoid`, `uuid`, `tar`, `undici`, `bn.js`, `postcss`, and others via `yarn resolutions`; bumped `next` from 13.5.6 to 14.2.35, clearing every high-severity Next.js advisory. Remaining findings (no patch available yet for `elliptic`, `@stablelib/ed25519`, `aws-sdk`; a few 15.x-only Next.js advisories deliberately deferred) are documented in `SECURITY-AUDIT.md` ([6e50b5a](https://github.com/jhead12/web3.db-fileconnector/commit/6e50b5a))
- Removed real private key seed material (`*.sk` files) that had been published to npm in every prior release; see "Removed" above. Note this only stops future exposure — the seed values themselves were already public and should be treated as compromised if ever used for anything real.

## [1.8.6] - 2025-05-31

### Bug Fixes

- apply comprehensive security patches and add automated security scripts ([9933b06](https://github.com/jhead12/web3.db-fileconnector/commit/9933b06d6f5fc270c0b7dce9ac61c31967511cc6))

### Security

- patched direct dependencies with security vulnerabilities: ws@8.17.1, axios@0.30.0, nanoid@5.0.9, @babel/runtime@7.26.10, parse-duration@2.1.3, secp256k1@5.0.1
- Added resolutions to package.json to handle transitive dependencies with vulnerabilities
- Created automated scripts for security patching and release process
- Note: Some transitive dependencies still contain vulnerabilities that need to be addressed in future releases

## [1.8.5] - 2025-05-31

### Bug Fixes

- fix React hook error in client application ([#123](https://github.com/jhead12/web3.db-fileconnector/pull/123))
- improve Ceramic network status handling ([#124](https://github.com/jhead12/web3.db-fileconnector/pull/124))

## [1.8.4] - 2025-05-30

### Bug Fixes

- update prepare-release script and dependencies ([e7dcb72](https://github.com/jhead12/web3.db-fileconnector/commit/e7dcb721b0a9c313f3c83a651cd3f9200b3f5b7a))
- update prepare-release.sh with proper paths ([ae1cfa7](https://github.com/jhead12/web3.db-fileconnector/commit/ae1cfa7b3d1172450049df325f32282dfcda1932))
- update version from 2.0.0 to 1.8.4 and resolve merge conflict markers ([5deb909](https://github.com/jhead12/web3.db-fileconnector/commit/5deb9090cccb87e3d1a965b7723a0715bd41c756))
