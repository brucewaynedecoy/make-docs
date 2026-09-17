---
title: "Phase 3: Lifecycle, Evidence, Compatibility, and State"
kind: "work"
status: "complete"
coordinate: "W19 R2 P3"
source:
  type: "prd"
  path: "docs/prd/48-performance-evidence-governance.md"
---

# Phase 3: Lifecycle, Evidence, Compatibility, and State

## Purpose

Connect Performance Evidence Governance to lifecycle qualification, work packets, evidence, normalized results, expiry, phase gates, compatibility, adjacent proof modes, and optional operational state without allowing any result, Store projection, or task status to redefine product or support authority.

## Overview

P3 consumes the canonical resources from P2, uses documentation fixtures rather than real benchmarks, and preserves independent Automated Implementation Testing, Guided Progress Review, Unassisted Goal Testing, Human Experience Review, accessibility, static-adapter, direct installed-product, release, and support boundaries. The phase permits at most two materially distinct correction attempts and two review cycles.

## Source PRD Docs

- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 28 — Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — no deferred obligation is assigned at backlog generation; a `defer-required` disposition must use a real PRD 45 record before execution.
- `NUAT-###: none` — no Unassisted Goal Test is assigned; Performance Testing remains a separate testing type.
- `Finding: none` — no finding is assigned; a task result cannot close a later performance or adjacent-mode finding.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact branch, HEAD, worktree, free disk, phase write allowlist, current dirty state, and completed P2 evidence; stop on unexpected user work or unsafe resource pressure.
- [x] t2: Reread the current normative bodies of PRDs 14, 18, 28, 38, 45, 46, 48, 49, and 50 plus PRD 03, and record each current revision or content digest before implementation.
- [x] t3: Reevaluate at minimum R-009, R-017, closed R-023 as a regression guard, R-029 through R-032, and R-034; reevaluate Q-018 only if this phase changes configuration ownership and Q-019 only if it changes Persona setup or configuration; use PRDs 46, 48, 49, and 50, not Q-019, as the authority for cross-type and Human Experience boundaries, and add newly relevant items from the live reread.
- [x] t4: For every relevant `Open`, `Confirming`, `Deferred`, or closed regression item, record its ID, authority revision or digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [x] t5: If no blocking item or authority gap remains, record an explicit no-blocker result and the finite phase correction/review budget before unlocking t8.
- [x] t6: If a blocking item or authority gap exists, stop before implementation writes and present an owner decision package with the source anchor, affected phase/PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history changes, validation, and decision-only commit boundary; do not create a standalone decision file.
- [x] t7: After an owner decision, require canonical PRD/register/history updates, focused validation, a separate decision-only commit, and the recorded decision commit SHA before marking this gate unlocked.

### Acceptance criteria

- Current owning PRDs and PRD 03 were reread and revisions or digests are recorded.
- Q-018 is evaluated only if configuration ownership is affected, and Q-019 only if Persona setup or configuration is affected; cross-mode non-substitution is governed by PRDs 46 and 48 rather than Q-019.
- R-023 remains closed and is used only as a Store-authority regression check.
- The gate records either an explicit no-blocker result or a complete owner decision package.
- No implementation write occurred before unlock, and any blocking decision was validated and separately committed.
- No task completion closes a question, risk, finding, waiver, deferred obligation, or capability.

### Dependencies

- P2 accepted with canonical resources and routing available.
- Current reconciled PRDs.

### Closeout Notes

