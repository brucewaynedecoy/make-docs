---
title: "W18 R10 Global Store and Project State"
kind: "plan"
status: "draft"
coordinate: "W18 R10"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The plan should become active PRD requirements before the store bootstrap, SQLite database, stable project identity, unified project-state model, lifecycle, and test implementation begins."
  coordinate_handoff: "Carry W18 R10 into the downstream PRD reconciliation and work backlog lineage."
source:
  type: "design"
  path: "docs/designs/2026-07-01-global-store-and-project-state.md"
---

# W18 R10 Global Store and Project State

## Purpose

Produce the reviewable change plan for turning [Global Store and Project State](../../designs/2026-07-01-global-store-and-project-state.md) into active PRD requirements and a decision-complete delta work backlog. The design introduces the machine-level global store at `~/.make-docs/` — a global configuration file, a global manifest, and a SQLite database — and the unified project-state model it holds, relocating Playbook run-state and work-execution evidence out of every repository, keying project-scoped state by a manifest-minted stable project identifier instead of directory path, and fixing the boundary principle that decides what lives in a repository versus the store.

## Objective

This plan is complete when the active PRD namespace carries the global store and unified project-state model as an effective requirement through a new numbered revision doc, the genuinely impacted baseline PRDs carry `### Change Notes` backlinks or doc-level change-note paragraphs, the PRD index and living risk register reflect the change including advancing the R-019 global-store dependency in place, and a dependency-ordered delta backlog exists that an implementing agent can execute without re-deriving store-layout, database, identity, project-state, lifecycle, privacy, or test decisions.

## Coordinate Decision

- Coordinate: `W18 R10`
- Classification: `revision`
- Evidence: The design's Coordinate Handoff declares that it introduces the global store and unified project-state model and relocates run-state and work-execution evidence out of the repository, revising the in-repo runtime-state model assumed by W18 R4 and by the checkpoint operations, so the lineage stays in wave 18 per the wave-model lineage rule. `docs/plans/` already contains W18 R1 through W18 R9, so R10 is the next unused revision of wave 18.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

