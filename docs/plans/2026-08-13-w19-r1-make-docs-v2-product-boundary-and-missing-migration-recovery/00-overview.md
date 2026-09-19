---
title: "W19 R1 Make Docs v2 Product Boundary and Missing Migration Recovery"
kind: "plan"
status: "draft"
coordinate: "W19 R1"
source:
  type: "design"
  path: "docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "Reconcile the accepted design into current PRD authority before any backlog or implementation stage."
  coordinate_handoff: "Carry W19 R1 into the downstream PRD-maintenance and delta-backlog lineage; neither stage is authorized by this plan."
---

# W19 R1 Make Docs v2 Product Boundary and Missing Migration Recovery

**Date:** 2026-08-13

**Repository:** Make Docs maintainer monorepo and dogfood instance

## Purpose

Translate the accepted [Make Docs v2 Product Boundary and Missing Migration Recovery design](../../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) into a decision-complete PRD-authority maintenance plan and documentation-first build sequence. This plan does not edit PRDs, generate work, implement, migrate, project, regenerate dogfood, release, or deploy.

## Approval State And Lifecycle Handling

- The owner accepted the source design and authorized plan creation only.
- The lifecycle remains `design -> plan -> PRD -> work -> implementation`; no stage is skipped, reordered, or implicitly authorized.
- Saving or accepting this plan does not authorize PRD edits, backlog generation, implementation, setup, reconfiguration, migration, projection, dogfood regeneration, commit, integration, publication, release, or deployment.
- The next possible stage is PRD reconciliation under a distinct, later owner authorization. A backlog may be derived only from accepted, reconciled PRDs and under its own later authorization.

## Objective

Make a future PRD-maintenance stage executable without rediscovering accepted decisions. Completion means every candidate has one disposition and owner, requirement-history and shared-surface obligations are explicit, later workers have disjoint scopes and merge order, and the eventual build sequence preserves upstream-first authority, safe migration, CLI/MCP parity, thin Naive-UAT Skill shims, paired Persona authority, and finite validation gates.

## Governing Invariant

> `docs/prd/` describes the current authoritative product shape. It must not describe the editorial operation used to change that authority.

Migration mechanics and implementation sequencing stay in this plan, the future delta backlog, and history. Current behavior and boundaries are updated inline in their existing PRD owners before non-normative history is appended.

## Coordinate Decision

- Coordinate: `W19 R1`
- Classification: `revision`
- Evidence: [W19 R0](../2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/00-overview.md) proposed an unexecuted Protocol direction. The accepted recovery design materially reverses the same source lineage: Make Docs owns neither Playbooks nor Protocols, retains Naive UAT, restores system resources and safe migration, and requires paired PRD 46/47 reconciliation. Under the wave model, lineage wins over the highest-wave fallback. `R1` is the next unused W19 revision.
- Supersession: W19 R1 prospectively supersedes W19 R0. W19 R0 remains unchanged provenance and is not executed or archived by this plan.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Accepted recovery design | Design authority | `docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md` | Highest; owner accepted |
| Active product authority | PRD set | `docs/prd/00-index.md` and its linked PRDs | Highest until separately authorized reconciliation |
| Planning, lifecycle, wave, and PRD-change references | System references | `.make-docs/references/system/` | Normative for plan construction and handoff |
| W19 R0 plan | Prior unexecuted plan | `docs/plans/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/` | Provenance only |
| Focused code trace | Read-only repository inspection | `packages/cli/src/`, `packages/skills/` | High for current consumers and observed absences; bounded, not theoretical proof |

## Active Authority Baseline

- Active PRDs remain authoritative until a separate PRD-stage authorization changes them.
- Current index: `docs/prd/00-index.md`.
- The bounded planning preflight is complete. Later PRD workers verify exact current prose in their assigned sections without reopening accepted design choices.
- PRDs 34, 35, and 36 remain numbered in place. Their removed subjects become present-tense retired-capability boundaries, not migration/editorial PRDs; archival is not authorized.

## Planning Preflight Findings