- Testing-mode decision(s): focused Automated Implementation Testing is selected. Performance Testing of the W19 R2 implementation, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now` unless a current decision activates them. Agent Human Experience Review applies to the human-facing lifecycle resources.
- Entry state: branch `make-docs-v2`; HEAD `f79ec885eb3021c10697ac787eed5aa4dffcd7ac`; clean worktree; 129 GB free; P2 accepted at `f79ec885`.
- Write allowlist: the eight upstream lifecycle resource/template files under `packages/docs/template/.make-docs/system/`; their eight dogfood projections under `.make-docs/system/`; `packages/cli/tests/performance-evidence-resources.test.ts`; `packages/cli/tests/fixtures/performance-evidence/lifecycle-cases.md`; and this phase record. No other repository file is accepted for P3.
- Authority digests: PRD 03 `575823ba6ef617e5b1b3fc20417c82f30d83ae8630fbf270a7a9abdd83da10e8`; PRD 14 `114f5b85da76b09951df23dbe279fd8e4c4fb0c765c45e8cad7b96f07dfe3522`; PRD 18 `9239f4ff3074c7ac4a92f9f1fdea442177d108a5fd4ade2354c1f14701d58f66`; PRD 28 `f709ba89a8c4b2c71b9cf9b74117a082c9721d6781f5373650ffff8993d421c6`; PRD 38 `17d8de3a9c7f114978afe5f3effe2d9057cb68c504bbacdee9c9f98967cc60fd`; PRD 45 `718b0c4584d049395433af6f3220f21b21f4d815ca615334f62a8a070119b7f1`; PRD 46 `64876d508c15c080d3b48bca68ce03ca53aabbd45c6b80cf7330ead5c2ff2c95`; PRD 48 `8ff466996e1da56714dbdc910e3a4e95933ca1fced29a8af8bad5c52aab32125`; PRD 49 `db65bcd107fc26958a97e6af9777a9d1da89622e5194817c90df66766c4d8020`; PRD 50 `461262c7b2e04eed560ac85b96ffa1e7ca90f0c0c660b0b3a7d835dd4f1d0bc4`.
- Risk gate: R-009 and R-017 are `impacted-nonblocking`; P3 keeps the lifecycle advisory and keeps detailed policy in the canonical system resource. R-023 is a `closed-regression-check`; P3 keeps repository records authoritative. R-029, R-030, R-031, R-032, and R-034 are `impacted-nonblocking`; the P3 fields, fixtures, proof separation, and proportional test set implement their accepted controls. R-021 is unrelated because P3 does not change support claims. Closed R-022 is a regression check only; P3 does not replace direct installed-product proof. Q-018 and Q-019 are unrelated because P3 changes neither configuration ownership nor Persona setup.
- Gate result: no blocking item, new authority gap, or decision-only commit is required. Tasks t6 and t7 are complete as not applicable. The phase budget is two material correction attempts and two independent review cycles.
- Phase / capability status: Stage 1 unlocked P3 implementation. Gate completion alone does not complete P3.

## Stage 2 - Wire Qualification, Profiles, And Finite Execution Packets

### Tasks

- [x] t8: Add the bounded performance-candidate inventory and dual disposition to design, plan, PRD, work, implementation, coverage, and closeout touchpoints without making evidence mandatory for every change.
- [x] t9: Require every `required-now` or `characterize-now` execution candidate to link exactly one repository-canonical, append-only `PERF-###` ID, version, source digest, target class, owner, and lineage.
- [x] t10: Keep hard product targets solely in their owning PRDs; keep engineering guardrail, characterization, and experiment profiles in their approved finite plan/work authority and prevent execution packets from copying or redefining product targets.
- [x] t11: Render finite execution packets that bind build, dependency/configuration identity, environment, workload, fixture, instrument, measurement/comparability protocol, non-sacrificable constraints, run/correction/review/time/compute/external-resource budgets, stops, fingerprint, reuse rule, and evidence destinations.
- [x] t12: Require correctness and the measurement seam to be validated before optimization or blocking performance execution, and route inadequate resolution or variance to `revise` or `blocked`.
- [x] t13: Prove with fixtures that characterization is an uncertain observed distribution and cannot become a threshold until source, comparability, variance, resolution, protected-outcome rationale, trade-offs, owner approval, and superseding lineage are established.

### Acceptance criteria

