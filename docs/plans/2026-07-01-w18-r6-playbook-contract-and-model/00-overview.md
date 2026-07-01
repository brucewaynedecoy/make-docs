---
title: "W18 R6 Playbook Contract and Model"
kind: "plan"
status: "draft"
coordinate: "W18 R6"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The plan should become active PRD requirements before contract, parser, validator, diagnostics, and default-playbook migration implementation begins."
  coordinate_handoff: "Carry W18 R6 into the downstream PRD reconciliation and work backlog lineage."
source:
  type: "design"
  path: "docs/designs/2026-06-30-playbook-contract-and-model.md"
---

# W18 R6 Playbook Contract and Model

## Purpose

Produce the reviewable change plan for turning [Playbook Contract and Model](../../designs/2026-06-30-playbook-contract-and-model.md) into active PRD requirements and a decision-complete delta work backlog. The design establishes the authoritative Playbook contract — document schema, embedded workflow contract and step model, dependency registry, and the single Playbook model with parser, validator, and diagnostic catalog — replacing the substring-based contract that W18 R1 lineage left distributed across earlier designs, one dogfood Playbook, and code validators.

## Objective

This plan is complete when the active PRD namespace carries the deterministic Playbook contract as an effective requirement through a new numbered revision doc, the genuinely impacted baseline PRDs carry `### Change Notes` backlinks, the PRD index and living risk register reflect the change, and a dependency-ordered delta backlog exists that an implementing agent can execute without re-deriving contract, parser, validator, operations-wiring, or test-fixture decisions.

## Coordinate Decision

- Coordinate: `W18 R6`
- Classification: `revision`
- Evidence: The design's Coordinate Handoff declares W18 lineage — it revises W18 R1 (Playbook contract and catalog validation) and W18 R4 (resolver and stack decisions) by replacing the substring-based contract those waves established. Per the wave-model lineage rule, the wave stays W18 and the revision is the next unused one; `docs/plans/` already contains W18 R1 through W18 R5, so R6 is the next unused revision of wave 18.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Playbook Contract and Model design | design doc | [../../designs/2026-06-30-playbook-contract-and-model.md](../../designs/2026-06-30-playbook-contract-and-model.md) | High — accepted authority with D0–D7 decisions and R-* requirement IDs |
| Playbook Architecture and Design, Sections 0–4 | artifact | [../../assets/artifacts/playbook-architecture.md](../../assets/artifacts/playbook-architecture.md) | High as source material; the design is the authority where they differ |
| PRD 29 Playbook Contract Run Playbook | baseline PRD | [../../prd/29-revise-playbook-contract-run-playbook.md](../../prd/29-revise-playbook-contract-run-playbook.md) | High — the primary baseline being revised |
| PRD 33 Playbook Packaging and Harness Adapter Registry | baseline PRD | [../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md) | High — packaging rails must now consume the single Playbook model |
| PRD 22 New Docs Assets Playbooks Persona Model | baseline PRD | [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md) | High — the playbook filename form in its namespace tree changes |
| PRD 30 Harness Plugin Substrate Workflow Bundles | baseline PRD | [../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md) | High — its Playbook Boundary cites the superseded filename form |

Open questions and ambiguities discovered during execution are promoted into [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) per its numbering and status rules.

## Baseline Context

- Active `docs/prd/` status: active namespace, docs `00` through `33`; next available number is `34`.
- Impacted baseline docs: PRD 29 (canonical location naming, minimum frontmatter, body contract, `run:` orchestration-hint declaration), PRD 22 (playbook filename form in the managed asset namespace tree), PRD 30 (playbook filename literal in the Playbook Boundary), PRD 33 (packaging deterministic rails now read the single Playbook model). PRD 29's resolver identity, run-state, harness capability semantics, and generic Run Playbook model are not revised; the design's R-SCOPE-1 explicitly leaves runner, packaging, conformance, CLI reorganization, and global-store ownership with their own designs.
- Discovery pass required: no
- Discovery scope if required: n/a

## Output Contract

- Plan directory: `docs/plans/2026-07-01-w18-r6-playbook-contract-and-model/`
  - entry point: `docs/plans/2026-07-01-w18-r6-playbook-contract-and-model/00-overview.md`
  - phase files: `docs/plans/2026-07-01-w18-r6-playbook-contract-and-model/0N-<phase>.md`
- New change docs:
  - `docs/prd/34-revise-playbook-contract-and-model.md`
- Baseline docs to annotate: `docs/prd/29-revise-playbook-contract-run-playbook.md`, `docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md`, `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md`, `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md`
- Index and register updates: `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`
- Delta backlog:
  - `docs/work/2026-07-01-w18-r6-playbook-contract-and-model/`

## Change Doc Strategy

