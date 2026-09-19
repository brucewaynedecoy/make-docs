---
title: "Phase 5: Packaging, Validation, and Closeout"
kind: "work"
status: "complete"
coordinate: "W19 R2 P5"
source:
  type: "prd"
  path: "docs/prd/48-performance-evidence-governance.md"
---

# Phase 5: Packaging, Validation, and Closeout

## Purpose

Assemble the authorized documentation-first W19 R2 outputs, prove upstream, package, dogfood, and installed integrity, run validation proportional to changed surfaces, and prepare the bounded agent closeout without executing benchmarks, promoting support, publishing, releasing, or deploying.

## Overview

P5 requires accepted and separately committed P2, P3, and P4. P4 includes the deterministic CLI/MCP operation, installed agent method, stable rule catalog, distinct proof states, focused review, and package assets. P5 permits at most two materially distinct correction attempts and two review cycles, reuses materially unchanged evidence, and reruns only failed affected checks after change.

## Source PRD Docs

- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 10 — Packaging Validation and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 16 — Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 25 — TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 28 — Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Unassisted Goal Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — no deferred obligation is assigned at backlog generation; closeout must name any real later reference explicitly.
- `NUAT-###: none` — no Unassisted Goal Test is assigned; package proof is not an Unassisted Goal Test.
- `Finding: none` — no finding is assigned; task completion cannot close a later finding.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact branch, HEAD, worktree, free disk, dirty-state allowlist, and accepted P2, P3, and P4 closeouts and commits; stop on unexpected user work or unsafe growth.
- [x] t2: Reread the current normative bodies of PRDs 06, 10, 14, 16, 18, 25, 28, 38, 39, 45, 46, 48, 49, and 50 plus PRD 03, and record each current revision or content digest.
- [x] t3: Reevaluate at minimum Q-017 only if this phase changes layout behavior, closed R-003 as a package-resolution regression guard, R-017, R-021 only if static-adapter or support claims are touched, closed R-022 as a direct-proof regression guard, and R-029 through R-035; add newly relevant items from the live reread.
- [x] t4: For every relevant `Open`, `Confirming`, `Deferred`, or closed regression item, record its ID, authority revision or digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [x] t5: If no blocking item or authority gap remains, record an explicit no-blocker result and finite phase correction/review budget before unlocking t8.
- [x] t6: If a blocker or authority gap exists, stop before implementation writes and present an owner decision package with the source anchor, affected phase/PRDs, bounded options/trade-offs, recommendation, consequences, exact PRD/register/history changes, validation, and decision-only commit boundary; do not create a standalone decision file.
- [x] t7: After an owner decision, require canonical PRD/register/history updates, focused validation, a separate decision-only commit, and the recorded decision commit SHA before marking this gate unlocked.

### Acceptance criteria

- Current owning PRDs and PRD 03 were reread and revisions or digests are recorded.
- Q-017 and R-021 are classified unrelated unless layout behavior or static-adapter or support scope is affected. R-022 is a closed direct-proof regression guard.
- R-003 remains closed and is used only as a package-resolution regression check.
- The gate records either an explicit no-blocker result or a complete owner decision package.
- No implementation write occurred before unlock, and any blocking decision was validated and separately committed.
- No task completion closes a question, risk, finding, waiver, deferred obligation, or capability.

### Dependencies

- P2 and P3 accepted and committed.
- P4 accepted and committed with its exact validation limits.

### Closeout Notes

