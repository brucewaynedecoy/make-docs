---
title: "Phase 2: Filtered Tool Discovery"
kind: "work"
status: "draft"
coordinate: "W24 R0 P2"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---
# Phase 2: Filtered Tool Discovery

## Purpose

Expose task profiles through one server factory and the CLI while preserving default stdio behavior.

## Overview

Use the P1 descriptor list. Filter registration and discovery by profile. Keep tool invocation on the existing shared operation path.

## Human Experience Outcome

A person can run `make-docs mcp --profile <name>` and can see allowed names in help. An unknown name gives a clear error. The existing `make-docs mcp` command still works. Evidence is help output, tool lists, and the old launch command.

## Current Testing Decisions

- Automated Implementation Testing: needed for each profile list, unknown profile, hidden tool call, and default `all`.
- Performance Testing: `not-needed` in P2; P4 measures context and discovery.
- Guided Progress Review: needed for help text and one configuration example.
- Unassisted Goal Testing: `not-needed-now`; clear options and direct inspection answer the current selection question.
- Human Experience Review: agent records the help and error observation in P4.

## Source PRD Docs

- [PRD 25: TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39: CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Stage 1 - Server And CLI

### Tasks

- [ ] t1: Add a checked profile option to `createMakeDocsMcpServer`, defaulting to `all`.
- [ ] t2: Register and list only the selected ready tools; reject calls outside the selected profile.
- [ ] t3: Add `--profile core|setup|workflow|quality|backlog|all` to the stdio CLI and explain the default in help.
- [ ] t4: Add a short, task-focused host configuration example that keeps the existing one-server command valid.

### Acceptance criteria

- Each named profile lists its assigned tools and no unassigned tools.
- An unknown profile fails before server startup and lists valid choices.
- `make-docs mcp` still launches the full `all` stdio catalog.
- A profile filter never changes an operation input, output, access check, or write gate.

### Dependencies

- [P1](01-profile-metadata-and-contracts.md).

### Closeout Notes

Keep tool names stable. Record one same-command default replay and one invalid-profile result.