| Surface | Current evidence | Disposition |
| --- | --- | --- |
| Skill registry/catalog and agentic roles | Production consumers exist in audit, CLI, installation, planner, Skills commands, wizard, manifest, and Skills UI. Current first-party Skills do not include Naive UAT. | Keep the general substrate; add Naive-UAT only after PRD reconciliation. |
| Operation registry | Non-Playbook operations serve CLI, MCP, PRD authority, work evidence, and work-item surfaces. | Keep the shared registry; remove Playbook/Protocol assumptions and later add accepted resource/run/UAT operations. |
| Global Store | Project registry and work evidence have non-Playbook consumers; `playbook_runs` is separable legacy data. | Keep the general store, plan minimal `runs`/`run_evidence`, and preserve legacy rows opaquely until safe retirement. |
| Plugin substrate | Focused trace found tests but no production importer. | Removal candidate; recheck once immediately before deletion. |
| Hook/extension, harness-adapter, and packaging conformance | Focused trace found only Playbook packaging/compiler/planner/writer/conformance uses. | Removal candidates unless one later focused trace identifies a non-Playbook consumer. |
| Instruction routers | Code maps `AGENTS.md -> codex` and `CLAUDE.md -> claude-code`; closeout checks those root files. | Plan only these filenames and mappings. Other routers are absent, not inferred. |
| Naive UAT runtime | No Naive-UAT CLI operation, system workflow, or first-party Skill package was found. | Treat all as missing implementation against existing PRD owners. |
| Persona/evidence contract | PRDs 46 and 47 divide UAT and Persona authority. | Reconcile as one paired unit: configured `user`/`maintainer`, default `user`, evidence only under `docs/assets/<persona-slug>/testing/`. |

Unknown or untraced surfaces remain removal candidates or absent capability; this plan does not invent a contract from a name.

## Candidate Decision Matrix

| Candidate | Decision | Owning PRD(s) | Reason |
| --- | --- | --- | --- |
| Remove Playbook/Protocol product behavior and authority | `update-existing` | 01, 02, 04, 34, 35, 36 | Existing overview, architecture, glossary, authoring, run-state, and packaging PRDs own the claims. |
| Contracts, prompts, references, templates as peer resources | `update-existing` | 06, 17, 21 | These own template assets, materialization, and resource tiers. |
| Stable resource URI, local-first resolution, provenance | `update-existing` | 17, 21, 25, 39 | Existing resource/runtime/registry owners cover the contract. |
| Resource list/read through CLI and native MCP resources | `update-existing` | 07, 25, 39 | Command and MCP authority already exists. |
| Setup/reconfigure selections and router behavior | `update-existing` | 05, 06, 07, 15, 22 | Installation, template, lifecycle, instruction, and documentation-asset owners must agree on the exact router topology. |
| Manifest ownership/provenance, conflicts, backup, rollback, update, uninstall | `update-existing` | 05, 15, 18 | These own manifest lifecycle, initialization, and compatibility safety. |
| Unconditional configured-harness routers at the project root, `docs/`, `docs/assets/`, `.make-docs/`, `.make-docs/system/`, and the four typed system directories; capability-local `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/` routers controlled by the resolved effective profile and its dependencies; one root-only `docs/assets/` router; resource projection that controls bodies only; on-demand `.make-docs/archive/`, `docs/artifacts/`, and Persona testing | `update-existing` | 05, 06, 07, 15, 17, 21, 22, 39 | Existing installation, template, lifecycle, instruction, materialization, tool-directory, asset, and operation owners cover it. |
| Preserve ambiguous/user-owned assets and legacy rows through quiescence | `update-existing` | 18, 34, 35, 36, 38 | Compatibility and Store owners govern preservation and retired subjects. |
| Naive-UAT system workflow plus first-party Skill with CLI-only shims | `update-existing` | 08, 14, 25, 28, 46 | Skill, lifecycle, runtime, exposure, and UAT owners already exist. |
| Configured `user`/`maintainer`, default `user` | `update-existing` | 46 and 47, paired | UAT execution and Persona schema cannot diverge. |
| Installed-product, anti-coaching, scenario, evidence, finding, gate semantics | `update-existing` | 14, 45, 46 | These are durable UAT semantics, never Skill policy. |
| Evidence in `docs/assets/<persona-slug>/testing/`; prohibit archive/artifacts | `update-existing` | 22, 38, 46, 47 | Asset, Store, UAT, and Persona owners must agree. |
| Lightweight `runs`/`run_evidence` and typed receipts | `update-existing` | 25, 38, 39 | Runtime, Store, and operation-registry owners cover bounded fact-of-record state. |
| Optional agentics consumers | `update-existing` | 08, 20, 28, 30, 43, 44 | Existing Skill/exposure/plugin/conformance owners distinguish retained from removal-candidate surfaces. |
| Upstream template -> package -> root dogfood -> installed-project ordering | `update-existing` | 06, 09, 10, 16, 17 | Existing template, dogfood, release, validation, and materialization owners cover the order. |
| Cross-platform, security, privacy, finite proof budgets | `update-existing` | 05, 18, 25, 38 | Durable lifecycle/runtime/Store constraints require PRD authority. |
| W19 R0 supersession and resolved design question | `link-only` | This plan; normal PRD 00/03 maintenance only | Lineage and provenance, not a product capability. |
| Performance evidence governance | `link-only` | Accepted sibling design and W19 R2 plan | Reuse separate authority; do not duplicate profiles or thresholds. |
| New recovery/migration/removal/reconciliation PRD | `none` | None | Every requirement has a coherent existing owner; editorial-operation PRDs are forbidden. |

