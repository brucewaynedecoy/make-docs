---
title: "W28 R0 Wave, Revision, and Backlog Amendment Rules Plan"
kind: "plan"
status: "draft"
coordinate: "W28 R0"
source:
  type: "design"
  path: "docs/designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "PRD 14 owns lifecycle workflow, PRD 51 owns backlog snapshot facts and rules, and PRD 04 owns shared terms. These owners must state the new rules before work is generated."
  coordinate_handoff: "Carry W28 R0 into Requirement History entries and the work backlog."
---

# W28 R0 Wave, Revision, and Backlog Amendment Rules Plan

## Purpose

Turn the [Wave, Revision, and Backlog Amendment Rules design](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md) into current product requirements and a decision-complete work backlog.

The design replaces the rule "revise, rework, correct, standardize, or finish → next Revision" with five parts:

- an outcome test for new Waves;
- in-place amendment of unfinished work;
- revision Phases for routine changes to completed work;
- revision Waves for change orders;
- owner gates and a `## Change History` audit trail.

## Objective

This plan has five goals:

1. Update the owning PRDs so that they state the new coordinate, amendment, and Change History rules, and the new backlog snapshot facts.
2. Fix the exact changes to each shipped template resource, Skill, and CLI module, so the work backlog needs no further product decision.
3. Create the work backlog at `docs/work/2026-11-18-w28-r0-wave-revision-rules/`.
4. Map each design promise to its owning PRD, work Phase, and evidence.
5. Keep three items out of scope: Store-as-archive, the status vocabulary, and the W22 status drift.

The plan is complete when three things are true:

- the PRD authority validator passes;
- the work backlog exists and validates;
- each design promise has a work Phase and an evidence decision.

This plan does not change shipped resources or CLI code itself.

## Governing Invariant

> `docs/prd/` describes the current authoritative shape of the product. It must never describe the editorial operation used to change that authority.

This plan, the work backlog, and history records hold the sequencing and editorial language. Product PRDs state the resulting rules as current requirements.

## Coordinate Decision

- Coordinate: `W28 R0`
- Classification: `new-wave`
- Evidence: The source design's `Coordinate Handoff` names a new wave, W28 R0. Under the design's own outcome test, this work adds outcomes that no earlier plan promised: in-place amendment with Change History, revision Phases, owner gates, and CLI coordinate facts. It revises no completed coordinate. A scan of `docs/plans/`, `docs/work/`, `.make-docs/archive/plans/`, and `.make-docs/archive/work/` found W27 as the highest wave and no W28 record. The product owner confirmed W28 R0 in the 2026-11-18 design session.

The coordinate identifies this maintenance plan. Product PRDs carry it only in `## Requirement History` entries and source links.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Source design | Dated design | [2026-11-18 design](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md) | Accepted planning input. Owner-approved on 2026-11-18. |
| Owner decisions | Design session record | Captured in the source design `## Decision` | Accepted. Covers the revision Wave test, gates, the deviation test, pivots, Change History, rebuilds, the outcome test, archived Waves, the CLI twin, adoption, and the coordinate. |
| Current coordinate rules | Shipped system resource | `packages/docs/template/.make-docs/system/references/wave-model.md` and its dogfood copy | Current authority to replace. Lines 13, 14, 39, and 42 conflict with the design. |
| Delta-backlog rules | Shipped system resources | `output-contract.md:261`, `prd-change-management.md:120`, `execution-workflow.md:161` | Current authority to replace. |
| Active PRDs | Product authority | [PRD index](../../prd/00-index.md), and PRDs 03, 04, 14, 39, and 51 | Current. No PRD states the W/R decision rule today. |
| Backlog snapshot code | TypeScript | `packages/cli/src/operations/work/backlog/snapshot.ts`, `catalog.ts`, `schemas.ts` | Read directly. `committed` and `closeoutAccepted` are reserved as `null`. The next free rule number is 017. |
| Dogfood records | Plans and work | `docs/plans/`, `docs/work/` | Used only for the expected-outcome walkthrough. No record is rewritten. |

Open questions found during execution go to `docs/prd/03-open-questions-and-risk-register.md`.

