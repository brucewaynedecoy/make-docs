---
title: "W18 R11 CLI Command Reorganization and Operation Registry"
kind: "plan"
status: "draft"
coordinate: "W18 R11"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The plan should become active PRD requirements before the operation registry, shared core, reorganized command tree, tool self-management, and pruned run surface implementation begins."
  coordinate_handoff: "Carry W18 R11 into the downstream PRD reconciliation and work backlog lineage."
source:
  type: "design"
  path: "docs/designs/2026-07-01-cli-command-reorganization-and-operation-registry.md"
---

# W18 R11 CLI Command Reorganization and Operation Registry

## Purpose

Produce the reviewable change plan for turning [CLI Command Reorganization and Operation Registry](../../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md) into active PRD requirements and a decision-complete delta work backlog. The design reorganizes the Make Docs CLI into five top-level commands — `setup`, `run`, `mcp`, `update`, and `uninstall` — organized as self, project, run, and serve; formalizes the append-only `domain.verb` operation registry as the single source that the CLI `run` tree, the MCP tools, and Playbook `operation:` steps are three surfaces over; fixes the shared modular operation core with typed contracts, injected execution context, and one-way dependencies; adds machine-footprint tool self-management reconciled with the remote-execution posture; and reflects the pruning that leaves `run` with the playbook subtree, the package subtree, and exactly two retained work operations.

## Objective

This plan is complete when the active PRD namespace carries the reorganized command tree, the operation registry, the shared operation core, tool self-management, the migration rules, and the pruned `run` surface as an effective requirement through a new numbered revision doc, the genuinely impacted baseline PRDs carry `### Change Notes` backlinks or doc-level change-note paragraphs, the PRD index and living risk register reflect the change including advancing the existing CLI-surface items in place, and a dependency-ordered delta backlog exists that an implementing agent can execute without re-deriving command-tree, registry, core-contract, self-management, run-surface, migration, or test decisions.

## Coordinate Decision

- Coordinate: `W18 R11`
- Classification: `revision`
- Evidence: The design's Coordinate Handoff declares that it reorganizes the W18 CLI and operations command surface, formalizes the operation registry and shared core, and reflects the operation pruning, so the lineage stays in wave 18 per the wave-model lineage rule. `docs/plans/` already contains W18 R1 through W18 R10, so R11 is the next unused revision of wave 18.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