## Existing PRD Owner Map

| Group | PRDs and owning sections | Normative outcome |
| --- | --- | --- |
| Shared product authority | 00 index; 01 Purpose/Scope/Capabilities/Non-Goals; 02 runtime zones/component/data-flow/integrations; 03 decisions/risks/questions; 04 glossary | Current product boundary, architecture, terminology, resolved W19 R0 direction, stable risk IDs. |
| Install/resource authority | 05 `Selection and Manifest Invariants`, `Managed-File Conflict Planning`; 06 selected/generated assets; 07 `Public command model`, `Lifecycle commands`; 15 initialization/adoption; 17 `Scope`, `Requirements`, `Contracts and Data`; 21 same; 22 asset namespace and `Persona Grouping Boundary` | Peer resource types, selections, optional projection, the unconditional router foundation, profile-controlled capability-local routers, the root-only `docs/assets/` rule, on-demand archive/artifact/Persona-testing surfaces, provenance, safety, and evidence IA. |
| Package and validation authority | 09 dogfood; 10 package/release; 16 repository validation | Enforce upstream-first authoring, package projection, root dogfood, then installed-project validation. |
| Skill/UAT/Persona authority | 08 Skill Purpose Registry/Manifest, Explicit Selected-Skill Model, Purpose-Led Skill Selection, Skills Manifest Shape; 14 `Phase-Close Obligation and UAT Gates`; 45 findings/reporting; 46 R-NUAT-SCOPE/GOAL/EVIDENCE/GATE/SCENARIO/COVERAGE/STATE; 47 `Persona Schema`, `Testing and UAT Boundary` | Thin CLI-delegating Naive-UAT Skill, preserved UAT semantics, paired Persona choice/default and canonical evidence location. |
| Runtime/Store authority | 25 TypeScript ownership/MCP/current surface/no-scripts/operation-first/managed-removal sections; 38 R-ID/R-STORE/R-PS; 39 R-REG/R-CORE/R-SURF/R-SEQ/R-SCOPE/R-KEEP/R-RUN/R-RUNID/R-FLAG | Resource/run/UAT operations, CLI/MCP parity, native MCP resources, minimal Store receipts, safe removal. |
| Optional agentics/conformance | 20 support claims; 28 Shared Store/Native Exposure/Plugin Inheritance/No-Default-Skills; 30 plugin payload/definition/metadata/selection/lifecycle/workflow-bundle; 43 scenarios; 44 coverage/release gates | Keep traced shared consumers, keep agentics optional, withdraw packaging-specific claims, do not imply untraced consumers. |
| Retired Playbook/Protocol subjects | 34 Scope/Requirements/R-SCOPE/R-SELECT/R-DOC; 35 Generic Model/Scope/Requirements/R-SCOPE/R-KEEP/R-STORE/R-STATE; 36 Scope/Requirements/R-SCOPE/R-KEEP/R-DECL/R-COMP | Restate present-tense no-Playbook/no-Protocol boundaries in place; preserve document identity and non-normative history. |
| Metadata/config/compatibility | 18 compatibility/migration; 23 metadata/handoffs; 24 configuration overlay | Encode compatibility facets, safe migration, resource/UAT metadata, and only accepted configuration keys. |

