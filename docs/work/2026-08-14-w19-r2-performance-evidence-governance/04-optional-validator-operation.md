---
title: "Phase 4: Dual-Path Performance Evidence Validation"
kind: "work"
status: "complete"
coordinate: "W19 R2 P4"
source:
  type: "prd"
  path: "docs/prd/48-performance-evidence-governance.md"
---

# Phase 4: Dual-Path Performance Evidence Validation

> **Phase status: CLOSED / VALIDATED DUAL-PATH OPERATION.** Decision commit `4b8b5956` records the admitted direction. The owner gave separate P4 implementation authority on 2026-09-17. The repository and packed implementation are complete. Independent review passed after one owner-authorized focused correction cycle and recheck. The stale Store receipt is separate follow-up work and a P5 confirmation item. Staging, commit, push, benchmark execution, publication, release, and support promotion remain outside this authority.

## Purpose

Implement the owner-admitted dual-path Performance Evidence validator. One read-only deterministic TypeScript core projects through CLI and MCP. One canonical agent method supports CLI-absent projects and judgment-only review. This record keeps implementation, review, staging, and commit gates separate.

## Overview

The deterministic operation may report only admitted structural and traceability facts. The agent method may review mapped structure and traceability and handle only catalog-marked judgment questions. Neither method may run benchmarks, choose targets, decide product authority, approve waivers, fulfill obligations, promote support, rewrite files, renew budgets, or loop on results.

P4 is now required before P5. The phase permits at most two materially distinct correction attempts and two review cycles after implementation authority. It consumes current PRD 49 and PRD 50 review and testing boundaries without adding a human-response gate.

## Source PRD Docs

- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 25 — TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — no deferred obligation is assigned at backlog generation.
- `NUAT-###: none` — no Unassisted Goal Test is assigned to a structural validator.
- `Finding: none` — no finding is assigned; validator output cannot close a finding by itself.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact branch, HEAD, worktree, free disk, dirty-state allowlist, and P2/P3 closeout. Entry used branch `make-docs-v2`, clean HEAD `a4a84e1f`, 123 GB free disk, P2 commit `f79ec885`, and P3 commit `b840b746`. No implementation write occurred.
- [x] t2: Reread current PRDs 25, 39, 48, and 03 plus the deterministic/agentic twin guide. Pre-edit SHA-256 digests were PRD 25 `038b8e86eb260220c264d297749f02cb1ddfe790c7686ac82488bbc644407174`, PRD 39 `a5d4918b6fcba87424a62cae01df37578b8e2474d85bd2b693dd51d319b9ca67`, PRD 48 `8ff466996e1da56714dbdc910e3a4e95933ca1fced29a8af8bad5c52aab32125`, PRD 03 `575823ba6ef617e5b1b3fc20417c82f30d83ae8630fbf270a7a9abdd83da10e8`, and the guide `32e58a23f01123f8a0332abf83eaf70870f7fa2063abbe242fdc7144f026bdbd`.
- [x] t3: Reevaluate the hard validator-admission question and R-025, R-029 through R-032, and R-034. Add R-035 for deterministic/agent drift, repeated cost, and proof substitution.
- [x] t4: Classify R-025, R-029 through R-032, R-034, and R-035 as `impacted-nonblocking`. The decision-only edits reconcile phase links, prevent target promotion, preserve finite budgets and repository authority, reject stale proof, keep proportional review, and add twin-parity controls.
- [x] t5: Record the owner's 2026-09-17 admission of the dual-path P4 direction. Keep implementation blocked until the authority commit and separate implementation authority exist.
- [x] t6: Reconcile PRDs 03, 25, 39, and 48 plus plan, work, P5, and history surfaces. Do not create a standalone decision file.
- [x] t7: The focused authority validation passed with 36 PRDs, 576 Markdown files, 196 structured files, 1,120 links, and no diagnostics. The separately authorized decision-only commit is `4b8b5956`. The owner gave separate P4 implementation authority on 2026-09-17. Phase-entry result: no blocker and no authority gap. Unlock t8 with at most two materially distinct correction attempts and two review cycles.

### Acceptance criteria

- P4 implementation remains blocked until explicit owner admission and separately committed current PRD authority both exist. Owner admission is complete.
- Current PRDs 25, 39, 48, and PRD 03 were reread and revisions or digests are recorded.
- R-025, R-029 through R-032, R-034, and R-035 have explicit phase classifications and rationales.
- After all admission items are classified and resolved, the phase-entry record states an explicit no-blocker/no-authority-gap result and the finite correction/review budget before t8 unlocks.
- No validator implementation, test, registry, CLI, MCP, or package write occurred before unlock.
- The owner decision is documented in canonical PRDs, the risk register, requirement history, plan, and work records. Validation passed, and decision commit `4b8b5956` is recorded here.
- No standalone decision file exists, and task completion cannot close a risk, finding, obligation, or capability.