## Human Experience Propagation

The source [design intent](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md#human-experience-intent) has `direct` impact for the `maintainer` Persona. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) governs review. The work Phases below are the planned backlog Phases.

| Promise | Owning PRD | Human-facing surface | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| A coordinate tells the reader the kind of change: new `W`, change-order `R`, or `P` for continuation or revision. | [14](../../prd/14-lifecycle-workflow-and-coverage-passes.md), [04](../../prd/04-glossary.md) | `wave-model.md`, plan `## Coordinate Decision`, commit coordinates | P1, P4 | Agent walkthrough of the five design cases against the shipped rules | None |
| Before a gated action, the owner gets one self-contained question that names the choice, the reason, and the effect. | [14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) | Agent replies during planning and work | P1, P4 | Agent review of one sample gated question against the User Action Requests rule | None |
| For each other coordinate choice, the agent's reply names the choice and the reason. | [14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) | Agent replies | P1, P4 | Agent review of one sample agent-alone reply | None |
| A reader of a committed plan or backlog sees each scope change, its reason, its PRD decision, and any approval in one `## Change History` section. | [14](../../prd/14-lifecycle-workflow-and-coverage-passes.md), [51](../../prd/51-backlog-review-and-reporting.md) | Plan overview and work index templates; snapshot diagnostic | P1, P2, P4 | Automated Implementation Testing of the shape rule, plus template review | None |

Testing decisions:

- **Automated Implementation Testing:** selected for the CLI facts and the new rule.
- **Human Experience Review:** done by the agent on the sample replies and the templates.
- **Guided Progress Review:** optional.
- **Unassisted Goal Testing:** not activated. Direct impact alone does not activate it, and no current decision needs it.

No accepted work is deferred.

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| Git lookup for the per-Phase `committed` fact in `backlog_snapshot` | `none` | `not-needed` | None | None | No executable profile. Stop at the design's qualification record. | W28 R0 plan |

The snapshot already reads git evidence for each record. No speed target changes the decision to report this fact. Functional proof is still required.

## Active Authority Baseline

- Active `docs/prd/` status: present. The PRD authority validator passed on 2026-11-18 after the design was written.
- Current index: `docs/prd/00-index.md`
- Discovery pass required: no. Owner search is complete. See the Candidate Decision Matrix.
- Known noncompliance or legacy editorial PRDs: none relevant.

This is authoritative PRD maintenance, not a full-set replacement. It needs no archive gate and no new numbered PRD.

## Candidate Decision Matrix

| Candidate | Decision | Owning PRD or new product subject | Reason | Evidence |
| --- | --- | --- | --- | --- |
| Coordinate decision procedure: outcome test, lineage Wave, revision Phase or revision Wave, archived Waves | `update-existing` | PRD 14 | PRD 14 owns lifecycle workflow, the straddle rule, and stage handoffs. Choosing W/R/P is a lifecycle decision. No PRD states it today. | PRD 14, Component and Capability Map |
| Significant deviation test and revision Wave test | `update-existing` | PRD 14 | These are parts of the same decision procedure. | Source design |
| Owner gates for coordinate and amendment actions | `update-existing` | PRD 14 | These are lifecycle departure and decision rules. They extend "never depart silently". | Lifecycle anchor and straddle rule |
| Plan and backlog amendment with `## Change History` | `update-existing` | PRD 14 | PRD 14 owns how plans and backlogs move through the lifecycle. It replaces "plans are written before execution, not retroactively" and the delta-backlog default. | `docs/plans/AGENTS.md:25`, `prd-change-management.md:120` |
| Rebuild a backlog from the PRD | `update-existing` | PRD 14 | Same lifecycle owner. The PRD-as-authority rule already lives in PRD 14. | PRD 14 lifecycle anchor |
| Per-Phase `committed` and `closeoutNotesPresent` facts, record-level `committed`, and project-level coordinate facts | `update-existing` | PRD 51 | PRD 51 owns the snapshot result and its facts. The `committed` slot already exists and is always `null`. | R-BACKLOG-SNAPSHOT-6, R-BACKLOG-SNAPSHOT-12 |
| Change History shape rule (`BACKLOG-RULE-017` / `BACKLOG-VAL-017`) and the agent-only coordinate decision entry | `update-existing` | PRD 51 | PRD 51 owns the rule catalog, its parity mapping, and one-sided reasons. | R-BACKLOG-RULES-2, -3, -4, -6, -7 |
| Terms: Wave, Revision, revision Phase, revision Wave, Phase complete, Change History | `update-existing` | PRD 04 | PRD 04 owns shared terms. | PRD 04 `## Terms` |
| Store as a durable archive (future) | `update-existing` | PRD 03, new `Q-025` | The owner raised it as a future capability. Record it as an open question only. Do no design or work here. | Owner note, 2026-11-18 |
| Link the existing coordinate-drift risk | `link-only` | PRD 03, `R-025` | R-025 covers cross-artifact coordinate drift. Add a pointer to W28 R0 as related, and do not close it. | PRD 03, R-025 |
| `work.item.resolve` coordinate facts | `none` | PRD 39 | PRD 39 bounds the work domain to one identity resolver and one evidence pair. The coordinate facts go into `work.backlog.snapshot`, which already scans every live and archived record. No PRD 39 change is needed. | PRD 39, R-RUN-2 and the work-domain bound |
| `coordinate` frontmatter field | `none` | PRD 23 | The field and its rules are unchanged. | PRD 23, Conditional Fields |
| Template ownership and dogfood order | `none` | PRD 06, PRD 22 | The existing upstream-first order covers these resource edits. No product rule changes. | PRD 06, Template Ownership and Mutation Order |
| Skill distribution | `none` | PRD 08 | Skill content edits do not change the distribution rules. | PRD 08 |
| Status vocabulary (`complete` vs `completed`) and W22 status drift | `none` | None | Out of scope by design. | Source design, Adoption |

## Existing PRDs To Update

| Existing PRD | Owning sections | Current normative update | Preserved surrounding authority |
| --- | --- | --- | --- |
| [14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) | A new `### Coordinate Selection and Amendment` subsection under `## Requirements`, plus one line in the Component and Capability Map | The terms, the decision procedure, the two tests, the gates, Change History, rebuild, plan amendment, storage neutrality, and adoption, all as current requirements | Human Experience, coverage-pass, testing, and phase-close requirements |
| [51](../../prd/51-backlog-review-and-reporting.md) | `### Backlog snapshot operation`, `### Internal collectors and rule catalog`, `### Snapshot result` | New snapshot facts with `null` semantics. A new deterministic Change History rule. An agent-only coordinate decision entry. | All report, cache, Skill, HTML, and App requirements. `schemaVersion` stays `1`, because the change only adds keys. |
| [04](../../prd/04-glossary.md) | `## Terms` | Six terms | Existing terms |
| [03](../../prd/03-open-questions-and-risk-register.md) | `## Open Questions` (new `Q-025`); `## Rebuild Risks` `R-025` (link only) | A Store-as-archive open question. An R-025 pointer. | All other items and their numbering |

## Genuinely New Product PRDs

None. Coordinate selection is part of the lifecycle workflow that PRD 14 owns. Snapshot facts are part of PRD 51.

## Requirement History Entries

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| PRD 14 | 2026-11-18 — W28 R0 | Coordinate Selection and Amendment | No PRD rule. Shipped resources sent any revise, rework, correct, standardize, or finish request to the next Revision, preferred a new delta backlog, and banned plan amendment. | The outcome test, in-place amendment, revision Phases, revision Waves with three tests, owner gates, and Change History | Revisions had become routine. They no longer showed which changes were serious. | Source design and this plan |
| PRD 51 | 2026-11-18 — W28 R0 | Snapshot `closeout.committed` and new coordinate facts | `committed` was always `null` | `committed` is derived from git when git is available, plus new per-Phase and project-level coordinate facts | Supports the agent's coordinate decision with facts | Source design and this plan |

PRD 04 and PRD 03 get no history entries, because their changes add content and replace nothing.

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Links and index | `docs/prd/00-index.md` | Update PRD 14 and PRD 51 focus text only if navigation changes | Navigation only |
| Risks and decisions | `docs/prd/03-open-questions-and-risk-register.md` | Add `Q-025`. Add the R-025 pointer. | Living register |
| Plans | This plan; earlier plans | No change to earlier plans | Sequencing |
| Work | `docs/work/2026-11-18-w28-r0-wave-revision-rules/` | Create it after PRD validation | Implementation queue |
| History | `.make-docs/archive/history/` | Add phase history records at closeout under the existing contract | Provenance |
| User concept guide | `docs/assets/user/concepts-wave-revision-phase-coordinates.md` | Rewrite it in work P1 for both the old and the new patterns | Reader guide |

## Output Contract

- Plan directory: `docs/plans/2026-11-18-w28-r0-wave-revision-rules/`
  - Entry point: `00-overview.md`
  - Phase files: `01-prd-authority.md`, `02-resource-and-code-changes.md`, `03-backlog-and-validation.md`
- Existing PRDs to update: 14, 51, 04, and 03
- New PRDs: none
- Requirement-history entries: PRD 14 and PRD 51
- Shared PRD surfaces: `00-index.md` (only if needed) and `03-open-questions-and-risk-register.md`
- Work backlog: `docs/work/2026-11-18-w28-r0-wave-revision-rules/`. This is a new-wave backlog, not a delta backlog.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-prd-authority.md](01-prd-authority.md) | Update PRDs 14, 51, 04, and 03, and run the authority gate. |
| [02-resource-and-code-changes.md](02-resource-and-code-changes.md) | Fix the exact changes to each template resource, Skill, and CLI module. |
| [03-backlog-and-validation.md](03-backlog-and-validation.md) | Create the four-Phase work backlog and validate the trace. |