## Genuinely New Product PRDs

`none`. System resources, lifecycle safety, Skills, runtime operations, Store records, Naive UAT, and Personas all have coherent owners. Do not create a PRD named for recovery, migration, removal, or reconciliation.

## Requirement History

After current normative text is updated, append standardized non-normative history for:

- PRDs 34-36: Playbook authority and unexecuted W19 R0 Protocol proposal -> no Playbook/Protocol product capability under W19 R1.
- PRDs 17/21/25/39: incomplete resource model -> four peer types, URI/local-first resolution, CLI/MCP parity.
- PRDs 05/15/18/38: incomplete provenance/migration and Playbook-specific persistence -> fail-closed provenance, quiescent migration, minimal runs/evidence, opaque legacy preservation.
- PRDs 08/14/46/47: Playbook-coupled or missing UAT execution/persona behavior -> system workflow, thin CLI shims, paired Persona authority, canonical evidence path.

History preserves prior authority; it never replaces updated present-tense requirements.

## Affected Links, Risks, Plans, And Work

| Surface | Required later maintenance | Role |
| --- | --- | --- |
| `docs/prd/00-index.md` | Update titles/kinds/navigation after subject PRDs settle. | Navigation only |
| `docs/prd/03-open-questions-and-risk-register.md` | Reconcile O-002, Q-015, Q-020, R-016, R-017, R-020, R-027 in place; add IDs only for genuinely new risks. | Living register |
| W19 R0 plan | Preserve unchanged; add a supersession backlink only if separately authorized and repository conventions require it. | Provenance |
| This W19 R1 plan | Keep as accepted sequencing/rationale authority after owner acceptance. | Plan authority |
| `docs/work/<execution-date>-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/` | Generate a scoped delta backlog only after accepted PRD reconciliation and separate authorization; cite PRDs as product authority. | Implementation queue |
| `docs/assets/archive/history/<execution-date>-w19-r1-p<P>-<slug>.md` | Create only for executed, separately authorized phases. | Execution provenance |

## Output Contract

- Plan directory: `docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/`
- Entry point: `00-overview.md`
- Phase files: `01-authority-baseline-and-decision-matrix.md` through `05-assembly-validation-and-build-sequencing.md`
- Existing PRD targets: the owner map above and phase-specific matrices.
- New PRDs: none.
- Shared surfaces: PRDs 00, 03, 04 and W19 R0 supersession provenance.
- Delta backlog: required after PRD acceptance, but not created here; use the actual execution date and preserve `W19 R1`.

## Worker Ownership And Merge Order

Future execution remains unauthorized but is delegation-ready:

| Future worker | Exclusive PRD write scope | Dependency |
| --- | --- | --- |
| Core/resource | 01, 02, 06, 16, 17, 21, 23, 24, 25, 39 | Plan acceptance plus PRD-stage authorization |
| Lifecycle/migration | 05, 07, 09, 10, 15, 18, 22, 38 | Same |
| Skills/agentics/retirement | 08, 20, 28, 30, 34, 35, 36, 43, 44 | Same |
| UAT/Persona | 14, 45, 46, 47 | Same; 46/47 merge as one paired unit |
| Shared-surface assembler | 00, 03, 04 and cross-links/history consistency | All subject workers complete |
| Validation/fix | Only files with concrete defects in the scopes above | Assembled candidate |

Merge subject PRDs first, PRDs 46/47 as an inseparable pair, shared surfaces second, then one focused validation/fix pass. No worker broadens into backlog or implementation without a new owner gate.

## MCP Strategy And Fallback

