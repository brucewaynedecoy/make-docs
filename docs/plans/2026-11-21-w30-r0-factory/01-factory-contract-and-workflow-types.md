---
title: "W30 R0 P1 Factory Contract and Workflow Types"
kind: "plan"
status: "draft"
coordinate: "W30 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-11-21-factory.md"
---

# W30 R0 P1 Factory Contract and Workflow Types

## Purpose

Write the shared factory rules once, as system resources, so both Skills and the CLI follow the same rules.

## Outcome

Four upstream resources exist: `make-docs://system/contract/factory-contract.md` and three references under `make-docs://system/reference/factory/workflows/`: `build-then-review.md`, `lead-and-specialists.md`, and `staged-backlog.md`. They use the existing resource types.

## Scope

- Contract: the four standard roles and the custom role fields; the capability catalog; the readiness states `draft`, `wired`, `ready`, and `drifted`; the escalation floor; acceptance at the end of the given scope; the working rules; the limits and their defaults; the undo rule outside git.
- Capability catalog: read and write files, run commands, launch agents, wait for an agent, read an agent's result, wake on a schedule, wake on an event, message the person, receive the person's answer, isolate a working copy, and edit code. Each entry says how setup proves it.
- Workflow type fields: the roles needed, the capabilities each role needs, the steps, the limits, the integration owner rule for parallel work, and what the type returns.
- The repo path and fields for a project-owned workflow type. A project type never replaces a shipped type silently.
- A rule catalog that maps each rule to its CLI check (where one exists) and its contract text, for the twins review.
- Examples that describe tools only by capability.

## Exclusions

- No new resource type. No Playbook or Protocol shape.
- No tool-specific default or example.

## Acceptance

- Package, provider inventory, and dogfood bytes match after projection.
- A reviewer can map every design decision to one contract or workflow type section.

## Dependencies

- Accepted design and PRD 53.
