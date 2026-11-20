---
title: "W28 R0 Wave, Revision, and Backlog Amendment Rules"
kind: "work"
status: "completed"
coordinate: "W28 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and current PRDs 14, 51, and 04 into implementation work."
  coordinate_handoff: "Carry W28 R0 into phase history records and commits, adding the active P number."
source:
  type: "prd"
  path: "docs/prd/14-lifecycle-workflow-and-coverage-passes.md"
---

# W28 R0 Wave, Revision, and Backlog Amendment Rules

## Purpose

This backlog ships three things in shipped resources, Skills, and the CLI:

- the coordinate selection and amendment rules in [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md#coordinate-selection-and-amendment);
- the snapshot facts and the Change History rule in [PRD 51](../../prd/51-backlog-review-and-reporting.md);
- the terms in [PRD 04](../../prd/04-glossary.md).

Shipped resources change in `packages/docs/template/` first. Each change is then reseeded, after review, into this repository's `.make-docs/` and `docs/`.

The [design](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md) and the [plan](../../plans/2026-11-18-w28-r0-wave-revision-rules/00-overview.md) define the scope.

Out of scope:

- Store-as-archive. It is recorded only as [Q-025](../../prd/03-open-questions-and-risk-register.md#q-025-should-the-store-become-an-optional-durable-archive-for-non-active-documents).
- The status vocabulary.
- W22 status drift.
- Any rewrite of existing records.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| A coordinate tells the reader the kind of change: new `W`, change-order `R`, or `P` for continuation or revision. | [Design](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md#human-experience-intent); [plan](../../plans/2026-11-18-w28-r0-wave-revision-rules/00-overview.md#human-experience-propagation) | [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md#coordinate-selection-and-amendment) R-COORD-1 to R-COORD-10; [PRD 04](../../prd/04-glossary.md) | [P1](01-template-resources-and-dogfood.md); [P4](04-validation-review-and-closeout.md) | Agent walkthrough of five past cases against the shipped `wave-model.md` | All five cases give the outcome that the design expects | None |
| Before a gated action, the owner gets one self-contained question that names the choice, the reason, and the effect. | Same | PRD 14 R-COORD-11, R-COORD-12 | [P1](01-template-resources-and-dogfood.md); [P3](03-skills.md); [P4](04-validation-review-and-closeout.md) | Agent Human Experience Review of one sample gated question | The sample meets the User Action Requests rule | None |
| For each other coordinate choice, the agent's reply names the choice and the reason. | Same | PRD 14 R-COORD-12 | [P1](01-template-resources-and-dogfood.md); [P4](04-validation-review-and-closeout.md) | Agent Human Experience Review of one sample agent-alone reply | The sample names the choice and the reason | None |
| A reader of a committed plan or backlog sees each scope change, its reason, its PRD decision, and any approval in one `## Change History` section. | Same | PRD 14 R-COORD-13 to R-COORD-15; [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-RULES-11 | [P1](01-template-resources-and-dogfood.md); [P2](02-cli-snapshot-facts-and-rule.md); [P4](04-validation-review-and-closeout.md) | Automated Implementation Testing of `BACKLOG-VAL-017`; template review | Valid and invalid fixtures give the expected diagnostics | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [P1 Template Resources and Dogfood](01-template-resources-and-dogfood.md) | Change the shipped references, contracts, prompts, templates, and routers. Reseed them into dogfood. Rewrite the user concept guide. |
| [P2 CLI Snapshot Facts and Rule](02-cli-snapshot-facts-and-rule.md) | Add the committed, closeout-notes, and coordinate facts and the Change History rule to `work.backlog.snapshot`. |
| [P3 Skills](03-skills.md) | Align `decompose-codebase`, `backlog-review`, and `preflight` with the rules and the new catalog entries. |
| [P4 Validation, Review, and Closeout](04-validation-review-and-closeout.md) | Walk through past cases, run the Human Experience Review, run the package checks, run the coverage pass, and write history. |
| [P5 Coordinate Facts Corrections](05-coordinate-facts-corrections.md) | Revision Phase for P2: count plan directories in coordinate facts, add per-Wave `archived`, and name `wave-model.md` in catalog parity. Runs before P4. |
| [P6 CI and Review Corrections](06-ci-and-review-corrections.md) | Revision Phase for P2 with P1 and P4 text corrections: fix the CodeQL comment-strip alert and the valid CodeRabbit findings on PR #64. |
| [P7 Schema Version and Completion Rules](07-schema-version-and-completion-rules.md) | Revision Phase for P2: snapshot schema version 2, commit-required completion, one glossary definition, and the 2.0.9 candidate digest. |
| [P8 Review Corrections and Skill Refresh](08-review-corrections-and-skill-refresh.md) | Revision Phase for P2 with design and guide text corrections: ignore headings inside HTML comments, fix the setup and Skill adoption defects D-054 and D-055, repair this repository's Store record, refresh the installed Skills, and repack the 2.0.9 candidate. |
| [P9 Second Review Corrections](09-second-review-corrections.md) | Revision Phase for P8: name every setup follow-up, treat code as literal in snapshot section lookup, fix the `incomplete` review display, explain the report version, refresh the installed Skills, and repack the 2.0.9 candidate. |
| [P10 Third Review Corrections](10-third-review-corrections.md) | Revision Phase for P9: name the target folder in the Skill route, recount Skill changes after a new plan, track comment and fence state together in the snapshot scan, record deferred findings D-056 and D-057, and repack the 2.0.9 candidate. |
| [P11 Fourth Review Corrections](11-fourth-review-corrections.md) | Revision Phase for P10: quote the Skill route target for every shell, accept CRLF closing fences, open no fence for inline code, correct the P10 testing closeout, and repack the 2.0.9 candidate. |

## Usage Notes

- Read the phases in order. P3 depends on the P2 rule IDs. P5 revises P2. P4 depends on P1 to P3 and P5, so it runs last.
- Every phase file includes `## Source PRD Docs`.
- Each phase adds `### Closeout Notes` at closeout. Do not add a placeholder earlier. A placeholder would make the `closeoutNotesPresent` fact misleading.
- Each Human Experience promise above is traceable through its phase, evidence decision, and implementation gate.
- The central [evidence report](evidence.md) holds the retained acceptance evidence for each phase. Follow the Acceptance-Case Evidence Retention section in [the coverage-pass contract](../../../.make-docs/system/contracts/coverage-pass-contract.md).
- No deferred obligation is in scope. Unassisted Goal Testing is `not-needed-now` in every phase, because no current decision needs it.
- This backlog is a draft until its first commit. After that, scope edits need a `## Change History` entry, as PRD 14 R-COORD-13 requires.
- Do not commit, push, or open a PR without Tyler's go-ahead.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: After Tyler's go-ahead, start with P1 and continue phase by phase.
- Why: The backlog turns the approved plan and current PRDs 14, 51, and 04 into implementation work.
- Coordinate Handoff: Carry `W28 R0` into phase history records and commits, adding the active P number.

## Change History

### 2026-11-18 — W28 R0

- Kind: `edit`
- Affected scope: P2 t11, t12, and A31; P3 t2.
- Previous scope: P2 changed the snapshot schema, snapshot code, catalog, and tests only. P3 t2 added the `rule-map.md` rows for `BACKLOG-RULE-017` and `BACKLOG-RULE-018`.
- Replacement scope: P2 t11 regenerates the two generated backlog-review Skill bundles and the MCP App widget asset from the changed schema. P2 t12 adds the `rule-map.md` rows, moved from P3 t2. P3 t2 points to P2 t12. New acceptance A31 covers the regenerated files.
- Rationale: The generated bundles embed the strict snapshot schema, and the Skill test checks that `rule-map.md` lists every catalog rule. P2's tests cannot pass without these files. The change stays inside the plan's stated scope.
- PRD decision: `none` — No product requirement changes; PRD 51 already requires the facts and the rule.
- Owner approval: Not required. This is an edit to unfinished work that fits the plan.
- Source: [P2 CLI Snapshot Facts and Rule](02-cli-snapshot-facts-and-rule.md)

### 2026-11-18 — W28 R0 P5

- Kind: `revision-phase`
- Affected scope: New P5 t1–t4 and A32–A35, revising completed P2; P4 dependencies.
- Previous scope: P2 coordinate facts counted work directories only, reported archived state per record only, and its catalog parity text did not name `wave-model.md`.
- Replacement scope: P5 counts the union of work and plan W/R directories, adds a per-Wave `archived` fact, and names `wave-model.md` in both catalog parity mappings. P4 now also depends on P5.
- Rationale: Owner review of committed P2 found that plan-only revisions such as W18 R15 were missing from the revision facts, which is the collision these facts exist to prevent. No revision Wave test passes.
- PRD decision: `update-existing` — PRD 51 R-BACKLOG-SNAPSHOT-29 now names plan directories and per-Wave archived state.
- Owner approval: Not required. This is a clear revision Phase that the agent may add alone; the owner requested the fixes in P2 review.
- Source: [P5 Coordinate Facts Corrections](05-coordinate-facts-corrections.md)

### 2026-11-18 — W28 R0 P4

- Kind: `edit`
- Affected scope: P4 A21; new P4 t9–t11 and A36–A38.
- Previous scope: A21 required a walkthrough mismatch to be fixed in P1. P4 had no task for the design table, the Skill sync, or the Skill delivery runner.
- Replacement scope: A21 allows the fix in the design's expected-outcomes table by owner decision. t9 corrects that table. t10 runs the owner-approved Skill sync, or records why it failed. t11 fixes the Skill delivery runner and closes D-052. A36–A38 cover these tasks.
- Rationale: The P4 walkthrough found that the design table, not the rules, was wrong for three cases. The owner approved one Store write for the Skill sync and asked for the D-052 fix in this change set.
- PRD decision: `update-existing` — PRD 03 closes D-052 and adds D-053. PRDs 14 and 51 need no change.
- Owner approval: Tyler, 2026-11-18 8:00 PM CST, relayed by the coordinator.
- Source: [P4 Validation, Review, and Closeout](04-validation-review-and-closeout.md)

### 2026-11-18 — W28 R0 P4

- Kind: `edit`
- Affected scope: P4 Stage 4 (t8, A27–A29, and its dependency) and the A38 closeout caveat.
- Previous scope: The owner follow-up edit had cut the P4 file inside task t8, which dropped the rest of t8, acceptance criteria A27–A29, and the Stage 4 dependency. A38 recorded the installed Skill copies as blocked by D-053.
- Replacement scope: Stage 4 is restored unchanged from commit `e8518f69`. A38 is resolved: the reviewed Skill sync, run with the D-053 fix, refreshed the installed `.agents/skills/` copies, which this change set commits.
- Rationale: CodeRabbit found the truncated Stage 4. The owner approved committing the synced Skill copies to close open item 1.
- PRD decision: `none` — No product requirement changes.
- Owner approval: Tyler, 2026-11-18, relayed by the coordinator.
- Source: [P4 Validation, Review, and Closeout](04-validation-review-and-closeout.md)

### 2026-11-18 — W28 R0 P6

- Kind: `revision-phase`
- Affected scope: New P6 t1–t4 and A39–A41. It revises completed P2 code, and it corrects P1 resource text and P4 guide text.
- Previous scope: The snapshot stripped HTML comments with one regular-expression pass (CodeQL alert 44). It ignored missing linked phases in `nextPhase` and record `committed`, assumed the target was the repository root, and skipped Change History headings at other levels. The decision procedure let a stated coordinate or a revision-Phase choice skip owner gates and archived restoration. Some guides still described change documents.
- Replacement scope: See P6 t1–t4.
- Rationale: CI and review findings on PR #64. Each fix corrects a defect inside an existing result, and no revision Wave test passes.
- PRD decision: `update-existing` — PRD 14 R-COORD-4 and R-COORD-5 now state the order, the gate rule, and the empty-scan fallback.
- Owner approval: Not required for a clear revision Phase. The owner approved the CI-fix work on 2026-11-18.
- Source: [P6 CI and Review Corrections](06-ci-and-review-corrections.md)

### 2026-11-19 — W28 R0 P4

- Kind: `edit`
- Affected scope: P4 closeout, the A25 caveat.
- Previous scope: A25 was recorded as a bounded caveat that waited on a Bun run.
- Replacement scope: A25 is an owner-approved caveat. It explains that Make Docs does not use Bun, and that the full `smoke:pack` tests `bun x` as one of the package runners users might use, alongside `npx` and `pnpm dlx`. The caveat stays under "Open before merge".
- Rationale: CodeRabbit noted that P4 closed with A25 unmet. The owner approved the caveat instead of reopening P4.
- PRD decision: `none` — No product requirement changes.
- Owner approval: Tyler, 2026-11-19 12:05 AM CST, relayed by the coordinator.
- Source: [P4 Validation, Review, and Closeout](04-validation-review-and-closeout.md)

### 2026-11-19 — W28 R0 P7

- Kind: `revision-phase`
- Affected scope: New P7 t1–t5 and A42–A44, revising completed P2.
- Previous scope: Snapshot facts were additive keys of schema version 1. Phase complete allowed "committed or deployed", and the glossary had two Phase complete rows. The package version was 2.0.8, which is already published.
- Replacement scope: Snapshot schema version 2 refuses version 1 with an upgrade message. A commit is required for completion, and deployment is extra evidence. One glossary row requires both conditions. The agent judges prior completion from history. The package is 2.0.9 with a reviewed candidate digest.
- Rationale: Owner decisions on the PR #64 review questions. The schema change applies P2's own rule for consumers that cannot accept new keys, and no revision Wave test passes.
- PRD decision: `update-existing` — PRD 51 R-BACKLOG-SNAPSHOT-10 and R-BACKLOG-SNAPSHOT-30, PRD 14 R-COORD-2 and R-COORD-21, and the PRD 04 Phase complete row.
- Owner approval: Tyler, 2026-11-19 12:05 AM CST, relayed by the coordinator.
- Source: [P7 Schema Version and Completion Rules](07-schema-version-and-completion-rules.md)

### 2026-11-19 — W28 R0 P8

- Kind: `revision-phase`
- Affected scope: New P8 t1–t6 and A45–A50, revising completed P2 and adding the D-054 and D-055 CLI fixes to W28.
- Previous scope: The snapshot found the Closeout Notes and Change History sections before it removed HTML comments. The installed `backlog-review` Skill trailed the source and refused version 2 snapshots. W28 did not cover setup or Skill adoption code.
- Replacement scope: Comments are blanked in the whole body first. Full setup keeps an unset resource choice unset and routes the Skill changes it leaves to `make-docs setup skills`. The Skill adoption review blocks an older install record with the `make-docs setup` route. This repository's Store record is repaired, the installed Skills are refreshed, and the 2.0.9 candidate is packed again.
- Rationale: CodeRabbit findings on PR #64 after P7, and the P7 Skill refresh limit. The refresh exposed D-054 and D-055, which blocked it. No revision Wave test passes.
- PRD decision: `update-existing` — PRD 03 records and closes D-054 and D-055. PRD 51 R-BACKLOG-SNAPSHOT-27 and R-BACKLOG-RULES-11, and PRD 08 R-SKILL-SETUP-6, already require the corrected behavior and do not change.
- Owner approval: Tyler, 2026-11-19, chose to fix D-054 and D-055 in W28, and approved each Store write.
- Source: [P8 Review Corrections and Skill Refresh](08-review-corrections-and-skill-refresh.md)

### 2026-11-19 — W28 R0

- Kind: `edit`
- Affected scope: P1 user route guide text and the P4 design text for the CLI twin.
- Previous scope: The route guide said completed work gets a revision Phase, without the revision Wave test. The design said the CLI reports whether a Phase was committed, without saying that the fact describes only the current working tree.
- Replacement scope: The route guide names the revision Wave test and its owner approval. The design states that `committed` describes the current working tree, and that the agent decides prior completion from history.
- Rationale: CodeRabbit findings on PR #64. Both texts now match `wave-model.md` and the owner's Q1 decision.
- PRD decision: `none` — PRD 14 R-COORD-4 and R-COORD-21 already state these rules.
- Owner approval: Not required
- Source: [P8 Review Corrections and Skill Refresh](08-review-corrections-and-skill-refresh.md)

### 2026-11-19 — W28 R0 P9

- Kind: `revision-phase`
- Affected scope: New P9 t1–t6 and A51–A55, revising completed P8 and adding the W25 R0 P3 review display fix to W28.
- Previous scope: The applied setup result named only a blocked platform when Skill changes also remained. A `<!--` in code could hide a live section. The review display treated `incomplete` as complete. The report model did not explain why the report version stays 1.
- Replacement scope: Setup names every remaining follow-up. Snapshot section lookup treats code as literal text. The display matches whole completion values. The report model explains the version. The installed Skills are refreshed, and the 2.0.9 candidate is packed again.
- Rationale: CodeRabbit findings on PR #64 at `e12583cb`. No revision Wave test passes.
- PRD decision: `none` — PRD 51 R-BACKLOG-SNAPSHOT-27 and R-BACKLOG-RULES-11, and PRD 08 R-SKILL-SETUP-6, already require this behavior. PRD 51 ties a new report version to a change in report meaning, and the meaning is unchanged.
- Owner approval: Tyler, 2026-11-19, chose to fix the two Skill-changing items in W28 and approved the Store write for the Skill sync.
- Source: [P9 Second Review Corrections](09-second-review-corrections.md)

### 2026-11-20 — W28 R0 P10

- Kind: `revision-phase`
- Affected scope: New P10 t1–t4 and A56–A59, revising completed P9.
- Previous scope: The `make-docs setup skills` route had no target folder, and setup did not count Skill changes again after a new plan. The snapshot code scan opened a fenced block from a marker inside an HTML comment, and closed a block on a line that mixed fence markers.
- Replacement scope: The route names `--target <folder>` when setup ran with a target, and the count matches the final plan. The scan tracks comment and fence state together and needs a matching closing fence. The backlog review display and widget findings are recorded as D-056 and D-057.
- Rationale: CodeRabbit findings on PR #64 at `73f0ae00`. No revision Wave test passes. The display and widget findings are W25 behavior outside W28's plan, and one needs a product decision.
- PRD decision: `update-existing` — PRD 03 records D-056 and D-057 as open. PRD 51 R-BACKLOG-SNAPSHOT-27 and R-BACKLOG-RULES-11, and PRD 08 R-SKILL-SETUP-6, already require the corrected behavior and do not change.
- Owner approval: Tyler, 2026-11-20, chose to defer the display and widget findings to a separate Wave.
- Source: [P10 Third Review Corrections](10-third-review-corrections.md)

### 2026-11-20 — W28 R0 P11

- Kind: `revision-phase`
- Affected scope: New P11 t1–t4 and A60–A63, revising completed P10.
- Previous scope: The `make-docs setup skills` route quoted the target with POSIX single quotes, which Command Prompt does not accept. The snapshot code scan did not close a CRLF fenced block, and it opened a fence for a line of inline code that starts with three backticks. The P10 closeout said all selected testing passed.
- Replacement scope: The route uses the double-quoted form of other make-docs next actions. The scan accepts a CRLF closing fence and opens no backtick fence when the rest of the line has a backtick. The P10 closeout names the 2 known `npm test` failures.
- Rationale: CodeRabbit findings on PR #64 at `9a017abf`. No revision Wave test passes.
- PRD decision: `none` — PRD 51 R-BACKLOG-SNAPSHOT-27 and R-BACKLOG-RULES-11, and PRD 08 R-SKILL-SETUP-6, already require this behavior.
- Owner approval: Not required. The owner told the agent to keep correcting review findings on 2026-11-19.
- Source: [P11 Fourth Review Corrections](11-fourth-review-corrections.md)
