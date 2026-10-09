---
title: "Phase 1: Access Trace and Design"
kind: "work"
status: "draft"
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
- Limit: A proposed design is not a working connection or an accepted policy change.

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

- [ ] t1: Trace snapshot, cache lookup/write, and refresh through setup, CLI/MCP context, registry, policy, Store session, and result serialization. Record target, Store location, grant, caller context, write intent, and exact refusal at each boundary. (Steps 2, 5; evidence: call-path map.)
- [ ] t2: Classify caller identity, receipt, package/native-entry, machine/project grant, command-rule, Store integrity, ownership, and lock checks as keep, move, or remove. Name each purpose and affected source/configuration owner. (Step 2; evidence: check-purpose matrix.)
- [ ] t3: Define project/checkout/item selection, dirty-source version, unknown-state, fact/judgment, migration, revocation, schema, error, rollback, and CLI/MCP parity rules. List exact PRD redlines, affected files, tests, and the combined F/W25 work estimate. (Steps 2–3, 15; evidence: design packet.)
- [ ] t4: Present the exact access-policy design and PRD redline for owner review. Record the decision before P2. (Step 15; gate: named policy approval.)

### Acceptance criteria

- The packet explains the observed denial and every check in the current and proposed path.
- Missing context does not become trusted authority. Existing write and Store safeguards remain explicit.
- The owner can review exact policy, schema, migration, file, test, and limit changes before P2.

### Dependencies

- W25 R0 P8 inventory and read-only repository/connection access. P2 waits for t4 approval.

## Closeout Notes

Leave this phase open until the owner decides the packet. A trace alone does not approve the policy.
