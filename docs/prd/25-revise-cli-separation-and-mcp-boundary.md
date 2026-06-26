# 25 Revise CLI Separation and MCP Boundary

## Purpose

Define the v2 boundary for the TypeScript package CLI, deterministic operation domains, and the required MCP surface before future CLI, skill, plugin, playbook, and harness work expands the runtime.

## Change Type

Revision. This PRD extends the active package/deployment, CLI lifecycle, asset materialization, compatibility, tool-directory, configuration, and conformance requirements.

Route: `change-plan`

Coordinate: `W10 R6`, superseded in runtime ownership by `W10 R7`

## Change Notes

W10 R7 supersedes this PRD's original Rust/PATH-order runtime assumptions. The TypeScript package CLI is now the v2 runtime authority for install, maintenance, deterministic operations, and the required MCP server surface.

Rust is shelved indefinitely and is not a v2 prerequisite, package-validation target, MCP owner, or same-command runtime peer.

W16 R3 remains valid implementation evidence because it moved lifecycle-critical deterministic behavior into the packaged TypeScript CLI. Its consolidated `packages/cli/src/operations.ts` file is first-pass operation-boundary proof, not the final source organization.

## Requirements

### Remote Execution and Installer Posture

`npx @brucewaynedecoy/make-docs`, `pnpm dlx @brucewaynedecoy/make-docs`, and `bunx @brucewaynedecoy/make-docs` / `bun x @brucewaynedecoy/make-docs` are first-class remote execution paths for v2.

The package CLI remains installer-first for project install, sync, reconfigure, selected-skills maintenance, backup, uninstall, and package-delivered template validation. Persistent local CLI installation is supported where package managers provide it, but it is not the primary user posture or a prerequisite for ordinary v2 usage.

The no-command workflow remains meaningful and must not be replaced by an `init`/`update` command-router model.

### TypeScript Runtime Ownership

The TypeScript package CLI owns v2 install, maintenance, deterministic operation, validation, migration, and MCP server behavior.

The TypeScript implementation must expose reusable operation domains that CLI commands and MCP tools share. Public command dispatch may remain thin, but the domain logic must be testable without invoking the full CLI parser or MCP transport.

### Rust Shelving

Rust is not a v2 runtime requirement. Future work must not require Rust parity, Homebrew/Crates packaging, same-command npm/Rust coexistence, or PATH-order runtime selection before v2 can ship.

Historical references to earlier Rust planning may remain only where they describe completed past work or superseded decisions.

### Product Roles

Installer-maintainer role:

- install, sync, reconfigure, selected-skills maintenance, backup, uninstall, audit review, compatibility classification, package/template validation, and future migration flows;
- TypeScript-owned for v2.

Agent automation role:

- deterministic inspection, validation, asset resolution, generation preparation, script-replacement helpers, and typed access to make-docs contracts for agents;
- TypeScript CLI/MCP-owned for v2, with shared operation-domain behavior.

### Required MCP Surface

MCP must ship as part of v2. It is TypeScript-owned and packaged with the same runtime authority as the CLI.

MCP tools must not define a second behavior model. Each MCP tool must delegate to the same deterministic operation domain used by the CLI command or shared core operation it represents.

Parity includes manifest reads, config interpretation, asset provenance, audit classification, compatibility classification, conflict handling, dry-run output, and write permissions.

W10 R8 Phase 3 ships the first TypeScript MCP surface through `make-docs mcp`. That surface is read-first and plan-first: it exposes installed-state inspection, manifest reads, config reads, compatibility classification, dry-run install planning, and closeout/work/lifecycle helpers that call the same TypeScript operation domains and planner/classifier modules used by the CLI.

### First MCP Surface

The first MCP surface is read-first and plan-first. W10 R8 Phase 3 implements:

- inspect installed project state, manifest provenance, package runtime metadata, config labels, operation domains, and compatibility classification;
- read manifest and config state through the same loaders used by the CLI;
- produce dry-run install/sync plans from the CLI planner before mutation;
- delegate closeout, work, and lifecycle helper tools to the modular operation domains introduced by W10 R8 Phase 2;
- require explicit `allowRun=true` before an MCP closeout validation tool executes validation commands.

Remaining planned MCP expansions must:

- list or resolve immutable system assets only through the accepted materialization contract;
- run deterministic validators and no-scripts replacement operations only after CLI/shared-core equivalents exist;
- add write behavior only after the permission model and parity proof are explicit.

MCP writes require explicit permission and parity proof in the implementation backlog, but MCP itself is not optional or post-v2.

### Development Contract

Deterministic logic must live in modular TypeScript operation domains, not skill-local scripts and not monolithic catch-all files.

Operation modules should mirror CLI/MCP command domains as closely as practical. New deterministic behavior requires focused operation tests and CLI/MCP parity expectations.

W10 R8 implements the follow-on source organization by modularizing the current `operations.ts` boundary while preserving existing `make-docs operations ...` behavior, then exposes the first MCP tools through the same operation domains.

### Asset and Config Boundaries

MCP must not expose hidden provider-backed state as the only way to understand a repository. Local bootstrap remains mandatory.

