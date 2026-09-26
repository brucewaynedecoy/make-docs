---
title: "Phase 1: Profile Metadata And Contracts"
kind: "work"
status: "draft"
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

- Automated Implementation Testing: needed for complete nonempty assignments, valid names, stable contracts, and `all` union.
- Performance Testing: `not-needed` in P1. P4 measures the profile discovery path.
- Guided Progress Review: `not-needed-now` until CLI help and profile lists exist in P2.
- Unassisted Goal Testing: `not-needed-now`; deterministic inventory checks answer this phase's question.
- Human Experience Review: agent review of the inventory and profile descriptions in P4.

## Source PRD Docs

- [PRD 25: TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39: CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Stage 1 - Descriptor Contract

### Tasks

- [ ] t1: Add the typed MCP profile metadata to canonical operation definitions and hand-defined tool descriptors.
- [ ] t2: Derive ready MCP descriptors from the same registry fields and reject absent, empty, or unknown profile sets.
- [ ] t3: Assign all current ready tools from the W24 inventory and require a same-change assignment for later admissions.

### Acceptance criteria

- Every current ready tool has an explicit nonempty assignment.
- The 43 current tools appear once each in `all`, and `all` equals the union of the five task profiles.
- A tool shared by profiles has one name, schema, description, access fact, and handler.
- `mcpReady` admission and operation access facts remain independent of profile metadata.

### Dependencies

- Current PRD 25 and PRD 39 authority.

### Closeout Notes

Record the generated assignment inventory and test result. Do not claim the Backlog Review app tools exist until their separate owner adds them.
