---
title: "W30 R0 P3 Factory Operations"
kind: "plan"
status: "draft"
coordinate: "W30 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-11-21-factory.md"
---

# W30 R0 P3 Factory Operations

## Purpose

Let Skills and people check and save factory state through one operation core.

## Outcome

These operations exist with CLI and MCP parity in a new `factory` MCP profile: `factory status`, `tools save`, `workflow save | show | list`, `proof save`, `assignment start | update | list`, and `restore`.

## Scope

- Admit the operations in the registry under `factory` with MCP names such as `factory_status`.
- Add the `factory` MCP profile. Keep the work queue tools in the `backlog` and `workflow` profiles and include them in `all`.
- `tools save` checks the shape of a tool list and its capability proofs. It does not run or contact the tools.
- `workflow save` checks the workflow against its type and the capability catalog, and sets the readiness state. It refuses `ready` without a passed proof.
- `proof save` records a test task result and moves the workflow to `ready` when the proof passed.
- `assignment start | update` checks the work store claim before it writes. `update` refuses a caller that no longer holds the claim.
- `status` shows workflows, readiness, claims, assignments, and open manual steps in human words first, with exact detail in machine output. It marks a workflow `drifted` when a bound tool's saved proof no longer holds.
- `restore` writes the `.make-docs/factory/` copies from the Store.
- Every write uses the existing write permission, `expectedVersion`, and Store-unavailable results. No operation launches, schedules, or messages anything.
- New on 2026-11-23: `assignment update` checks the status move table, final states, correction rounds, and grant use; `tools save` checks proof fields and capability IDs and drifts on a new tool version; `workflow save` resolves and saves plan revisions; `proof save` binds a proof to one plan digest; `workflow show` reads revisions and drift codes; every write runs the never-log check; `assignment start` and `update` take the private claim ID; a grant-only `workflow save` writes grants during a run; reason codes stay stable. No command or MCP name changes.

## Exclusions

- No Skill text. P4 and P5 own that.

## Acceptance

- CLI JSON and MCP results match for every operation and fixture.
- No operation spawns a process or opens a network connection to a tool.
- Guided Progress Review of `status` output.

## Dependencies

- P2.
- An accepted command tree review under register D-065.
