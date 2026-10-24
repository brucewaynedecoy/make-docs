---
title: "Phase 2: Setup and Lifecycle"
kind: "work"
status: "draft"
coordinate: "W27 R0 P2"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 2: Setup and Lifecycle

## Purpose

Implement the PRD-approved Copilot MCP method in Make Docs setup.

## Overview

Use [the P2 plan](../../plans/2026-10-24-w27-r0-github-copilot-support/02-setup-and-lifecycle.md). Keep method inventory in the static adapter source. Do not treat a test fixture as a second method source.

## Human Experience Outcome

The setup preview shows the exact native entry, Store scope, and action. Status gives one recovery action for a blocked or drifted client. The affected surfaces are CLI setup output and the installed Copilot MCP list. The executor is the implementation agent. Evidence is a redacted before and after diff plus focused tests. Human Experience Review checks the real text after P3.

## Current Testing Decisions

- Automated Implementation Testing: `required` for plan, apply, repeat, repair, rotation, removal, and denial.
- Performance Testing: `not-needed-now`.
- Guided Progress Review: `required` at the first reviewed native delta.
- Unassisted Goal Testing: `not-needed-now`; revisit with the real flow in P3.
- Human Experience Review: inspect setup preview and recovery text.

## Source PRD Docs

- [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md).
- [PRD 38](../../prd/38-global-store-and-project-state.md).

## Stage 1 - Add Static Adapter

### Tasks

- [ ] t1: Add the PRD-approved `github-copilot` adapter with one MCP method and exact path detection.
- [ ] t2: Add the reviewed setup preview and exact entry apply path, with secret redaction.
- [ ] t3: Bind current calls to the active connection key and machine, project, target, profile, and operation grants.
- [ ] t4: Keep the generic MCP path available when native ownership or policy blocks the static method.

### Acceptance criteria

- Setup writes only the reviewed Make Docs-owned entry.
- Other servers and unknown JSON fields remain byte-equivalent where possible and semantically unchanged.
- A client label or receipt cannot grant Store access.

### Dependencies

- P1 PRD reconciliation and native shape.

## Stage 2 - Lifecycle And User Text

### Tasks

- [ ] t5: Add repeat, drift, repair, rotation, removal, and separate CLI and app status.
- [ ] t6: Add conflict and custom-home blockers with one recovery action each.
- [ ] t7: Update the user and maintainer setup guides after the behavior is proved.
- [ ] t8: Run focused tests and inspect the packaged executable.

### Acceptance criteria

- Repeat setup is a no-op when current.
- Drift never causes an automatic write.
- Old key and removed entry fail current access checks.
- No key appears in status, logs, receipts, or repo files.

### Dependencies

- Stage 1.
