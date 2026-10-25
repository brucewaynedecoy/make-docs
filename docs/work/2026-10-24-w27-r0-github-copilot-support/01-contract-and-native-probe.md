---
title: "Phase 1: Contract and Native Probe"
kind: "work"
status: "active"
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

## P1 Read-Only Observation

On 2026-10-24, the installed `copilot` CLI reported version `1.0.102`. The GitHub Copilot app bundle reported version `1.1.30`. The CLI reported a user MCP configuration source, but no Make Docs entry. The check did not prove app MCP precedence, caller identity, Store access, or skill discovery. The saved Copilot configuration was not changed. GitHub's [app customization guide](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app) documents both CLI and repository MCP reuse and the app's own Customize > MCP install path. The owner accepted one managed CLI entry and user-owned app entries. The design and PRD now state that rule.

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

- [x] t1: Record the installed `copilot` CLI and GitHub Copilot app versions and platform.
- [ ] t2: Check a same-name MCP entry added through the app. The config home, CLI and project precedence, folder trust, app reuse, and Skill discovery have direct macOS proof.
- [x] t3: Check whether both clients pass the proposed connection identity and key to a disposable Make Docs server.
- [x] t4: Record blocked states for unproved clients, paths, policies, and platforms.

### Acceptance criteria

- A redacted record names each observed native source and each unproved assumption.
- No installed connection changes during the probe.
- CLI and app findings are separate.
- A same-name app-installed entry or unknown effective source leaves app support blocked until reviewed.

### Dependencies

- The owner approves this package before execution.

## Stage 2 - Reconcile Product Authority

### Tasks

- [x] t5: Record the accepted static adapter, one-entry rule, separate client proof, and fallback in PRD 28. This scope decision does not close the native-fact gate.
- [x] t6: Review PRD 25 and PRD 38 for a boundary gap. No new Store schema or operation boundary change was needed.
- [x] t7: Add W27 R0 requirement history. No new product gap required a risk-register entry.
- [x] t8: Reconcile the native facts proved by t2 and t3. Keep app-owned entry conflicts and unproved platforms as explicit limits.

## Closeout limit

The macOS CLI and app tests proved CLI-entry reuse, trusted project-entry precedence, connection-key refusal, and Skill discovery. The same-name entry added through the app remains unproved, so t2 stays open for that case. The [P3 work record](03-installed-client-proof.md) gives the direct client evidence and keeps Windows and Linux client runs open. P1 makes no claim for those cases.

### Acceptance criteria

- PRD 28 states the exact supported method and blocked states before source edits.
- The owner can review any product choice that differs from the design.

### Dependencies

- Stage 1 native facts.