- Prefer `jdocmunch` for project docs and `jcodemunch` for code consumers and signatures.
- If an index is stale, reindex once and retry; do not repeatedly rebuild repository-wide indexes.
- If reindexing fails, use bounded direct reads and `rg`, record the fallback, and stop when decision-relevant surfaces are characterized.
- Immediately before deletion, trace imports/registrations once at the current revision. Untraced names remain removal candidates, not fabricated dependencies.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-authority-baseline-and-decision-matrix.md](01-authority-baseline-and-decision-matrix.md) | Freeze inputs, consumer trace, dispositions, PRD owners, history, and retirement handling. |
| [02-product-boundary-and-resource-authority.md](02-product-boundary-and-resource-authority.md) | Reconcile product/resource/CLI/MCP authority and its later build handoff. |
| [03-lifecycle-migration-and-data-safety-authority.md](03-lifecycle-migration-and-data-safety-authority.md) | Reconcile manifest provenance, quiescence, compatibility, Store, and rollback authority. |
| [04-naive-uat-persona-and-agentics-authority.md](04-naive-uat-persona-and-agentics-authority.md) | Reconcile UAT/Persona authority, system workflow, thin Skill shims, evidence, and optional agentics. |
| [05-assembly-validation-and-build-sequencing.md](05-assembly-validation-and-build-sequencing.md) | Assemble shared surfaces, validate authority, and define the later build/package/dogfood sequence. |

## Dependencies

1. Owner plan acceptance precedes PRD-stage execution.
2. PRD reconciliation precedes backlog generation or implementation.
3. PRDs 46/47 are a paired acceptance unit.
4. Removal candidates require one current trace immediately before deletion.
5. Reusable resources are authored in `packages/docs/template/` before package projection and root dogfood.
6. The sibling performance plan governs performance evidence; this plan does not duplicate profiles, targets, or requalification policy.

## Evidence Budgets And Stop Rules

- Reuse unchanged fingerprints; do not rerun identical checks for theoretical completeness.
- Each later phase gets one normal authoring pass, one materially distinct correction pass, and one confirmation review unless the owner authorizes more.
- Migration rehearsal is finite and fixture-scoped. Destructive migration is blocked without verified provenance, quiescence, current backup, and rollback evidence.
- Do not introduce universal performance thresholds, sample counts, or theoretical proof duties.
- Stop on contradictory provenance, unsafe disk growth, context/memory pressure, or unresolved authority conflict.

## Validation

Plan acceptance checks the complete directory, candidate/owner uniqueness, valid PRD-23 frontmatter, required headings, relative links/anchors, path hygiene, and whitespace. Semantic review must confirm prompt parity, CLI/MCP availability, thin CLI-only UAT shims, paired PRD 46/47 authority, evidence destinations, safe migration, and no invented consumer. Do not run full implementation or package suites at this gate.

## Unresolved Questions

No accepted product-design question blocks this plan. One bounded execution-time evidence question remains:

1. At the later implementation revision, does a production importer exist for any plugin/hook/extension/harness-adapter/packaging-conformance removal candidate? If not, retire it; if yes, reconcile its existing product owner before deletion.

W19 R1 P6 settled the former receipt question. P6 uses a dedicated `LifecycleStoreMutationReceipt` with only `schemaVersion`, `receiptId`, `operation`, `projectId`, `runId`, `storeSchemaVersion`, `resultingVersion`, and `committedAt`. Existing lifecycle and migration receipt types remain unchanged. The receipt proves only a Store transaction and carries no evidence payload or acceptance claim.

## Intended Follow-On

- Route: `prd-generation`
- Next step: after explicit owner authorization, execute W19 R1 PRD reconciliation.
- Why: accepted design decisions must become current product authority before work or implementation.
- Coordinate handoff: carry `W19 R1` into requirement history, accepted PRD changes, and the later scoped delta backlog.
- Exact owner plan-acceptance statement: **“I approve the W19 R1 Make Docs v2 Product Boundary and Missing Migration Recovery plan as accepted plan authority. This approval authorizes plan acceptance only; it does not authorize PRD reconciliation, work-backlog generation, implementation, setup, reconfiguration, migration, projection, dogfood regeneration, commit, integration, publication, release, or deployment.”**
- Exact later PRD-reconciliation authorization statement: **“I authorize W19 R1 PRD reconciliation for the Make Docs v2 Product Boundary and Missing Migration Recovery plan. This authorization permits maintenance of the mapped existing PRD authority only; it does not authorize work-backlog generation, implementation, setup, reconfiguration, migration, projection, dogfood regeneration, commit, integration, publication, release, or deployment.”**

Until the plan-acceptance statement or equally explicit plan-only approval is received, stop at the Plan Approval Gate. After plan acceptance, do not begin PRD reconciliation until the distinct PRD-reconciliation authorization is received.