The change alters established requirements: the flat top-level CLI taxonomy with `operations` and `mcp` beside the install commands and the project-level `uninstall`, and the hand-maintained CLI/MCP surface parity, are replaced by the five-command tree, registry-derived surfaces, tool self-management, no back-compatibility aliases, and the pruned `run` surface, and the change-doc selection rules use a revision doc whenever a change alters an already-established requirement even when new implementation work is also needed.

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| CLI Command Reorganization and Operation Registry design | design doc | [../../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md](../../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md) | High — accepted authority with D0–D10 decisions and R-* requirement IDs |
| CLI Command Reorganization | artifact | [../../assets/artifacts/cli-command-reorganization.md](../../assets/artifacts/cli-command-reorganization.md) | High as source material; records the current-state inventory, the command mapping table, and the locked core properties; the design is the authority where they differ |
| Migrated Deterministic Operations Inventory | artifact | [../../assets/artifacts/migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md) | High — records the ten-operation cluster, the keep/remove disposition, and the two retained work operations whose internals this plan must not redefine |
| NORTHSTAR guiding principles | artifact | [../../assets/artifacts/NORTHSTAR.md](../../assets/artifacts/NORTHSTAR.md) | High — supplies the R-SEQ-3 filter for what deterministic logic earns a registry slot |
| Playbook Architecture Section 0.6 | artifact | [../../assets/artifacts/playbook-architecture.md](../../assets/artifacts/playbook-architecture.md) | High — introduces the operation registry and the three-surfaces model the design formalizes |
| PRD 07 CLI Command Surface and Lifecycle | baseline PRD | [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md) | High — the primary baseline being revised; it carries the flat public taxonomy, the project-level `uninstall`, and the rejected `update` surface |
| PRD 25 Revise CLI Separation and MCP Boundary | change PRD | [../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | High — the CLI/MCP boundary is preserved per R-KEEP-1 while its `make-docs operations ...` surface and hand-maintained CLI/MCP mirror expectation are superseded by registry derivation |
| PRD 26 Revise No-Scripts Migration Skill Refactor | change PRD | [../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md#no-scripts-migration-dependency) | High — R-SEQ-3 revises the migration destination: derivation-heavy behavior becomes Playbooks, and only registry-worthy logic is retained as operations |
| PRD 16 Revise Package and Deployment Boundaries | change PRD | [../../prd/16-package-runtime-and-deployment-boundaries.md](../../prd/16-package-runtime-and-deployment-boundaries.md) | High — the remote-execution posture and one-command/no-alias boundary are preserved while tool self-management is added around the machine-level footprint |
| PRD 05 Installation Profile and Manifest Lifecycle | baseline PRD | [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md) | High — the install lifecycle semantics are preserved while the command spellings move under `setup` and project uninstall becomes `setup remove` |
| PRD 35 Revise Run Playbook State Machine | change PRD | [../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) | High — its progression operations surface under `run playbook` and its operation-registry external contract now resolves to the new change doc |
| PRD 36 Revise Playbook Packaging Compiler and Harness Adapters | change PRD | [../../prd/36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | Medium — its packaging operations surface under `run package` and its operation-registry external contract now resolves to the new change doc |
| PRD 38 Revise Global Store and Project State | change PRD | [../../prd/38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) | High — the retained work operations are keyed to its project-state model, and its cross-design mention of the reorganization lineage as planned W18 R11 now resolves to the new change doc |

Open questions and ambiguities discovered during execution are promoted into [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) per its numbering and status rules.

## Baseline Context

- Active `docs/prd/` status: active namespace, docs `00` through `38`; next available number is `39`.
- Impacted baseline docs: PRD 07 (the flat public command taxonomy is superseded: the no-command install/sync plus `reconfigure`, `skills`, `backup`, and project-level `uninstall` parser model, the rejected `update` surface, and the four-subcommand help matrix are replaced by the five-command tree with the `setup` subtree, `setup remove`, context-aware bare invocation, and top-level tool self-management; the wizard, review, conflict, audit-snapshot, and lifecycle-safety semantics remain active and move under the new spellings), PRD 25 (the CLI/MCP boundary, remote-execution posture, installer-first no-command meaning, operation-domain development contract, and config-overlay subordination are preserved per R-KEEP-1; the `make-docs operations ...` compatibility surface and the hand-maintained expectation that operation modules mirror CLI/MCP command domains are superseded by the registry as single source with derived or conformance-checked surfaces and registry-derived MCP tool names), PRD 26 (the operation-first migration order and managed removal safety remain active; the destination rule is superseded per R-SEQ-3: derivation-heavy behavior becomes Playbooks rather than CLI operations, and only fact-of-record or fiddly, genuinely reused canonical-identity or parse primitives earn a registry slot), PRD 16 (enhanced: the remote-execution-first posture, one primary command, and no-default-aliases boundary are preserved, and machine-footprint `uninstall` plus detect-and-delegate `update` are added as tool self-management defined around the machine-level footprint rather than assuming a global install), PRD 05 (the command spellings around the install lifecycle are superseded: install/sync becomes `setup`, `reconfigure` becomes `setup reconfigure`, project uninstall becomes `setup remove`, and `setup`/`setup reconfigure` gain pre-v2 detection; the three install modes, planner/apply flow, conflict staging, and audit-snapshot safety semantics are unchanged), PRD 35 (enhanced: the operation registry and `run playbook` surface it consumed from the CLI reorganization artifact now land as active requirements in PRD 39), PRD 36 (enhanced: the operation registry external contract it consumed from the artifact now lands as PRD 39, with `run package` plan, surface-resolve, and write fixed as the packaging CLI surface), and PRD 38 (enhanced: its cross-design sequencing mention of the reorganization lineage as planned W18 R11 now resolves to PRD 39, whose retained work operations record and read evidence through the PRD 38 store).
- Not annotated after verification: PRD 34 consumes the registry only as the step `operation:` field's external identifier contract with no command spellings, and PRD 29 and PRD 30 delegate execution to the runner without naming CLI command spellings, so PRD 39 adds nothing they must carry; PRD 32's backup-destination, protection, and pruning rules are command-spelling-free and its uninstall/setup-remove store obligations were already annotated by W18 R10; PRD 01, PRD 08, PRD 09, and PRD 10 mention command spellings only incidentally and inherit the rename through the PRD 07 taxonomy supersession and the D-002 public-docs audit rather than per-doc annotations.
- Discovery pass required: no
- Discovery scope if required: n/a

## Output Contract

- Plan directory: `docs/plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/`
  - entry point: `docs/plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-overview.md`
  - phase files: `docs/plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/0N-<phase>.md`
- New change docs:
  - `docs/prd/39-cli-command-model-and-operation-registry.md`
- Baseline docs to annotate: `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`, `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`, `docs/prd/16-package-runtime-and-deployment-boundaries.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/35-run-playbook-state-machine-and-portability.md`, `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`, `docs/prd/38-global-store-and-project-state.md`
- Index and register updates: `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`
- Delta backlog:
  - `docs/work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/`

## Change Doc Strategy

One change doc carries the whole scope because the design's decision areas (top-level structure, bare-command behavior, tool self-management, the operation registry and shared core, the pruned `run` surface, migration, and sequencing) share one rationale — the CLI grew without reorganization, mixing three concerns at the top level, lacking self-management, and hand-maintaining parallel CLI and MCP surfaces that drift — and one delivery sequence fixed by R-SEQ-1.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) | revision | Supersedes the flat top-level CLI taxonomy, the project-level `uninstall`, the hand-maintained CLI/MCP surface mirrors, and the wave/phase/closeout operation cluster's `run`-surface presence with the five-command tree, the append-only operation registry as single source with derived surfaces, the shared modular operation core, machine-footprint tool self-management, no aliases plus pre-v2 detection, and the pruned `run` surface. | PRD 07, PRD 25, PRD 26, PRD 16, PRD 05, PRD 35, PRD 36, PRD 38, plus the PRD index and risk register. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md) | Public command model (new `#### Change Notes`), Contracts and Data `### Change Notes` (newest note last), Rebuild Notes `### Change Notes` (newest note last) | Superseded by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) |
| [25-typescript-runtime-cli-mcp-operation-boundaries.md](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Doc-level Change Notes (W18 R11 paragraph, newest last); Development Contract (new `#### Change Notes`) | Superseded by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) |
| [25-typescript-runtime-cli-mcp-operation-boundaries.md](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md#no-scripts-migration-dependency) | Doc-level Change Notes (W18 R11 paragraph, newest last); Script Classification (new `#### Change Notes`) | Superseded by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) |
| [16-package-runtime-and-deployment-boundaries.md](../../prd/16-package-runtime-and-deployment-boundaries.md) | Effective Requirement (new `### Change Notes`) | Enhanced by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) |
| [05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md) | Component and Capability Map `### Change Notes` (newest note last) | Superseded by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) |
| [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) | Impacted Docs and Dependencies `### Change Notes` (newest note last) | Enhanced by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) |
| [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | Impacted Docs and Dependencies `### Change Notes` (newest note last) | Enhanced by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) |
| [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) | Impacted Docs and Dependencies (new `### Change Notes`) | Enhanced by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) |

