---
title: "W29 R0 P5 Agent Twin and Config"
kind: "plan"
status: "draft"
coordinate: "W29 R0 P5"
source:
  type: "design"
  path: "docs/designs/2026-11-21-work-store.md"
---

# W29 R0 P5 Agent Twin and Config

## Purpose

Give agents without the CLI the same rules, and give projects one portable place for work settings.

## Outcome

The upstream template has a new reference resource, `make-docs://system/reference/work-store.md`. The config validator accepts a `work` block. The tracker connection contract is written down for agents and maintainers.

## Scope

- Author `work-store.md` upstream in `packages/docs/template/`. It explains readiness, claims, report, close, sync, and conflicts for an agent that edits the files directly.
- State in the resource that it is the agent twin of the P4 operations, and that a change to either form needs a review of the other.
- Add the `work` block to the config schema: `projection` (`on` by default) and `tracker` (connection name and field map). No digests, receipts, IDs, or secrets.
- Write the tracker connection contract in the same resource: the four operations, the field map, and the capability declaration.
- Project the resource into the package and then into this repo's dogfood copy, in that order.
- Update routers that name work backlog rules so they point to the new resource where an agent needs it.
- State that quick items live only in the work store, and how `make-docs://project/<project>/` URIs name a project and its work.
- Validate `projectName` in config, and have setup propose the folder name.

## Exclusions

- No connection for another tracker.

## Acceptance

- Package, provider inventory, and dogfood bytes match.
- The agent twin and the CLI give the same answer on the P1 parity fixtures.
- Config validation accepts the new block and rejects state fields in it.

## Dependencies

- P1. Final text after P4 behavior is stable.