- Testing-mode decision(s): phase-entry authority and regression review. Focused Automated Implementation Testing is selected for changed files. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now` unless a current decision activates them. Agent Human Experience Review applies to the shipped and installed maintainer-facing result.
- Entry state: branch `make-docs-v2`; HEAD `d868bdc56c191d81942d941eedd877034a95fe4d`; worktree clean; dirty-file allowlist empty; 118 GB free. P2 commit `f79ec885`, P3 commit `b840b746`, and P4 commit `d868bdc5` are present and separate.
- Current authority digests: PRD 03 `419900e06e1bb63628feca85016cd1344bbeba0b`; PRD 06 `0a9ad0c0ef6d47748e5ce94e9b224f086d22f85a`; PRD 10 `d34c901ecfbc2f17661614e47c13da17af3e5251`; PRD 14 `e8e2dc65137a7752a869033259ffb734772e352e`; PRD 16 `cf8a657cc0f6e98dfea09d50ff1ce9e1b359fe44`; PRD 18 `adf1352a37d47baf76ad805631a6653fa05ff09d`; PRD 25 `0d5722d04a2cd8754cecd15900664fea20c80a30`; PRD 28 `ed4ba3a2c1361d7d96ee0fd9557909dc297684ba`; PRD 38 `d1a421ecbe8cdae173b0d8f56f0cc461963008fb`; PRD 39 `01c76e9e161d641c90318a2ec80c2a1f5b1bc6c6`; PRD 45 `db6313ca2afee45e0df25881b9474d6c12f9d6f9`; PRD 46 `9cab59c4c770954a7632f7d600d099bd9ad4d27d`; PRD 48 `3f8f3500c0fc4b934bd1d87f7463d28e3c1d6313`; PRD 49 `bb110e20fcafaf26ce24fc9cd8e1d939ebf3efc3`; PRD 50 `d1e76225ce920ccd689c87ad353bc11c615fffd5`.
- Risk result: Q-017 is `unrelated` because P5 changes no layout behavior. R-003 and R-022 are `closed-regression-check` items for packed resolution and direct proof. R-017, R-021, R-029, R-030, R-031, R-032, R-034, and R-035 are `impacted-nonblocking` checks for canonical resources, exact installed claims, supported targets, finite work, single authority, current comparable evidence, proportionate testing, and twin parity. R-033 is a `closed-regression-check` for review of the real human-facing result. The entry reread found no new relevant question, risk, or authority gap. Review cycle 1 later found that PRD 39 described a stale registry count. The owner approved the final correction attempt. Current PRD 39 now matches the active registry, and PRD authority validation passes.
- Disposition: no blocker exists. P5 is unlocked at t8. P5 permits at most two materially distinct correction attempts and two review cycles. It reuses unchanged valid evidence and reruns only failed affected checks after a material change. t6 and t7 were evaluated but were not activated because no owner decision was required.
- Phase / capability status: Stage 1 accepted and P5 active; gate completion alone does not complete P5.

## Stage 2 - Prove Upstream, Package, Dogfood, And Installed Resolution

### Tasks

- [x] t8: Inventory exact authorized W19 R2 source resources, router pairs, lifecycle touchpoints, fixtures, generated copies, P4 deterministic operation, rule catalog, agent instructions, and package assets; reject unexpected surfaces.
- [x] t9: Prove `packages/docs/template/ -> generated packages/cli/template/ -> selected root dogfood -> installed-project proof` in that order, with generated copies never hand-edited.
- [x] t10: Verify all four peer URIs resolve to intended upstream bytes through optional project-local projection and machine-installed fallback, without requiring a full local snapshot.
- [x] t11: Verify router pairs are byte-consistent where required, remain thin, and point to canonical contract/prompt/reference/template authority rather than duplicating policy.
- [x] t12: Verify project-authored PRDs, `PERF-###` profiles, results, work, findings, waivers, obligations, history, and evidence do not enter shipped defaults or generated package assets.
- [x] t13: Prove package, release, static-adapter, direct installed-product, Unassisted Goal Testing, Human Experience Review, and support authorities remain independent; package proof and Store receipts cannot promote a performance outcome or support claim.
- [x] t14: Prove the exact admitted P4 projection only: one deterministic core through CLI/MCP, one stable catalog, one installed agent method, distinct proof states, and no benchmark, hidden write, retry service, Store schema, project record, or support-claim expansion.

### Acceptance criteria

- Every shipped governance byte derives from the upstream template source.
- Four peer resource types resolve through the accepted W19 R1 precedence model.
- Thin routers and generated copies do not become product or performance authority.
- Project-specific profiles/evidence remain project content and never ship as defaults.
- P4 package delivery matches the admitted scope and contains no inferred capability.
- Package proof makes no release, static-adapter, direct installed-product, support, or performance claim.

### Dependencies

- Stage 1 unlocked.
- P2 and P3 closeout evidence.
- Explicit P4 disposition.

### Closeout Notes

