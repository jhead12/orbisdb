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