- Lifecycle artifacts link to one canonical profile authority and never copy live targets into competing records.
- Each executable packet has finite budgets, explicit stops, and a complete fingerprint/comparability contract.
- Plan/work guardrails remain explicitly non-product authority and cannot establish support claims.
- Characterization precedes threshold promotion.
- Correctness, durability, safety, security, privacy, accessibility, portability, cost, and maintainability remain non-sacrificable.

### Dependencies

- Stage 1 unlocked.
- P2 canonical resources.

### Closeout Notes

- Testing-mode decision(s): representative documentation fixtures; no real performance execution.
- Evidence: the lifecycle reference now routes Design, Plan, PRD, Work backlog, Implementation, Coverage, Closeout, and Release/publish. The design and plan templates record both candidate decisions. The work template links the canonical profile, finite budget, execution packet, evidence handoff, gate disposition, and scope.
- Fixture coverage: six target classes, canonical profile version/digest/owner/scope/lineage, the complete finite packet, correctness precondition, non-sacrificable constraints, and characterization authority limits.
- Phase / capability status: execution-packet contract wired; later P3 stages supply result, gate, proof-mode, and closeout evidence.

## Stage 3 - Normalize Results, Findings, Expiry, And Phase Gates

### Tasks

- [x] t14: Define unique result records bound to the exact profile ID/version/digest, build, fingerprint, raw and analyzed evidence, uncertainty, exclusions, budget ledger, supported scope, owner/reviewer disposition, and one normalized `pass`, `fail`, `revise`, `blocked`, or `waived` outcome.
- [x] t15: Preserve finding and waiver records as independent authority: task completion cannot close a finding, and `waived` is bounded risk acceptance with explicit scope and expiry rather than success.
- [x] t16: Implement bidirectional traceability from qualification through profile, plan budget, work packet, result, finding, PRD or `O-###` disposition, phase gate, and history.
- [x] t17: Enforce unchanged-fingerprint result reuse outside requalification, affected-only reruns after material change, remaining-budget accounting, and stop/escalation at exhaustion or diminishing return.
- [x] t18: Encode expiry or release requalification as a separately owner- or phase-authorized event with a new finite budget and exactly one bounded qualification execution when unchanged; prohibit further unchanged repeats until another valid trigger and explicit authorization.
- [x] t19: Make phase gates consume evidence validity, outcome, critical/major findings, reproducibility, waiver scope/expiry, deferred obligations, budget state, unchanged-check compliance, and supported scope; treat `fail`, `revise`, `blocked`, expired, or unrun required proof as non-passing.
- [x] t20: Add fixtures for hard profile, engineering guardrail, characterization, deferred, unsupported, expired, non-comparable, blocked, waived, unchanged reuse, affected rerun, and valid versus repeated requalification cases.

### Acceptance criteria

- Result, finding, waiver, budget, and expiry records preserve exact profile and supported-scope authority.
- Outcomes use only `pass`, `fail`, `revise`, `blocked`, and `waived` with their bounded gate meanings.
- Unchanged results are reused; material changes rerun only affected checks; budgets cannot self-replenish.
- Each expiry/release event permits at most one newly budgeted unchanged-fingerprint qualification execution.
- Gates cannot infer a favorable result from missing, expired, invalid, non-comparable, waived, or adjacent-mode evidence.

### Dependencies

- Stage 2 accepted.
- PRDs 14, 45, and 48 current.

### Closeout Notes

- Testing-mode decision(s): documentation fixtures and gate-contract review only.
- Evidence: the normalized result fixtures use only `pass`, `fail`, `revise`, `blocked`, and `waived`. Separate finding and waiver fixtures preserve scope, expiry, risk, obligations, and later-result links.
- Gate coverage: current pass, expired, non-comparable, missing or invalid, adjacent-mode, unchanged reuse, affected-only rerun, exhausted budget, first requalification, and prohibited repeated requalification.
- Phase / capability status: result and gate semantics complete; proof-mode, compatibility, state, and final closeout remain open.

## Stage 4 - Preserve Proof-Mode, Compatibility, And State Boundaries

### Tasks

