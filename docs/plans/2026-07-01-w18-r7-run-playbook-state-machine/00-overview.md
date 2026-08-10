---
title: "W18 R7 Run Playbook State Machine"
kind: "plan"
status: "draft"
coordinate: "W18 R7"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The plan should become active PRD requirements before the run-state record, progression engine, execution modes, resume, guardrail, portability, and test implementation begins."
  coordinate_handoff: "Carry W18 R7 into the downstream PRD reconciliation and work backlog lineage."
source:
  type: "design"
  path: "docs/designs/2026-07-01-run-playbook-state-machine.md"
---

# W18 R7 Run Playbook State Machine

## Purpose

Produce the reviewable change plan for turning [Run Playbook State Machine](../../designs/2026-07-01-run-playbook-state-machine.md) into active PRD requirements and a decision-complete delta work backlog. The design closes a verified gap — the current runner can create and read run state but has no progression engine — by defining the run-state record, the `playbook.start`/`status`/`next`/`advance`/`gate`/`resume`/`close` progression operations, execution by step mode, digest-aware resume, run-time guardrails, and run portability, and by relocating run state from the in-repo `.make-docs/runs/playbooks/<run-id>/state.json` location into the global store at `~/.make-docs/`.

## Objective

This plan is complete when the active PRD namespace carries the run state machine as an effective requirement through a new numbered revision doc, the genuinely impacted baseline PRDs carry `### Change Notes` backlinks, the PRD index and living risk register reflect the change including the run-state relocation dependency on the global store, and a dependency-ordered delta backlog exists that an implementing agent can execute without re-deriving storage, operation-semantics, mode, resume, guardrail, portability, or test decisions.

## Coordinate Decision

