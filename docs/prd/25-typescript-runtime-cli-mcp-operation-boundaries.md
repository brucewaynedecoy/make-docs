# 25 TypeScript Runtime, CLI, MCP, and Operation Boundaries

## Purpose

This document defines the current product contract for the TypeScript runtime and the separation among CLI presentation, MCP exposure, and reusable operations. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns the TypeScript runtime and the separation among CLI presentation, MCP exposure, and reusable operations. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
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

System-resource discovery and reads are an MCP resource surface, not only a tool surface. The CLI commands `make-docs resource list` and `make-docs resource read` are canonical; native MCP resources expose the same stable `make-docs://system/<type>/<posix-relative-path>` inventory and bytes where the SDK supports native resources. Both surfaces call one resolver, and MCP tools cover resource operations such as projection changes that native discovery/read cannot represent.

Parity includes manifest reads, config interpretation, resource identity and provenance, audit classification, compatibility classification, conflict handling, dry-run output, and write permissions.

`make-docs mcp` exposes hand-defined installed-state, manifest, config, compatibility, and install-plan reads plus exactly one derived MCP tool for every admitted operation-registry identifier. Derived tools call the same operation core as the identifier's canonical CLI projection; mutating operations require `allowWrite=true`, and `dryRun` plus named approvals ride the shared execution context.

Packed-package validation executes the generated tarball through `npx --package`, `pnpm dlx`, and `bun x --package` in isolated temporary roots before support claims rely on remote package-runner behavior.

### Current MCP Surface

The current MCP surface must:

- inspect installed project state, manifest provenance, package runtime metadata, config labels, operation domains, and compatibility classification through the same loaders used by the CLI;
- discover and read peer `contract`, `prompt`, `reference`, and `template` resources with the same URI normalization, local-projection trust checks, installed-provider fallback, bytes, media types, and typed failures as CLI resource list/read;
- use native MCP resource discovery/read where supported without creating a second registry, resolver, or content representation;
- produce dry-run install/sync plans from the CLI planner before mutation;
- derive exactly one MCP tool from every admitted registry operation, with the tool name, description, input shape, mutation classification, and pending status taken from the registry definition;
- route every derived tool through the shared operation core so input validation, pending-lineage refusal, dry-run behavior, named approvals, and write gating cannot diverge by surface;
- require `allowWrite=true` for every mutating tool while allowing `dryRun=true` to exercise the same operation without writes; and
- prove registry-to-MCP parity in both directions so no admitted operation lacks a tool and no tool invents an unregistered operation.

New projection mutations, deterministic validators, and no-scripts replacements may join the MCP tool surface only after a CLI/shared-core operation and its permission, parity, and package-validation evidence exist.

### Development Contract

- Operations project to the canonical `resource`, `project`, or `run` CLI subtree declared by registry metadata. CLI/MCP parity is derived from or conformance-checked against the operation registry rather than maintained by hand. Modular operation domains use the shared operation core's typed contracts, injected execution context for uniform dry-run, write-permission, and approval gating, and one-way surface-to-core dependencies; [39-cli-command-model-and-operation-registry.md](39-cli-command-model-and-operation-registry.md) owns the public grammar and registry.

Deterministic logic must live in modular TypeScript operation domains, not skill-local scripts and not monolithic catch-all files.

Operation modules should mirror CLI/MCP command domains as closely as practical. New deterministic behavior requires focused operation tests and CLI/MCP parity expectations.

The modular operation-domain source organization remains, but public command exposure follows [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md): CLI operations appear only at their registry-derived canonical path, and MCP tool names derive from the same operation identifiers.

Current support claims cover validated registry-derived canonical CLI paths and their matching MCP tools, canonical CLI/native-MCP resource reads, mutating operations protected by shared `allowWrite`, dry-run, and approval gates, and packed-package execution through npm, pnpm, and Bun package runners. New projection, adversarial-review, migration link-rewrite, or other operation domains must add their own operation contract, permission proof, and package validation before support claims broaden.

