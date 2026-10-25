---
title: "Phase 3: Cross-Interface Proof"
kind: "work"
status: "active"
coordinate: "W26 R0 P3"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---

# Phase 3: Cross-Interface Proof

## Purpose

Prove the shared path before W25 uses it for final acceptance.

## Overview

This phase proves Bear proposal steps 2–3 and the shared-core part of step 5. It supplies exact evidence to W25 R0 P11. It does not install or approve W25's final connection.

## Human Experience Outcome

- Promise: A sandboxed agent can use an allowed host-owned Store operation, and a denied call names the cause without blocking independent project work.
- Surface and evidence: Same-source CLI/MCP outputs, setup receipts, and sandbox proof.
- Limit: W25's app rendering and same-chat actions need their own installed-host proof.

## Current Testing Decisions

Automated Implementation Testing: selected. Run the isolated grant, source, setup, migration, rollback, and sandbox checks on the W26 candidate.

Performance Testing: not-needed-now. This phase changes no performance target.

Guided Progress Review: selected. Prepare a source-linked PR packet for the owner. Do not treat it as owner acceptance.

Unassisted Goal Testing: not-needed-now. This phase adds no visible app flow. W25 owns live Refresh testing after integration.

Use one exact P2 source/configuration for parity. Keep receipts small and source-linked.

## Source PRD Docs

- [PRD 25 access authority](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 38 Store and identity](../../prd/38-global-store-and-project-state.md)
- [PRD 39 registry and core](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

Bear F-A01–F-A11, proposal steps 2–3, 5, and 15; approved P1 packet; P2 tested source.

## Stage 1 - Normal, denied, and sandbox proof

### Tasks

- [x] t1: Run normal setup and migration, then compare allowed CLI and MCP facts, identities, source versions, and typed errors for the same selection. (F-A01–F-A03, F-A07, F-A09–F-A10; evidence: exact result receipts.)
- [x] t2: Test missing, read-only, revoked, out-of-scope, unavailable, unsafe, and denied grants and targets. Check that no denied write changes Store or project data. (F-A04–F-A06; evidence: denial matrix.)
- [x] t3: Use a client that cannot read Store files to complete an allowed MCP Store call through the host. Verify its package/configuration and Store grant. (F-A02, F-A08; evidence: [P3 evidence](evidence.md#p3-shared-store-and-sandbox-proof).)
- [x] t4: Check agent instructions against deterministic behavior and record passed checks, failed checks, and W25 consumption limits. (F-A11; evidence: coverage and handoff.)

The W26 checks above use shared operations and one sandboxed MCP client. They do not require a running W25 widget. W25 must test its visible Refresh action after it takes in the Store access change.

### Acceptance criteria

- Normal supported setup works without a hand-supplied caller-proof value.
- CLI and MCP share the same facts, policy outcome, and precise error reason for identical inputs.
- The sandbox proof uses host-owned Store access; an unrestricted local CLI call alone does not pass it.
- W25 receives only passed, version-bound evidence.

### Dependencies

- P2 source, setup, and package checks pass. W25 R0 P11 waits for required P3 results.

## Closeout Notes

Keep any failed grant or sandbox case open. A source-only result cannot satisfy a host-bound check.

The [2026-10-23 local proof receipt](evidence/p3/2026-10-23-local-proof.json) covers source build, focused tests, isolated setup, CLI/MCP snapshot parity, and cache refusal and write behavior at commit `0398949e`. The test Store and project were temporary. The receipt contains no MCP key or live backlog JSON.

The [P3 evidence report](evidence.md#p3-shared-store-and-sandbox-proof) records the passed sandbox call through a temporary W26 MCP host. The client could not read the isolated Store files. The [P3 matrix receipt](evidence/p3/2026-10-24-cross-interface-proof.json) records grant, migration, rollback, source-version, and instruction results. The saved `make_docs` entry still starts the installed package and was not changed.

Human Experience Review: the agent checked the real temporary host result and the source-linked denial outcomes. The result supports the bounded promise for shared Store access. It does not prove a user's lived experience or the W25 visible Refresh flow. There is no separate human acceptance gate for this phase.

Phase status: local P3 proof complete. W26 delivery remains pending PR review and later merge. W25 still owns its visible Refresh proof.