- [x] t21: Preserve independent applicability, evidence, outcomes, conclusions, and gate effects for Performance Testing, Automated Implementation Testing, Guided Progress Review, Unassisted Goal Testing, agent Human Experience Review, architecture review, accessibility, static-adapter and direct installed-product proof, release, and support promotion.
- [x] t22: Allow one physical execution to contribute to multiple testing types, review lenses, or evidence gates only when each authority, field set, evidence use, conclusion, outcome, and gate effect remains explicit. Prevent perceived slowness, performance pass, waiver, or Store receipt from certifying another type, lens, or gate.
- [x] t23: At the first qualifying lifecycle event after adoption, inventory active current numeric thresholds, relative claims, resource budgets, absolute performance language, benchmark assets, and evidence without retroactively failing completed phases or rerunning, certifying, moving, deleting, or rewriting existing assets.
- [x] t24: Route ambiguous or modified managed resources through PRD 18 conflict-stop and explicit disposition, and require owner authority for keeping, reclassifying, deferring, narrowing, or removing current candidates.
- [x] t25: Keep repository knowledge canonical and any Project State or Global Store projection rebuildable and non-authoritative; add no new table, daemon, retry loop, hidden mutation, or self-authorizing budget ledger in documentation-first delivery.
- [x] t26: Prove closed R-023 regressions: operational projection or receipt cannot override profile, target, outcome, expiry, waiver, finding, obligation, ownership, or history authority.
- [x] t27: Prove performance outcomes cannot promote static-adapter availability, direct installed-product correctness, release readiness, public support, or a broader harness method, and apply R-021 or the closed R-022 regression guard only when this phase touches those claims.

### Acceptance criteria

- Cross-mode outcomes never substitute for one another.
- Compatibility is conservative, non-retroactive, conflict-stopping, and evidence-honest.
- Existing benchmark assets are neither executed nor reclassified by inference.
- Repository authority remains canonical; optional state is rebuildable and proves recording only.
- R-023 remains closed and guarded, and no performance result broadens static-adapter, installed-product, or support scope.

### Dependencies

- Stage 3 accepted.
- PRDs 18, 28, 38, 46, 48, 49, and 50.

### Closeout Notes

- Testing-mode decision(s): cross-type, review-lens, compatibility, static-adapter, and Store-boundary fixtures; no real benchmark or added harness exercise unless a current decision and authority require it.
- Evidence: the fixture keeps Performance Testing separate from Automated Implementation Testing, Guided Progress Review, Unassisted Goal Testing, Human Experience Review, architecture and accessibility review, static-adapter proof, direct installed-product proof, release proof, and support promotion. One physical execution can contribute only when each authority and conclusion stays explicit.
- State boundary: repository records remain canonical. A Store receipt proves recording only. No Store table, daemon, retry loop, hidden write, runtime validator, CLI command, MCP command, or self-renewing budget was added.
- Compatibility boundary: the lifecycle text keeps first-use inventory conservative and does not execute, recertify, move, delete, or rewrite old assets by inference.
- Phase / capability status: integration complete; validation and independent review remain open.

## Stage 5 - Validate And Close P3

### Tasks

- [x] t28: Run focused documentation-contract, template, fixture, link, anchor, path-hygiene, PRD-authority regression, and affected tests without a platform/environment benchmark matrix.
- [x] t29: Retry only affected failed checks after a material correction, reuse unchanged valid evidence, and stop at the declared correction/review budget or diminishing return.
- [x] t30: Independently review the P3 diff for target copies, implicit budgets, outcome shopping, expiry loopholes, correctness trade-offs, cross-mode substitution, retroactive failure, and Store authority drift.
- [x] t31: Record exact changed files, validations, fixture coverage, remaining questions, risks, findings, waivers, obligations, budget consumption, phase-versus-capability status, and agent Human Experience Review of the real lifecycle resources.
- [x] t32: Hand off P4 as `blocked / not-authorized` and P5 as the next documentation-first phase unless the owner separately admits the validator.

### Acceptance criteria