Although the design introduces the net-new machine-level store, it alters established requirements — the in-repo runtime-state placement under `.make-docs/runs/`, the per-repo checkpoint JSON, and path-keyed state assumptions — and the change-doc selection rules use a revision doc whenever a change alters an already-established requirement even when new implementation work is also needed.

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Global Store and Project State design | design doc | [../../designs/2026-07-01-global-store-and-project-state.md](../../designs/2026-07-01-global-store-and-project-state.md) | High — accepted authority with D0–D11 decisions and R-* requirement IDs |
| Runtime and Global Store | artifact | [../../assets/artifacts/runtime-and-global-store.md](../../assets/artifacts/runtime-and-global-store.md) | High as source material; the design is the authority where they differ |
| Migrated Deterministic Operations Inventory | artifact | [../../assets/artifacts/migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md) | High — records the per-repo checkpoint JSON at `.make-docs/runs/<wave-slug>/state.json` and the keep/remove disposition whose kept genuine state becomes work-execution evidence |
| PRD 21 Tool Directory System Custom Resource Tiers | baseline PRD | [../../prd/21-project-tool-directory-and-resource-tiers.md](../../prd/21-project-tool-directory-and-resource-tiers.md) | High — the primary baseline being revised; its runtime-state family still carries temporary run state as in-repo `.make-docs/**` runtime state |
| PRD 05 Installation Profile and Manifest Lifecycle | baseline PRD | [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md) | High — the manifest contract gains the setup-minted stable project identifier, and setup remove gains store pruning obligations |
| PRD 35 Revise Run Playbook State Machine | change PRD | [../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) | High — the run-state facet's owner and this store's first consumer; it cites the Runtime and Global Store lineage as planned W18 R10, which this plan resolves |
| PRD 17 Revise System Asset Materialization Contract | baseline PRD | [../../prd/17-system-asset-materialization-and-local-bootstrap.md](../../prd/17-system-asset-materialization-and-local-bootstrap.md) | High — the pinned global asset cache and non-optional local bootstrap are preserved and must stay distinct from the operational store |
| PRD 24 Revise Configuration Convention Overlay | baseline PRD | [../../prd/24-project-configuration-and-convention-overlay.md](../../prd/24-project-configuration-and-convention-overlay.md) | High — project `.make-docs/config.yaml` is preserved unchanged; the machine-level global config is a separate surface that must not override it |
| PRD 32 Revise Lifecycle Backup State Agentics Pruning | baseline PRD | [../../prd/38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md#backup-uninstall-and-upgrade-r-life) | Medium — repo-level backup and pruning rules are unchanged, but tool uninstall and project setup remove gain global-store handling obligations |

Open questions and ambiguities discovered during execution are promoted into [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) per its numbering and status rules.

## Baseline Context

- Active `docs/prd/` status: active namespace, docs `00` through `37`; next available number is `38`.
- Impacted baseline docs: PRD 21 (the runtime-state family's remaining inclusion of temporary run state — the work-lifecycle checkpoint state at `.make-docs/runs/<wave-slug>/state.json` — as in-repo `.make-docs/**` runtime state is superseded; W18 R7 already superseded the playbook run-state portion, and W18 R10 completes the relocation for work-execution evidence while `manifest.json`, `conflicts/`, provider/cache metadata, and audit state are unchanged), PRD 05 (the manifest contract is enhanced: `.make-docs/manifest.json` gains the setup-minted stable project identifier, and setup remove and uninstall gain store-pruning and store-handling obligations), PRD 17 (enhanced: the operational store is a new machine-level surface that is explicitly distinct from the pinned global asset cache and does not weaken the non-optional local bootstrap), PRD 24 (enhanced: a machine-level global configuration file now exists that is separate from, never overrides, and is never overridden by project `.make-docs/config.yaml`), PRD 32 (enhanced: tool uninstall must handle the global store explicitly and project setup remove must prune only that project's rows; `.make-docs/backup/**` and legacy root `.backup/**` rules are unchanged), and PRD 35 (enhanced: its cross-design sequencing dependency on the "planned as W18 R10" Runtime and Global Store lineage now resolves to PRD 38 as the landed store owner).
- Not annotated after verification: PRD 29 and PRD 30 were already annotated by W18 R7 for the run-state relocation and delegate execution semantics to the runner, not to the store, so PRD 38 adds nothing they must carry; PRD 25's CLI/MCP operation-boundary rules are consumed unchanged; the CLI command tree, operation registry, and pruning inventory are owned by the CLI reorganization lineage and the migrated-operations inventory per R-SCOPE-1 and are not PRD-annotated here.
- Discovery pass required: no
- Discovery scope if required: n/a

## Output Contract

- Plan directory: `docs/plans/2026-07-01-w18-r10-global-store-and-project-state/`
  - entry point: `docs/plans/2026-07-01-w18-r10-global-store-and-project-state/00-overview.md`
  - phase files: `docs/plans/2026-07-01-w18-r10-global-store-and-project-state/0N-<phase>.md`
- New change docs:
  - `docs/prd/38-global-store-and-project-state.md`
- Baseline docs to annotate: `docs/prd/21-project-tool-directory-and-resource-tiers.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/17-system-asset-materialization-and-local-bootstrap.md`, `docs/prd/24-project-configuration-and-convention-overlay.md`, `docs/prd/38-global-store-and-project-state.md`, `docs/prd/35-run-playbook-state-machine-and-portability.md`
- Index and register updates: `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`
- Delta backlog:
  - `docs/work/2026-07-01-w18-r10-global-store-and-project-state/`

## Change Doc Strategy

One change doc carries the whole scope because the design's decision areas (boundary principle, store location and contents, SQLite database operations, stable project identity, unified project-state model, mirror-versus-relocated distinction, lifecycle, privacy, tests) share one rationale — removing the per-repo operational-noise pattern by giving Make Docs one machine-level place to manage state — and one delivery sequence.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) | revision | Supersedes the in-repo runtime-state placement of run-state and work-execution evidence under `.make-docs/runs/**` and the per-repo checkpoint JSON with the machine-level global store at `~/.make-docs/`, its SQLite operational database, the manifest-minted stable project identity, and the unified project-state model. | PRD 21, PRD 05, PRD 17, PRD 24, PRD 32, PRD 35, plus the PRD index and risk register. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [21-project-tool-directory-and-resource-tiers.md](../../prd/21-project-tool-directory-and-resource-tiers.md) | Effective Requirement, runtime-state family (existing `### Change Notes` block, newest note last) | Superseded by | [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) |
| [05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md) | Contracts and Data `### Change Notes`, newest note last | Enhanced by | [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) |
| [17-system-asset-materialization-and-local-bootstrap.md](../../prd/17-system-asset-materialization-and-local-bootstrap.md) | Effective Requirement, system asset boundary | Enhanced by | [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) |
| [24-project-configuration-and-convention-overlay.md](../../prd/24-project-configuration-and-convention-overlay.md) | Doc-level Change Notes (W18 R10 paragraph, newest last) | Enhanced by | [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) |
| [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md#backup-uninstall-and-upgrade-r-life) | Doc-level Change Notes (W18 R10 paragraph, newest last) | Enhanced by | [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) |
| [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) | Impacted Docs and Dependencies, cross-design sequencing dependency | Enhanced by | [38-global-store-and-project-state.md](../../prd/38-global-store-and-project-state.md) |

## Worker Ownership

The coordinator write scope is `none` when delegation is available; every output-writing task below belongs to a role-based worker with a disjoint write scope.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Change doc author | Author PRD 38 from the revision template with the design's R-* requirement IDs | `docs/prd/38-global-store-and-project-state.md` | Accepted W18 R10 design | The effective-requirement change doc. |
| Baseline annotation worker | Add change-note backlinks under the genuinely impacted headings, newest note last in existing blocks | `docs/prd/21-*.md`, `docs/prd/05-*.md`, `docs/prd/17-*.md`, `docs/prd/24-*.md`, `docs/prd/32-*.md`, `docs/prd/35-*.md` (annotations only) | PRD 38 exists | Non-destructive supersession/enhancement annotations. |
| Index and register assembler | PRD index row, reading-order and lineage mentions, risk-register updates including advancing R-019 in place | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` | PRD 38 and annotations | Accurate catalog status, lineage, and register state. |
| Delta backlog author | Dependency-ordered W18 R10 implementation backlog | `docs/work/2026-07-01-w18-r10-global-store-and-project-state/**` | PRD 38 shape settled | Decision-complete delta backlog. |
| Validation worker | Link, path-hygiene, wave-numbering, annotation, and traceability checks | Changed docs only (fix-up edits) | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search and section reads when indexed and `jcodemunch` for any code-anchor verification; reindex before falling back.
- Fallback plan if unavailable: direct file reads plus `rg` for targeted searches, with repository contracts under `.make-docs/**` as the structural authority.

## Validation

Execution validates that PRD 38 uses the revision template and carries every design R-* family (R-SCOPE, R-BND, R-STORE, R-DB, R-ID, R-PS, R-MIR, R-LIFE, R-PRIV, R-KEEP, R-TEST); that every impacted baseline doc contains the required change-note backlink with the planned verb, newest note last, and no baseline text was deleted or renumbered; that `docs/prd/00-index.md` shows doc 38 with Current status and consistent reading-order and lineage prose; that the risk register advances R-019 in place rather than duplicating it and adds any new item at the next available R-* number; that every backlog phase cites PRD 38 plus the still-constraining baselines; and that changed files pass link, path-hygiene, and `git diff --check` review.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-prd-change-doc-and-baseline-reconciliation.md](01-prd-change-doc-and-baseline-reconciliation.md) | Author PRD 38, annotate the impacted baselines, and update the PRD index and risk register. |
| [02-global-store-and-project-state-scope.md](02-global-store-and-project-state-scope.md) | Settle the store, database, identity, project-state, mirror, lifecycle, privacy, and test scope the backlog must encode, grounded in D0–D11. |
| [03-delta-backlog-and-validation.md](03-delta-backlog-and-validation.md) | Generate the W18 R10 delta backlog and run the closing validation pass. |

## Dependencies

- [Global Store and Project State](../../designs/2026-07-01-global-store-and-project-state.md) is the accepted authority; [Runtime and Global Store](../../assets/artifacts/runtime-and-global-store.md) is its source material, and [migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md) supplies the work-execution evidence disposition (keep genuine state, drop re-derivable fields) that the project-state model consumes.
- Cross-design sequencing: this store is consumed by W18 R7 ([../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md)), whose run-state storage phases are gated on the store, its concurrency model, and the stable project identifier landing here, and by the CLI reorganization's retained work operations — the work-execution evidence store and the work-item identity resolver — whose reorganization lineage is planned next as W18 R11; W18 R10 must land the store seam those consumers build on.
- Per R-SCOPE-1, this plan must not redefine the Playbook run-state record shape or its progression semantics (owned by the W18 R7 lineage), project `.make-docs/config.yaml` and its overlay rules (PRD 24), the local bootstrap guarantee and pinned global asset cache (PRD 17), the CLI command tree and operation registry (CLI reorganization lineage), or the pruning of the removed work and closeout operations (the migrated-operations inventory).
- The relocation has a documentation consequence: the `.make-docs/` runtime-state guidance that currently names `.make-docs/runs/` as a runtime-state location — `packages/docs/template/.make-docs/AGENTS.md` and `packages/docs/template/.make-docs/CLAUDE.md`, mirrored in this repo's dogfood `.make-docs/` routers — must be updated upstream in `packages/docs/template/` first and then dogfooded, per the maintainer dogfooding rule; that template-doc update is in-scope implementation work carried by the delta backlog, and this documentation pass authors nothing under `packages/`.
- The store implementation is ordinary source code under the CLI package, not a repository file and not a shipped template asset; this planning round writes project planning/PRD/work content only.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then implement from the W18 R10 delta backlog.
- Why: The plan should become the product requirement contract before the store bootstrap, database, identity, project-state, lifecycle, and test implementation begins, because the W18 R7 runner and the retained work operations both store their state here and R-019 records this store as their blocking prerequisite.
- Coordinate Handoff: Carry `W18 R10` into the downstream PRD reconciliation and the delta work backlog lineage, adding the active P coordinate per phase.
