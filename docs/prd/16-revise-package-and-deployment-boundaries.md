# 16 Revise Package and Deployment Boundaries

## Purpose

This revision records the effective package, command, deployment, and release-channel boundary for the v2 Make Docs work. It reconciles the accepted package/deployment design and the W10 R1 plan into the active PRD set so downstream package, compatibility, Rust, MCP, and release-validation work does not reopen the product identity decision.

The change keeps the current TypeScript npm CLI as the implementation source of truth while it defines how a future Rust distribution must share product contracts instead of forking command semantics, manifest provenance, audit safety, or user-facing identity.

## Change Type

Revision.

This document supersedes stale rename and alias assumptions and enhances package-validation, lifecycle-safety, skills-delivery, and future Rust ownership requirements across the active PRD set.

## Baseline Being Revised or Removed

This revision updates these baseline assumptions:

- A broad v2 product rename is no longer active. The effective names are `make-docs` for the package and command identifier, `Make Docs` for prose, and `MakeDocs` where spaces or hyphens are unavailable.
- The installed command remains `make-docs` across npm, Homebrew, and Crates distributions. The v2 surface does not add default compatibility aliases such as `makedocs`, `make-docs-js`, or `make-docs-rs`.
- The TypeScript npm package remains the canonical npm and `npx` entry point until an accepted Rust parity design and plan moves specific ownership.
- The root workspace remains private and is not a deployment package.
- The Rust CLI is a separate future deployment artifact for Homebrew and Crates. It may use owner-qualified package lookup names when registries require them, but its installed command remains `make-docs`.
- Current manifest, audit, backup, uninstall, conflict, and skills-selection safety behavior remains TypeScript-owned until an accepted implementation plan moves it.
- Long-term MCP startup ownership belongs to the Rust CLI, but the Rust path must preserve existing manifest, audit, backup, uninstall, and command-semantics contracts.

## Rationale

The accepted package/deployment design fixes the v2 identity boundary before later Batch 1 work decides asset materialization, compatibility, migration, template/package dogfood, or Rust runtime behavior. Without this revision, the active PRD set still contains open rename and packaging questions that can make downstream work branch around stale assumptions.

The live package surface already has a single publishable npm package and command boundary: `packages/cli/package.json` defines `@brucewaynedecoy/make-docs`, exposes the `make-docs` binary, and limits the published package to the built CLI, bundled template, skill registry files, schema, and README. The CLI parser currently exposes the no-command install/sync path plus `reconfigure`, `skills`, `backup`, and `uninstall`, so the PRD set should preserve one command rather than add compatibility aliases before migration/audit design narrows the matrix.

The live lifecycle model is also package-boundary relevant. `.make-docs/manifest.json`, audit snapshots, backup, uninstall, conflict staging, and selected-skill ownership are the durable contracts future Rust work must share. A Rust distribution can become the long-term MCP startup owner, but it cannot bypass those contracts or silently reinterpret installed-project state.

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

TypeScript npm ownership:

- The TypeScript npm package remains the canonical npm and `npx` entry point.
- It owns project installation and reconfiguration through `npx @brucewaynedecoy/make-docs@...` and the installed `make-docs` binary.
- It owns npm release channels: `next` for release candidates and `latest` for stable releases.
- It owns npm package contents: built CLI, bundled template, skill registry files, skill registry schema, and package README.
- It owns current manifest, audit, backup, uninstall, conflict, and skills-selection safety behavior until another accepted design and implementation plan moves part of that ownership.

Rust distribution ownership:

- The standalone Rust CLI is a separate deployment artifact for Homebrew and Crates.
- Its primary binary name is also `make-docs`.
- Distribution package names should use `make-docs` when possible. If registry, tap, or ownership constraints block that lookup name, the package lookup name may be owner-qualified, but the installed command must remain `make-docs`.
- The same binary name across npm, Homebrew, and Crates is intentional. PATH order decides which implementation runs when users install multiple distributions.
- Once both implementations exist, help/version output must identify the runtime and version clearly enough for support, audit, and bug-report triage.

Command and alias boundary:

- The product exposes one primary command name: `make-docs`.
- Compatibility aliases are not part of v2 by default.
- A future design may add a constrained package lookup alias only if a registry constraint requires it, but that alias must not add another primary command name.

MCP and shared-contract boundary:

- Long-term MCP startup ownership belongs to the Rust CLI.
- The TypeScript npm package may continue to bootstrap, configure, or bridge MCP-related setup during transition, but it should not become the long-term MCP runtime owner.
- [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) narrows that transition: the TypeScript npm package remains the current source of truth for installer-maintainer behavior, future MCP tools must delegate to CLI/shared-core operation contracts, and the first MCP surface is read-first and plan-first until a later permission model and parity proof authorizes writes.
- The TypeScript and Rust implementations must share durable contracts rather than fork them.
- `.make-docs/manifest.json`, package metadata needed for installed-project provenance, audit safety expectations, backup/uninstall behavior, and user-visible command semantics are shared product contracts.
- Until a Rust implementation plan lands, the TypeScript CLI remains the implementation source of truth for those shared contracts.
- [17-revise-system-asset-materialization-contract.md](./17-revise-system-asset-materialization-contract.md) extends this shared boundary to system asset delivery: a future Rust provider may serve immutable system assets only if local bootstrap readability, pinned provenance, conflict review, audit safety, backup, uninstall, and manifest compatibility are preserved.
- [18-revise-compatibility-audit-and-migration-disposition.md](./18-revise-compatibility-audit-and-migration-disposition.md) extends this shared boundary to existing-install compatibility: TypeScript and Rust implementations must preserve the same classifier, source-state taxonomy, disposition semantics, manifest compatibility, and single-audit safety model.