## Dependencies

- Phase 2 depends on the wording of the Phase 1 PRDs.
- Phase 3 depends on Phase 1 passing the authority validator.
- Template edits follow the upstream-first contract in `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md`.
- CLI work follows `docs/assets/project/developing-deterministic-agentic-twins.md`.
- No external dependency.

## Worker Ownership

The work is ready for delegation, and the write scopes are kept separate:

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| PRD owner | Phase 1 | PRDs 14, 51, and 04 | Design | Updated PRD text and history |
| Register | Phase 1 | PRD 03, and PRD 00 if needed | PRD owner | Q-025, R-025 pointer |
| Backlog | Phase 3 | The new work directory | Phase 1 gate | Index and four Phase files |
| Validation | Phases 1 and 3 | Fixes assigned after review | All | Validator results and trace check |

This session uses one agent, as the coordinator directed. The coordinator does not claim another worker's output.

## MCP Strategy

- Preferred servers: jdocmunch for documentation and jcodemunch for code. Use the Make Docs PRD validator and backlog snapshot for gates.
- Fallback: direct reads, and the `make-docs run` CLI projections of the same operations.

## Validation

1. Each candidate has one decision and one reason.
2. Each design promise reaches PRD 14, PRD 51, or PRD 04, plus a work Phase and evidence.
3. `make-docs run prd authority validate --target-root .` passes after Phase 1 and again after Phase 3.
4. Relative links resolve. Frontmatter follows PRD 23. Source Markdown has no semantic line breaks. `make-docs project path-hygiene validate` passes.
5. Work tasks cite current PRD requirements. Tasks use `- [ ] tN:` items. Acceptance criteria are plain bullets with `A<n>` IDs.
6. `make-docs run work backlog snapshot --target-root . --json` lists the new record as `supported`, with no new diagnostics on existing records.

Passing these document checks does not show that the rules are shipped.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Use [plan-to-prd-change.prompt.md](../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md) to update PRDs 14, 51, 04, and 03. Then create the W28 R0 work backlog.
- Why: PRD 14 owns lifecycle workflow, PRD 51 owns backlog snapshot facts and rules, and PRD 04 owns shared terms. These owners must state the new rules before work is generated.
- Coordinate Handoff: Carry `W28 R0` into Requirement History entries and the work backlog.