One change doc carries the whole scope because the four decision areas (document schema, workflow contract, dependency registry, model/parser/validator) share one rationale — replacing the substring-based contract with a deterministic parseable one — and one delivery sequence.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [34-revise-playbook-contract-and-model.md](../../prd/34-revise-playbook-contract-and-model.md) | revision | Supersedes the substring-based Playbook contract from the PRD 29 lineage with the deterministic document-and-workflow contract, dependency registry, and single parsed Playbook model. | PRD 29, PRD 22, PRD 30, PRD 33, plus the PRD index and risk register. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [29-revise-playbook-contract-run-playbook.md](../../prd/29-revise-playbook-contract-run-playbook.md) | Change Notes; Canonical Playbook Location; Minimum Frontmatter; Body Contract; Harness Capability Mediation | Superseded by | [34-revise-playbook-contract-and-model.md](../../prd/34-revise-playbook-contract-and-model.md) |
| [22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md) | Managed Project Asset Namespace | Superseded by | [34-revise-playbook-contract-and-model.md](../../prd/34-revise-playbook-contract-and-model.md) |
| [30-revise-harness-plugin-substrate-workflow-bundles.md](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md) | Playbook Boundary | Superseded by | [34-revise-playbook-contract-and-model.md](../../prd/34-revise-playbook-contract-and-model.md) |
| [33-enhance-playbook-packaging-and-harness-adapter-registry.md](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md) | Contracts and Data | Enhanced by | [34-revise-playbook-contract-and-model.md](../../prd/34-revise-playbook-contract-and-model.md) |

## Worker Ownership

The coordinator write scope is `none` when delegation is available; every output-writing task below belongs to a role-based worker with a disjoint write scope.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Change doc author | Author PRD 34 from the revision template with the design's R-* requirement IDs | `docs/prd/34-revise-playbook-contract-and-model.md` | Accepted W18 R6 design | The effective-requirement change doc. |
| Baseline annotation worker | Add `### Change Notes` backlinks under the genuinely impacted headings | `docs/prd/29-*.md`, `docs/prd/22-*.md`, `docs/prd/30-*.md`, `docs/prd/33-*.md` (annotations only) | PRD 34 exists | Non-destructive supersession/enhancement annotations. |
| Index and register assembler | PRD index row, reading-order and lineage mentions, risk-register updates | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` | PRD 34 and annotations | Accurate catalog status, lineage, and register state. |
| Delta backlog author | Dependency-ordered W18 R6 implementation backlog | `docs/work/2026-07-01-w18-r6-playbook-contract-and-model/**` | PRD 34 shape settled | Decision-complete delta backlog. |
| Validation worker | Link, path-hygiene, wave-numbering, annotation, and traceability checks | Changed docs only (fix-up edits) | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search and section reads when indexed and `jcodemunch` for any code-anchor verification; reindex before falling back.
- Fallback plan if unavailable: direct file reads plus `rg` for targeted searches, with repository contracts under `.make-docs/**` as the structural authority.

## Validation

Execution validates that PRD 34 uses the revision template and carries every design R-* family (R-AUTH, R-SCOPE, R-DOC, R-WF, R-DEP, R-MODEL, R-TEST); that every impacted baseline doc contains the required `### Change Notes` backlink with the planned verb and no baseline text was deleted or renumbered; that `docs/prd/00-index.md` shows doc 34 with Current status and consistent reading-order and lineage prose; that the risk register reflects the contract/validator parity obligation without duplicating existing items; that every backlog phase cites PRD 34 plus the still-constraining baselines; and that changed files pass link, path-hygiene, and `git diff --check` review plus `bash scripts/check-wave-numbering.sh` where applicable.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-prd-change-doc-and-baseline-reconciliation.md](01-prd-change-doc-and-baseline-reconciliation.md) | Author PRD 34, annotate the impacted baselines, and update the PRD index and risk register. |
| [02-contract-and-model-scope.md](02-contract-and-model-scope.md) | Settle the contract-authoring, parser, validator, and diagnostics scope the backlog must encode, grounded in D0–D7. |
| [03-delta-backlog-and-validation.md](03-delta-backlog-and-validation.md) | Generate the W18 R6 delta backlog and run the closing validation pass. |

## Dependencies

- [Playbook Contract and Model](../../designs/2026-06-30-playbook-contract-and-model.md) is the accepted authority; [Playbook Architecture and Design](../../assets/artifacts/playbook-architecture.md) Sections 0–4 are its source material.
- The operation registry and stable operation identifiers are owned by the CLI command reorganization design ([../../assets/artifacts/cli-command-reorganization.md](../../assets/artifacts/cli-command-reorganization.md)); this plan consumes identifiers such as `playbook.validate` and `playbook.catalog` as an external contract per R-SCOPE-2.
- Run-state storage and runtime execution semantics are owned by the [Run Playbook State Machine](../../designs/2026-07-01-run-playbook-state-machine.md) design and the [Runtime and Global Store](../../assets/artifacts/runtime-and-global-store.md) artifact; this plan defines contract fields only.
- Upstream-first authoring per [2026-06-19 Template, Package, and Dogfood Source-of-Truth Contract](../../designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md): the Playbook contract and default Playbooks are authored under `packages/docs/template/` and dogfooded into `./.make-docs/` and `./docs/`; this planning round writes project planning/PRD/work content only and authors nothing under `packages/`.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then implement from the W18 R6 delta backlog.
- Why: The plan should become the product requirement contract before contract authoring, parser/validator, operations wiring, and default-playbook migration implementation begins, because the runner, packaging, and conformance designs all compile against this model.
- Coordinate Handoff: Carry `W18 R6` into the downstream PRD reconciliation and the delta work backlog lineage, adding the active P coordinate per phase.