Playbooks and Protocols have no runtime, registry, compiler, package, or MCP surface. Deterministic workflow assistance is expressed through focused operations and the peer system-resource types rather than a separate workflow product model.

### Asset and Config Boundaries

MCP must not expose hidden provider state as the only way to understand a repository. Local manifest/config/router bootstrap remains mandatory, while local system-resource projection is optional.

The resource resolver accepts only stable system-resource URIs, resolves a trustworthy selected local projection before the installed provider, and rejects traversal, invalid type segments, stale or divergent projected content, and unavailable provider state with typed errors. Projection provenance records provider, version or immutable ref, hash algorithm, hash set, local path, ownership state, offline expectation, and recovery guidance.

Configuration overlays are presentation inputs. CLI commands, MCP tools/resources, plugin surfaces, and skills route through canonical paths, manifest keys, route identifiers, resource URIs, operation ids, lifecycle stages/statuses, skill names, and harness names.

### Naive-UAT Operation Boundary

- The reusable Naive-UAT system workflow remains available through first-class contracts, prompts, references, and templates. Where that workflow invokes deterministic behavior, it uses canonical typed TypeScript CLI operations; equivalent MCP exposure delegates to the same operation definitions and returns identical typed results rather than a second implementation.
- The TypeScript registry owns only the deterministic seams required by current authority: scenario identity/version validation, Persona resolution/defaulting, installed-target and evidence-reference validation, lifecycle run/checkpoint operations, and finding/result receipt validation. [PRD 46](46-naive-end-user-acceptance-testing.md) and [PRD 47](47-persona-model.md) remain authoritative for selecting exactly one configured Persona mapped to `user` or `maintainer`, defaulting omitted input to canonical `user`, and governing UAT policy plus scenario/evidence semantics.
- Canonical append-only `NUAT-###` scenario identity and version authority remains in the active PRD that owns the primary external outcome; rendered or executed evidence remains project evidence bound to that exact version or digest and never becomes operation-registry authority.
- A first-party Naive-UAT Skill, when selected, is an optional access adapter whose shims delegate to the same typed CLI operations and may adapt arguments or receipt formatting only. It contains no UAT policy, scenario authority, evidence semantics, state machine, or correctness-only behavior.

### No-Scripts Migration Dependency

The no-scripts migration must move deterministic logic into TypeScript operation domains first, then expose it through ordinary CLI commands and MCP tools. Existing system scripts may remain only as thin wrappers after an equivalent CLI/MCP-backed operation exists.

Skills that currently depend on standalone scripts must be rewritten in the same migration window so they call the CLI/MCP boundary instead of carrying independent deterministic logic.

#### Domain and Script Classification

- A deterministic fact-of-record or a fiddly, genuinely reused canonical-identity or parse primitive belongs in a focused TypeScript operation behind the stable registry. Derivation, judgment, and generation that an agent can perform correctly from contracts, prompts, references, templates, and project files do not become registry operations.
- Selected-skill prose, references, examples, metadata, and routing may remain skill assets, but they never become the sole owner of deterministic Make Docs behavior. Thin compatibility wrappers may remain only after an equivalent shared operation exists. Custom user scripts remain custom and outside this migration unless explicitly brought into scope by a later PRD.
- Each retained operation exposes deterministic inputs, outputs, read-only or dry-run behavior where applicable, provenance, and error semantics shared by CLI and MCP. Modules align with operation domains and remain testable without the CLI parser or MCP transport.

#### Operation-First Migration Sequence

1. Add the shared operation or system-resource replacement and its focused tests.
2. Update manifest, planner, audit, backup, uninstall, and installer behavior for both old and new asset shapes.
3. Rewrite affected first-party skills in the same window so their guidance routes to the accepted replacement rather than a skill-local helper.
4. Remove a helper from registry, template, dogfood, or harness mirrors only after both replacement and skill rewrite are present.
5. Validate install, selected skills, audit, package, template synchronization, CLI/MCP parity, and managed removal before acceptance.