- Testing-mode decision(s): source/projection parity, installed-resource resolution, package-boundary, and router checks; no product benchmark.
- Projection evidence: `node scripts/copy-template-to-cli.mjs` rebuilt generated CLI content only from `packages/docs/template/`. SHA-256 comparison then proved byte parity across upstream, generated, and dogfood copies. The contract digest is `bbf11716947bc033aaa7957f51553cf9277bf0e70004a069d4d7ff0e4fb3318c`; prompt digest is `b4700c6f04615b75eb4deee804a88ead377da276013913c3f2543ebede259196`; reference digest is `78098335723282d0207a9d4175ad31744b0948c7a832e079ff34b5db05e192ab`; and template digest is `e67bdf7cb4cee44d170b032bb79fb04ca290f64c7cf053dff5f9516964538cec`.
- Package evidence: `npm run build` passed. `npm run smoke:pack:local -- --verify-dogfood` passed. It packed the package, installed it in a disposable project, checked upstream/generated/dogfood/packed bytes, checked Store-free installed reads, kept project records out of defaults, and ran no benchmark. The package includes the admitted P4 operation and agent method without a Store table, writer, benchmark runner, retry service, or support claim.
- Resolution evidence: direct installed reads passed for all four URIs. Each installed-machine digest matches the upstream digest above. The live optional local projection returns `resource-not-found` from the Store-free project view, so installed-machine fallback is the current selected path. On 2026-09-18, the owner confirmed that the separate Codex MCP receipt repair is follow-up work and is not a P5 or W19 R2 closeout gate. No Store or machine setting changed in P5.
- Router and authority evidence: `bash scripts/check-instruction-routers.sh` passed. The resource and lifecycle tests passed in the CLI suite. The contract remains the detailed policy source. Routers remain short. Package proof and Store receipts do not promote an outcome, release state, or support scope.
- Phase / capability status: Stage 2 is accepted. Package integrity and installed fallback are proven. The optional local projection remains unavailable and is recorded as a non-blocking external limit.

## Stage 3 - Run Proportional Validation

### Tasks

- [x] t15: Run PRD-authority validation as a regression check and verify backlog traceability points to current normative PRDs rather than plan prose or requirement history.
- [x] t16: Run focused contract, prompt, reference, template, URI, frontmatter, relative-link, anchor, managed-block, router-pair, and path-hygiene validation.
- [x] t17: Run representative lifecycle fixtures covering target classes, characterization-before-promotion, versioned profiles, finite budgets, unchanged reuse, affected-only reruns, diminishing returns, normalized outcomes, expiry, singular requalification, waivers, gates, compatibility, and cross-mode separation.
- [x] t18: Run local and packed-template resolution checks sufficient to preserve closed R-003, and only the broader package/implementation suites required by the actual changed surfaces.
- [x] t19: Run P4 focused operation, registry, rule-catalog, CLI/MCP, installed-agent, one-sided-rule, twin-change, proof-state, unsafe-path, package, and non-capability tests.
- [x] t20: Run whitespace and exact-diff hygiene; confirm the worktree contains only authorized design, plan, PRD, work, resource, implementation, test, and generated-copy changes.
- [x] t21: Retry only affected failed checks after a material correction, reuse unchanged valid evidence, and stop at budget exhaustion, diminishing return, unsafe resource growth, or conflicting authority.
- [x] t22: Independently review the complete W19 R2 implementation diff for duplicated authority, unsupported targets, hidden defaults, unbounded reruns, expiry loopholes, correctness trade-offs, rule drift, false cross-certification, cross-mode substitution, support promotion, and scope expansion.

### Acceptance criteria

- All focused checks required by changed surfaces pass within finite budgets.
- Validation proves both development-template and packed-template resolution without unnecessary full-suite repetition.
- Fixtures cover accepted governance semantics without executing real benchmarks.
- No arbitrary universal threshold, sample count, environment matrix, statistical recipe, or benchmark framework exists.
- The diff contains only authorized changes, and independent review has no unresolved material finding.

### Dependencies

- Stage 2 accepted.

### Closeout Notes

