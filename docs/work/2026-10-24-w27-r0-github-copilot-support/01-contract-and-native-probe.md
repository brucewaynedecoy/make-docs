---
title: "Phase 1: Contract and Native Probe"
kind: "work"
status: "draft"
coordinate: "W27 R0 P1"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 1: Contract and Native Probe

## Purpose

Prove the installed Copilot contract and make the active PRD ready for code work.

## Overview

Use [the P1 plan](../../plans/2026-10-24-w27-r0-github-copilot-support/01-contract-and-native-probe.md). Keep the installed-client check read-only. Use a disposable profile for any trial entry.

## Human Experience Outcome

The later setup can name one exact native change and tell the user which client has proof. The affected surfaces are the Make Docs setup preview and status. The agent reviews the wording after P1. The executor records a redacted probe. No owner acceptance is inferred from a probe.

## Current Testing Decisions

- Automated Implementation Testing: `required` for config parsing and precedence probes.
- Performance Testing: `not-needed-now`; no target is set.
- Guided Progress Review: `required` for the PRD and method decision.
- Unassisted Goal Testing: `not-needed-now`; no working flow exists yet.
- Human Experience Review: inspect whether the proposed preview names the action and scope.

## Source PRD Docs

- [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md).
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md).
- [PRD 38](../../prd/38-global-store-and-project-state.md).

## Stage 1 - Probe Native Clients

### Tasks

- [ ] t1: Record the installed `copilot` CLI and GitHub Copilot app versions and platform.
- [ ] t2: Check active MCP config home, user and project entry precedence, folder trust, app reuse, and skill discovery.
- [ ] t3: Check whether both clients pass the proposed connection identity and key to a disposable Make Docs server.
- [ ] t4: Record blocked states for unproved clients, paths, policies, and platforms.

### Acceptance criteria

- A redacted record names each observed native source and each unproved assumption.
- No installed connection changes during the probe.
- CLI and app findings are separate.

### Dependencies

- The owner approves this package before execution.

## Stage 2 - Reconcile Product Authority

### Tasks

- [ ] t5: Update PRD 28 with the accepted static adapter, one-entry rule, separate client proof, and fallback.
- [ ] t6: Update PRD 25 or PRD 38 only if a real boundary gap is proved; stop before a Store schema change.
- [ ] t7: Add W27 R0 requirement history and update the risk register for any new gap.

### Acceptance criteria

- PRD 28 states the exact supported method and blocked states before source edits.
- The owner can review any product choice that differs from the design.

### Dependencies

- Stage 1 native facts.
