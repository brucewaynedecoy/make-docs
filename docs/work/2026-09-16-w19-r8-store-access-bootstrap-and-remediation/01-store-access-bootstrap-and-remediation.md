---
title: "W19 R8 P1 — Store Access Bootstrap and Remediation"
kind: "work"
status: "completed"
coordinate: "W19 R8 P1"
source:
  type: "plan"
  path: "docs/plans/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/01-store-access-bootstrap-and-remediation.md"
---

# Phase 1: Store Access Bootstrap and Remediation

## Purpose

Repair the closed setup and Store-access loop in one phase. Preserve strict Store and harness safety while making setup, upgrade, recovery, Store-free work, mid-task access, and generic MCP reachable.

## Overview

This phase owns the open W19 R7 correction and the wider W19 R8 defect. Five ordered stages produce the accepted replacement package candidate. No stage is a release point. Stage 5 records the Codex TOML array-table correction found by live W19 R2 use.

The phase does not require Make Docs Store or MCP access to start or continue. Those surfaces are test subjects. The agent uses repository authority, direct package commands, temporary homes, temporary Store roots, and isolated projects.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact through HX-1 to HX-8 in the [design](../../designs/2026-09-16-store-access-bootstrap-and-remediation.md).
- Intended human outcome: A person can complete or recover setup through one valid path. An agent can continue Store-free work and can add Store access without abandoning an active task.
- Human-facing surface or indirect effect: Interactive setup, non-interactive setup, setup status and errors, CLI JSON, MCP results, agent guidance, generic MCP help, and upgrade recovery.
- Implementation work: Executable trust, setup subplans, typed Store state, agent continuation, generic MCP, W19 R7 recovery, and exact package proof.
- Evidence source or testing type selected under current authority: Automated implementation testing, installed transcript review, isolated upgrade matrix, and agent Human Experience Review.
- Executor: Authorized implementation agent or delegated runtime and validation workers.
- Accepted obligation or deferral route: None. The result is required inside P1.