- Testing-mode decision(s): focused Automated Implementation Testing and independent review; no real benchmark or support qualification. Agent Human Experience Review remains for final closeout.
- Passed checks: PRD authority validation passed with 36 PRDs, 591 Markdown files, 196 structured files, 1,181 links, and no diagnostic. Path hygiene passed with 815 checked files and no finding or I/O error. The corrected performance validator passed with catalog version 1, 18 rules, 863 Markdown files, 287 candidates, 40 trace warnings, no error, no mutation, no benchmark, and no retry authority. TypeScript no-emit, router checks, all 13 smoke-harness tests, build, packed local smoke, and `git diff --check` passed.
- Reused suite evidence: the full CLI suite passed 82 test files and 1,320 tests before it reached two stale inventory expectations. All other tests passed, and 1 file and 5 tests remained intentionally skipped. The first bounded correction added the admitted P4 MCP tool to the exact tool inventory and kept it separate from the 24 W19 R1 P3 operation IDs. The required affected-only rerun then passed both files and all 14 tests. Unchanged passing results were not repeated.
- Coverage evidence: the suite passed all 20 CLI-projected prompt checks, 16 performance resource tests, 27 corrected performance validator tests, 12 template-link tests, 38 consistency tests, 6 MCP derivation tests, 7 registry contract tests, and 4 operation-domain tests. Fixtures cover each target class, all five outcomes, finite budgets, reuse, affected-only reruns, expiry, singular requalification, waivers, compatibility, proof separation, symbolic authority-root refusal, complete profile fields, required-field `none` refusal, valid archived version history, unsafe paths, and non-capabilities. No real performance benchmark ran.
- Independent review status: task `01a0b4b4-1e12-7cd0-95ee-51f2305c398a` completed two read-only review cycles. Cycle 1 found six material issues. The owner approved the final correction attempt. The correction refuses symbolic authority roots, validates the complete canonical profile, refuses `none` in required fields, reconciles PRD 39 with the active registry, permits archived prior profile versions, and records the receipt repair as separate non-blocking work. Cycle 2 passed t22 with no remaining material finding. The reviewer made no change.
- Confirmed limits: the reviewer found no benchmark runner, project writer, retry service, Store schema, arbitrary shipped threshold, package leakage of project records, cross-mode certification, or support-claim promotion.
- Budget status: both material correction attempts and both review cycles are used. No further correction or review is authorized under this phase budget.
- Phase / capability status: Stage 3 is accepted. The final correction, affected validation, and independent review pass within the stated limits.

## Stage 4 - Prepare The Bounded Closeout And Optional Handoff

### Tasks

- [x] t23: Record exact branch, HEAD, worktree, dirty state, changed files, generated copies, free disk, and phase correction/review budget consumption.
- [x] t24: Summarize target-class authority, resource identities, lifecycle and gate integration, evidence and requalification semantics, compatibility and state boundaries, P4 rule-catalog coverage, proof states, and validation limits.
- [x] t25: Report validation commands and results, reused evidence, bounded waivers, unresolved questions, open risks, findings, deferred obligations, and exact supported scope without closing any item by inference.
- [x] t26: Prove no benchmark execution, support promotion, publication, release, deployment, or unauthorized Store/product mutation occurred.
- [x] t27: Distinguish each phase's task status from overall W19 R2 capability status. Apply agent Human Experience Review to each accepted promise and record the evidence, observation, conclusion, limit, and next action. Name any separately required decision, remediation, commit, publication, or release gate.
- [x] t28: Present the bounded closeout and a short optional experience handoff. Do not require a human response unless an explicit acceptance gate applies. Stop before staging, commit, push, publication, release, deployment, benchmark execution, or support promotion without separate authorization.

### Acceptance criteria

- The closeout package is exact, evidence-backed, and clear to a maintainer.
- Every unresolved item retains its canonical ID, status, owner, and next gate.
- Phase completion does not close findings, risks, waivers, obligations, or capability authority by implication.
- No later lifecycle action is treated as authorized.
- A maintainer can distinguish documentation-first policy, deterministic validation, agent review, combined proof state, phase completion, commit, release, benchmark, and support gates.

### Dependencies

- Stages 2 and 3 accepted.

### Closeout Notes

