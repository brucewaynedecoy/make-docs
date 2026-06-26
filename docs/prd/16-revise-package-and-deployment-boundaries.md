# 16 Revise Package and Deployment Boundaries

## Purpose

This revision records the effective package, command, deployment, and release-channel boundary for the v2 Make Docs work. It reconciles the accepted package/deployment design, the W10 R1 plan, and the W10 R7 runtime pivot into the active PRD set so downstream package, compatibility, MCP, and release-validation work does not reopen the product identity or runtime-ownership decision.

The change keeps the TypeScript package CLI as the v2 implementation source of truth for install, maintenance, deterministic operations, remote package execution, and the required MCP server surface.

## Change Type

Revision.

This document supersedes stale rename, alias, Rust-runtime, same-command dual-runtime, and PATH-order assumptions. It enhances package-validation, lifecycle-safety, skills-delivery, remote package execution, and TypeScript-owned MCP requirements across the active PRD set.

## Baseline Being Revised or Removed

This revision updates these baseline assumptions:

- A broad v2 product rename is no longer active. The effective names are `make-docs` for the package and command identifier, `Make Docs` for prose, and `MakeDocs` where spaces or hyphens are unavailable.
- The package binary remains `make-docs` for the TypeScript package CLI. The v2 surface does not add default compatibility aliases such as `makedocs`, `make-docs-js`, `make-docs-rs`, or `make-docs-engine`.
- The TypeScript package CLI is the canonical v2 runtime authority for `npx`, `pnpm dlx`, and `bunx` / `bun x` execution.
- The root workspace remains private and is not a deployment package.
- Persistent local CLI installation is not the primary user posture for v2, though package-manager installs may continue to work where supported.
- Rust is shelved indefinitely and is not a v2 prerequisite, deployment target, MCP owner, or package-validation target.
- Current manifest, audit, backup, uninstall, conflict, migration, deterministic-operation, and skills-selection safety behavior remains TypeScript-owned.
- MCP must ship for v2 and is TypeScript-owned.

## Rationale

The accepted package/deployment design fixes the v2 identity boundary before later Batch 1 work decides asset materialization, compatibility, migration, template/package dogfood, or runtime behavior. W10 R7 corrects the runtime direction: TypeScript owns the v2 CLI/MCP runtime, while Rust is no longer a required v2 path. Without this revision, the active PRD set still contains open rename, packaging, and Rust/PATH-order questions that can make downstream work branch around stale assumptions.

The live package surface already has a single publishable npm package and command boundary: `packages/cli/package.json` defines `@brucewaynedecoy/make-docs`, exposes the `make-docs` binary, and limits the published package to the built CLI, bundled template, skill registry files, schema, and README. The CLI parser currently exposes the no-command install/sync path plus `reconfigure`, `skills`, `backup`, and `uninstall`, so the PRD set should preserve one command rather than add compatibility aliases before migration/audit design narrows the matrix.

The live lifecycle model is also package-boundary relevant. `.make-docs/manifest.json`, audit snapshots, backup, uninstall, conflict staging, and selected-skill ownership are durable TypeScript package contracts. MCP tools and operation domains must reuse those contracts rather than silently reinterpret installed-project state.

Code anchors:

- `packages/cli/package.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/core/manifest.ts`
- `packages/cli/src/commands/audit.ts`
- `packages/cli/src/commands/backup.ts`
- `packages/cli/src/commands/uninstall.ts`
- `packages/cli/skill-registry.json`
- `scripts/smoke-pack.mjs`

## Effective Requirement

Product identity:

- `make-docs` is the CLI/package identifier and primary executable spelling.
- `Make Docs` is the prose display name.
- `MakeDocs` is the compact identifier for contexts that cannot use spaces or hyphens.
- No broad product rename is part of v2.
- Existing private workspace package names may remain until a specific package-ownership design changes them.
- The root workspace remains private and is not a deployment package.

TypeScript package ownership:

