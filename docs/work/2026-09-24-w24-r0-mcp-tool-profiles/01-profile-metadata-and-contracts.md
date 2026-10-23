---
title: "Phase 1: Profile Metadata And Contracts"
kind: "work"
status: "complete"
coordinate: "W24 R0 P1"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---
# Phase 1: Profile Metadata And Contracts

## Purpose

Give every MCP-ready tool an explicit profile assignment in its owning descriptor.

## Overview

The operation registry remains canonical. Hand-defined tools carry the same MCP metadata shape. Keep access and handler semantics unchanged. Use the [43-tool map](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/02-profile-inventory-and-discovery.md) as the starting assignment.

## Human Experience Outcome

A person can find a tool under a task-named profile. The metadata does not ask the person to understand Store access or operation IDs. Evidence is the complete generated profile inventory and readable descriptions.

## Current Testing Decisions

- Automated Implementation Testing: required and passed for complete nonempty assignments, valid names, stable contracts, and `all` union. See the [central evidence](evidence.md#w24-r0-p1-profile-metadata-and-contracts).
- Performance Testing: `not-needed-now` in P1. P4 measures the profile discovery path.
- Guided Progress Review: `not-needed-now` until CLI help and profile lists exist in P2.
- Unassisted Goal Testing: `not-needed-now`; deterministic inventory checks answer this phase's question.
- Human Experience Review: the P1 agent review is complete for the inventory and preserved tool descriptions. P4 owns the review of the host discovery result.

## Source PRD Docs

- [PRD 25: TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39: CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Stage 1 - Descriptor Contract

### Tasks

- [x] t1: Add the typed MCP profile metadata to canonical operation definitions and hand-defined tool descriptors.
- [x] t2: Derive ready MCP descriptors from the same registry fields and reject absent, empty, or unknown profile sets.
- [x] t3: Assign all current ready tools from the W24 inventory and require a same-change assignment for later admissions.

### Acceptance criteria

- Every current ready tool has an explicit nonempty assignment.
- The 43 current tools appear once each in `all`, and `all` equals the union of the five task profiles.
- A tool shared by profiles has one name, schema, description, access fact, and handler.
- `mcpReady` admission and operation access facts remain independent of profile metadata.

### Dependencies

- Current PRD 25 and PRD 39 authority.

### Closeout Notes

P1 passed its implementation checks on 2026-10-03. See the [central evidence](evidence.md#w24-r0-p1-profile-metadata-and-contracts) and [generated inventory](evidence/p1/profile-inventory.json).

All 43 ready tools have explicit assignments. Counts are core 8, setup 15, workflow 14, quality 9, and backlog 3. Their union contains each tool once. Registry and catalog checks reject missing, empty, unknown, or duplicate profile assignments. They also reject invalid default exposure values.

Core tools declare eager exposure. Other tools declare deferred exposure. These fields give host advice only. Admission, access, handlers, names, descriptions, and schemas retain their prior behavior. P1 does not filter discovery.

Validation passed: 17 new profile tests; 44 focused tests; 1,527 full CLI tests plus 19 smoke-harness checks; TypeScript checks; CLI build; baseline tool contract comparison. The full test run skipped five installed-upgrade tests. It did not run a release or platform proof.

P1 is complete. P2 still needs separate authorization. The Backlog Review app tools remain with their separate owner.

The closeout review found no open P1 issues. All 16 code and test files still match the tested file hashes. The passing test evidence remains valid. The user authorized the local P1 commit on 2026-10-03. This work record accompanies that commit.
