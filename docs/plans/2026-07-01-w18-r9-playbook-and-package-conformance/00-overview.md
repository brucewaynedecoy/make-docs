---
title: "W18 R9 Playbook and Package Conformance"
kind: "plan"
status: "draft"
coordinate: "W18 R9"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The plan should become active PRD requirements before the tuple registry, evidence bar, first-pass scenario, test-layer, and support-claim governance implementation begins."
  coordinate_handoff: "Carry W18 R9 into the downstream PRD reconciliation and work backlog lineage."
source:
  type: "design"
  path: "docs/designs/2026-07-01-playbook-and-package-conformance.md"
---

# W18 R9 Playbook and Package Conformance

## Purpose

Produce the reviewable change plan for turning [Playbook and Package Conformance](../../designs/2026-07-01-playbook-and-package-conformance.md) into active PRD requirements and a decision-complete delta work backlog. The design extends the maintainer conformance lab established by [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md) into the Playbook packaging domain so generated distributables earn evidence-backed support claims: it expands the support tuple for generated outputs, adds a queryable tuple registry with explicit statuses under `docs/assets/conformance/`, defines the install-discover-invoke-uninstall evidence bar, names the required Codex-first first-pass scenarios, separates three test layers so one layer's passing is never read as another's, and governs support-claim wording. It exists because the current tests assert internal file writing and symlink exposure, which passed while a generated Codex package was not recognized by Codex; conformance closes that gap by testing the user-visible outcome.

## Objective

This plan is complete when the active PRD namespace carries the conformance extension as an effective requirement through a new numbered enhancement doc, the genuinely impacted baseline PRDs carry `### Change Notes` backlinks, the PRD index and living risk register reflect the change including the tuple-registry statuses and the gating of the W18 R5 provisional support claims, and a dependency-ordered delta backlog exists that an implementing agent can execute without re-deriving tuple, registry, evidence-bar, scenario, test-layer, or governance decisions.

## Coordinate Decision

- Coordinate: `W18 R9`
- Classification: `revision`
- Evidence: The design's Coordinate Handoff extends the W18 conformance and support-claim requirements associated with the conformance lab and PRD 20 to generated Playbook distributables, and gates the provisional support claims introduced by W18 R5 packaging. Per the wave-model lineage rule, the wave stays W18 and the revision is the next unused one; `docs/plans/` already contains W18 R1 through W18 R8, so R9 is the next unused revision of wave 18.

## Change Classification

- Requested change type: `enhancement`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

