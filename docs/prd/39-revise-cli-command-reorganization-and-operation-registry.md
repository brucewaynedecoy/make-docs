---
title: "39 Revise CLI Command Reorganization and Operation Registry"
kind: "prd"
status: "active"
coordinate: "W18 R11"
source:
  type: "design"
  path: "docs/designs/2026-07-01-cli-command-reorganization-and-operation-registry.md"
---

# 39 Revise CLI Command Reorganization and Operation Registry

## Purpose

Make the reorganized Make Docs CLI command surface and the formalized operation registry an active requirement: the five top-level commands `setup`, `run`, `mcp`, `update`, and `uninstall` organized as self, project, run, and serve; the context-aware bare command that preserves the installer-first posture; machine-footprint tool self-management reconciled with the remote-execution posture; the append-only `domain.verb` operation registry as the single source of truth that the CLI `run` tree, the MCP tools, and Playbook `operation:` steps are three surfaces over; the shared modular operation core with typed contracts, injected execution context, and one-way dependencies; the pruned `run` surface of `run playbook`, `run package`, and exactly two retained work operations; and the no-aliases migration with pre-v2 detection. This change belongs in the active PRD namespace because Make Docs v2 grew the CLI without reorganizing it — the install commands sit at the top level beside two large top-level commands, `operations` and `mcp`, the tool has no self-management although it is now an installed artifact, and the CLI and MCP surfaces are hand-maintained parallel mirrors that drift — and because the W18 R7 progression operations in [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md) and the W18 R10 retained work operations in [38-revise-global-store-and-project-state.md](38-revise-global-store-and-project-state.md) already reference the registry and `run` surface this PRD lands.

## Change Type

Revision. This PRD supersedes the flat top-level command taxonomy from the PRD 07 lineage — the no-command install/sync path beside `reconfigure`, `skills`, `backup`, project-level `uninstall`, `operations`, and `mcp` — together with the project-level `uninstall` spelling, the rejected top-level `update` surface, and the hand-maintained CLI/MCP surface parity, and it revises the no-scripts migration's operation-destination rule so derivation-heavy behavior becomes Playbooks and only registry-worthy logic is retained. It does not revise the internal logic of the operations or the pruning removals, the Playbook model, runner, packaging, or conformance, the global store schema and project-state model, or the CLI/MCP boundary and TypeScript runtime authority; those remain governed by their owning docs, designs, and artifacts.

Route: `change-plan`

Coordinate: `W18 R11`

## Baseline Being Revised or Removed

- [07-cli-command-surface-and-lifecycle.md](07-cli-command-surface-and-lifecycle.md): the public command model is superseded — the four explicit subcommands plus meaningful no-command taxonomy becomes the five-command tree with the `setup` subtree (`setup`, `setup reconfigure`, `setup skills`, `setup backup`, `setup remove`), the project-level `uninstall` becomes `setup remove`, the rejected `update` command gains a new meaning as tool self-management, and bare invocation becomes context-aware (guided `setup` when no install is present; status and help, never auto-sync, when one is). The wizard, review, conflict-resolution, lifecycle-safety, and shared audit-snapshot semantics remain active and move under the new spellings.
- [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md): the `make-docs operations ...` command surface and the hand-maintained expectation that operation modules mirror CLI/MCP command domains are superseded by the operation registry as single source with the CLI `run` tree and MCP tool list derived from it or conformance-checked against it, and by MCP tool names derived from registry identifiers. The CLI/MCP boundary itself, the remote-execution posture, the installer-first no-command meaning, the modular operation-domain development contract, and the MCP delegation rule are preserved unchanged per R-KEEP-1.
- [26-revise-no-scripts-migration-skill-refactor.md](26-revise-no-scripts-migration-skill-refactor.md): the destination rule that core deterministic script behavior belongs in CLI/shared-core operation domains is narrowed per R-SEQ-3 — the no-scripts migration correctly moved deterministic logic out of skill-local scripts, but the destination for derivation-heavy behavior is a Playbook, not a CLI operation, and only logic passing the NORTHSTAR filter (a fact-of-record, or a fiddly and genuinely reused canonical-identity or parse primitive) is retained as a registry operation. The operation-first migration order and managed removal safety remain active.
- [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md): the install lifecycle command spellings are superseded — install/sync becomes `setup`, `reconfigure` becomes `setup reconfigure`, and project uninstall becomes `setup remove`, with `setup` and `setup reconfigure` gaining pre-v2 detection per R-MIG-2. The three install modes, planner/apply flow, conflict staging, and audit-snapshot safety semantics are unchanged.
- [16-revise-package-and-deployment-boundaries.md](16-revise-package-and-deployment-boundaries.md): enhanced rather than superseded — the one-command, no-default-aliases, remote-execution-first boundary is preserved, and tool self-management is added around the machine-level footprint (`uninstall` removing the global store and any installed binary; `update` as a detect-and-delegate wrapper) rather than assuming a persistent global install.
- The wave, phase, and closeout operation cluster's presence on the operations surface: `wave-status`, `work-phase-state`, `phase-plan`, the `phase-gate` decision logic, `scope-guard`, `closeout-probe`, `closeout-validate`, and `closeout-history` are removed from the command surface per the pruning disposition in [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md) and are rebuilt as Playbooks; only the work-item identity resolver and the work-execution evidence record and read are retained.