The lifecycle-critical first migration cluster is `closeout-commit`, `closeout-phase`, `work-on-wave`, and `work-on-phase`. Their later registry retirement does not relax stale-install cleanup: no acceptance checkpoint may leave an explicitly selected first-party skill requiring a missing helper or replacement.

#### Managed Removal and MCP Safety

- Removed helper scripts are classified through managed ownership and compatibility rules, never deleted as anonymous files. Audit, backup, uninstall, and migration distinguish managed old skill scripts, managed wrappers, locally modified managed files, and custom scripts; every removal plan is reviewable before mutation.
- MCP exposes the same modular operation domains as CLI surfaces and never a second implementation. Writes require explicit permission plus parity proof. Rust implementation and Rust parity are not v2 requirements.

[25-typescript-runtime-cli-mcp-operation-boundaries.md](25-typescript-runtime-cli-mcp-operation-boundaries.md) is the concrete migration contract for this dependency. It defines the required operation-first sequence, same-window first-party skill rewrites, managed old-script and wrapper classification, and validation gates before standalone helper scripts are removed or downgraded.

[08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md) supplies the skills-manifest metadata contract that MCP or plugin surfaces must reuse. MCP and plugin tools may present purpose-led choices, but they must use one effective manifest, canonical purpose ids, resolved skill names, and the same source-policy validation as the CLI.

[28-shared-agentics-installation-and-harness-exposure.md](28-shared-agentics-installation-and-harness-exposure.md) supplies the selected-agentics store and native harness exposure primitive that MCP or plugin surfaces must reuse. Discovery, dry-run planning, and installed-state inspection can read manifest ownership records, symlink exposures, and copy mirrors without a live CLI process, but deterministic writes still delegate to CLI/shared-core operations.

[30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) supplies optional plugin substrate only where a traced non-Playbook consumer and evidence-backed harness contract survive recovery. Plugin entrypoints may call accepted CLI/MCP/shared-core operations, but they must not implement independent manifest, config, audit, backup, uninstall, generation, validation, or lifecycle routing behavior; workflow bundles have no authority in this PRD.

Bounded lifecycle operations use the Store's general `runs` and `run_evidence` records, share typed inputs/outputs and receipts across CLI and MCP tools, and preserve lifecycle stages, statuses, checkpoints, evidence references, and failure codes without Playbook-specific state. An unavailable Store yields ancillary `run-capture-unavailable` when the underlying operation can otherwise complete; operations that directly require Store mutation fail with their typed Store error.

[14-lifecycle-workflow-and-coverage-passes.md](14-lifecycle-workflow-and-coverage-passes.md) supplies the optional adversarial-review coverage-pass contract that future CLI, MCP, plugin, skill, or agent surfaces must reuse if they expose adversarial review. Those surfaces must delegate deterministic candidate validation, verdict mapping, history idempotency, and support-claim checks to accepted operation contracts; no CLI or MCP write surface is implied by adversarial review.
## Non-Requirements

- No Rust implementation, Rust parity plan, Homebrew/Crates packaging, or PATH-order runtime model for v2.
- No MCP write surface without explicit permission and parity proof.
- No direct MCP asset source policy outside the accepted materialization contract.
- No replacement of the no-command npm workflow with `init` or `update`.
- No resolution of remote versus bundled skills, plugin runtime implementation parity, or per-bundle public UX.
- No CLI or MCP adversarial-review surface unless a later plan explicitly selects it and proves parity.
- No monolithic or surface-owned operation logic; the current modular shared operation domains serve CLI and MCP adapters, which preserve permission and parity boundaries without importing one another.
- No CLI, MCP, config, skill, or plugin surface may introduce Playbook- or Protocol-specific metadata, operations, state, packages, or routing authority.
- No MCP resource surface may diverge from canonical CLI resource identity, resolver precedence, bytes, media types, or typed errors.
## Acceptance Criteria

