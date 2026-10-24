---
title: "W27 R0 P4 Setup Completion and 2.0.5 Readiness"
kind: "work"
status: "active"
coordinate: "W27 R0 P4"
---

# Phase 4: Setup Completion and 2.0.5 Readiness

## Purpose

Make the selected-platform setup result complete and truthful. Prepare a 2.0.5 CLI package after the accepted partial-finish behavior passes.

## Overview

The P1-P3 Copilot adapter and macOS proof remain separate committed work. P4 changes the common setup result, the manual MCP path, one wizard card, and package metadata. The [P4 plan](../../plans/2026-10-24-w27-r0-github-copilot-support/04-setup-completion-and-205-readiness.md) records the owner decision and the safe stop cases.

## Human Experience Outcome

- Impact and governing promise: direct setup experience under [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-SETUP-4 and R-SETUP-20 through R-SETUP-22.
- Intended human outcome: the person sees what finished, which harness still needs work, and one usable next action.
- Human-facing surface: project-state tile, platform and method screens, final terminal result, and JSON result.
- Implementation work: short tile text, independent harness selection, partial completion state, and exact manual MCP guidance.
- Evidence: focused automated tests plus review of real rendered setup output in a disposable profile.
- Executor: implementation agent; owner acceptance is separate.
- Deferral route: none for the selected macOS flow. Other host systems keep their P3 proof limits.

## Current Testing Decisions

- Automated Implementation Testing: required for selection routing, partial setup, manual entry, version, and regression cases.
- Performance Testing: not-needed-now. The phase adds no performance target.
- Guided Progress Review: inspect the rendered wizard and final terminal output after the tests.
- Unassisted Goal Testing: not-needed-now. No accepted gate asks for a new human run of this local setup change.
- Human Experience Review: required agent review of the observed result, with limits and next action.

## Source PRD Docs

- [PRD 39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md).
- [PRD 28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md).

## Stage 1 - Plan and Authority

### Tasks

- [x] t1: Record the accepted partial-finish rule and one-time manual MCP path in the P4 plan.
- [x] t2: Update PRD 39's current requirements and dated requirement history before source changes.
- [x] t3: Link this phase from the W27 plan and work indexes.

### Acceptance criteria

- A1: PRD 39 names the safe partial-finish condition, pending harness state, and stop cases without calling an unverified connection ready.
- A2: The plan, PRD, and work links resolve to one P4 scope.

### Dependencies

- Owner accepted the partial-finish rule on 2026-10-24.

## Stage 2 - Setup and Package

### Tasks

- [ ] t4: Remove the repeated `Project state` text inside the initial card.
- [ ] t5: Make selected harnesses and their MCP methods produce only their own reviewed native entries.
- [ ] t6: Permit project apply after a safely blocked MCP method while keeping pending or unsafe native operations on the stop path.
- [ ] t7: Render separate project and harness results in text and JSON. Add a safe one-time manual MCP entry path and later verification.
- [ ] t8: Set the publishable package and lock metadata to 2.0.5.

### Acceptance criteria

- A3: Codex-only, Copilot-only, and both-harness MCP cases touch only selected native entries. Unselected entries remain unchanged.
- A4: A safely blocked single harness leaves the project ready and the harness pending. A pending native operation still stops project apply.
- A5: The final text has a usable exact manual entry only when a valid key can be issued. Preview, JSON, receipts, status, and repo evidence contain no raw key.
- A6: The package reports version 2.0.5. The private monorepo root version stays unchanged.

### Dependencies

- Stage 1 and the committed W27 P1-P3 adapter.

## Stage 3 - Proof and Review

### Tasks

- [ ] t9: Run focused setup tests, build, TypeScript check, package check, and PRD authority validation.
- [ ] t10: Inspect the rendered wizard card and final terminal result in a disposable setup run.
- [ ] t11: Record Human Experience Review, exact test results, remaining host limits, and the W27 PR packet.

### Acceptance criteria

- A7: The setup matrix proves complete, partial, blocked, repeat, and recovery states in text and JSON.
- A8: The retained review record distinguishes project completion from MCP readiness and states any remaining limit.

### Dependencies

- Stage 2. Installed connection changes, push, PR, and publication need separate approval.