## Rationale

The CLI began as an installer and accreted v2 capability without reorganization, leaving a flat top level that mixes three unrelated concerns — managing a project's installation, running operations, and serving MCP — with no home for managing the tool itself even though the tool is now an installed artifact with a machine-level footprint. The CLI operations and the MCP tools are already a one-to-one mirror maintained by hand, so a formal registry mostly recognizes an existing pattern while ending the drift; and the registry is what makes the reorganization safe, because Playbooks and MCP tools reference stable identifiers rather than command spellings. The pruning disposition simultaneously empties most of the old `operations` surface, so reorganizing now avoids carrying removed operations into new spellings.

Code anchors:

- `packages/cli/src/cli.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `docs/assets/artifacts/cli-command-reorganization.md`
- `docs/assets/artifacts/migrated-operations-inventory.md`

## Effective Requirement

The effective requirement set carries the design's requirement IDs so traceability holds; [../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md) is the normative statement of each.

### Scope, Boundaries, and Preserved Decisions (R-SCOPE, R-KEEP)

- R-SCOPE-1 (MUST NOT): this change owns exactly the top-level command structure, bare-command behavior, tool self-management, the operation registry and shared core, the `run` surface, and migration and sequencing. The internal logic of the operations and the pruning removals (tracked by [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md)); the Playbook model, runner, packaging, and conformance (owned by the W18 R6 through R9 lineages in [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md), [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md), [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md), and [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md)); the global store schema and the project-state model (owned by [38-revise-global-store-and-project-state.md](38-revise-global-store-and-project-state.md)); and the CLI/MCP boundary and TypeScript runtime authority (preserved from the predecessor designs) must not be redefined or reinvented here.
- R-KEEP-1 (MUST): the prior decisions are preserved unchanged — TypeScript is the v2 runtime authority with Rust shelved and not a design target, distribution, or parity requirement; remote execution through `npx`, `pnpm dlx`, and `bunx` is the primary posture, with the installed binary existing because package managers require an entry point; the installer-first no-command posture remains meaningful and must not be replaced by a forced command-router; MCP tools delegate to the same deterministic operation contract as the equivalent CLI command with identical reads, config interpretation, provenance, audit, dry-run, and write permissions; deterministic logic lives in modular TypeScript operation domains behind thin dispatchers, testable without the CLI parser or MCP transport; and project `.make-docs/config.yaml` is a presentation overlay consumed after canonical routing, never routing authority.

### Top-Level Structure (R-TOP)

- R-TOP-1 (MUST): the CLI has five top-level commands, organized as self, project, run, and serve — `setup` for the project install lifecycle (`setup`, `setup reconfigure`, `setup skills`, `setup backup`, `setup remove`), `run` for the operation surface, `mcp` for the MCP server, and `update` and `uninstall` for tool and machine-level self-management; this replaces the flat top level where the install commands sit beside `operations` and `mcp`.
- R-TOP-2 (MUST): `setup remove` replaces the current project-level `uninstall`, which frees the `uninstall` name for machine-level removal.
- R-TOP-3 (MUST): multi-operation families under `run` use a subtree under a domain object mapping one-to-one to registry identifiers; standalone utilities are flat.

### Bare Command (R-BARE)

- R-BARE-1 (MUST): bare `make-docs` with no subcommand is context-aware — with no install detected in the working directory it starts a guided `setup` that asks before writing, and with an install present it shows status and help and does not auto-sync — preserving the installer-first no-command posture without forcing a command-router and without silently re-syncing an existing install.

### Tool Self-Management (R-SELF)

- R-SELF-1 (MUST): `uninstall` removes Make Docs' machine-level footprint — the global store at `~/.make-docs/` and the installed binary when one is present — and for a remote-execution user with no global install it removes the global store and reports that no binary is installed; this is a hard cutover to this meaning, project removal is only `setup remove`, and it must confirm before removing.
- R-SELF-2 (MUST): `update` updates a persistent global install where one exists as a detect-and-delegate wrapper over the install manager that prints the exact command when detection is ambiguous; for remote execution it reports that there is nothing persistent to update, since the runner fetches the requested version, and it applies any global-store schema migration.
- R-SELF-3 (MUST NOT): neither command may guess and then execute a destructive global change; when the install method or intent is ambiguous it prints the exact command and the affected store path rather than acting.

### The Operation Registry and Shared Core (R-REG, R-CORE, R-SURF)

- R-REG-1 (MUST): a single operation registry is the source of truth for which deterministic operations exist; identifiers follow a `domain.verb` or `domain.object.verb` convention, lowercase, dot-separated, with hyphenated multiword segments, and are stable and append-only.
- R-REG-2 (MUST): the CLI `run` command tree and the MCP tool list are generated from, or at minimum conformance-checked against, the registry, so the two surfaces cannot drift out of parity as they do today.
- R-CORE-1 (MUST): deterministic logic lives in a shared operation core of modular, per-operation modules grouped by domain — never a monolith, because a single shared library does not mean a single shared file. Every operation is a stable identifier, a typed input, a typed output, a mutation classification, and a handler that takes the input and an execution context; surfaces adapt argv, MCP arguments, or Playbook step inputs into that input and adapt the output back and contain no operation logic; handlers return structured data and perform effects only through the injected context, which enforces dry-run, write-permission, and approval uniformly across surfaces; presentation belongs to the surface.
- R-CORE-2 (MUST): dependencies are one-way — surfaces depend on the core, the core never depends on a surface, and no surface imports another surface.
- R-SURF-1 (MUST): the three surfaces over the registry are the CLI `run` command, the MCP tools, and Playbook `operation:` steps; `setup`, `mcp`, `update`, and `uninstall` are CLI lifecycle commands, not registry operations, and a Playbook step must not install, serve, update, or uninstall the tool.

### The Run Surface After Pruning (R-RUN)

- R-RUN-1 (MUST): the `run` surface exposes only registry operations; after pruning it contains `run playbook` (catalog, resolve, capabilities, start, invoke, status, next, advance, gate, resume, close), `run package` (plan, surface-resolve, write), and the retained work-execution operations only — a work-item identity resolver and the work-execution evidence record and read, keyed to the global-store project-state model — which replace the removed wave, phase, and closeout cluster.
- R-RUN-2 (MUST NOT): the derivation, judgment, and generation operations removed by the pruning disposition — the wave-status, work-phase-state, phase-plan, phase-gate decision, scope-guard, and closeout probe, validate, and history logic — must not be carried into the new `run` surface; they are rebuilt as Playbooks per the inventory disposition.
- The exact names of the two retained work operations are an implementation detail; their shape is fixed as one identity resolver and one evidence record-and-read pair.

### Migration and Upgrade Safety (R-MIG)

- R-MIG-1 (MUST): there are no back-compatibility aliases; the current install base is small enough that aliases add complexity without benefit, so the old command spellings are removed rather than aliased.
- R-MIG-2 (MUST): `update`, `setup`, and `setup reconfigure` detect a pre-v2 configuration by its fingerprints and, when found, present a warning that itemizes the changes that could break on upgrade, followed by a choice between backing up and installing the latest version, which is recommended, and cancelling.
- R-MIG-3 (MUST): MCP tool names are derived from the registry identifiers, so the MCP renames follow the same registry as the CLI.

### Sequencing (R-SEQ)

- R-SEQ-1 (MUST): establish the operation core, the registry, and the reorganized command tree first, and move all retained operation logic behind the registry in the same wave to avoid a half-migrated state.
- R-SEQ-2 (SHOULD): the internal modularization of the messiest retained logic may be a tracked follow-up; the removal of the pruned operations is tracked separately by the inventory disposition and must not block the reorganization.
- R-SEQ-3 (MUST): the no-scripts migration correctly moved deterministic logic out of skill-local scripts, but the destination for derivation-heavy behavior is a Playbook, not a CLI operation; only logic that earns a slot by the filter in [../assets/artifacts/NORTHSTAR.md](../assets/artifacts/NORTHSTAR.md) — a fact-of-record, or a fiddly and genuinely reused canonical-identity or parse primitive — is retained as a registry operation.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): a test asserts that the CLI `run` tree and the MCP tool list are both derived from or conformance-checked against the registry, with no operation present in one surface and absent in the other.
- R-TEST-2 (MUST): a test asserts that surfaces contain no operation logic, by invoking an operation through the core without the CLI parser or MCP transport.
- R-TEST-3 (MUST): a test asserts that `run` exposes no `setup`, `mcp`, `update`, or `uninstall` operation, and that a Playbook step cannot invoke tool lifecycle.
- R-TEST-4 (MUST): a test asserts that pre-v2 detection triggers the warning-and-choice flow, that `uninstall` confirms and does not delete repository content, and that the pruned operations are absent from the `run` surface.

The design's D9 section fixes the five-command structure and self/project/run/serve organization, context-aware bare, machine-footprint `uninstall` with hard cutover and remote-execution-honest self-management, the registry as single source with derived surfaces, the shared modular core with the uniform contract and one-way dependencies, the registry-operations-only pruned `run` surface, and no aliases plus pre-v2 detection as non-substitutable, while leaving the exact names of the two retained work operations, the pre-v2 fingerprint set and warning copy, the install-manager detection matrix, and the internal module layout of the operation core to the implementer.

Code anchors:

- `packages/cli/src/cli.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/operations/lifecycle/index.ts`

## Impacted Docs and Dependencies

- [07-cli-command-surface-and-lifecycle.md](07-cli-command-surface-and-lifecycle.md): the public command model, the root command contract and parser taxonomy, and the rebuild guidance around the no-command/`init`/`update` model are superseded; the wizard, review, conflict, lifecycle-safety, and shared audit-snapshot semantics remain active under the new spellings.
- [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md): the `make-docs operations ...` surface and hand-maintained CLI/MCP mirroring are superseded by registry derivation and registry-derived MCP tool names; the boundary, posture, and development contract are preserved and consumed unchanged.
- [26-revise-no-scripts-migration-skill-refactor.md](26-revise-no-scripts-migration-skill-refactor.md): the operation-destination rule is superseded per R-SEQ-3; the operation-first order and managed removal safety remain active and govern how the pruned cluster and its Python originals are retired.
- [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md): the install lifecycle command spellings are superseded; install modes, planner/apply behavior, conflict staging, and audit-snapshot safety are unchanged.
- [16-revise-package-and-deployment-boundaries.md](16-revise-package-and-deployment-boundaries.md): enhanced — the one-command, no-alias, remote-execution-first boundary is preserved and machine-footprint tool self-management is added.
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md): enhanced — the operation registry, stable identifiers, and `run playbook` surface its progression operations consume now land as active requirements here; the progression semantics remain owned there.
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): enhanced — the operation-registry external contract its compiler and generated `cli` dependency checks consume now lands here, with `run package` plan, surface-resolve, and write as the packaging CLI surface; the compiler and adapters remain owned there.
- [38-revise-global-store-and-project-state.md](38-revise-global-store-and-project-state.md): enhanced — its cross-design mention of the reorganization lineage as planned W18 R11 resolves to this PRD; the retained work operations record and read evidence through its project-state model, and `update` and `uninstall` honor its store migration and removal obligations.
- Cross-design sequencing dependency: the two retained work operations are keyed to the W18 R10 project-state model, so their implementation is gated on the store, its concurrency model, and the stable project identifier landing per the [W18 R10 backlog](../work/2026-07-01-w18-r10-global-store-and-project-state/00-index.md); R-SEQ-1 requires the core, registry, and tree to land together in this wave so no half-migrated state exists.
- Documentation consequence: any template-owned instruction router, guide, or README that names old command spellings, such as `operations` or the project-level `uninstall`, must be updated upstream in `packages/docs/template/` first and then dogfooded, per the maintainer dogfooding rule; the delta backlog carries that work.
- External contracts consumed: the Playbook `operation:` step field from [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md) references registry identifiers and is consumed unchanged; the CLI/MCP operation-boundary rules in [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md) apply to every registry operation surfaced on the CLI or as MCP tools.

Code anchors:

- `packages/cli/src/cli.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/docs/template/`
- `scripts/smoke-pack.mjs`

## Required Baseline Annotations

- [07-cli-command-surface-and-lifecycle.md](07-cli-command-surface-and-lifecycle.md): `Superseded by` as a new `#### Change Notes` block under Public command model; `Superseded by` appended newest-last to the Contracts and Data `### Change Notes` for the root command contract and parser taxonomy; `Superseded by` appended newest-last to the Rebuild Notes `### Change Notes` for the no-command/`init`/`update` rebuild guidance.
- [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md): a W18 R11 paragraph appended newest-last to its doc-level `## Change Notes`, plus `Superseded by` as a new `#### Change Notes` block under Development Contract for the `make-docs operations ...` surface and hand-maintained mirroring.
- [26-revise-no-scripts-migration-skill-refactor.md](26-revise-no-scripts-migration-skill-refactor.md): a W18 R11 paragraph appended newest-last to its doc-level `## Change Notes`, plus `Superseded by` as a new `#### Change Notes` block under Script Classification for the operation-destination rule.
- [16-revise-package-and-deployment-boundaries.md](16-revise-package-and-deployment-boundaries.md): `Enhanced by` as a new `### Change Notes` block under Effective Requirement for machine-footprint tool self-management under the preserved remote-execution posture.
- [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md): `Superseded by` appended newest-last to the Component and Capability Map `### Change Notes` for the install lifecycle command spellings.
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md): `Enhanced by` appended newest-last to the Impacted Docs and Dependencies `### Change Notes` resolving the operation-registry external contract to this PRD.
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): `Enhanced by` appended newest-last to the Impacted Docs and Dependencies `### Change Notes` resolving the operation-registry external contract to this PRD.
- [38-revise-global-store-and-project-state.md](38-revise-global-store-and-project-state.md): `Enhanced by` as a new `### Change Notes` block under Impacted Docs and Dependencies resolving the planned-W18-R11 reorganization lineage to this PRD.
- [00-index.md](00-index.md): add PRD 39 to the reading order, document map, source anchors, audience paths, and intended follow-on.
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md): advance R-005, R-016, and D-002 in place with the W18 R11 decisions, and add the hard-cutover and half-migrated-state migration exposure as a new rebuild risk at the next available number.

## Source Anchors

- [../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md](../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md)
- [../designs/2026-06-20-cli-separation-and-mcp-boundary.md](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- [../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md](../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)
- [../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md](../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md)
- [../assets/artifacts/NORTHSTAR.md](../assets/artifacts/NORTHSTAR.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-overview.md](../plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-overview.md)
- [../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-index.md](../work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-index.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [26 Revise No-Scripts Migration Skill Refactor](26-revise-no-scripts-migration-skill-refactor.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [35 Revise Run Playbook State Machine](35-revise-run-playbook-state-machine.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [38 Revise Global Store and Project State](38-revise-global-store-and-project-state.md)
- `packages/cli/src/cli.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `scripts/smoke-pack.mjs`