### Dependencies

- P2 and P3 accepted.
- Owner admission decision: complete on 2026-09-17.
- Separately reconciled, validated, and committed PRDs 03, 25, 39, and 48: complete in `4b8b5956`.

### Closeout Notes

- Testing-mode decision(s): decision-only PRD and documentation validation applies now. Automated Implementation Testing remains locked until implementation authority. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. No Human Experience handoff is invented for an unimplemented surface.
- Human Experience Review: the promise is that a maintainer can tell what the owner admitted, what remains blocked, and what action comes next. Evidence is the P4 plan authority gate, the active backlog admission record and phase map, this Stage 1 record, and the P5 dependency. The documents state that the direction is admitted, implementation is not authorized, validation and a separate decision commit come next, and P5 waits for accepted P4. Conclusion: `satisfied` for the decision-only maintainer path. Limit: no CLI, MCP, or installed agent surface exists yet, so this review supports no implementation-use claim. Next action: finish focused validation and stop for separate staging and commit authority.
- Phase / capability status: direction admitted; decision-only authority committed; implementation authorized and active; t8 unlocked.

## Stage 2 - Implement The Rule Catalog, Deterministic Core, And Agent Method

### Tasks

- [x] t8: jcodemunch identified the operation registry, CLI adapter and renderer, derived MCP tools, resource tests, and package projection seams. The implementation modules are `packages/cli/src/operations/performance-evidence/catalog.ts`, `validator.ts`, `ops.ts`, and `index.ts`; the shared registry is `packages/cli/src/operations/registry.ts`; CLI projection and rendering are `packages/cli/src/run/cli.ts` and `render.ts`; MCP remains derived through `packages/cli/src/mcp/tools.ts` with no per-operation logic. Canonical agent instructions remain upstream in `packages/docs/template/.make-docs/system/contracts/performance-evidence-governance.md` and its explanatory reference. Generated `packages/cli/template/` and dogfood `.make-docs/system/` copies are projections only. Focused fixtures and tests live under `packages/cli/tests/fixtures/performance-evidence-validator/` and `packages/cli/tests/performance-evidence-validator.test.ts`. Supported project authority roots are Markdown under `docs/` and `.make-docs/archive/history/`. Access is `store: none`, `project: read`, and `hostConfig: none`. Missing or unreadable roots return `blocked`; symlinked or escaping paths return `refused`; structural defects return `failed`; only a clean result returns `passed` with `validator-passed`. One shared report carries catalog identity, candidates, profiles, diagnostics, fingerprint classifications, and explicit non-mutation and no-benchmark facts.
- [x] t9: Implemented catalog `make-docs.performance-evidence-validation-rules.v1` with 18 stable rule and diagnostic mappings. Every entry records its class, deterministic support, agent instruction, judgment need, focused tests, and parity or one-sided reason.
- [x] t10: Implemented one read-only TypeScript core. It inventories candidate language and validates admitted profile, owner, approval, expiry, budget, stop, outcome, trace, evidence-link, work-criterion, and fingerprint structure.
- [x] t11: Added stable `PERF-VAL-*` and `PERF-AGENT-*` diagnostics. The complete report carries reasons, next actions, catalog identity, typed status, and an honest proof state. Unsafe or unreadable authority fails closed before mutation.
- [x] t12: Added the canonical agent method and stable catalog to the upstream Performance Evidence Governance contract. Added a thin explanatory reference. Both dogfood files match upstream bytes.
- [x] t13: Kept both methods inside the admitted limits. The operation declares no Store or host access, writes no file, runs no benchmark, authorizes no retry, makes no owner decision, and certifies no adjacent proof mode.

### Acceptance criteria

- The two methods match the exact owner-admitted PRDs 25, 39, and 48 contract and no broader scope.
- The rule catalog maps every rule or records an explicit one-sided reason.
- One TypeScript core owns parsing, validation, and the complete structured result.
- Canonical installed instructions own the agent method and preserve repository authority.
- Unsafe or ambiguous inputs fail closed with stable diagnostics before mutation.
- Judgment boundaries are enforced as tested non-capabilities.
- Fingerprint reporting cannot authorize an execution or retry.
- No method certifies the other method or promotes its proof state into a performance outcome.
- No benchmark framework, universal profile library, arbitrary target, Store table, daemon, retry service, or self-replenishing budget is created.

