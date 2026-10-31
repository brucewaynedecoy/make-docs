---
title: "Checkout Move and Managed-Block Ownership Repair"
kind: "work"
status: "in-progress"
coordinate: "W22 R1"
follow_on:
  route: "implementation-loop"
  next_prompt: "Run Phase 3 installed-package and broader flow proof with temporary Stores."
  why: "P1 and P2 local code and focused tests are complete. Installed-package proof remains open."
  coordinate_handoff: "Carry W22 R1 and the active phase into later evidence, history, and commits."
---

# Checkout Move and Managed-Block Ownership Repair

## Purpose

This backlog turns the [reviewed W22 R1 plan](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/00-overview.md) into four ordered phases for a Make Docs 2.0.6 candidate. The user authorized plan review, scoped PRD reconciliation, P1, and P2 implementation. P1 and P2 local code and focused tests are complete and uncommitted. P3 installed-package proof and P4 release work remain open.

The plan review found and corrected material gaps. The [evidence report](evidence.md) retains those findings and the local P1 and P2 test results. [D-049](../../prd/03-open-questions-and-risk-register.md#d-049-moved-checkout-setup-bypasses-project-identity-and-managed-block-ownership) stays open until installed-package proof.

## Authority and Implementation Gate

This is a scoped delta backlog. Existing PRDs remain current authority. The user requested this backlog before full PRD reconciliation. This is a bounded departure from the usual plan-to-PRD-to-work order. The named existing owners are reconciled and the independent semantic and Store-free authority checks passed. The user then authorized P1 regression tests and the ownership fix, followed by P2 implementation. Both local phases remain uncommitted.

The user later authorized P3 and P4 work up to a check commit. The work uses temporary Stores. The user did not authorize a commit, live Store repair, tag, package publication, or release. The package version is now 2.0.6 in the uncommitted tree.

No new PRD or broad rewrite is planned. Keep the active PRD set and W22 R0 history in place. Preserve authentic schema-1 adoption rules. Keep current shared-file ownership block-scoped.

## Human Experience Trace

Use the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md). The accepted change input is the user's rename report and block-ownership correction in this chat. A separate new design was not requested.

| Promise | Source plan | Owning PRD | Phase | Evidence | Implementation gate | Obligation |
| --- | --- | --- | --- | --- | --- | --- |
| Setup explains the moved install before fresh choices. | [Flow](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/02-setup-path-move-flow.md) | PRD 07, PRD 38 | P2, P3 | Red flow fixture, installed transcript, agent review | Separate authorization and P1 authority stage | None |
| Outside user text is preserved without ownership conflict. | [Ownership](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/01-authority-and-ownership.md) | PRD 15, PRD 18 | P1, P3 | Block proof and exact prefix/suffix comparisons | Same gate | None |
| Move retains selected identity, ledger, and history. | [Flow](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/02-setup-path-move-flow.md) | PRD 38 | P2, P3 | Logical Store comparison and atomic retry cases | Same gate | None |
| Cancel, preview, and unsafe cases leave no durable move. | [Tests](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/03-tests-and-package-proof.md) | PRD 07, PRD 18, PRD 38 | P2, P3 | No-change assertions and next-action checks | Same gate | None |
| Root and kit require separate targets and reviews. | [Flow](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/02-setup-path-move-flow.md) | PRD 24, PRD 38 | P2, P3 | Authentic two-ID nested fixture | Same gate | None |
| Release claims identify the exact proved package and limits. | [Release](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/04-release-206.md) | PRD 10 | P4 | Final digest, host results, security review, release review | Separate publication approvals | None |

## Phase Map

| File | Purpose | Dependency |
| --- | --- | --- |
| [01-authority-and-ownership.md](01-authority-and-ownership.md) | Reconcile current authority, write red ownership cases, then repair proof. | Implementation authorization before execution |
| [02-setup-path-move-flow.md](02-setup-path-move-flow.md) | Write red setup cases, then add shared preview/apply and path review. | P1 authority and proof contract |
| [03-tests-and-package-proof.md](03-tests-and-package-proof.md) | Expand negative, integration, authentic upgrade, and development package proof. | P1 and P2 implementation |
| [04-release-206.md](04-release-206.md) | Bump version, build one final artifact, prove it, and prepare release. | P3 development proof; later release approvals |

Focused failing fixtures belong before the code in P1 and P2. P3 expands and closes proof after those changes. This avoids a dependency cycle. P4 repeats required installed proof after the final version bump.

## Workstream and Write Scope

