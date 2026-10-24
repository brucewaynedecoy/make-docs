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

- [x] t1: Add the PRD-approved `github-copilot` adapter with one MCP method and exact path detection.
- [x] t2: Add the reviewed setup preview and exact entry apply path, with secret redaction.
- [x] t3: Bind current calls to the active connection key and machine, project, target, profile, and operation grants.
- [x] t4: Keep the generic MCP path available when native ownership or policy blocks the static method.

### Acceptance criteria

- Setup writes only the reviewed Make Docs-owned entry.
- Other servers and unknown JSON fields remain byte-equivalent where possible and semantically unchanged.
- A client label or receipt cannot grant Store access.

### Dependencies

- P1 PRD reconciliation and native shape.

## Stage 2 - Lifecycle And User Text

### Tasks

- [x] t5: Add repeat, drift, repair, rotation, removal, and separate CLI and app status.
- [x] t6: Add conflict and custom-home blockers with one recovery action each.
- [x] t7: Update the user and maintainer setup guides after the local behavior was proved.
- [x] t8: Run focused tests and inspect the packaged executable.

### Acceptance criteria

- Repeat setup is a no-op when current.
- Drift never causes an automatic write.
- Old key and removed entry fail current access checks.
- No key appears in status, logs, receipts, or repo files.

### Dependencies

- Stage 1.

## P2 Evidence and Limit

The built package wrote one `mcpServers.make-docs` entry in a disposable Copilot CLI user file. `copilot mcp list --json` and `copilot mcp get make-docs --json` found it as a user source. The reported environment names were `MAKE_DOCS_MCP_CONNECTION_ID` and `MAKE_DOCS_MCP_CONNECTION_KEY`. No saved Copilot entry was changed.

The eight W27 tests cover an unchanged repeat, a user-owned name, a changed receipt entry, reviewed repair of a prior owned entry, a project entry that can shadow the user entry, a custom CLI home, entry removal, reviewed key change, rejection of the old key, and recovery after an interrupted native apply. Removal restores the prior non-Make Docs JSON state. The built server passed local MCP tool discovery, a Store-free resource call, an allowed project status call, and a denied wrong-target call. These checks prove the native entry and server contract. They do not prove a Copilot agent call.

The package build, type check, package dry run, focused tests, PRD authority and link scan, and `git diff --check` passed on 2026-10-24.