- The TypeScript package remains the canonical v2 runtime and package entry point.
- It owns project installation and reconfiguration through `npx @brucewaynedecoy/make-docs@...`, `pnpm dlx @brucewaynedecoy/make-docs@...`, `bunx @brucewaynedecoy/make-docs@...`, `bun x @brucewaynedecoy/make-docs@...`, and package-manager-installed `make-docs` binaries where users choose persistent installation.
- It owns npm release channels: `next` for release candidates and `latest` for stable releases.
- It owns npm package contents: built CLI, bundled template, skill registry files, skill registry schema, and package README.
- It owns current manifest, audit, backup, uninstall, conflict, migration, deterministic-operation, MCP, and skills-selection safety behavior.

Remote execution and runtime boundary:

- `npx`, `pnpm dlx`, and `bunx` / `bun x` are first-class remote execution targets.
- Persistent local installation is not the primary user posture, and future docs should not require users to install the CLI globally before using v2.
- Rust, Homebrew, Crates, same-command dual-runtime behavior, and PATH-order runtime selection are not v2 implementation or validation targets.
- Help/version output still needs enough package/runtime information for support, audit, and bug-report triage, but it does not need to distinguish npm and Rust peers.

Command and alias boundary:

- The product exposes one primary command name: `make-docs`.
- Compatibility aliases are not part of v2 by default.
- A future design may add a constrained package lookup alias only if a registry constraint requires it, but that alias must not add another primary command name.

MCP and shared-contract boundary:

- MCP must ship as part of v2 and is TypeScript-owned.
- [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) defines the required TypeScript MCP surface: W10 R8 Phase 3 ships the first read-first stdio server through `make-docs mcp`; MCP tools must delegate to the same modular operation domains as CLI commands, and write behavior requires explicit permission and parity proof.
- `.make-docs/manifest.json`, package metadata needed for installed-project provenance, audit safety expectations, backup/uninstall behavior, migration behavior, deterministic operation semantics, and user-visible command semantics are TypeScript package product contracts.
- [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) extends this boundary to system asset delivery: any provider-backed system asset behavior must preserve local bootstrap readability, pinned provenance, conflict review, audit safety, backup, uninstall, and manifest compatibility.
- [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) extends this boundary to existing-install compatibility: TypeScript CLI and MCP paths must preserve the same classifier, source-state taxonomy, disposition semantics, manifest compatibility, and single-audit safety model.

Skills and plugin boundary:

- The TypeScript package remains responsible for not regressing current install behavior while operation domains and future MCP expansions are hardened.
- Bare installs must keep the current no-default-skills behavior.
- Explicit skills installs must remain opt-in through the skills selection flow until a later accepted design changes that contract.
- [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) narrows the no-scripts implementation target: TypeScript owns the first CLI/shared-core operation boundary, and deterministic first-party skill behavior must be available from the CLI package rather than only from remote or skill-local script payloads.
- [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) narrows skills metadata and source policy: purpose-led selection remains opt-in, alternate manifests are explicit effective-manifest inputs, and unpinned remote manifests or skill payloads are invalid for installation.
- [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) narrows selected-agentics placement: explicitly selected skills install one canonical shared payload and generated harness stubs by default, with no symlink requirement.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) narrows plugin substrate: selected plugins use canonical `.make-docs/agentics/plugins/<plugin-id>/` payloads, generated harness exposure, explicit plugin selection, and evidence-gated support claims.
- This revision does not decide remote-fetch versus bundled-local skills delivery, broader remote source integrity mechanics, plugin implementation parity, or per-bundle public UX. Those remain open in the risk register.

Validation and release boundary:

- Package and release validation must prove the packed npm artifact, not only the local development tree.
- Validation must continue to distinguish local template resolution from packed template resolution.
- Package/release validation remains dry-run only unless the user separately authorizes irreversible registry or npm publish actions.
- Package validation must prove `npx`, `pnpm dlx`, and `bunx` / `bun x` behavior where remote package execution changes. W10 R8 Phase 4 supplies the first packed-tarball proof by running `npx --package`, `pnpm dlx`, and `bun x --package` in isolated temp roots.
- MCP validation must prove command parity, operation-domain reuse, manifest, audit, backup, uninstall, migration, and permission behavior against the same product contracts. W10 R8 Phase 3 supplies the initial read-first MCP parity proof; future write, provider, plugin, and shared-agentics MCP expansions must add their own proof before support claims broaden.
- [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) keeps conformance-lab scenarios, records, and raw artifacts out of shipped package surfaces unless a later accepted design deliberately promotes a subset.

