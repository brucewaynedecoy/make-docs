---
title: "W18 R13 Conformance Execution and Lab Session Redesign"
kind: "plan"
status: "draft"
coordinate: "W18 R13"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The plan should become active PRD requirements before the scenario reorganization, kit generation, instruments, ingestion, and evidence-home relocation are implemented, because the R-021/R-022 first-pass close inputs bind to the redesigned forms."
  coordinate_handoff: "Carry W18 R13 into the downstream PRD reconciliation and work backlog lineage; the implementation round precedes any operated first-pass lab session, and the design's reconciliation inventory is executed exhaustively per register item R-028."
source:
  type: "design"
  path: "docs/designs/2026-07-06-conformance-execution-and-lab-session-redesign.md"
---

# W18 R13 Conformance Execution and Lab Session Redesign

## Purpose

Produce the reviewable change plan for turning [Conformance Execution and Lab Session Redesign](../../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) into active PRD requirements and a decision-complete delta work backlog. The design redesigns the execution layer and asset organization of the W18 R9 conformance lab in one round: scenario definitions become harness-agnostic and organize by domain under `conformance/scenarios/<domain>/` with domain-qualified ids and per-target `targets` bindings replacing `futureHarnesses`, evidence and results organize by execution target under `conformance/results/<harness>/`, execution becomes agent-driven self-assessment through per-target kits generated on demand into disposable lab-session workspaces under the named rule "the agent drives, the instruments measure" (R-EXEC-1..3), deterministic instrument scripts bracket every asserted bar stage, ingestion assembles fail-closed result records into the unchanged `recordConformanceRunOnRegistryEntry` seam, all three operator modes are first-class, the characterization preamble generalizes to the discovery kit, and the rejected repo-local `.make-docs/conformance/` transcript home is replaced by the session workspace plus the machine-level store's lab area with "lab session" as the operational vocabulary. The tuple registry, the three statuses, verdict derivation, the install-discover-invoke-uninstall evidence bar, blocked-honesty semantics, support-claim governance, and meta-verification semantics are unchanged.

## Objective

This plan is complete when the active PRD namespace carries the redesign as effective requirements through two new numbered revision docs, the genuinely impacted baseline PRDs carry `### Change Notes` backlinks, the PRD index reflects the change, and a dependency-ordered delta backlog exists that an implementing agent can execute without re-deriving organization, schema, kit, instrument, ingestion, mode, or naming decisions — with the design's twenty-entry reconciliation inventory (D12) honored as the backlog's completeness source per register item [R-028](../../prd/03-open-questions-and-risk-register.md).

## Coordinate Decision

- Coordinate: `W18 R13`
- Classification: `revision`
- Evidence: The design's Coordinate Handoff declares W18 lineage — it revises W18 R9 (PRD 37) at its execution layer and the W10 R5 lab baseline's evidence-home default (PRD 20) — and names W18 R13 as the downstream coordinate. `docs/plans/` contains W18 R1 through W18 R12, so R13 is the next unused revision of wave 18. Register item [R-028](../../prd/03-open-questions-and-risk-register.md) already records the round under this coordinate with the nothing-under-the-rug reconciliation mandate; the pending R-027 polish round remains separately sequenced.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Conformance Execution and Lab Session Redesign design | design doc | [../../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) | High — user-approved as-is, with D1–D14 decisions, R-* requirement IDs, and the D12 reconciliation inventory |
| 2026-07-06 execution-projection findings | risk register items | [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) (D-023, D-024, D-025, R-028; R-021/R-022/Q-022 as updated) | High — verified against shipped code during the projection |
| PRD 37 Enhance Playbook and Package Conformance | change PRD | [../../prd/37-enhance-playbook-and-package-conformance.md](../../prd/37-enhance-playbook-and-package-conformance.md) | High — the primary baseline being revised: R-SCEN scenario identity and absence reporting, the Contracts and Data raw-evidence clause, and the R-TEST meta-verification family gaining the executability check |
| PRD 20 Revise Agent Harness Model Conformance Lab | change PRD | [../../prd/20-revise-agent-harness-model-conformance-lab.md](../../prd/20-revise-agent-harness-model-conformance-lab.md) | High — the lab baseline whose raw-artifact default (`.make-docs/conformance/` or `.make-docs/runs/conformance/`) is superseded and whose execution protocol gains the lab-session vocabulary, the three operator modes, and the agent-driven rule |
| PRD 42 Revise Conformance Asset Home Relocation | change PRD | [../../prd/42-revise-conformance-asset-home-relocation.md](../../prd/42-revise-conformance-asset-home-relocation.md) | High — repo-root `conformance/` home explicitly preserved (D-022); its Effective Requirement restates the now-rejected raw-transcript default and needs a scoped annotation |
| PRD 36 Revise Playbook Packaging Compiler and Harness Adapters | change PRD | [../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md) | High — owns the capability descriptors (R-CAP-2) the kit consumes; the descriptor type gains the lab-facing interrogation block per design R-HOME-2 |
| Parked operator walkthrough | untracked working file | `CONFORMANCE-RUN-codex-plugin.md` (repo root) | High as evidence — the user's working file; raw material for the human-only mode; never modified by agents |
| W18 R9 backlog and history records | completed work artifacts | [../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md](../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) | High — historical evidence; receives a reconciliation note, never a rewrite |