If a tool resolves a provider-backed or cached system asset, the manifest must identify the provider, version or immutable ref, hash algorithm, hash set, offline expectation, and recovery guidance.

Configuration overlays are presentation inputs. CLI commands, MCP tools, plugin surfaces, and skills route through canonical paths, manifest keys, route identifiers, prompt paths, skill names, contract names, and harness names.

### No-Scripts Migration Dependency

The no-scripts migration must move deterministic logic into TypeScript operation domains first, then expose it through ordinary CLI commands and MCP tools. Existing system scripts may remain only as thin wrappers after an equivalent CLI/MCP-backed operation exists.

Skills that currently depend on standalone scripts must be rewritten in the same migration window so they call the CLI/MCP boundary instead of carrying independent deterministic logic.

[26-revise-no-scripts-migration-skill-refactor.md](26-revise-no-scripts-migration-skill-refactor.md) is the concrete migration contract for this dependency. It defines the required operation-first sequence, same-window first-party skill rewrites, managed old-script and wrapper classification, and validation gates before standalone helper scripts are removed or downgraded.

[27-revise-skill-purpose-registry-alternate-skills-manifest.md](27-revise-skill-purpose-registry-alternate-skills-manifest.md) supplies the skills-manifest metadata contract that MCP or plugin surfaces must reuse. MCP and plugin tools may present purpose-led choices, but they must use one effective manifest, canonical purpose ids, resolved skill names, and the same source-policy validation as the CLI.

[28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md) supplies the selected-agentics store and harness exposure primitive that MCP or plugin surfaces must reuse. Discovery, dry-run planning, and installed-state inspection can read manifest ownership records and generated stubs without a live CLI process, but deterministic writes still delegate to CLI/shared-core operations.

[29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) supplies the generic Run Playbook execution model that future CLI, MCP, plugin, skill, or agent surfaces must reuse. MCP tools may inspect, validate, select, and dry-run playbooks under the read-first/plan-first surface, but writes or unattended execution still require a later permission and parity plan.

[30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) supplies the plugin substrate and workflow bundle metadata that future CLI, MCP, plugin, skill, or agent surfaces must reuse. Plugin entrypoints may call accepted CLI/MCP/shared-core operations, but they must not implement independent manifest, config, audit, backup, uninstall, generation, validation, or lifecycle routing behavior.

[31-revise-coverage-pass-extensions-adversarial-review.md](31-revise-coverage-pass-extensions-adversarial-review.md) supplies the optional adversarial-review coverage-pass contract that future CLI, MCP, plugin, skill, or agent surfaces must reuse if they expose adversarial review. Those surfaces must delegate deterministic candidate validation, verdict mapping, history idempotency, and support-claim checks to accepted operation contracts; no CLI or MCP write surface is implied by adversarial review.

## Non-Requirements

- No Rust implementation, Rust parity plan, Homebrew/Crates packaging, or PATH-order runtime model for v2.
- No MCP write surface without explicit permission and parity proof.
- No direct MCP asset source policy outside the accepted materialization contract.
- No replacement of the no-command npm workflow with `init` or `update`.
- No resolution of remote versus bundled skills, plugin runtime implementation parity, or per-bundle public UX.
- No CLI or MCP adversarial-review surface unless a later plan explicitly selects it and proves parity.
- No code modularization or MCP implementation in W10 R7 itself; W10 R8 owns that implementation work.

## Affected Baseline Docs

- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [17 Revise System Asset Materialization Contract](17-revise-system-asset-materialization-contract.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)

## Acceptance Criteria

- Public docs preserve the no-command npm workflow and explicit lifecycle commands.
- TypeScript package CLI behavior remains the v2 implementation authority for install, maintenance, deterministic operations, and MCP.
- `npx`, `pnpm dlx`, and `bunx` / `bun x` package execution paths are treated as first-class validation targets.
- MCP tools have one shared operation contract with CLI/shared-core behavior and must ship in v2.
- MCP writes remain gated by explicit permission and parity planning.
- Operation-domain logic is modular, testable without the parser or MCP transport, and mirrored by CLI/MCP command domains where practical.
- Validation covers CLI/MCP parity, noninteractive/dry-run behavior, provider/cache failure behavior, package-runner behavior, and conformance-lab scenarios before public support claims.

## Source Anchors

- [../designs/2026-06-20-cli-separation-and-mcp-boundary.md](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- [../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md](../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)
- [../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md](../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md)
- [../plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md](../plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md)
- [../plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md](../plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md)
- [../work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-index.md](../work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-index.md)
- [../work/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md](../work/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md)
- [../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-index.md](../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-index.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [17 Revise System Asset Materialization Contract](17-revise-system-asset-materialization-contract.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [26 Revise No-Scripts Migration Skill Refactor](26-revise-no-scripts-migration-skill-refactor.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)
- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- [../designs/2026-06-20-playbook-contract-and-run-playbook.md](../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- [../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
- [../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- [../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md)
- [../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- [../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md](../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md)
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/rules.ts`
- `scripts/smoke-pack.mjs`
