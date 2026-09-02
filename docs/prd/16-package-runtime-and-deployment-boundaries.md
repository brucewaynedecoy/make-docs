# 16 Package Runtime and Deployment Boundaries

## Purpose

This document defines the current product contract for package identity, runtime ownership, and deployment boundaries. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns package identity, runtime ownership, and deployment boundaries. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

- The product keeps one `make-docs` executable, no default compatibility aliases, and first-class `npx`, `pnpm dlx`, and `bunx` remote execution. Top-level `uninstall` removes the global store at `~/.make-docs/` and an installed binary when present, while reporting that no binary exists for remote-execution users. Top-level `update` detects the installation manager, delegates the update, reports no persistent installation for remote execution, and applies global-store schema migrations. Neither command guesses before a destructive global change. The install lifecycle lives under `setup`, and [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md) requires the command tree and MCP tool list to derive from the operation registry.

Product identity:

- `make-docs` is the CLI/package identifier and primary executable spelling.
- `Make Docs` is the prose display name.
- `MakeDocs` is the compact identifier for contexts that cannot use spaces or hyphens.
- No broad product rename is part of v2.
- Existing private workspace package names may remain; any product-facing package identity change requires authoritative maintenance of this PRD and its related package owners.
- The root workspace remains private and is not a deployment package.

TypeScript package ownership:

- The TypeScript package remains the canonical v2 runtime and package entry point.
- It owns project installation and reconfiguration through `npx @brucewaynedecoy/make-docs@...`, `pnpm dlx @brucewaynedecoy/make-docs@...`, `bunx @brucewaynedecoy/make-docs@...`, `bun x @brucewaynedecoy/make-docs@...`, and package-manager-installed `make-docs` binaries where users choose persistent installation.
- It owns npm release channels: `next` for release candidates and `latest` for stable releases.
- It owns npm package contents: built CLI, the installed system-resource provider derived from the bundled template, skill registry files, skill registry schema, and package README.
- It owns current manifest, audit, backup, uninstall, conflict, migration, deterministic-operation, MCP, and skills-selection safety behavior.
- `packages/docs/template/` remains the upstream authoring authority for shipped contracts, prompts, references, templates, and default assets. Package preparation derives the CLI provider from that tree; the repository-root `.make-docs/` and `docs/` trees are downstream dogfood projections and never package source authority.
- The package contains no Playbook or Protocol compiler, registry, asset kind, or runtime surface.

Remote execution and runtime boundary:

- `npx`, `pnpm dlx`, and `bunx` / `bun x` are first-class remote execution targets.
- Persistent local installation is not the primary user posture, and future docs should not require users to install the CLI globally before using v2.
- Rust, Homebrew, Crates, same-command dual-runtime behavior, and PATH-order runtime selection are not v2 implementation or validation targets.
- Help/version output still needs enough package/runtime information for support, audit, and bug-report triage, but it does not need to distinguish npm and Rust peers.

Command and alias boundary:

- The product exposes one primary command name: `make-docs`.
- Compatibility aliases are not part of v2 by default.
- A constrained package lookup alias may be added only through authoritative maintenance of this PRD and [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md), only when a registry constraint requires it, and never as another primary command name.

MCP and shared-contract boundary:

- MCP must ship as part of v2 and is TypeScript-owned.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) defines the required TypeScript MCP surface: `make-docs mcp` exposes hand-defined read/plan tools, registry-derived operation tools, and native MCP resources where the SDK supports them; CLI resource list/read and MCP resource discovery/read share one resolver and stable `make-docs://system/<type>/<posix-relative-path>` identities, and writes require the shared permission, dry-run, approval, and parity proof.
- `.make-docs/manifest.json`, package metadata needed for installed-project provenance, audit safety expectations, backup/uninstall behavior, migration behavior, deterministic operation semantics, and user-visible command semantics are TypeScript package product contracts.
- [17-system-asset-materialization-and-local-bootstrap.md](./17-system-asset-materialization-and-local-bootstrap.md) extends this boundary to system-resource delivery: the installed provider supplies bodies without a repository snapshot, the `.make-docs/system/**` router skeleton is always local, and any optional local resource bodies must preserve provenance, conflict review, audit safety, backup, uninstall, and manifest compatibility.
- [18-compatibility-classification-and-migration-safety.md](./18-compatibility-classification-and-migration-safety.md) extends this boundary to existing-install compatibility: TypeScript CLI and MCP paths must preserve the same classifier, source-state taxonomy, disposition semantics, manifest compatibility, and single-audit safety model.