Open questions and ambiguities discovered during execution are promoted into [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) per its numbering and status rules; the register already carries this round's items (D-023, D-024, D-025, R-028) from the design session, so this round updates them in place at closure rather than minting duplicates.

## Baseline Context

- Active `docs/prd/` status: active namespace, docs `00` through `42`; next available numbers are `43` and `44`.
- Impacted baseline docs: PRD 37 (R-SCEN's harness-named scenario identity and its absence-reporting expression are superseded by the domain-qualified harness-agnostic definitions with `targets` bindings; the Contracts and Data scenario-organization and raw-evidence prose is superseded; the R-TEST meta-verification family is enhanced with the executable-by-construction check), PRD 20 (the raw-artifact default clause is superseded by the session-workspace-plus-store rule, and the lab's execution protocol gains agent-driven self-assessment, the instruments-measure rule, the three operator modes, and the lab-session vocabulary), PRD 42 (its Effective Requirement sentence restating raw transcripts "local under `.make-docs/conformance/`" is superseded, transcript-home clause only — the repo-root `conformance/` home it fixes is explicitly preserved), and PRD 36 (the capability descriptor contract is enhanced with the lab-facing interrogation block that kit generation consumes, strengthening R-CAP-2's single home).
- Not annotated after verification: PRD 35 and PRD 38 (the store architecture is consumed as the principle D-024 restores, not altered; the store's lab area is defined narrowly by the change docs without owning store schema), PRD 39 (the W18 R11 parity rule is preserved vacuously — kit generation stays off the shipped surface entirely per design R-HOME-1, so no registry, CLI, or MCP surface changes), PRD 33 (its support-claim gating routes through PRD 37/PRD 20 chains already annotated), and PRD 40/41 (consumed unchanged — the kit ships through the `plan`/`preview`/`write` pipeline and pins `--json` per the reconciled W18 R9 baseline). PRD 36's R-PROV-2 was checked for superseded scenario references: it names the cleanliness scenario generically without a `codex-*` id, so no annotation is needed there beyond the R-CAP enhancement note.
- Discovery pass required: no
- Discovery scope if required: n/a

## Output Contract

- Plan directory: `docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/`
  - entry point: `docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md`
  - phase files: `docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/0N-<phase>.md`
- New change docs:
  - `docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md`
  - `docs/prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md`
- Baseline docs to annotate: `docs/prd/37-enhance-playbook-and-package-conformance.md`, `docs/prd/20-revise-agent-harness-model-conformance-lab.md`, `docs/prd/42-revise-conformance-asset-home-relocation.md`, `docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md`
- Index updates: `docs/prd/00-index.md`
- Register handling: [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) already reflects this round (D-023/D-024/D-025 open with close bars, R-028 tracking, R-021/R-022 updated in the design session); closures land during implementation Phase 4, not in this documentation round.
- Delta backlog:
  - `docs/work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/`

## Change Doc Strategy

Two change docs carry the round because its two requirement areas have materially different baselines and rationale, following the R12 two-docs-for-two-baselines precedent: the scenario model and execution machinery revise the W18 R9 packaging-conformance lineage (PRD 37), while the execution protocol and evidence homes revise the W10 R5 lab core (PRD 20). Both are `revision` docs. The design's reconciliation inventory describes the PRD 20 change as an enhancement, but the change-doc selection rules in `.make-docs/references/system/prd-change-management.md` require a revision doc whenever an established requirement is altered — and the PRD 20 change supersedes the established raw-artifact-default clause (`.make-docs/conformance/` or `.make-docs/runs/conformance/`), which also lets the baseline annotation carry the accurate `Superseded by` verb. The enhancement-flavored content (agent-driven self-assessment, the three operator modes, the lab-session vocabulary) rides in the same revision doc; this classification judgment is recorded here deliberately.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [43-revise-conformance-scenario-model-and-execution-kit.md](../../prd/43-revise-conformance-scenario-model-and-execution-kit.md) | revision | Supersedes the harness-named `codex-*` scenario identity, the `futureHarnesses` property, and the authored-executability spec form with domain-qualified harness-agnostic definitions under `conformance/scenarios/<domain>/`, `targets` bindings, results by execution target, the generated per-target kit with deterministic instruments and prompts, the discovery kit, fail-closed ingestion into the unchanged recording seam, and the executable-by-construction requirement closing D-023. | PRD 37, PRD 36, plus the PRD index. |
| [44-revise-conformance-lab-execution-protocol-and-evidence-homes.md](../../prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md) | revision | Supersedes the lab's repo-local raw-evidence default with the disposable lab-session workspace plus the machine-level store's lab area (D-024), and revises the lab's execution protocol: agent-driven self-assessment as the primary mode under "the agent drives, the instruments measure" (R-EXEC-1..3, self-attestation prohibited), three first-class operator modes, and the lab-session vocabulary that un-overloads "run". | PRD 20, PRD 42, plus the PRD index. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [37-enhance-playbook-and-package-conformance.md](../../prd/37-enhance-playbook-and-package-conformance.md) | Required First-Pass Scenarios (R-SCEN), appended newest-last to the existing `#### Change Notes` block | Superseded by | [43-revise-conformance-scenario-model-and-execution-kit.md](../../prd/43-revise-conformance-scenario-model-and-execution-kit.md) |
| [37-enhance-playbook-and-package-conformance.md](../../prd/37-enhance-playbook-and-package-conformance.md) | Verification and Meta-Verification (R-TEST) as a new `#### Change Notes` block | Enhanced by | [43-revise-conformance-scenario-model-and-execution-kit.md](../../prd/43-revise-conformance-scenario-model-and-execution-kit.md) |
| [37-enhance-playbook-and-package-conformance.md](../../prd/37-enhance-playbook-and-package-conformance.md) | Contracts and Data, appended newest-last to the existing `### Change Notes` block | Superseded by | [43](../../prd/43-revise-conformance-scenario-model-and-execution-kit.md) (scenario/result organization) and [44](../../prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md) (raw-evidence default) |
| [20-revise-agent-harness-model-conformance-lab.md](../../prd/20-revise-agent-harness-model-conformance-lab.md) | Effective Requirement, appended newest-last to the existing `### Change Notes` block | Superseded by | [44-revise-conformance-lab-execution-protocol-and-evidence-homes.md](../../prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md) |
| [42-revise-conformance-asset-home-relocation.md](../../prd/42-revise-conformance-asset-home-relocation.md) | Effective Requirement as a new `### Change Notes` block, scoped to the raw-transcripts sentence only; the repo-root `conformance/` home is explicitly preserved | Superseded by | [44-revise-conformance-lab-execution-protocol-and-evidence-homes.md](../../prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md) |
| [36-revise-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md) | Harness Capability and Distributable Model (R-CAP) as a new `#### Change Notes` block | Enhanced by | [43-revise-conformance-scenario-model-and-execution-kit.md](../../prd/43-revise-conformance-scenario-model-and-execution-kit.md) |

## Worker Ownership

The coordinator write scope is `none` when delegation is available; every output-writing task below belongs to a role-based worker with a disjoint write scope.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Scenario-model change doc author | Author PRD 43 from the revision template carrying the design's R-ORG, R-SCHEMA, R-KIT, R-HOME, R-INST, R-PROMPT, R-DISC, and R-ING requirement families plus the D14 verification bar and the D12 reconciliation obligation | `docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md` | Accepted W18 R13 design | The scenario-model and execution-kit effective-requirement change doc. |
| Lab-protocol change doc author | Author PRD 44 from the revision template carrying the design's R-EXEC, R-MODE, and R-NAME requirement families | `docs/prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md` | Accepted W18 R13 design | The execution-protocol and evidence-homes effective-requirement change doc. |
| Baseline annotation worker | Add the `### Change Notes`/`#### Change Notes` backlinks per the annotation plan, newest note last in existing blocks, never deleting baseline text | `docs/prd/37-*.md`, `docs/prd/20-*.md`, `docs/prd/42-*.md`, `docs/prd/36-*.md` (annotations only) | PRD 43 and PRD 44 exist | Non-destructive supersession/enhancement annotations. |
| Index assembler | PRD index rows for 43 and 44, reading-order and audience-path extensions, source anchors, and the W18 R13 Intended Follow-On bullet | `docs/prd/00-index.md` | PRD 43, PRD 44, and annotations | Accurate catalog status and lineage. |
| Delta backlog author | Dependency-ordered W18 R13 implementation backlog with the P1–P4 phase split, honoring the D12 reconciliation inventory as the completeness source | `docs/work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/**` | PRD 43 and PRD 44 shapes settled | Decision-complete delta backlog. |
| Validation worker | Link, path-hygiene, wave-numbering, annotation, and traceability checks plus `npm run validate:defaults` | Changed docs only (fix-up edits) | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search and section reads when indexed and `jcodemunch` for code-anchor verification (`scenario.ts`, `meta-verification.ts`, `registry.ts`, `tuple.ts`, the conformance test suites); reindex before falling back.
- Fallback plan if unavailable: direct file reads plus targeted `grep` for section location, with repository contracts under `.make-docs/**` as the structural authority.

## Validation

Execution validates that PRD 43 and PRD 44 use the revision template and carry every design requirement family assigned to them with stable IDs matching the design; that every impacted baseline doc contains the required change-note backlink with the planned verb, newest note last, and no baseline text was deleted or renumbered; that `docs/prd/00-index.md` shows docs 43 and 44 with Current status and consistent reading-order, audience-path, source-anchor, and follow-on prose; that every backlog phase cites its change docs plus the still-constraining baselines, names its PRD requirement anchors, and traces its coverage to the design's reconciliation inventory; and that changed files pass `npm run validate:defaults`, `python3 .make-docs/scripts/check_path_hygiene.py`, relative-link resolution, and `git diff --check`. The untracked repo-root working files `UAT-W18-R7-R8.md` and `CONFORMANCE-RUN-codex-plugin.md` are never touched.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-prd-change-docs-and-baseline-reconciliation.md](01-prd-change-docs-and-baseline-reconciliation.md) | Author PRD 43 and PRD 44, annotate the impacted baselines, and update the PRD index. |
| [02-execution-and-organization-scope.md](02-execution-and-organization-scope.md) | Settle the organization, schema, kit, instrument, ingestion, mode, and naming scope the backlog must encode, grounded in D1–D14 and the reconciliation inventory. |
| [03-delta-backlog-and-validation.md](03-delta-backlog-and-validation.md) | Generate the W18 R13 delta backlog with the P1–P4 phase split and run the closing validation pass. |

## Dependencies

- [Conformance Execution and Lab Session Redesign](../../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) is the user-approved authority; the 2026-07-06 execution-projection findings recorded in register items D-023, D-024, and D-025 are its source evidence, and R-028 is the tracking item whose nothing-under-the-rug mandate the D12 reconciliation inventory satisfies.
- The named rule R-EXEC-1 constrains every execution artifact: self-assessment is never self-attestation; conformance evidence comes exclusively from deterministic instrument outputs, a target agent's claim is narrative context, and a bar stage with no instrument output is unasserted.
- The boundary is sharp (design D13): the tuple registry schema, statuses, and derivation rules; the evidence bar and verdict vocabulary; blocked-honesty and simulation-posture semantics; support-claim governance, thresholds, and claim surfaces; and meta-verification semantics beyond the id/path retargeting and the added executability check do not change. The implementation round performs no real-harness interaction; terminal-multiplexer tooling is consumed, not built; no new public claim surface is created.
- Kit generation is maintainer lab tooling, not a registered operation (design R-HOME-1): it stays off the shipped CLI command tree and MCP surface entirely, preserving the W18 R11 parity rule vacuously, with the revisit seam recorded on Q-022. The kit consumes the harness capability descriptors per PRD 36 R-CAP-2 and never mints a second home for harness knowledge (R-HOME-2).
- PRD 42's repo-root `conformance/` home and `conformance/fixtures/` are explicitly preserved; the recording seam `recordConformanceRunOnRegistryEntry` is unchanged; dated designs, plans, and history records naming the old transcript home stay historical.
- Sequencing: the implementation round precedes any operated first-pass lab session — the R-021/R-022 close inputs bind to the redesigned forms — and the pending R-027 polish round remains separately sequenced. The conformance asset family is maintainer-only in-repo content edited in place (the recorded exception to the upstream-first rule); lab code (`kit.ts`, instruments, ingestion) is ordinary source under `packages/cli/`, and this planning round writes project planning/PRD/work content only, authoring nothing under `packages/` or `conformance/`.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then implement from the W18 R13 delta backlog.
- Why: The plan should become the product requirement contract before the reorganization, kit, instruments, and ingestion are implemented, because the first operated lab sessions — the R-021/R-022 close inputs — bind their evidence to the redesigned forms.
- Coordinate Handoff: Carry `W18 R13` into the downstream PRD reconciliation and the delta work backlog lineage, adding the active P coordinate per phase; operated first-pass lab sessions begin only after this round lands and the D12 reconciliation inventory is exhausted with grep proof (R-028).