- Coordinate: `W18 R7`
- Classification: `revision`
- Evidence: The design's Coordinate Handoff declares W18 lineage — it revises W18 R4 (run playbook orchestration and harness capabilities), whose on-disk run-state location it supersedes, and completes the run-progression engine W18 R1 assumed but did not provide. Per the wave-model lineage rule, the wave stays W18 and the revision is the next unused one; `docs/plans/` already contains W18 R1 through W18 R6, so R7 is the next unused revision of wave 18.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Run Playbook State Machine design | design doc | [../../designs/2026-07-01-run-playbook-state-machine.md](../../designs/2026-07-01-run-playbook-state-machine.md) | High — accepted authority with D0–D10 decisions and R-* requirement IDs |
| Playbook Architecture and Design, Section 5 | artifact | [../../assets/artifacts/playbook-architecture.md](../../assets/artifacts/playbook-architecture.md) | High as source material; the design is the authority where they differ |
| Runtime and Global Store | artifact | [../../assets/artifacts/runtime-and-global-store.md](../../assets/artifacts/runtime-and-global-store.md) | Medium — working artifact that owns the store boundary this design consumes; its own design lineage is planned later as W18 R10 |
| PRD 29 Playbook Contract Run Playbook | baseline PRD | [../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md#requirements) | High — the primary baseline being revised; carries the superseded W18 R4 run-state location and the generic Run Playbook model the engine now realizes |
| PRD 34 Revise Playbook Contract and Model | change PRD | [../../prd/34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) | High — this design consumes its Playbook model, step modes, and shared status vocabulary unchanged |
| PRD 30 Harness Plugin Substrate Workflow Bundles | baseline PRD | [../../prd/30-plugin-substrate-and-workflow-bundles.md](../../prd/30-plugin-substrate-and-workflow-bundles.md) | High — its Playbook Boundary cites the superseded `.make-docs/runs/playbooks/**` state location |
| PRD 21 Tool Directory System Custom Resource Tiers | baseline PRD | [../../prd/21-project-tool-directory-and-resource-tiers.md](../../prd/21-project-tool-directory-and-resource-tiers.md) | Medium — its runtime-state family text includes temporary run state as in-repo runtime state, which the relocation partially supersedes for playbook runs |
| PRD 24 Configuration Convention Overlay | baseline PRD | [../../prd/24-project-configuration-and-convention-overlay.md](../../prd/24-project-configuration-and-convention-overlay.md) | High — the `harnessCapabilities` hint surface is consumed unchanged; no annotation expected |

Open questions and ambiguities discovered during execution are promoted into [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) per its numbering and status rules.

## Baseline Context

- Active `docs/prd/` status: active namespace, docs `00` through `34`; next available number is `35`.
- Impacted baseline docs: PRD 29 (the `.make-docs/runs/playbooks/<run-id>/state.json` run-state location and the required run-state field set under Run State, Nesting, and Concurrency are superseded; the Generic Run Playbook Model is enhanced by the progression engine that now executes its steps as registry operations), PRD 30 (the Playbook Boundary's `.make-docs/runs/playbooks/**` state literal is superseded; the delegation to the runner is unchanged), PRD 21 (temporary playbook run state no longer remains in-repo runtime state; the rest of the runtime-state family is unchanged), PRD 05 (the W18 R4 note placing run state under `.make-docs/runs/playbooks/**` is superseded; manifest and config ownership are unchanged), and PRD 10 (the W18 R4 packaged-runner validation coverage of `.make-docs/runs/playbooks/**` state is superseded in favor of global-store-backed coverage).
- Not annotated after verification: PRD 34 is consumed unchanged as the Playbook model authority and already records the Run Playbook State Machine design as a gated downstream dependency, and PRD 24's `harnessCapabilities` surface is inherited unchanged per R-SCOPE-2 and R-KEEP-1, so neither carries a requirement this change supersedes or extends.
- Discovery pass required: no
- Discovery scope if required: n/a

## Output Contract

- Plan directory: `docs/plans/2026-07-01-w18-r7-run-playbook-state-machine/`
  - entry point: `docs/plans/2026-07-01-w18-r7-run-playbook-state-machine/00-overview.md`
  - phase files: `docs/plans/2026-07-01-w18-r7-run-playbook-state-machine/0N-<phase>.md`
- New change docs:
  - `docs/prd/35-run-playbook-state-machine-and-portability.md`
- Baseline docs to annotate: `docs/prd/35-run-playbook-state-machine-and-portability.md`, `docs/prd/30-plugin-substrate-and-workflow-bundles.md`, `docs/prd/21-project-tool-directory-and-resource-tiers.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/10-packaging-validation-and-release-reference.md`
- Index and register updates: `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`
- Delta backlog:
  - `docs/work/2026-07-01-w18-r7-run-playbook-state-machine/`

## Change Doc Strategy

One change doc carries the whole scope because the design's decision areas (run-state storage and record, progression operations, execution modes, digest-aware resume, guardrails, portability, three-tier behavior, tests) share one rationale — completing the missing progression engine and removing the in-repo run-state anti-pattern — and one delivery sequence.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) | revision | Supersedes the W18 R4 in-repo run-state location and the create-and-read-only runner with global-store run state and the full progression engine, binding run state to the W18 R6 shared status vocabulary. | PRD 29, PRD 30, PRD 21, PRD 05, PRD 10, plus the PRD index and risk register. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md#requirements) | Change Notes (doc-level W18 R7 paragraph); Run State, Nesting, and Concurrency | Superseded by | [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) |
| [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md#requirements) | Generic Run Playbook Model | Enhanced by | [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) |
| [30-plugin-substrate-and-workflow-bundles.md](../../prd/30-plugin-substrate-and-workflow-bundles.md) | Playbook Boundary | Superseded by | [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) |
| [21-project-tool-directory-and-resource-tiers.md](../../prd/21-project-tool-directory-and-resource-tiers.md) | Effective Requirement, runtime-state family | Superseded by | [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) |
| [05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md) | Contracts and Data Change Notes, W18 R4 run-state note | Superseded by | [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) |
| [10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md) | Change Notes, W18 R4 packaged-runner run-state validation | Superseded by | [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) |

## Worker Ownership

The coordinator write scope is `none` when delegation is available; every output-writing task below belongs to a role-based worker with a disjoint write scope.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Change doc author | Author PRD 35 from the revision template with the design's R-* requirement IDs | `docs/prd/35-run-playbook-state-machine-and-portability.md` | Accepted W18 R7 design | The effective-requirement change doc. |
| Baseline annotation worker | Add `### Change Notes` backlinks under the genuinely impacted headings, newest note last in existing blocks | `docs/prd/29-*.md`, `docs/prd/30-*.md`, `docs/prd/21-*.md`, `docs/prd/05-*.md`, `docs/prd/10-*.md` (annotations only) | PRD 35 exists | Non-destructive supersession/enhancement annotations. |
| Index and register assembler | PRD index row, reading-order and lineage mentions, risk-register updates including R-016 and the run-state relocation dependency | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` | PRD 35 and annotations | Accurate catalog status, lineage, and register state. |
| Delta backlog author | Dependency-ordered W18 R7 implementation backlog | `docs/work/2026-07-01-w18-r7-run-playbook-state-machine/**` | PRD 35 shape settled | Decision-complete delta backlog. |
| Validation worker | Link, path-hygiene, wave-numbering, annotation, and traceability checks | Changed docs only (fix-up edits) | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search and section reads when indexed and `jcodemunch` for any code-anchor verification; reindex before falling back.
- Fallback plan if unavailable: direct file reads plus `rg` for targeted searches, with repository contracts under `.make-docs/**` as the structural authority.

## Validation

Execution validates that PRD 35 uses the revision template and carries every design R-* family (R-SCOPE, R-KEEP, R-STORE, R-STATE, R-OP, R-MODE, R-RESUME, R-GUARD, R-PORT, R-TIER, R-TEST); that every impacted baseline doc contains the required `### Change Notes` backlink with the planned verb, newest note last, and no baseline text was deleted or renumbered; that `docs/prd/00-index.md` shows doc 35 with Current status and consistent reading-order and lineage prose; that the risk register reflects the run-state relocation and global-store sequencing dependency by updating existing items in place before adding new ones; that every backlog phase cites PRD 35 plus the still-constraining baselines; and that changed files pass link, path-hygiene, and `git diff --check` review.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-prd-change-doc-and-baseline-reconciliation.md](01-prd-change-doc-and-baseline-reconciliation.md) | Author PRD 35, annotate the impacted baselines, and update the PRD index and risk register. |
| [02-state-machine-scope.md](02-state-machine-scope.md) | Settle the run-state, operation, mode, resume, guardrail, portability, and tier scope the backlog must encode, grounded in D0–D10. |
| [03-delta-backlog-and-validation.md](03-delta-backlog-and-validation.md) | Generate the W18 R7 delta backlog and run the closing validation pass. |

## Dependencies

- [Run Playbook State Machine](../../designs/2026-07-01-run-playbook-state-machine.md) is the accepted authority; [Playbook Architecture and Design](../../assets/artifacts/playbook-architecture.md) Section 5 is its source material.
- The Playbook model, step execution modes, `delegated` default, and shared step-status vocabulary are owned by the W18 R6 lineage ([../../prd/34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) and [../../designs/2026-06-30-playbook-contract-and-model.md](../../designs/2026-06-30-playbook-contract-and-model.md)); this plan consumes them unchanged and must not redefine the Playbook model.
- Cross-design sequencing dependency: run-state storage depends on the global store, its physical schema, its concurrency model, and the stable project-identifier scheme, which are owned by the [Runtime and Global Store](../../assets/artifacts/runtime-and-global-store.md) artifact and its design lineage planned later today as W18 R10; this plan records the dependency and defines only what run state requires of the store (location and keying), never the store schema itself.
- The progression operations are addressed by stable identifiers from the operation registry and surfaced under `run playbook`; the registry and CLI tree are owned by [CLI Command Reorganization](../../assets/artifacts/cli-command-reorganization.md) and are consumed, not redefined, per R-SCOPE-1.
- Resolver identity, orchestration policy fields, canonical harness-capability identifiers, the `harnessCapabilities` config surface, and unknown-capability handling are inherited unchanged from the W18 R4 lineage per R-SCOPE-2 and R-KEEP-1.
- The runner is ordinary operation-core source code under the CLI package, not a dogfooded template asset; any Make Docs-owned documentation or config-schema resource this change implies is authored upstream in `packages/docs/template/` per the maintainer dogfooding rule, and this planning round writes project planning/PRD/work content only and authors nothing under `packages/`.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then implement from the W18 R7 delta backlog.
- Why: The plan should become the product requirement contract before the run-state relocation, progression engine, mode execution, resume, guardrail, portability, and test implementation begins, because plugins, workflow bundles, and packaging all delegate execution semantics to this runner.
- Coordinate Handoff: Carry `W18 R7` into the downstream PRD reconciliation and the delta work backlog lineage, adding the active P coordinate per phase.