## Impacted Docs and Dependencies

| Area | Effective impact |
| --- | --- |
| `docs/prd/01-product-overview.md` | Supersedes stale broad-rename and product-boundary assumptions with stable v2 identity and one command. |
| `docs/prd/02-architecture-overview.md` | Enhances runtime and module boundaries with TypeScript package ownership, required MCP, remote execution, and shared contract requirements. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhances manifest provenance, audit safety, backup/uninstall safety, and TypeScript CLI/MCP lifecycle-contract expectations. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Supersedes any public-command model that would add default aliases or treat TS and Rust as separate user-facing runtime names. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhances skills-delivery boundaries while leaving remote/bundled delivery, source integrity, and shared plugin/skill install questions open. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhances npm allowlist, release-channel, package verification, dry-run publish, remote package-runner, and MCP package proof. |
| `docs/prd/12-revise-cli-skill-selection-simplification.md` | Enhances the no-default-skills requirement by tying it to the TypeScript package boundary. |
| `docs/prd/17-revise-system-asset-materialization-contract.md` | Enhances the package/deployment boundary with explicit full-snapshot, provider-backed, and hybrid pinned-cache system asset requirements. |
| `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md` | Enhances the package/deployment boundary with TypeScript CLI/MCP compatibility classification, migration dispositions, and single-audit backup-and-reinstall safety. |
| `docs/prd/03-open-questions-and-risk-register.md` | Closes stale rename question Q-008 and updates package, skill-delivery, audit, template, and no-scripts risks without duplicating entries. |

The paired delta backlog for implementation work should be generated under `docs/work/2026-06-23-w10-r1-package-and-deployment-boundaries/` and trace back to this revision, the W10 R1 plan, the accepted package/deployment design, and current TypeScript CLI/package surfaces.

## Required Baseline Annotations

The following active PRD docs must carry `Change Notes` backlinks to this revision:

| Baseline doc | Note verb | Required note focus |
| --- | --- | --- |
| `docs/prd/01-product-overview.md` | Superseded by | Stable v2 product/package identity, one command, no broad rename, and no default aliases. |
| `docs/prd/02-architecture-overview.md` | Enhanced by | Runtime zones, module map, deployment boundaries, TypeScript runtime ownership, and required MCP contracts. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhanced by | Manifest state, package provenance, audit safety, backup/uninstall safety, and shared lifecycle contracts. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Superseded by | Public command model, help/version behavior, lifecycle routing, and no default compatibility aliases. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhanced by | Skills delivery boundary and unresolved shared plugin/skill install questions. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhanced by | npm allowlist, release channels, package verification, dry-run publish boundary, remote package-runner validation, and MCP package proof. |
| `docs/prd/12-revise-cli-skill-selection-simplification.md` | Enhanced by | No-default-skills behavior for bare installs under the TypeScript package boundary. |

Do not add `Change Notes` to `docs/prd/03-open-questions-and-risk-register.md`; update its existing numbered D/Q/R items directly.

## Source Anchors

- `docs/designs/2026-06-19-package-and-deployment-boundaries.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md`
- `docs/plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `docs/plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md`
- `docs/plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md`
- `docs/prd/01-product-overview.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/12-revise-cli-skill-selection-simplification.md`
- `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`
- `docs/prd/26-revise-no-scripts-migration-skill-refactor.md`
- `docs/prd/27-revise-skill-purpose-registry-alternate-skills-manifest.md`
- `docs/prd/28-revise-shared-agentics-installation-harness-redirection.md`
- `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md`
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md`
- `packages/cli/package.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/core/manifest.ts`
- `packages/cli/src/commands/audit.ts`
- `packages/cli/src/commands/backup.ts`
- `packages/cli/src/commands/uninstall.ts`
- `packages/cli/skill-registry.json`
- `scripts/smoke-pack.mjs`
