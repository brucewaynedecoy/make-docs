---
title: "Phase 1: Access Trace and Design"
kind: "work"
status: "completed"
coordinate: "W26 R0 P1"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---

# Phase 1: Access Trace and Design

## Purpose

Trace the current access failure and make the smaller policy an exact owner decision.

## Overview

This phase owns Bear proposal steps 2 and 3 and the design part of step 5. It consumes the W25 R0 P8 change inventory. No access-policy or connection mutation is included.

## Human Experience Outcome

- Promise: Normal setup should support bounded Store use, and each refusal should name its cause and next action.
- Surface and evidence: Current CLI/MCP call traces, setup configuration, Store results, and the reviewed policy packet.
- Limit: An accepted design is not a working connection or a live policy change.

## Current Testing Decisions

Use read-only traces and existing focused tests to identify each boundary. Use isolated temporary Store roots if a diagnostic needs Store data. Do not change production grants or supply a private identity patch as acceptance proof.

## Source PRD Docs

- [PRD 25 access authority](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 38 Store and identity](../../prd/38-global-store-and-project-state.md)
- [PRD 39 registry and core](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

Bear proposal steps 2–3 and 15; W25 `store-denied` observation; current R-ACCESS-6 through R-ACCESS-17; W25 R0 P8 evidence inventory.

## Stage 1 - Trace and policy packet

### Tasks

- [x] t1: Trace snapshot, cache lookup/write, and refresh through setup, CLI/MCP context, registry, policy, Store session, and result serialization. Record target, Store location, grant, caller context, write intent, and exact refusal at each boundary. (Steps 2, 5; evidence: call-path map.)
- [x] t2: Classify caller identity, receipt, package/native-entry, machine/project grant, command-rule, Store integrity, ownership, and lock checks as keep, move, or remove. Name each purpose and affected source/configuration owner. (Step 2; evidence: check-purpose matrix.)
- [x] t3: Define project/checkout/item selection, dirty-source version, unknown-state, fact/judgment, migration, revocation, schema, error, rollback, and CLI/MCP parity rules. List exact PRD redlines, affected files, tests, and the combined F/W25 work estimate. (Steps 2–3, 15; evidence: design packet.)
- [x] t4: Present the exact access-policy design and PRD redline for owner review. Record the decision before P2. (Step 15; gate: named policy approval.)

### Acceptance criteria

- The packet explains the observed denial and every check in the current and proposed path.
- Missing context does not become trusted authority. Existing write and Store safeguards remain explicit.
- The owner can review exact policy, schema, migration, file, test, and limit changes before P2.

### Dependencies

- W25 R0 P8 inventory and read-only repository/connection access. P2 waits for t4 approval.

## Closeout Notes

The [P1 decision packet](../../plans/2026-10-09-w26-r0-shared-access-and-data-foundation/01-access-trace-and-design.md#p1-decision-packet--accepted-design-not-active-policy) contains the current call path, the accepted shared-policy design, the purpose and failure effect of each connection check, grants, migration, revocation, identity, error fields, the exact later PRD redline, file list, tests, rollback, and a 29–46 active-hour combined estimate. The three current MCP entries have different launch bytes and caller carriers. The earlier `store-denied` call cannot be assigned to one entry from retained P8 evidence. The project repair-1 entry has no caller environment value and would have no Store grant under the current policy if it made that call. No grant, connection, live policy, or PRD changed in P1.

On 2026-10-09, the owner accepted one saved key per MCP connection, current grants and target checks on every Store call, a new key with old-key disablement on setup replacement, and an explicit remove or disable action. Manual client-settings edits or deletion do not disable a running connection. This closes P1 design only. P2 work, its limit, and any exact connection replacement need separate approval. Before P2 implementation, show the selected installed runtime's enforced rules and its differences from PRDs 25, 38, and 39 with exact host and byte evidence.