The change is an enhancement rather than a revision: it extends the existing conformance-lab capability from PRD 20 into the packaging domain without retiring any established requirement — the lab's maintainer-only nature, verdicts, safety modes, evidence classes, storage boundaries, run-record fields, scenario protocol, and one-run-minimum threshold are all preserved unchanged per R-KEEP-1, and the expanded tuple, tuple registry, evidence bar, first-pass scenarios, test layers, and governance are additive extensions of them.

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Playbook and Package Conformance design | design doc | [../../designs/2026-07-01-playbook-and-package-conformance.md](../../designs/2026-07-01-playbook-and-package-conformance.md) | High — accepted authority with D0–D9 decisions and R-* requirement IDs |
| Playbook Architecture and Design, Section 9 | artifact | [../../assets/artifacts/playbook-architecture.md](../../assets/artifacts/playbook-architecture.md) | High as source material; the design is the authority where they differ |
| PRD 20 Revise Agent Harness Model Conformance Lab | baseline PRD (primary baseline being enhanced) | [../../prd/20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md) | High — carries the lab core this design extends and the support-claim gating this design carries into packaging |
| PRD 33 Enhance Playbook Packaging and Harness Adapter Registry | change PRD | [../../prd/36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | High — its provisional support claims for generated outputs are the claims this design gates through the tuple registry |
| PRD 36 Revise Playbook Packaging Compiler and Harness Adapters | change PRD | [../../prd/36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | High — its distributables are what conformance verifies, and its R-PROV-2, R-PROV-3, and R-TEST-5 route recognition evidence to this lineage |
| PRD 34 Revise Playbook Contract and Model | change PRD | [../../prd/34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) | High — the conformance work consumes the W18 R6 Playbook model unchanged; no requirement text there is affected |
| PRD 35 Revise Run Playbook State Machine | change PRD | [../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) | High — conformance scenarios that drive workflows execute via the W18 R7 runner unchanged; no requirement text there is affected |
| PRD 19 Revise Template Package Dogfood Source of Truth Contract | baseline PRD | [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md#template-source-authority) | High — the maintainer-only exception is a deliberate, stated departure from its upstream-first rule for conformance assets only; no annotation expected |
| PRD 10 Packaging Validation and Release Reference | baseline PRD | [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md) | Medium — the R-TEST-3 exclusion check lands in its validation surface generically; no requirement text there is superseded |

Open questions and ambiguities discovered during execution are promoted into [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) per its numbering and status rules.

## Baseline Context

- Active `docs/prd/` status: active namespace, docs `00` through `36`; next available number is `37`.
- Impacted baseline docs: PRD 20 (under Effective Requirement, the lab is extended into the packaging domain — the support tuple for generated outputs expands to scenario, harness, surface, scope, output kind, generated-output kind, model or provider, and runtime; tuple statuses live in a queryable registry under `docs/assets/conformance/`; the install-discover-invoke-uninstall bar governs `conformance-validated`; the lab core is preserved unchanged), PRD 33 (under Integration Impact, its conformance paragraph and provisional support claims for generated outputs are now promotable through the W18 R9 tuple registry and evidence bar), PRD 36 (under Impacted Docs and Dependencies, the downstream conformance dependency it records as planned W18 R9 has landed, including ownership of the R-PROV-2 backup/uninstall cleanliness scenario).
- Not annotated after verification: PRD 34 and PRD 35 already record conformance as a downstream owner and are consumed unchanged as the model and runner authorities; PRD 30 and PRD 31 route support-claim gating through PRD 20's gating text, which is annotated once at its owning heading rather than at every referrer; PRD 19's upstream-first rule is not revised — the maintainer-only conformance location is a deliberate exception recorded in the change doc, not a change to the rule; PRD 10 and PRD 25 constrain implementation generically and none of their requirement text is extended or superseded.
- Discovery pass required: no
- Discovery scope if required: n/a

## Output Contract

- Plan directory: `docs/plans/2026-07-01-w18-r9-playbook-and-package-conformance/`
  - entry point: `docs/plans/2026-07-01-w18-r9-playbook-and-package-conformance/00-overview.md`
  - phase files: `docs/plans/2026-07-01-w18-r9-playbook-and-package-conformance/0N-<phase>.md`
- New change docs:
  - `docs/prd/20-agent-harness-conformance-and-support-claims.md`
- Baseline docs to annotate: `docs/prd/20-agent-harness-conformance-and-support-claims.md`, `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`, `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`
- Index and register updates: `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`
- Delta backlog:
  - `docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/`

## Change Doc Strategy

One change doc carries the whole scope because the design's decision areas (support tuple, tuple registry, evidence bar, first-pass scenarios, test layers, support-claim governance, meta-verification) share one rationale — internal tests passed while a real harness failed to recognize the output, so support claims must be bound to real-harness evidence per exact tuple — and one delivery sequence.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance) | enhancement | Extends the PRD 20 conformance lab to generated Playbook distributables with the expanded support tuple, the queryable tuple registry with `provisional`/`implementation-validated`/`conformance-validated` statuses, the install-discover-invoke-uninstall evidence bar, the required Codex-first first-pass scenarios, three named test layers with the internal-tests-are-not-user-outcome-evidence rule, support-claim governance, and the maintainer-only not-shipped boundary with exclusion checks. | PRD 20, PRD 33, PRD 36, plus the PRD index and risk register. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md) | Effective Requirement | Enhanced by | [20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance) |
| [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | Integration Impact | Enhanced by | [20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance) |
| [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | Impacted Docs and Dependencies | Enhanced by | [20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance) |

## Worker Ownership

The coordinator write scope is `none` when delegation is available; every output-writing task below belongs to a role-based worker with a disjoint write scope.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Change doc author | Author PRD 37 from the addition/enhancement template with the design's R-* requirement IDs | `docs/prd/20-agent-harness-conformance-and-support-claims.md` | Accepted W18 R9 design | The effective-requirement change doc. |
| Baseline annotation worker | Add `### Change Notes` backlinks under the genuinely impacted PRD 20, PRD 33, and PRD 36 headings, newest note last in existing blocks | `docs/prd/20-agent-harness-conformance-and-support-claims.md`, `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`, `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md` (annotations only) | PRD 37 exists | Non-destructive enhancement annotations. |
| Index and register assembler | PRD index row, reading-order and lineage mentions, risk-register updates including R-021 advanced in place and the first-pass scenario availability risk | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` | PRD 37 and annotations | Accurate catalog status, lineage, and register state. |
| Delta backlog author | Dependency-ordered W18 R9 implementation backlog | `docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/**` | PRD 37 shape settled | Decision-complete delta backlog. |
| Validation worker | Link, path-hygiene, wave-numbering, annotation, and traceability checks | Changed docs only (fix-up edits) | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search and section reads when indexed and `jcodemunch` for any code-anchor verification; reindex before falling back.
- Fallback plan if unavailable: direct file reads plus `rg` for targeted searches, with repository contracts under `.make-docs/**` as the structural authority.

## Validation

Execution validates that PRD 37 uses the addition/enhancement template with change type `enhancement` and carries every design R-* family (R-SCOPE, R-KEEP, R-TUPLE, R-REG, R-BAR, R-SCEN, R-LAYER, R-GOV, R-TEST); that PRD 20, PRD 33, and PRD 36 contain the required `### Change Notes` backlinks with the planned verb, newest note last, and no baseline text was deleted or renumbered; that `docs/prd/00-index.md` shows doc 37 with Current status and consistent reading-order and lineage prose; that the risk register advances R-021 in place and adds the first-pass availability risk with the next available number; that every backlog phase cites PRD 37 plus the still-constraining baselines; and that changed files pass link, path-hygiene, and `git diff --check` review.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-prd-change-doc-and-baseline-reconciliation.md](01-prd-change-doc-and-baseline-reconciliation.md) | Author PRD 37, annotate PRDs 20, 33, and 36, and update the PRD index and risk register. |
| [02-conformance-scope.md](02-conformance-scope.md) | Settle the tuple, registry, evidence-bar, scenario, test-layer, governance, and meta-verification scope the backlog must encode, grounded in D0–D9. |
| [03-delta-backlog-and-validation.md](03-delta-backlog-and-validation.md) | Generate the W18 R9 delta backlog and run the closing validation pass. |

## Dependencies

- [Playbook and Package Conformance](../../designs/2026-07-01-playbook-and-package-conformance.md) is the accepted authority; [Playbook Architecture and Design](../../assets/artifacts/playbook-architecture.md) Section 9 is its source material.
- Cross-design sequencing: this design is sequenced last among the core Playbook-architecture designs — it verifies the W18 R8 packaging outputs ([../../prd/36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)) as the distributables under test, executes workflow-driving scenarios via the W18 R7 runner ([../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md)), and consumes the W18 R6 Playbook model ([../../prd/34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md)) unchanged.
- The conformance lab's core — verdicts, safety modes, evidence classes, storage boundaries, run-record fields, and the model-agnostic scenario protocol — is owned by [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md) and the [Agent Harness and Model Conformance Lab](../../designs/2026-06-19-agent-harness-and-model-conformance-lab.md) design; it is consumed and extended per R-SCOPE-1 and R-KEEP-1, never redefined here.
- The packaging compiler, harness adapters, and capability model; the Playbook model; the run-state machine; and non-packaging scenario families (install, audit, backup, skills) are owned elsewhere per R-SCOPE-1 and must not be reinvented by this lineage.
- Maintainer-only exception to the upstream-first rule: conformance assets — scenario specs, the tuple registry, and compact result records — live in-repo as project content under `docs/assets/conformance/`, edited in place, and are deliberately NOT authored upstream in `packages/docs/template/`; they MUST stay out of the shipped template, the packaged copy, npm tarballs, and any future package, because conformance is maintainer evidence infrastructure, not shipped product. The compiler and lab code remain ordinary source code under the CLI package, and this planning round writes project planning/PRD/work content only and authors nothing under `packages/`.
- Raw run artifacts, transcripts, and provider logs default to local, uncommitted storage per PRD 20's lab scope; promotion of redacted bundles remains a deliberately open implementer choice per D8.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then implement from the W18 R9 delta backlog.
- Why: The plan should become the product requirement contract before the tuple registry, evidence bar, first-pass scenarios, test layers, and support-claim governance are implemented, because the W18 R5 through W18 R8 provisional support claims can only be promoted through this evidence surface.
- Coordinate Handoff: Carry `W18 R9` into the downstream PRD reconciliation and the delta work backlog lineage, adding the active P coordinate per phase.
