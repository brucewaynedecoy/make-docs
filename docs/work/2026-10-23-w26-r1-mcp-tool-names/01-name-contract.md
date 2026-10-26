---
title: "W26 R1 P1 Name Contract and Authority"
kind: "work"
status: "complete"
coordinate: "W26 R1 P1"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 1: Name Contract and Authority

## Purpose

Fix the [exact name map](../../plans/2026-10-23-w26-r1-mcp-tool-names/01-name-contract.md) before source changes.

## Overview

The owner requested a new W26 R1 package after W26 R0 excluded a broad rename. This phase changes current PRD authority without changing operation IDs.

## Human Experience Outcome

- Promise: Each listed tool has a short, clear task name.
- Surface and evidence: The complete mapping table, PRD text, and measured name lengths.
- Limit: A plan and PRD change do not change the installed tool list.

## Source PRD Docs

- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Stage 1 - Name And Authority

### Tasks

- [x] t1: Check the six hand-defined tools and 37 registry tools against the P1 map.
- [x] t2: Update PRD 39 R-MIG-3 and PRD 25 current MCP surface. Add dated requirement history.
- [x] t3: Check name length, uniqueness, migration wording, and unchanged operation IDs.

### Acceptance criteria

- Every current tool has one new name and no two new names match.
- PRD 39 and PRD 25 state the current name rule.
- The old-name break and installed-version boundary are clear.

### Dependencies

- The owner requested W26 R1 and local implementation in this branch.
