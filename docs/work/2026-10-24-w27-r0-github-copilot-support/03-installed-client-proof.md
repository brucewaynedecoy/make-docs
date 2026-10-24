---
title: "Phase 3: Installed Client Proof"
kind: "work"
status: "draft"
coordinate: "W27 R0 P3"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 3: Installed Client Proof

## Purpose

Prove each claimed Copilot surface and close the W27 R0 human promises.

## Overview

Use [the P3 plan](../../plans/2026-10-24-w27-r0-github-copilot-support/03-installed-client-proof.md). Run from a built package. Keep tests in a disposable profile. An installed connection needs its own separate reviewed change.

## Human Experience Outcome

A user can select Copilot, inspect one setup change, then use Make Docs in the CLI or app that has direct proof. A blocked result gives one action. The executor is the testing agent. Evidence is a redacted real-client trace. Human Experience Review compares each promise with the observed flow and names limits. Offer a short optional normal-use handoff when complete.

## Current Testing Decisions

- Automated Implementation Testing: `required` for all changed setup and policy code.
- Performance Testing: `not-needed-now`; report startup failure or hang as a functional defect.
- Guided Progress Review: `required` for the support-label matrix and rollback evidence.
- Unassisted Goal Testing: `revisit`; select it only if a real setup flow exposes a question that direct proof cannot settle.
- Human Experience Review: `required` for each direct promise.

## Source PRD Docs

- [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md).
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md).
- [PRD 38](../../prd/38-global-store-and-project-state.md).

## Stage 1 - Real Client Matrix

### Tasks

- [ ] t1: Run a real Copilot CLI session from the built package. Record tool discovery, allowed Store read, denied operation, Store-free resource read, and sandbox result.
- [ ] t2: Run the same matrix in the GitHub Copilot app. Record its separate native source and result.
- [ ] t3: Check trusted and untrusted project entry behavior, same-name precedence, and shared skill discovery.
- [ ] t4: Run the claimed host platform checks. Leave each unproved client or platform blocked.

### Acceptance criteria

- Each support label has its own installed-client evidence.
- A denied Store call does not stop a Store-free resource call.
- The current native entry and grants, not a receipt, decide access.

### Dependencies

- P2 packaged build.

## Stage 2 - Recovery And Review

### Tasks

- [ ] t5: Prove repeat setup, drift detection, reviewed repair, key rotation, removal, and rollback in a disposable profile.
- [ ] t6: Compare the real setup text with the Human Experience promises. Record observation, conclusion, limit, and next action for each.
- [ ] t7: Run build, type, focused tests, packaging checks, and link checks. Record exact results.
- [ ] t8: Prepare the release and PR review packet. Ask for separate approval before push or PR.

### Acceptance criteria

- Unrelated servers and user-owned files survive repair and removal.
- The old key stops working after rotation.
- The packet names every blocked claim and required next action.

### Dependencies

- Stage 1.
