---
title: "Phase 2: Shared Core and Setup"
kind: "work"
status: "complete"
coordinate: "W26 R0 P2"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---

# Phase 2: Shared Core and Setup

## Purpose

Apply the accepted access-policy design through the existing operation core and setup path.

## Overview

This phase owns the shared-core and setup part of Bear proposal step 5. The approved P1 packet fixes the exact files and policy behavior before implementation starts.

## Human Experience Outcome

- Promise: Supported setup gives a usable connection within explicit limits, without a private caller-proof patch.
- Surface and evidence: Shared CLI/MCP results, setup and migration receipts, and natural refusal text.
- Limit: Source tests do not prove the installed W25 connection or sandbox access.

## Current Testing Decisions

Use focused access, registry, setup, migration, Store, and envelope tests. Test allowed and denied cases. Run package and generated-asset checks for changed shipped files. Review deterministic rules and agent instructions together.

## Source PRD Docs

- [PRD 25 access authority](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 38 Store and identity](../../prd/38-global-store-and-project-state.md)
- [PRD 39 registry and core](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

Bear proposal steps 5 and 15; approved P1 access packet; normal setup, read-only, write-intent, denial, grant change, and migration scenarios.

## Stage 1 - Approved authority and implementation

### Tasks

- [x] t1: Apply only the approved normative PRD 25/38/39 redline, requirement history, risk, and navigation edits. Validate PRD authority before source work consumes it. (Step 2; gate: P1 owner decision.)
- [x] t2: Change the shared policy and adapter context within the approved source list. Keep project scope, Store safety/ownership/locks, write intent, and named approvals. (Step 5; evidence: focused core tests.)
- [x] t3: Change supported setup, migration, revocation, and precise error serialization. Preserve unrelated settings and never widen a grant by default. (Step 5; evidence: setup and CLI/MCP tests.)
- [x] t4: Check shipped contracts and agent instructions upstream in `packages/docs/template/` against the dogfood copy; update them if the new policy needs a text change. Run focused parity, type, package, and coverage checks named by P1. (Step 5; evidence: tested source and package receipts.)

### Acceptance criteria

- The accepted policy, setup, and agent instructions agree in source and package output.
- A denied or unsafe operation stops without widening scope or erasing independent Store-free facts.
- No new grant database, service, generic CRUD path, or unapproved migration is present.

### Dependencies

- P1 design is accepted. Before implementation, show the selected installed connection's enforced rules and differences from PRDs 25, 38, and 39 with exact host and runtime evidence. P2 work and its file, test, and finite work limits need separate approval. A specific connection replacement needs separate W25 R0 P10 approval.

## Closeout Notes

Do not mark P2 complete from source tests if setup or package output differs from the approved contract.

P2 is complete for the merged W26 source and package scope. Commit `39b12140` changed PRDs 25, 38, and 39, shared policy, adapters, setup, Store integration, and focused tests. PR corrections in `2504e4ab` kept that contract. The [PR review packet](pr-review-packet.md) records the passing 19 smoke tests, 1,662 CLI tests, TypeScript check, path check, migration and rollback checks, and shipped agent guidance. The [P3 proof](evidence.md) adds grant refusal and temporary sandbox results. For t4, the upstream and dogfood managed router blocks match, and both already direct agents to stop only the failed Store operation. No W26 text change was needed; this record does not claim one. The saved `make_docs` entry was outside P2 and was checked later by W25. These records support t1–t4 without treating source tests as installed-host proof.