Skills and plugin boundary:

- The TypeScript package remains responsible for not regressing current install behavior while operation domains and future MCP expansions are hardened.
- Bare installs must keep the current no-default-skills behavior.
- Explicit skills installs are opt-in through the skills selection flow; [08-skills-catalog-and-distribution.md](./08-skills-catalog-and-distribution.md) owns changes to that selection contract.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) narrows the no-scripts implementation target: TypeScript owns the first CLI/shared-core operation boundary, and deterministic first-party skill behavior must be available from the CLI package rather than only from remote or skill-local script payloads.
- [08-skills-catalog-and-distribution.md](./08-skills-catalog-and-distribution.md) narrows skills metadata and source policy: purpose-led selection remains opt-in, alternate manifests are explicit effective-manifest inputs, and unpinned remote manifests or skill payloads are invalid for installation.
- [28-shared-agentics-installation-and-harness-exposure.md](./28-shared-agentics-installation-and-harness-exposure.md) narrows selected-agentics placement: explicitly selected skills install one canonical shared payload and expose native harness skill directories through symlink-preferred behavior with managed copy-mirror fallback.
- [30-plugin-substrate-and-workflow-bundles.md](./30-plugin-substrate-and-workflow-bundles.md) narrows plugin substrate: selected plugins use canonical `.make-docs/agentics/plugins/<plugin-id>/` payloads, native exposure or plugin-specific adapters, explicit plugin selection, and evidence-gated support claims.
- This authority does not decide remote-fetch versus bundled-local skills delivery, broader remote source integrity mechanics, plugin implementation parity, or per-bundle public UX. Those remain open in the risk register.

Validation and release boundary:

- Package and release validation must prove the packed npm artifact, not only the local development tree.
- Validation must continue to distinguish local template resolution from packed template resolution.
- Package/release validation remains dry-run only unless the user separately authorizes irreversible registry or npm publish actions.
- Package validation must prove `npx`, `pnpm dlx`, and `bunx` / `bun x` behavior where remote package execution changes by running the generated tarball in isolated temporary roots, as owned by [PRD 10](10-packaging-validation-and-release-reference.md).
- MCP validation must prove registry parity, operation-domain reuse, CLI/native-MCP resource identity and byte parity where native resources are supported, manifest, audit, backup, uninstall, migration, write-permission, dry-run, and approval behavior against the same product contracts. New provider-backed, plugin, shared-agentics, or other MCP domains must add their own proof before support claims broaden.
- [20-agent-harness-conformance-and-support-claims.md](./20-agent-harness-conformance-and-support-claims.md) keeps conformance-lab scenarios, records, and raw artifacts out of shipped package surfaces. Promoting a reviewed subset requires authoritative maintenance of PRDs 20, 43, and 44 plus the applicable package owner before the subset may ship.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — W10 R1

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current package identity, runtime ownership, and deployment boundaries requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Package and deployment boundaries design](../designs/2026-06-19-package-and-deployment-boundaries.md)

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `TypeScript package ownership`, `MCP and shared-contract boundary`, and `Validation and release boundary`
- Previous contract: Package ownership treated system assets primarily as local/bootstrap material and did not require one stable resource resolver across CLI and native MCP surfaces or explicitly exclude Playbook and Protocol package behavior.
- Replacement contract: The TypeScript package ships an installed provider for peer contract, prompt, reference, and template resources; CLI and native MCP access share stable resource identity and one resolver; local projection is optional; package preparation preserves the template-upstream/package/root-dogfood order; and no Playbook or Protocol runtime ships.
- Rationale: Package and deployment authority must expose the accepted v2 resource boundary without turning generated copies or repository dogfood into competing sources of truth.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
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
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/28-shared-agentics-installation-and-harness-exposure.md`
- `docs/prd/30-plugin-substrate-and-workflow-bundles.md`
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
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/skill-registry.json`
- `scripts/smoke-pack.mjs`