| Workstream | Future write scope | Required handoff |
| --- | --- | --- |
| Authority | Named sections in PRDs 07, 10, 15, 18, 24, 25, 38, 39; narrow index/risk links | Current rules validated before code |
| Ownership | Shared verifier, manifest/provenance readers, scoped ownership tests | Versioned proof contract to setup |
| Setup | CLI preflight, Store-only move operation, registry/MCP projections, flow tests | Explicit source/target review and atomic apply |
| Proof | Grouped test matrix, isolated package fixtures, host workflow additions | Exact artifacts and bounded results |
| Release | CLI/lock version, scoped notes and release guidance, candidate artifact guards | One tested final digest; separate approvals |
| Validation | Changed-doc checks and scoped fixes; later product evidence review | No pass inferred from plans or checkboxes |

Keep worker scopes separate. Source core and setup work can overlap only after the authority and proof interfaces are fixed. Run proof after both merge. Do not let a coordinator replace delegated authors where the live workflow calls for workers.

## Common Testing Decision Record

These are planned decisions from [plan P3](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/03-tests-and-package-proof.md#four-testing-decisions), not permission to run tests now. Each phase narrows the scope below. Use [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md) and [PRD 46](../../prd/46-naive-end-user-acceptance-testing.md).

| Field | Automated Implementation Testing | Performance Testing | Guided Progress Review | Unassisted Goal Testing |
| --- | --- | --- | --- | --- |
| Decision informed | Correctness of this repair and the exact candidate | No current performance decision | Useful owner feedback on the installed flow | No current unassisted-use claim |
| Reason now | Rename and ownership failures need regression proof | not-needed-now; no speed or scale claim changes | Offer after the first meaningful installed flow | not-needed-now; automated proof and agent review can answer the known failure |
| Product maturity | Released CLI; patch repair | Released CLI; patch repair | Working installed increment | Released CLI; no new unassisted support claim |
| Scope | Phase cases, nearest boundaries, required package and host proof | No benchmark | One disposable moved-project goal in one to five steps | No run selected |
| Executor | Maintainer or agent; temporary roots and disposable Stores through MAKE_DOCS_HOME or existing explicit platform adapters only | None | Willing owner or maintainer; may decline | None; a later run requires PRD 46 qualification |
| Gate effect | blocking-claim-only for exact correctness/release claims | not-applicable | advisory | not-applicable |
| Effort budget | One affected-first set, one full set, one final artifact matrix per candidate; at most two repair-and-rerun cycles per failure | Zero runs | One offer; at most 15 minutes if accepted | Zero runs |
| Stop condition | Required failure, unsafe environment, missing seed/host, or exhausted budget | Stop before a benchmark | Goal experienced, feedback saved, declined, or environment blocked | Stop before recruiting or preparing a scenario |
| Evidence retained | Commands, identities, logical facts, results, and material failures | Decision only | Goal, short path, result/decline, feedback, next action | Decision only |
| Rerun trigger | Relevant code/artifact/environment change or covered failure | New accepted performance claim or relevant cost risk | Material UI change or owner feedback | Discoverability uncertainty existing evidence cannot answer, or explicit product/release authority |

Agent Human Experience Review is required for applicable promises. It is separate from the four testing types. Inspect the real result, name the evidence and reviewer, and record observations, conclusions, limits, and next actions. Guided Progress Review remains advisory. A declined offer is not a failed release or an obligation. No human acceptance gate, benchmark, NUAT scenario, or deferred obligation is selected.

## Usage Notes

- Execute phases in order only after the implementation gate opens.
- Each phase contains Source PRD Docs. Acceptance cases A1 through A32 are unique across this backlog.
- Task ordinals restart at t1 in each phase and continue across that phase's stages.
- Extend evidence.md only with actual review or execution results. Do not mark an A case passed from its planned text.
- Retain new acceptance captures in evidence/a<number>/ only when needed. Existing evidence can be linked.
- Future fixtures use MAKE_DOCS_HOME or existing explicit platform test adapters, task-scoped temporary-root variables, and disposable Stores. Use temporary plain project copies. Do not change HOME, home, or CODEX_HOME. They must not touch the owner's Store, machine settings, or Make Kit checkout. New branches or worktrees need separate explicit user permission.
- Keep jdocmunch/jcodemunch as the first route for docs/code. Reindex before fallback if stale.
- D-049 stays open until required installed proof passes. A version bump or development pass alone does not close it.
- The owner's real root and kit path repairs need later explicit authorization after preview.

## Intended Follow-On

- Route: implementation-loop.
- Next step: Review the uncommitted Phase 1 result, then use its shared ownership proof in Phase 2 preview and apply work when that work starts.
- Why: Phase 1 now has focused regression evidence and a versioned proof reader and writer.
- Coordinate Handoff: Carry W22 R1 and the active P coordinate into later history and commits.
- Current state: Phase 1 code and focused tests are complete but uncommitted. Phase 2 to Phase 4, full package proof, version bump, live Store repair, and release remain open.