- Public docs preserve the no-command npm workflow and explicit lifecycle commands.
- TypeScript package CLI behavior remains the v2 implementation authority for install, maintenance, deterministic operations, and MCP.
- `npx`, `pnpm dlx`, and `bunx` / `bun x` package execution paths are treated as first-class validation targets.
- MCP tools have one shared operation contract with CLI/shared-core behavior and must ship in v2.
- CLI resource list/read and native MCP resource discovery/read where supported expose the same stable URI inventory and bytes through one resolver.
- MCP writes require explicit permission and registry-parity proof.
- Bounded lifecycle operations use general run/evidence records and return surface-neutral typed receipts without Playbook-specific state.
- Operation-domain logic is modular, testable without the parser or MCP transport, and mirrored by CLI/MCP command domains where practical.
- Validation covers CLI/MCP parity, noninteractive/dry-run behavior, provider/cache failure behavior, package-runner behavior, and conformance-lab scenarios before public support claims.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 26.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W10 R6

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current TypeScript runtime and the separation among CLI presentation, MCP exposure, and reusable operations inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [CLI and MCP boundary design](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)

### 2026-08-08 — W10 R7–R8

- Affected requirement or section: `First MCP Surface` and `Non-Requirements`
- Previous contract: W10 R7 explicitly deferred code modularization and MCP implementation to W10 R8.
- Replacement contract: The current TypeScript runtime uses modular shared operation domains behind separate CLI and MCP adapters, and this PRD requires explicit permission gating plus CLI/MCP parity proof before any MCP write exposure.
- Rationale: Phase sequencing is implementation provenance; active requirements state the present modular boundary and its proof obligations inline.
- Source: [W10 R7 runtime pivot](../plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md) and [W10 R8 operation domains and MCP runtime](../plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md)

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Required MCP Surface`, `Current MCP Surface`, `Development Contract`, `Asset and Config Boundaries`, `No-Scripts Migration Dependency`, `Non-Requirements`, and `Acceptance Criteria`
- Previous contract: CLI/MCP parity was tool-centric, provider assets lacked a stable peer-resource surface, and Playbook execution and packaging owned runtime operation domains and state.
- Replacement contract: CLI resource list/read and native MCP resource discovery/read where supported share one resolver and stable peer-resource URIs; local projection is optional and provenance-aware; bounded lifecycle operations use general run/evidence records and typed receipts; and Playbooks and Protocols have no runtime or operation authority.
- Rationale: The TypeScript runtime boundary must expose one deterministic contract across human and agent surfaces without reintroducing the retired workflow product model.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-06-20-cli-separation-and-mcp-boundary.md](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- [../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md](../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)
- [../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md](../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md)
- [../plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md](../plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md)
- [../plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md](../plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md)
- [../work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-index.md](../work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-index.md)
- [../work/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md](../work/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md)
- [../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-index.md](../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-index.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [16 Package and Deployment Boundaries](16-package-runtime-and-deployment-boundaries.md)
- [17 System Asset Materialization Contract](17-system-asset-materialization-and-local-bootstrap.md)
- [18 Compatibility Audit and Migration Disposition](18-compatibility-classification-and-migration-safety.md)
- [20 Agent Harness Model Conformance Lab](20-agent-harness-conformance-and-support-claims.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [24 Configuration Convention Overlay](24-project-configuration-and-convention-overlay.md)
- [25 TypeScript Runtime CLI MCP Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [28 Shared Agentics Installation Harness Redirection](28-shared-agentics-installation-and-harness-exposure.md)
- [30 Harness Plugin Substrate Workflow Bundles](30-plugin-substrate-and-workflow-bundles.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
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
