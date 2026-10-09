---
title: "Shared Access and Data Foundation"
kind: "design"
status: "draft"
coordinate: "W26 R0"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "The shared access design needs an approved policy redline and a bounded implementation plan."
  coordinate_handoff: "Carry W26 R0 into the foundation plan and work records. W25 R0 consumes only proved foundation results."
---

# Shared Access and Data Foundation

## Purpose

Define the shared access and data path that W25 R0 needs for a normal supported connection. The Bear coordinating plan dated 2026-10-09 calls this Package F. That letter is a planning label, not a Make Docs coordinate.

## Context

The owner rejected the current W25 live app for release. A private installed candidate proved selected behavior, but the normal connection refused `work.backlog-cache.lookup` with `store-denied`. That result does not establish that ordinary setup provides usable Store access. W25 also needs one project, checkout, item, and source-version contract for reads, cache entries, refresh, and actions.

[PRD 25](../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) owns operation access. [PRD 38](../prd/38-global-store-and-project-state.md) owns Store and project identity. [PRD 39](../prd/39-cli-command-model-and-operation-registry.md) owns the registry and shared core. Their current caller-proof rules remain current until the owner approves the exact F1 policy design and its authority redline. W25 [PRD 51](../prd/51-backlog-review-and-reporting.md) consumes the resulting path.

The Bear proposal `A26E70E0-D758-4BFC-9663-082EF11369BC` supplies the full 15-step scope. The coordinating plan `2EF0252A-EA60-4207-84FA-B62351245335` assigns the shared policy and setup to this package. Both are external coordination records. Make Docs work files own task state.

## Human Experience Intent

Impact: `direct`

Affected humans: Maintainers and agents that use an approved Make Docs connection when the client cannot read Store files.

Human goal or effect: Normal setup gives them a usable, bounded path to project and Store facts. A refusal names its cause and a safe next action.

Experience promises:

- One shared policy applies project and Store limits to CLI and MCP operations.
- A sandboxed client can ask the host to perform an allowed Store operation without direct Store file access.
- A missing, read-only, revoked, or out-of-scope grant stops only the affected operation.
- `store-not-configured`, `store-unavailable`, `store-unsafe`, and `store-denied` remain distinct.
- A refused optional cache does not erase current project facts or create a private fallback cache.
- Project, checkout, item, and source version identify the same facts across adapters.

Complexity kept out of the human path:

- The user does not supply a private caller-proof value to make ordinary MCP use work.
- Setup and status explain package health separately from operation authority.

Evidence required:

- Test normal setup, migration, grant change, and denial through CLI and MCP.
- Test one host-owned Store through an MCP client that cannot read Store files.
- Compare selected identity, facts, source versions, and errors across adapters.

## Decision

Use the existing operation registry, configuration, Store session, and write safeguards. F1 traces the current caller-proof chain and presents a check-purpose matrix. The owner must approve the exact checks to keep, move, or remove, plus the PRD, schema, migration, revocation, and error redline, before F2 changes access policy.

The proposed design has one approved connection context, explicit project and checkout limits, declared operation requirements, and one shared policy decision. Core write intent, named approvals, denied-target checks, Store integrity, ownership, and locking remain required. Package and native-entry health checks move to setup or explicit status only where the approved F1 design permits. Receipts remain only for a defined ownership purpose. Missing context never grants broad access.

Use stable project and checkout IDs separately from names and paths. Explicit path selects its checkout; a matching working directory selects that checkout; preferred checkout is a fallback; unresolved ambiguity requires a choice. A view stays pinned to its selected checkout. A source version includes relevant uncommitted content. Known zero, unknown, unsupported, and unavailable are distinct. Recorded facts, cached judgment, and fresh agent judgment retain separate provenance.

F2 changes only the approved shared core and supported setup path. F3 proves CLI/MCP parity, denial, grant changes, and sandbox access. W25 acceptance waits for the F3 checks it consumes. Later HTTP work may call this same core, but W26 R0 adds no HTTP server.

## Design Lineage

- Relationship: `new-doc-related`.
- Prior design: [Store architecture recovery](2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [live Backlog Review](2026-09-24-live-backlog-review-mcp-app.md).
- Reason: The shared access correction spans setup, Store, and adapters. It has a separate policy approval gate from W25 app repair.

## Alternatives Considered

- Patch a missing identity environment value for the private candidate. Rejected as final acceptance because it does not prove supported setup.
- Reuse private report files after Store denial. Rejected because the existing Store cache remains the only reuse authority.
- Add a grant database or a second service. Rejected because the existing policy and configuration are the intended owners.

## Consequences

F1 must make the policy change exact before F2 begins. The old caller-proof PRD contract stays effective until that approval and redline. W25 cannot claim normal cache acceptance from private-candidate or Store-free tests. Q, U, H, and B remain later packages with separate authority and limits.

## Intended Follow-On

- Route: `change-plan`.
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md).
- Why: The owner needs a bounded F1 design packet, then a separate policy decision before implementation.
- Coordinate Handoff: Use W26 R0 P1–P3 in the plan and work records. Link W25 R0 to passed P3 evidence.
