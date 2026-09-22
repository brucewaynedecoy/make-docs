# Legacy Package Fixtures

These archives are exact inputs for the W22 R0 P7 upgrade tests. Do not rebuild them from the current source.

## `make-docs-0.1.0.tgz`

- Package: `make-docs@0.1.0`
- SHA-256: `aa9c10e20a49dfeb5afbcd3e26fd9873d4362311fe277145be5a4332a80d6acb`
- Source identity: The package metadata and the bundled source-map bodies for `cli.ts`, `wizard.ts`, and `index.ts` match Git commit `55b0cbec5526f5a1cd32c8ba284e4c00498e84c6` byte for byte.
- Registry status: This package version was not published under `make-docs` or `@brucewaynedecoy/make-docs` on npm.

## `brucewaynedecoy-make-docs-1.0.0-rc.1.tgz`

- Package: `@brucewaynedecoy/make-docs@1.0.0-rc.1`
- SHA-256: `dfad170ceffc6e74c2afd397b390be5c900bd2e74e63491598c394382e209d71`
- npm SHA-1: `684a0791879e1218ddb7148d46c0adad55c7405b`
- npm integrity: `sha512-lF8MH7lRxAclI5ewIK4johoerXhD9EpJlGbXpDKOjtHGdl8kCPXb8xtNSeAivHoYgYtBsSTF3x4wxfTwSrhzyg==`
- Source identity: This is the exact archive returned by `npm pack @brucewaynedecoy/make-docs@1.0.0-rc.1`.

## `brucewaynedecoy-make-docs-2.0.0-rc-f5fd5579.tgz`

- Package: `@brucewaynedecoy/make-docs@2.0.0-rc`
- SHA-256: `6008ee431f8e42d3714da8df512a934aa5e3f5d930a7a0c8104a17768a0fb878`
- Source identity: This archive was built from Git commit `f5fd5579849debf87f5a700dd8b8a656c4f01e87`, the accepted W22 R0 P2 commit. All 109 bundled Make Docs `packages/cli/src/**` source-map bodies match that commit byte for byte.
- Build environment: Node.js `v24.19.0`, npm `11.17.0`, and the locked `tsup@8.5.1` dependency from the unchanged root lock file.
- Build command: Extract the exact commit with `git archive`, expose the repository root `node_modules` directory to that extracted tree, then run `npm pack` from its `packages/cli` directory.
- Reproducibility limit: The retained SHA-256 identifies this exact built archive. The generated source maps can include build-root paths. A build under a different path can have a different archive digest. The source-map body comparison, commit identity, package metadata, and retained digest are the provenance proof.
- Store identity: A plain setup from this archive creates Store schema 3 and an installation ledger with manifest schema 4. This is the exact old Store shape used by the P7 partial-install upgrade regression.

The tests check each SHA-256 digest before they run a historical package.