- Testing-mode decision(s): all required focused Automated Implementation Testing, independent review, and agent Human Experience Review are recorded. Performance Testing, Guided Progress Review, and Unassisted Goal Testing remain `not-needed-now` unless a current decision activates them. `O-###`, `NUAT-###`, and finding remain `none` unless real authority-backed references are created.
- Final state: branch `make-docs-v2`; HEAD `d868bdc56c191d81942d941eedd877034a95fe4d`; nine reviewed dirty files; 117 GB free. The changed files are PRD 39; the W19 R2 index, P4 record, and P5 record; the performance catalog and validator; and three focused CLI tests. Generated template copies have no new unreviewed delta. Stage 2 records upstream, generated, dogfood, packed, and installed parity. Both correction attempts and both review cycles are used.
- Delivered scope: PRDs alone own hard product targets. Approved finite plan or work profiles can own engineering guardrails, characterization, and experiments. Deferred or unsupported candidates do not execute. The four stable resource URIs cover one detailed contract, one prompt, one reference, and one profile template. Lifecycle records use the two-part candidate decision, one canonical versioned `PERF-###` profile per executable candidate, finite execution packets, the five outcomes, expiry, waivers, and one authorized unchanged requalification. Gates require current, comparable, same-mode evidence. Repository records remain authoritative. No Store table or default project record was added.
- Validation scope: the 18-rule catalog maps one read-only TypeScript core to CLI and MCP and maps the installed agent method to judgment-only checks. `validator-passed`, `agent-reviewed`, and `combined` remain distinct proof states. None changes a performance outcome, target, waiver, obligation, phase gate, installed-product claim, release claim, or support claim. Automated checks, packed installation, and review passed. No real benchmark ran.
- Evidence and limits: PRD authority, TypeScript, focused resources, validator, registry, MCP, consistency, router, path-hygiene, smoke-harness, build, packed installation, and diff-hygiene checks passed. Unchanged valid evidence was reused after each bounded correction. There is no W19 R2 waiver, open question, finding, or deferred obligation. Existing risk dispositions remain as recorded and were not closed by inference. The optional local projection still returns `resource-not-found`; installed fallback passes, and the separate receipt repair is not a P5 or W19 R2 gate.
- Human Experience Review — decide whether evidence is useful: evidence is the shipped prompt, contract, reference, and profile plus resource tests. Observation: the prompt asks for applicability before profile detail, and the profile has no sample target. Conclusion: a maintainer can stop an unsupported candidate without inventing a target. Limit: the agent does not decide product applicability. Next action: use the owning PRD or approved plan/work authority when a candidate is executable.
- Human Experience Review — understand the evidence state: evidence is the canonical profile, packet, result, finding, waiver, expiry, and requalification guidance plus fixtures. Observation: owner, target class, budget, stop, outcome, and next action remain visible and linked. Conclusion: a maintainer can understand the bounded state without reading Store data. Limit: the repository must contain the required records. Next action: correct the named missing record when validation reports a gap.
- Human Experience Review — choose a validation path: evidence is the shared CLI/MCP result, installed agent method, rule catalog, and proof-state contract. Observation: deterministic output gives reasons and next actions, while agent review states its evidence and limits. Conclusion: a maintainer can use either available path without treating it as a benchmark result or as proof that the other path ran. Limit: judgment-only decisions stay with named owners. Next action: request the missing proof path only when current authority requires it.
- Human Experience Review — avoid repeated work and hidden gates: evidence is finite budget, reuse, affected-only rerun, expiry, and closeout behavior. Observation: the work reused passing evidence, reran only affected checks, stopped after two corrections and two reviews, and did not require optional human feedback or the receipt repair. Conclusion: the closeout does not ask a person to repeat automated proof or approve the report by default. Limit: later staging, commit, publication, release, benchmark, and support actions remain separate. Next action: obtain explicit authority before any such action.
- Phase / capability status: P1 through P5 are complete. W19 R2 delivers documentation-first performance-evidence governance and the bounded read-only validator within the recorded scope. It does not deliver a benchmark platform, performance result, release, or support claim. Optional maintainer feedback can improve later work but does not block this closeout.
- Gate: staging and the P5 commit need separate owner authority. Push, publication, release, deployment, benchmark execution, support promotion, and the separate receipt repair are not authorized by this closeout.