## Worker Ownership

The coordinator write scope is `none` when delegation is available; every output-writing task below belongs to a role-based worker with a disjoint write scope.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Change doc author | Author PRD 39 from the revision template with the design's R-* requirement IDs | `docs/prd/39-cli-command-model-and-operation-registry.md` | Accepted W18 R11 design | The effective-requirement change doc. |
| Baseline annotation worker | Add change-note backlinks under the genuinely impacted headings, newest note last in existing blocks | `docs/prd/07-*.md`, `docs/prd/25-*.md`, `docs/prd/26-*.md`, `docs/prd/16-*.md`, `docs/prd/05-*.md`, `docs/prd/35-*.md`, `docs/prd/36-*.md`, `docs/prd/38-*.md` (annotations only) | PRD 39 exists | Non-destructive supersession/enhancement annotations. |
| Index and register assembler | PRD index row, reading-order and lineage mentions, risk-register updates including advancing R-005, R-016, and D-002 in place and adding the new migration risk | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` | PRD 39 and annotations | Accurate catalog status, lineage, and register state. |
| Delta backlog author | Dependency-ordered W18 R11 implementation backlog | `docs/work/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/**` | PRD 39 shape settled | Decision-complete delta backlog. |
| Validation worker | Link, path-hygiene, wave-numbering, annotation, and traceability checks | Changed docs only (fix-up edits) | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search and section reads when indexed and `jcodemunch` for any code-anchor verification; reindex before falling back.
- Fallback plan if unavailable: direct file reads plus `rg` for targeted searches, with repository contracts under `.make-docs/**` as the structural authority.

## Validation

Execution validates that PRD 39 uses the revision template and carries every design R-* family (R-SCOPE, R-KEEP, R-TOP, R-BARE, R-SELF, R-REG, R-CORE, R-SURF, R-RUN, R-MIG, R-SEQ, R-TEST); that every impacted baseline doc contains the required change-note backlink with the planned verb, newest note last, and no baseline text was deleted or renumbered; that `docs/prd/00-index.md` shows doc 39 with Current status and consistent reading-order and lineage prose; that the risk register advances R-005, R-016, and D-002 in place rather than duplicating them and adds any new item at the next available number, verified as R-024; that every backlog phase cites PRD 39 plus the still-constraining baselines; and that changed files pass link, path-hygiene, and `git diff --check` review.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-prd-change-doc-and-baseline-reconciliation.md](01-prd-change-doc-and-baseline-reconciliation.md) | Author PRD 39, annotate the impacted baselines, and update the PRD index and risk register. |
| [02-command-tree-registry-and-run-surface-scope.md](02-command-tree-registry-and-run-surface-scope.md) | Settle the command-tree, registry, core-contract, self-management, run-surface, migration, sequencing, and test scope the backlog must encode, grounded in D0–D10. |
| [03-delta-backlog-and-validation.md](03-delta-backlog-and-validation.md) | Generate the W18 R11 delta backlog and run the closing validation pass. |

## Dependencies

- [CLI Command Reorganization and Operation Registry](../../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md) is the accepted authority; [cli-command-reorganization.md](../../assets/artifacts/cli-command-reorganization.md) is its source material, [migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md) supplies the pruning disposition and the two retained work operations, [NORTHSTAR.md](../../assets/artifacts/NORTHSTAR.md) supplies the R-SEQ-3 slot filter, and [playbook-architecture.md](../../assets/artifacts/playbook-architecture.md) Section 0.6 supplies the three-surfaces registry model.
- Cross-design sequencing per R-SEQ-1: the operation core, the registry, and the reorganized command tree land first and all retained operation logic moves behind the registry in the same wave, so no half-migrated state exists where some operations are registry-backed and others are hand-wired.
- Cross-design sequencing for the retained work operations: the work-item identity resolver and the work-execution evidence record and read are keyed to the W18 R10 project-state model in [../../prd/38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md), so their implementation is gated on the store, its concurrency model, and the stable project identifier landing per the W18 R10 backlog; the `run playbook` progression verbs remain owned by the W18 R7 lineage in [../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) and this plan fixes only their surface.
- Per R-SCOPE-1, this plan must not redefine the internal logic of the operations or the pruning removals (tracked by [migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md)), the Playbook model, runner, packaging, and conformance (owned by the W18 R6 through R9 lineages), the global store schema and project-state model (owned by [../../prd/38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md)), or the CLI/MCP boundary and TypeScript runtime authority (preserved from [../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) and [../../prd/16-package-runtime-and-deployment-boundaries.md](../../prd/16-package-runtime-and-deployment-boundaries.md)).
- The reorganization has a documentation consequence: any template-owned instruction router, guide, or README that names old command spellings such as `operations` or the project-level `uninstall` must be updated upstream in `packages/docs/template/` first and then dogfooded, per the maintainer dogfooding rule; that template-doc update is in-scope implementation work carried by the delta backlog, and this documentation pass authors nothing under `packages/`.
- The reorganization implementation is ordinary source code under the CLI package, not a repository file and not a shipped template asset; this planning round writes project planning/PRD/work content only.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then implement from the W18 R11 delta backlog.
- Why: The plan should become the product requirement contract before the registry, core, command tree, self-management, run-surface, and migration implementation begins, because Playbooks, MCP tools, and the W18 R7 and R10 lineages all reference registry identifiers this change fixes, and R-SEQ-1 requires the core, registry, and tree to land together.
- Coordinate Handoff: Carry `W18 R11` into the downstream PRD reconciliation and the delta work backlog lineage, adding the active P coordinate per phase.