### Dependencies

- Stage 1 unlocked with decision commit SHA recorded.

### Closeout Notes

- Testing-mode decision(s): focused Automated Implementation Testing for structural facts, catalog mapping, agent instructions, proof-state honesty, and non-capabilities; no benchmark execution.
- Phase / capability status: catalog, core, and agent method implemented. Registry, package, and parity work passed focused checks.

## Stage 3 - Project, Package, And Prove Both Validation Paths

### Tasks

- [x] t14: Activated `performance.evidence.validate` with exact read-only metadata, strict input, one handler, project-read access, typed output, and the admitted failure states. PRD 39 now records eight active and seventeen pending nonlegacy operations.
- [x] t15: Derived the CLI and MCP projections from the same result. Interactive CLI output leads with status and counts, then gives each diagnostic reason and next action. Non-interactive and `--json` output preserve the complete structured result.
- [x] t16: Rebuilt generated package resources from the upstream template. `smoke:pack:local -- --verify-dogfood` passed. It proved packed, installed, and dogfood router parity in a disposable project. The package includes the agent method and catalog anchors. It includes no project performance records as defaults.
- [x] t17: Added bounded fixtures for all admitted target classes and outcomes, identity and owner faults, budget and requalification faults, expiry, three fingerprint classes, broken and unsafe links, agent-only rules, proof states, and no-mutation behavior.
- [x] t18: Focused tests prove CLI/MCP result parity, complete diagnostics, fail-closed handling, installed fallback, mapped twin rules, honest proof state, and no retry or benchmark authority. The operation cannot update PRDs, approve waivers, close records, execute profiles, or change support.

### Acceptance criteria

- CLI and MCP project one operation core and preserve complete diagnostics.
- Packed installed resources contain the canonical agent method and its rule mappings.
- Registry metadata and permissions match the admitted read-only contract.
- Fixtures cover positive, negative, unsafe-path, expiry, rerun, outcome, proof-state, one-sided, absent-CLI, and judgment-boundary cases.
- No adapter, CLI renderer, or MCP tool contains separate business policy.
- Neither method can mutate authority or execution state, certify the other, or substitute for adjacent proof.

### Dependencies

- Stage 2 accepted.
- Admitted CLI/MCP scope in the decision commit.

### Closeout Notes

- Testing-mode decision(s): focused operation, registry, CLI/MCP, catalog, installed-resource, router, proof-state, twin-change, and unsafe-path tests.
- Phase / capability status: both validation paths, public adapters, package projection, and direct dogfood bytes are complete. Store-backed local discovery is not current because the Codex MCP receipt binds to the pre-P4 local CLI digest. Safe setup previews were not applied. Independent review and final closeout remain open.

## Stage 4 - Validate And Close Or Reblock P4

### Tasks