See [PRDs 07](../../prd/07-cli-command-surface-and-lifecycle.md), [08](../../prd/08-skills-catalog-and-distribution.md), [10](../../prd/10-packaging-validation-and-release-reference.md), [18](../../prd/18-compatibility-classification-and-migration-safety.md), [25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [28](../../prd/28-shared-agentics-installation-and-harness-exposure.md), [38](../../prd/38-global-store-and-project-state.md), [39](../../prd/39-cli-command-model-and-operation-registry.md), and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Remediation Execution Rule

Store access, MCP access, harness receipts, Store-backed lifecycle state, and successful `make-docs setup` are not prerequisites for this phase.

A missing or unreachable Store is expected evidence. It must not block code work, tests, package construction, isolated-home proof, or review. The agent must not ask the user to repair the broken product first. The agent must not create a project-local fallback, direct Store write, false success, or queued write.

If a Store-backed verification case fails, record the failure and continue every independent case. Keep the phase open until the defect is fixed and the exact candidate passes.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | `satisfied` | All W19 R8 focused, fault-injection, and exact installed-package cases pass. The owner accepted `W19-R8-GATE-EXCEPTION-1` for repository-wide failures that cover only the separate Performance Evidence projection work. |
| Performance Testing | `not-needed-now` | The correction changes control flow and access behavior. No current latency or resource-budget decision depends on a performance result. |
| Guided Progress Review | `activated` | The validation owner reviews real terminal and agent transcripts. This review is not a human acceptance gate. |
| Unassisted Goal Testing | `not-needed-now` | The current decisions can be made from deterministic installed scenarios and agent review. No new `NUAT-###` authority is needed. |

Human Experience Review is separate. The validation owner must inspect the real packed result and record evidence, observations, conclusions, limits, and next actions for HX-1 through HX-8. A short optional owner handoff can follow. No response is required for phase closure.

## Source PRD Docs

- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- Obligations: none.
- Unassisted Goal Testing scenarios: `not-needed-now`.
- Findings: D-034, D-035, and D-038.

## Stage 1 - Reachable Setup and Package Identity

### Tasks

- [x] t1: Recheck the active worktree, current source, installed launcher, and package manifest. Record the launch path, resolved path, package root, bin path, and current verifier result without changing the real Store or project.
- [x] t2: Refactor executable verification to accept only a safely resolved link to the exact declared package bin. Preserve wrapper, runner, escaping-link, file-type, executable-mode, package-root, version, and fingerprint checks.
- [x] t3: Replace swallowed verification errors with stable codes, safe detail, checked launch and resolved paths, failed rule, and one action that can change the result.
- [x] t4: Make support rendering classify a method only after all plan prerequisites pass. Prevent one method from appearing as both available and blocked in the same review.
- [x] t5: Split full setup into independent machine, project, Skills, and resource subplan results. Apply and verify machine work first. Preserve that result when a later subplan blocks.
- [x] t6: Validate existing-install Skill changes before final review. Reuse the shared W19 R7 Skills interaction and route an unsupported change without discarding independent setup.

### Acceptance criteria

- A1: A normal package-manager `make-docs` link resolves to the exact declared package bin and passes verification.
- A2: Broken, escaping, wrapper, runner, mismatched, non-file, and non-executable launch cases remain blocked with stable, distinct reasons.
- A3: Every shown method has one consistent state. A method with a known failed prerequisite is not labeled available.
- A4: A blocked project, Skill, or resource subplan does not roll back, hide, or repeat a verified machine subplan.
- A5: Full setup does not collect a Skill change and reject it only after the complete interview.

### Dependencies

- Explicit implementation authority.
- Current PRDs 07, 08, 10, 25, 28, 38, and 39.
- No Store or MCP prerequisite.

### Closeout Notes

- Four testing decisions: Automated activated; Performance not-needed-now; Guided Progress Review activated; Unassisted Goal Testing not-needed-now.
- Human Experience Review: Record HX-1 and HX-2 evidence, observations, conclusions, reviewer, and limits in `evidence.md`.
- Optional experience handoff: Not yet. Use the final packed candidate.
- Explicit human acceptance gate: None.
- Evidence report: Add A1 through A5 results to `evidence.md`.
- Phase / capability status: P1 remains open. No partial release claim.

## Stage 2 - Scoped Store State and Agent Continuation

### Tasks

- [x] t7: Define shared typed access results for `store-not-configured`, `store-unavailable`, `store-unsafe`, and `store-denied`. Keep exact machine, project, method, receipt, and Store evidence in safe detail.
- [x] t8: Prove the operation runner does not open or create the Store for `access.store: none`. Preserve Store-free resource and repository behavior without harness setup.
- [x] t9: Limit a Store access failure to the requested Store-backed operation. Preserve independent task progress and return one exact setup or recovery action when one exists.
- [x] t10: Update shipped agent guidance and active remediation instructions. State that no Store configuration is valid, Store failure is scoped, and W19 R8 remediation cannot depend on Store or MCP access.
- [x] t11: Add human, JSON, MCP, and agent-output parity tests for all four Store access states and for the absence of a false task-wide blocker.

### Acceptance criteria

- A6: A project with no Store or harness intent returns `store-not-configured`, not unsafe, unavailable, or denied.
- A7: Every `store: none` operation completes without a Store open, Store creation, session, receipt, or harness requirement.
- A8: Each Store-backed failure stops only that operation and states the exact scope and one useful next action when available.
- A9: Agent guidance continues all independent Store-free work and never tells a remediation agent to repair setup before doing the repair.
- A10: Human, JSON, MCP, and agent results preserve the same state, reason, affected operation, and safe action.

### Dependencies

- Stage 1 shared result structure where required.
- Current PRDs 25, 38, and 39.

### Closeout Notes

- Four testing decisions: Automated activated; Performance not-needed-now; Guided Progress Review activated; Unassisted Goal Testing not-needed-now.
- Human Experience Review: Record HX-4, HX-5, and HX-8 evidence, observations, conclusions, reviewer, and limits in `evidence.md`.
- Optional experience handoff: Not yet. Use the final packed candidate.
- Explicit human acceptance gate: None.
- Evidence report: Add A6 through A10 results to `evidence.md`.
- Phase / capability status: P1 remains open. Store absence is evidence, not a blocker.

## Stage 3 - Mid-Task Access, Generic MCP, and Recovery

### Tasks

- [x] t12: Add a focused access-status refresh and one-operation retry path for an active agent task. Preserve prior task context and independent results.
- [x] t13: Add interactive and non-interactive generic MCP profile setup with a validated stable client label, reviewed machine ceiling, separate project intent, bounded identity proof, and standard configuration output.
- [x] t14: Add generic MCP help that an unsupported harness agent can reach after `store-not-configured` or on direct request. Do not edit unknown client configuration.
- [x] t15: Add repeat, drift, rotation, repair, and removal behavior for generic MCP. Preserve unknown client files and keep normal status output free of secret proof.
- [x] t16: Complete the W19 R7 shared Skills interview, pre-question pending-state admission, plan-aware action selection, safe no-effect rollback, and retained failure detail.
- [x] t17: Preserve completed machine and project subplan results across interruption, process restart, retry, and later Store access refresh.

### Acceptance criteria

- A11: An agent that reaches an unconfigured Store operation shows one exact setup action, continues independent work, refreshes after setup, and retries only the affected operation.
- A12: Generic MCP setup produces a standard usable configuration object and reviewed access ceiling without editing unknown client files.
- A13: Generic client identity cannot be granted by a caller-controlled label or environment value alone.
- A14: Generic MCP repeat, drift, rotation, repair, removal, and project-access changes are reviewed, bounded, and safe to run again.
- A15: Incomplete plans never offer resume. A proved zero-step rollback changes no project file or installation ledger. Complete partial plans remain recoverable.
- A16: Failure detail survives restart and matches human, JSON, MCP, setup, status, and recovery results.
- A17: Completed independent subplans remain current after later failure or access refresh.

### Dependencies

- Stages 1 and 2.
- Current PRDs 08, 18, 25, 28, 38, and 39.
- If bounded generic proof cannot fit current Store records, stop only for the required schema choice. Do not weaken identity.

### Closeout Notes

- Four testing decisions: Automated activated; Performance not-needed-now; Guided Progress Review activated; Unassisted Goal Testing not-needed-now.
- Human Experience Review: Record HX-3, HX-6, and HX-7 evidence, observations, conclusions, reviewer, and limits in `evidence.md`.
- Optional experience handoff: Not yet. Use the final packed candidate.
- Explicit human acceptance gate: None.
- Evidence report: Add A11 through A17 results to `evidence.md`.
- Phase / capability status: P1 remains open. No generic-client or recovery claim before package proof.

## Stage 4 - Exact Packaged Candidate and Acceptance

### Tasks

- [x] t18: Run focused and full CLI tests, default validation, PRD authority validation, link and path checks, and diff checks. Fix only W19 R8 defects and preserve unrelated work.
- [x] t19: Build one tarball. Record its name, version, digest, package root, declared bin, and included guidance. Do not rebuild between installed acceptance cases.
- [x] t20: Install the exact tarball through a normal package manager in isolated homes with the repository unavailable. Run fresh, v1, early-v2, partial, invalid-option, interrupted, no-Store, configured-Store, first-party MCP, generic MCP, repeat, repair, removal, and recovery cases.
- [x] t21: Run the agent mid-task scenario through the installed candidate. Prove Store-free continuation before access and one-operation retry after access.
- [x] t22: Complete the Human Experience Review for HX-1 through HX-8. Record evidence, observations, conclusions, reviewer, limits, and next actions. Offer a short optional owner handoff.
- [x] t23: Recheck the real worktree and affected-project boundaries. Confirm no real-project or real-Store mutation occurred. Prepare the phase closeout without committing, pushing, publishing, releasing, or repairing the real project.

### Acceptance criteria

- A18: One exact candidate passes every W19 R8 automated and isolated installed case with the repository unavailable. A repository-wide failure outside W19 R8 can be excluded only by a bounded owner exception that names the failed checks, covered claim, risk, owner, owning backlog, and reopen rule.
- A19: The tested global launcher is the normal package-manager link and resolves to the recorded candidate bin.
- A20: Fresh, v1, early-v2, partial, invalid-option, interrupted, and repeated setup each provides a reachable and safe next action.
- A21: No-Store, first-party MCP, and generic MCP cases preserve their exact access boundaries and never create project-local operational state.
- A22: The installed agent scenario preserves task progress, gives one exact setup action, refreshes access, retries only the affected operation, and continues.
- A23: D-034, D-035, and D-038 have complete close evidence. Any failed close rule keeps P1 open.
- A24: The Human Experience Review covers HX-1 through HX-8 with evidence, observations, conclusions, reviewer, limits, and next actions. Human response is not required.
- A25: The worktree review proves all unrelated user changes remain intact and unstaged by W19 R8 work unless separate authority changes that state.

### Dependencies

- Stages 1 through 3 pass.
- One fixed tarball candidate.
- Isolated homes, Store roots, and project fixtures.
- No affected real-project use without a separate user request after P1 acceptance.

### Closeout Notes

- Four testing decisions: Automated satisfied for W19 R8 with one bounded external-scope exception; Performance not-needed-now; Guided Progress Review activated and recorded; Unassisted Goal Testing not-needed-now.
- Human Experience Review: Link the complete HX-1 through HX-8 record in `evidence.md` and state any reviewer limits.
- Optional experience handoff: Provide one to three normal-use setup steps, what to notice, and an invitation for feedback after agent proof. A response is optional.
- Explicit human acceptance gate: None.
- Evidence report: Link A18 through A25 and the underlying installed captures from `evidence.md`.
- Phase / capability status: This was the original Stage 4 close. Live W19 R2 use later reopened P1 for Stage 5. `W19-R8-GATE-EXCEPTION-1` still routes only unrelated Performance Evidence projection failures. Release, commit, push, and real-project repair remain separate actions.

## Stage 5 - Codex TOML Array-Table Correction

### Tasks

- [x] t24: Record that live W19 R2 use invalidated the first candidate's broad Codex MCP setup claim. Keep the first identity and results as replaced evidence.
- [x] t25: Replace flat TOML table and value sets with an internal container tree for normal tables, arrays of tables, current array elements, and values.
- [x] t26: Make each `[[path]]` header create a separate element. Resolve assignments and nested normal tables against the current element.
- [x] t27: Preserve duplicate-key, duplicate-normal-table, table-kind conflict, malformed value, multiline TOML, null-byte, conflict-marker, and unsafe managed-marker blocks.
- [x] t28: Add a sanitized fixture with 21 `[[skills.config]]` elements and repeated `[skills.config.metadata]` tables. Prove plan, apply, repeat, repair, removal, and exact byte preservation.
- [x] t29: Extend the exact installed setup matrix with the failure-producing full setup option shape. Use one temporary home, Store, project, and Codex file.
- [x] t30: Build one replacement package and use that exact package for every installed correction check.
- [x] t31: Run the real W19 R2 command as a dry run only. Record the configuration shape and result. Do not record private values or apply setup.
- [x] t32: Repeat HX-2 and HX-3 review for independent setup results and safe setup retry.

### Acceptance criteria

- A26: Valid repeated TOML array tables can use the same key names and nested normal-table paths in separate elements.
- A27: Duplicate keys in one element, duplicate normal tables, table-kind conflicts, malformed input, and invalid parents remain blocked without file changes.
- A28: Planning changes no Codex file. Apply adds only the Make Docs managed block. Repeat changes nothing. Receipt-bound removal restores the original user bytes.
- A29: The exact installed matrix uses a sanitized 21-element configuration and the full setup option shape. It proves dry run, apply, repeat, and repair.
- A30: The correction adds no TOML dependency and no public CLI, MCP, Store, schema, or configuration interface.
- A31: The replacement package passes the TypeScript check, focused tests, W19 R8 tests, build, installed matrix, and the real W19 R2 dry-run planning step.
- A32: `W19-R8-GATE-EXCEPTION-1` covers only the existing Performance Evidence failures. It covers no TOML, setup, MCP, native-file, or W19 R8 failure.
- A33: The 20 pre-existing Performance Evidence worktree paths remain unstaged and are not restored or rewritten by this correction.
- A34: The first package remains recorded as replaced evidence. P1 reclose uses the replacement package identity and result.

### Dependencies

- The original Stages 1 through 4 remain historical prerequisites.
- Store and MCP access are not correction prerequisites.
- No branch or worktree change is allowed.

### Closeout Notes

- Four testing decisions: Automated satisfied; Performance not-needed-now; Guided Progress Review repeated for HX-2 and HX-3; Unassisted Goal Testing not-needed-now.
- Human Experience Review: The replacement package can plan Codex MCP setup for the real 21-element configuration shape. Setup retry is safe and does not change the file in dry-run mode.
- Optional experience handoff: Resume W19 R2 from its preserved candidate. Treat any later `work-phase.md` projection conflict as separate W19 R2 work.
- Explicit human acceptance gate: None.
- Evidence report: Link A26 through A34 and the replacement package record in `evidence.md`.
- Phase / capability status: P1 is reclosed. Commit, push, publication, release, and real setup apply remain separate actions.
