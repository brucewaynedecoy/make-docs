---
title: "Phase 2: Filtered Tool Discovery"
kind: "work"
status: "complete"
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

- Automated Implementation Testing: required; pass. The focused tests, full suite, type check, build, and built stdio checks passed. See [P2 testing decisions](evidence.md#p2-testing-decisions).
- Performance Testing: `not-needed-now` in P2. P4 owns the context and discovery measurements. P2 makes no performance claim.
- Guided Progress Review: pass. Codex reviewed the built help, invalid-profile error, and the backlog host example.
- Unassisted Goal Testing: `not-needed-now`. Direct checks answer the current profile selection question. No claim of unassisted host setup is made.

The [P2 Human Experience Review](evidence.md#p2-human-experience-review) records the agent's observations, conclusions, and limits. It is separate from the four testing decisions. No human acceptance gate applies.

## Source PRD Docs

- [PRD 25: TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39: CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Stage 1 - Server And CLI

### Tasks

- [x] t1: Add a checked profile option to `createMakeDocsMcpServer`, defaulting to `all`.
- [x] t2: Register and list only the selected ready tools; reject calls outside the selected profile.
- [x] t3: Add `--profile core|setup|workflow|quality|backlog|all` to the stdio CLI and explain the default in help.
- [x] t4: Add a short, task-focused host configuration example that keeps the existing one-server command valid.

### Acceptance criteria

- A1: Each named profile lists its assigned ready tools and no unassigned tools. A hidden tool call fails before arguments, access checks, or handlers run.
- A2: An unknown profile fails before server startup and lists valid choices.
- A3: `make-docs mcp` still launches the full `all` stdio catalog.
- A4: A profile filter never changes an operation input, output, access check, or write gate.
- A5: Help names each profile and the default. A task-focused host example shows the same accepted CLI arguments and keeps the existing one-server command valid.

See [P2 acceptance evidence](evidence.md#p2-acceptance-evidence). A1 through A5 are stable case IDs for this backlog.

### Dependencies

- [P1](01-profile-metadata-and-contracts.md).

### Closeout Notes

- P2 is complete as of 2026-10-03. All four tasks are checked. No open P2 issue remains.
- The [central evidence](evidence.md#w24-r0-p2-filtered-tool-discovery) retains the focused tests, built stdio replay, invalid-profile result, source identity, testing decisions, and guide review.
- Human Experience Review: the P2 promises are satisfied within the local source and build evidence. This is agent review. It does not prove lived human ease or an installed host's setup path.
- Optional experience handoff: run `node packages/cli/dist/index.js mcp --help` from this repo to see the task groups and default. The user guide gives a backlog host example. The old `make-docs mcp` command still selects the full tool list. Feedback is optional.
- Explicit human acceptance gate: none. No new scenario or deferred obligation was created.
- Native resource filtering and required HTTP paths belong to P3. Full compatibility and context or latency measurements belong to P4.
- The user authorized the local P2 commit on 2026-10-03. The source and built-file hashes still match the tested candidate. W24 remains in progress. P3 is next and needs separate implementation authorization.