Skills and plugin boundary:

- The npm package remains responsible for not regressing current install behavior while Rust catches up.
- Bare installs must keep the current no-default-skills behavior.
- Explicit skills installs must remain opt-in through the skills selection flow until a later accepted design changes that contract.
- [26-revise-no-scripts-migration-skill-refactor.md](./26-revise-no-scripts-migration-skill-refactor.md) narrows the no-scripts implementation target: TypeScript owns the first CLI/shared-core operation boundary, and deterministic first-party skill behavior must be available from the CLI package rather than only from remote or skill-local script payloads.
- [27-revise-skill-purpose-registry-alternate-skills-manifest.md](./27-revise-skill-purpose-registry-alternate-skills-manifest.md) narrows skills metadata and source policy: purpose-led selection remains opt-in, alternate manifests are explicit effective-manifest inputs, and unpinned remote manifests or skill payloads are invalid for installation.
- [28-revise-shared-agentics-installation-harness-redirection.md](./28-revise-shared-agentics-installation-harness-redirection.md) narrows selected-agentics placement: explicitly selected skills install one canonical shared payload and generated harness stubs by default, with no symlink requirement.
- This revision does not decide remote-fetch versus bundled-local skills delivery, broader remote source integrity mechanics, or plugin runtime and public exposure behavior. Those remain open in the risk register.

Validation and release boundary:

- Package and release validation must prove the packed npm artifact, not only the local development tree.
- Validation must continue to distinguish local template resolution from packed template resolution.
- Package/release validation remains dry-run only unless the user separately authorizes irreversible registry, Homebrew, Crates, or npm publish actions.
- Future Rust package validation must prove command, runtime/version, manifest, audit, backup, uninstall, and MCP startup behavior against the same product contracts.
- [20-revise-agent-harness-model-conformance-lab.md](./20-revise-agent-harness-model-conformance-lab.md) keeps conformance-lab scenarios, records, and raw artifacts out of shipped npm, Homebrew, Crates, and Rust package surfaces unless a later accepted design deliberately promotes a subset.

## Impacted Docs and Dependencies

| Area | Effective impact |
| --- | --- |
| `docs/prd/01-product-overview.md` | Supersedes stale broad-rename and product-boundary assumptions with stable v2 identity and one command. |
| `docs/prd/02-architecture-overview.md` | Enhances runtime and module boundaries with TypeScript npm ownership, future Rust distribution ownership, and shared contract requirements. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhances manifest provenance, audit safety, backup/uninstall safety, and shared TS/Rust lifecycle-contract expectations. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Supersedes any public-command model that would add default aliases or treat TS and Rust as separate user-facing command names. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhances skills-delivery boundaries while leaving remote/bundled delivery, source integrity, and shared plugin/skill install questions open. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhances npm allowlist, release-channel, package verification, dry-run publish, and future Rust distribution references. |
| `docs/prd/12-revise-cli-skill-selection-simplification.md` | Enhances the no-default-skills requirement by tying it to the npm package boundary while Rust parity is pending. |
| `docs/prd/17-revise-system-asset-materialization-contract.md` | Enhances the package/deployment boundary with explicit full-snapshot, provider-backed, and hybrid pinned-cache system asset requirements. |
| `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md` | Enhances the package/deployment boundary with TypeScript/Rust compatibility classification, migration dispositions, and single-audit backup-and-reinstall safety. |
| `docs/prd/03-open-questions-and-risk-register.md` | Closes stale rename question Q-008 and updates package, skill-delivery, audit, template, and no-scripts risks without duplicating entries. |

The paired delta backlog for implementation work should be generated under `docs/work/2026-06-23-w10-r1-package-and-deployment-boundaries/` and trace back to this revision, the W10 R1 plan, the accepted package/deployment design, and current TypeScript CLI/package surfaces.

## Required Baseline Annotations

The following active PRD docs must carry `Change Notes` backlinks to this revision:

| Baseline doc | Note verb | Required note focus |
| --- | --- | --- |
| `docs/prd/01-product-overview.md` | Superseded by | Stable v2 product/package identity, one command, no broad rename, and no default aliases. |
| `docs/prd/02-architecture-overview.md` | Enhanced by | Runtime zones, module map, deployment boundaries, and shared TS/Rust contracts. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhanced by | Manifest state, package provenance, audit safety, backup/uninstall safety, and shared lifecycle contracts. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Superseded by | Public command model, help/version behavior, lifecycle routing, and no default compatibility aliases. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhanced by | Skills delivery boundary and unresolved shared plugin/skill install questions. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhanced by | npm allowlist, release channels, package verification, dry-run publish boundary, and future Rust distribution references. |
| `docs/prd/12-revise-cli-skill-selection-simplification.md` | Enhanced by | No-default-skills behavior for bare installs while Rust parity is pending. |

Do not add `Change Notes` to `docs/prd/03-open-questions-and-risk-register.md`; update its existing numbered D/Q/R items directly.

## Source Anchors

- `docs/designs/2026-06-19-package-and-deployment-boundaries.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/plans/2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
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
- `docs/designs/2026-06-20-no-scripts-migration-and-skill-refactor.md`
- `docs/designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md`
- `docs/designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md`
- `docs/plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md`
- `docs/plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md`
- `docs/plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md`
- `packages/cli/package.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/core/manifest.ts`
- `packages/cli/src/commands/audit.ts`
- `packages/cli/src/commands/backup.ts`
- `packages/cli/src/commands/uninstall.ts`
- `packages/cli/skill-registry.json`
- `scripts/smoke-pack.mjs`