- [x] t19: Focused validation passed: CLI build; TypeScript no-emit check; PRD authority validation with 36 PRDs, 576 Markdown files, 196 structured files, 1,120 links, and no diagnostics; the original 51 focused P4 tests; 38 affected consistency tests; template-link and package-safety tests; packed local smoke with dogfood parity; byte parity; and `git diff --check`. After the focused correction cycle, all 23 validator tests and all 56 tests across the five affected files passed. The rebuilt validator passed on this repository after scanning 863 Markdown files and 279 candidates. It found no executable profile, returned 40 trace warnings and no errors, wrote nothing, ran no benchmark, and authorized no retry. Final closeout PRD authority validation passed with 36 PRDs, 591 Markdown files, 196 structured files, 1,181 links, and no diagnostic. The current whole-repository path check passed after scanning 815 files with no finding or I/O error.
- [x] t20: Used correction attempt 1 for real-path, fixture, parser, and projection-test issues found by the first focused run. Used correction attempt 2 to add admitted risk `R-035` to the fixed risk inventory test. Independent review found four false-pass defects. On 2026-09-18, the owner authorized one additional focused correction cycle for those four findings. That cycle changed only the validator and its focused test file. It added canonical-owner validation, strict single-run validation, per-criterion work trace checks outside embedded profiles, and invalid per-profile status for duplicate identities. The owner-authorized additional correction cycle is used.
- [x] t21: Independent review task `01a0b475-9d20-7181-bff0-7f16ae0ea702` reviewed the exact 21-file diff. Review cycle 1 failed on four findings. Review cycle 2 performed a read-only focused recheck after the authorized corrections. It found no remaining or new material finding and passed t21. It confirmed no scope creep, judgment automation, mutation, benchmark execution, incomplete diagnostics, rule drift, CLI/MCP difference, missing installed fallback, false cross-certification, hidden retry, or target-authority promotion.
- [x] t22: The exact changed files are `.make-docs/system/contracts/performance-evidence-governance.md`, `.make-docs/system/references/performance-evidence.md`, `docs/prd/39-cli-command-model-and-operation-registry.md`, `docs/prd/48-performance-evidence-governance.md`, this work record, `packages/cli/src/operations/registry.ts`, `packages/cli/src/run/cli.ts`, `packages/cli/src/run/render.ts`, `packages/cli/src/operations/performance-evidence/catalog.ts`, `packages/cli/src/operations/performance-evidence/index.ts`, `packages/cli/src/operations/performance-evidence/ops.ts`, `packages/cli/src/operations/performance-evidence/validator.ts`, `packages/cli/tests/consistency.test.ts`, `packages/cli/tests/mcp-derivation.test.ts`, `packages/cli/tests/operation-domains.test.ts`, `packages/cli/tests/performance-evidence-resources.test.ts`, `packages/cli/tests/registry-contract.test.ts`, `packages/cli/tests/fixtures/performance-evidence-validator/profile.md`, `packages/cli/tests/performance-evidence-validator.test.ts`, `packages/docs/template/.make-docs/system/contracts/performance-evidence-governance.md`, and `packages/docs/template/.make-docs/system/references/performance-evidence.md`. Decision commit: `4b8b5956`. Remaining risks R-025, R-029 through R-032, R-034, and R-035 remain `impacted-nonblocking` within their recorded controls. Finding, `O-###`, and `NUAT-###` remain `none`. The two original correction attempts and the one owner-authorized additional focused cycle are used. Both review cycles are used. Disposition: `validated dual-path operation`.

### Acceptance criteria

- Focused tests and independent review pass within the admitted and finite scope.
- The deterministic operation remains read-only, complete, and non-judgmental. The agent method stays within the catalog-marked judgment boundary.
- The rule catalog, CLI/MCP result, installed agent method, and proof states remain consistent without cross-certification.
- No benchmark was run and no product target, waiver, obligation, result, or support claim changed.
- Closeout preserves open risks and distinguishes P4 task status from W19 R2 capability status.
- Any unresolved authority or safety issue reblocks the phase rather than broadening scope.

### Dependencies

- Stages 2 and 3 accepted.

### Closeout Notes

- Testing-mode decision(s): focused Automated Implementation Testing and agent Human Experience Review apply only after admission and implementation. Performance Testing, Guided Progress Review, and Unassisted Goal Testing remain `not-needed-now` unless a current decision activates them. `O-###`, `NUAT-###`, and finding remain `none` unless authority-backed records are created separately.
- Human Experience Review: the promised surface is a maintainer-facing validation result that states the result first, explains each problem, and states the limits. Evidence is the interactive CLI output for a missing authority root, the complete JSON output, the repository validation result, the canonical agent instructions, the four failure-revealing regression cases, and the independent focused recheck. Observation: the interactive output starts with `failed`, gives profile, candidate, and diagnostic counts, names the applicable diagnostic, explains why the input failed, gives the exact next action, and ends with the no-benchmark, no-write, and no-retry limits. The repository result reports `passed` with 40 warnings and no errors without turning warnings into a performance outcome. The corrected validator now rejects the reviewed false-pass cases for owner authority, hidden retry language, unlinked criteria, and duplicate identity summaries. Conclusion: `satisfied` for the implemented agent-facing and maintainer-facing result. Limit: this was an agent review of code, tests, terminal behavior, documents, and package evidence. It is not a lived human-use study, performance result, current Store receipt, release proof, or support approval. Next action: maintainer feedback after normal use is optional and is not a completion gate.
- Store and setup limit: the stale Codex MCP receipt is tracked by a separate repair task. It is not a P4 blocker. Direct dogfood file projection changed only the two reviewed resource files and has byte parity. Packed-package proof and installed fallback passed. P5 must confirm current local and installed discovery after the separate receipt repair. No Store or machine file changed in P4.
- Phase / capability status: repository implementation, package proof, independent review, and Human Experience Review are complete within the stated limits. P4 disposition is `validated dual-path operation`. This does not prove a performance outcome, installed-harness receipt, release readiness, or support scope. Staging and commit need separate owner authority.