- Focused validation and independent review pass within finite budgets.
- No real benchmark, arbitrary threshold, universal count, support promotion, or hidden state mutation occurred.
- Closeout distinguishes P3 task completion from open risks, findings, obligations, and W19 R2 capability status.
- P4 remains blocked absent separate owner admission; P5 can proceed with an explicit P4 disposition.

### Dependencies

- Stages 2 through 4 accepted.

### Closeout Notes

- Testing-mode decision(s): focused Automated Implementation Testing and agent Human Experience Review are required for closeout. Performance Testing of the implementation, Guided Progress Review, and Unassisted Goal Testing remain `not-needed-now` unless a current decision activates them. `O-###`, `NUAT-###`, and finding remain `none` unless execution creates an authority-backed reference.
- Changed files: eight upstream lifecycle resources/templates; their eight dogfood copies; one resource test file; one documentation fixture; and this phase record. The generated CLI template was rebuilt from upstream. The setup command used Codex method `mcp` and Claude Code method `none`. Unrelated harness configuration drift was removed from `.make-docs/config.yaml`.
- Validation: `npm run build` passed. The effective focused set passed 68 of 68 tests. After each material correction, only the affected template-link and performance-resource tests reran. The final affected set passed 27 of 27, and the unchanged 41 valid consistency and package-safety results were reused. `npm run validate:defaults` passed 53 of 53. After the branch advanced to current HEAD `95ccc0866662e8780d00f8f087aafecbb0a4329a`, PRD authority validation passed with 36 PRDs, 575 Markdown files, 196 structured files, 1,118 links, and no diagnostic. Scoped path hygiene checked 18 content files and passed with no finding. `git diff --check` passed. The full repository path-hygiene scan remains red because it finds 3,024 existing paths in W19 R5 retained evidence; those findings are outside this P3 change set.
- Projection evidence: automated byte checks passed for the eight upstream, generated CLI, and dogfood lifecycle files. Link and anchor checks passed. No product benchmark or performance execution ran.
- Budget: the owner authorized one additional bounded correction after the first independent review. Three of three correction attempts were used. The first replaced an invalid whole-link placeholder and bad template-relative links. The second completed the characterization-promotion, full-result, bidirectional-traceability, and first-adoption compatibility fixtures. The third changed the Human Experience Review conclusion to the contract term and refreshed current-HEAD validation evidence. Two of two independent review cycles were used. The first returned the two work-record findings and no other material finding. The second verified both corrections and passed with no new material finding.
- Questions, risks, findings, waivers, and obligations: no new question, risk, performance finding, waiver, `O-###`, or `NUAT-###` was created. The open PRD 03 risks keep their recorded status. Task completion does not close them.
- Human Experience Review: the promised goal is that a maintainer can see when performance evidence applies and can follow the next lifecycle link without treating it as universal work. The reviewed surfaces are the lifecycle and workflow references, coverage prompt, and design, plan, and work templates. Evidence is the real projected text plus passing link, template, parity, fixture, and default-resource tests. The review found short candidate tables at the decision points, a direct canonical contract route, separate proof-mode language, and explicit stop and gate fields. The conclusion is `satisfied` for the exact documentation goal within the recorded evidence and limits. The limit is that no human used a generated project and no real benchmark ran. The next action is the focused independent recheck, followed by P5 installed-package proof. Human feedback is optional and is not a gate.
- Independent review: the second and final review cycle passed. It verified current HEAD `95ccc0866662e8780d00f8f087aafecbb0a4329a`, the `satisfied` Human Experience conclusion, current PRD validation counts, owner-authorized correction budget, review history, and plain-language gate. It found no new material issue. The reviewer changed no files.
- Remaining gate: P3 is closed. The next action is a separate owner decision on staging and committing the reviewed P3 files. This record does not authorize either action.
- Phase / capability status: P3 is complete. P4 remains `blocked / not-authorized` and creates no deferred obligation. P5 is the next documentation-first phase. W19 R2 remains open through P5.
