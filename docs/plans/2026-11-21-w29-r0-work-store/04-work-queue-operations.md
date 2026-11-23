---
title: "W29 R0 P4 Work Queue Operations"
kind: "plan"
status: "draft"
coordinate: "W29 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-11-21-work-store.md"
---

# W29 R0 P4 Work Queue Operations

## Purpose

Expose the work store through the existing operation registry, so CLI and MCP share one core.

## Outcome

Nine operations exist with CLI and MCP parity: `run work status`, `sync`, `next`, `claim`, `release`, `report`, `close`, `export`, and `add` (MCP `work_status` to `work_add`). `make-docs resource read` prints a named project's quick items and backlog by `make-docs://project/<project>/` URI. `backlog_snapshot` reads the store when the store is the authority.

## Scope

- Admit the operations in the registry with their CLI paths under `run work` and their MCP names.
- Add them to the `backlog` and `workflow` MCP profiles. Writes need the existing write permission and `expectedVersion`.
- Run sync at the start of each operation. Report sync results in the same result.
- `next` returns ready units and the reason each open, not-ready unit waits.
- `claim` creates or renews a claim. A takeover after expiry requires the caller to confirm the old handle check.
- `report` and `close` refuse a caller that no longer holds the claim.
- `status` reports the authority mode (store or files), the reason, sync state, and conflicts, in human words first, with exact detail in machine output.
- Switch `backlog_snapshot` to the store when the store is the authority. Keep schema v2 and add resolved readiness facts. Keep the file path for no-Store checkouts.
- `add` adds a Store-only quick item with the next plain quick item number. `export --quick <path>` writes quick items to a path the caller names.
- The shared resource resolver accepts `make-docs://project/<project>/tasks/`, `.../tasks/<n>`, and `.../backlog/` coordinate paths. The project is named by project name or project ID, never taken from the current folder. Only a project URI read opens a read-only Store session.
- Keep every operation Store-optional where the design says so: without a Store, `next` and `status` read the files and report the mode.

## Exclusions

- No factory operation. W30 owns those.
- No change to backlog review interaction. W30 owns the button handoff.

## Acceptance

- CLI JSON and MCP results match for every operation and fixture.
- A no-Store checkout gives the same `backlog_snapshot` result as before this Wave.
- Guided Progress Review of `next`, `status`, and the conflict report, with owner feedback invited.

## Dependencies

- P2 and P3.
- An accepted command tree review under register D-065.
