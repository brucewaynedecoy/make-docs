---
title: "Phase 1: Contract and Native Probe"
kind: "work"
status: "complete"
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
- [x] t2: Dispose of the same-name app-added entry case. The owner excluded this user-created conflict from the 2.0.5 support claim. No app-added collision test passed. The config home, CLI and project precedence, folder trust, app reuse, and Skill discovery have direct macOS proof.
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
- [x] t8: Reconcile the native facts and t2's bounded disposition with t3. Keep app-owned entry conflicts and unproved platforms as explicit limits.

## Closeout limit

The macOS CLI and app tests proved CLI-entry reuse, trusted project-entry precedence, connection-key refusal, and Skill discovery. A same-name entry added through the app remains unproved. On 2026-10-26, the owner accepted a bounded closeout that excludes this user-created conflict from the 2.0.5 app claim. P1 t2 is discharged by that scope decision, not passed as a collision test. [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) still blocks a `current` app claim if an app-owned entry has the same name or the effective source is unknown. The [P3 work record](03-installed-client-proof.md) gives the direct client evidence and the Windows and Linux limit.

The excluded part of t2 is one conflict case, not the normal Make Docs setup path. The normal app test used the managed CLI entry and returned `ready`. The project-entry test proved folder trust and project precedence. The excluded case would require a person to add a second Make Docs entry through the app's own MCP settings with the same name. Make Docs does not create or manage that entry. No app setting changed during this closeout.

### Future test if the supported scope expands

If a later release claims support for app-owned same-name entries, use a disposable project, Store, and Make Docs key on macOS. Save the current app and CLI MCP settings before the test. Add a valid `make-docs` CLI user entry and confirm its direct app call returns `ready`. Add another `make-docs` entry through the app's own add-server control with a different test key. In a fresh app session, record which entry the app lists and which key reaches Make Docs. A `ready` result for one key and `store-denied` for the other makes the effective source visible. Repeat with a trusted same-name project entry to establish the three-source order. Check that the `preflight` Skill still loads. Remove the app-added and project entries, restore the exact prior CLI settings, revoke both test keys, and verify the starting state. Keep the app version, redacted config sources, call results, and cleanup receipt. This test was not run for the bounded W27 closeout.

### Acceptance criteria

- PRD 28 states the exact supported method and blocked states before source edits.
- The owner can review any product choice that differs from the design.

### Dependencies

- Stage 1 native facts.
