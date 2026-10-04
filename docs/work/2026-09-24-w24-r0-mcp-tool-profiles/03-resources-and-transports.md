---
title: "Phase 3: Resources And Transports"
kind: "work"
status: "complete"
coordinate: "W24 R0 P3"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---
# Phase 3: Resources And Transports

## Purpose

Apply profile rules to native resources and add HTTP routes only where supported host use needs them.

## Overview

The shipped resource catalog is upstream under `packages/docs/template/`. Its local `.make-docs/` copy is a dogfood projection. Scope native discovery and reads with explicit URI metadata. Use the same server factory for stdio and any needed Streamable HTTP route.

The user authorized P3 implementation on 2026-10-03 after the preflight commit `5e3cdd6142bd99cc585c3a3e18c5991c853e8044`. Implementation, selected validation, and agent review passed. The user then authorized the P3 local commit on 2026-10-03. P3 is complete within the [recorded evidence limits](evidence.md#w24-r0-p3-resources-and-transports). The [history record](../../../.make-docs/archive/history/2026-10-03-w24-r0-p3-mcp-tool-profiles.md) records this closeout. No commit hash is claimed here.

## Current Transport Decision

Stdio is the current selected transport. Keep `make-docs mcp` and its `all` default. HTTP work is conditional on a later confirmed need from a supported host.

Reuse the recorded W25 R0 P2 stdio proof as bounded context. Its source is commit `0c112e57fb0c197105c4eabe9d60395f772ab198` on `w25-r0-p1-live-delivery-contract`, file `docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md`, heading `P2 Current Evidence`. It used `ui://make-docs/host-proof/v1.html` in Claude Desktop 2.16120.0. It proved resource open, a page tool call, fixed message delivery after host Send, safe text, and missing-bridge fallback. It did not need an HTTP MCP adapter. It did not test one. The loopback fallback was an ordinary page check, not MCP over HTTP.

At the 2026-10-03 preflight, that commit was not an ancestor of this W24 branch. This recorded result does not prove the new W24 resource filters, a fresh installed-host path, or production use. The new P3 stdio path passed its own local build checks. See the [P3 transport plan](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/03-resources-and-transports.md#stdio-and-http) and [P3 evidence](evidence.md#p3-acceptance-evidence) for the limits. The current draft W25 work file does not replace the completed record at the named commit. App implementation remains with W25.

## Human Experience Outcome

A person who chooses `backlog` can open the Backlog Review UI resource when the app package lands. A person who chooses another profile sees only relevant resources and gets a clear out-of-profile read error. Evidence is native resource list/read through each profile.

## Current Testing Decisions

- Automated Implementation Testing: required and passed within the recorded limits. Scope is metadata completeness, native filtering, byte/provenance parity, preserved CLI and core resource tools, stdio, and the unready UI reservation. The one root suite preceded three help-only string corrections. Final focused help tests, a rebuild, and a final stdio replay passed. See [P3 testing decisions](evidence.md#p3-testing-decisions).
- Performance Testing: `not-needed-now`. P4 owns performance evidence. No HTTP need is confirmed and no HTTP code is being added.
- Guided Progress Review: completed for the resource meanings, denied-read recovery, updated guides, and final built help. The first help omitted native resources; the final help fixes that gap. No owner response is required.
- Unassisted Goal Testing: `not-needed-now`. The current questions concern bounded resource behavior and can be answered by automated checks and agent inspection. No scenario or human acceptance claim is added.

Human Experience Review is required agent work during P3 coverage and closeout. The agent must inspect the actual native resource lists, allowed reads, denied-read errors, and any new launch or help text. Record per-promise observations, conclusions, limits, and next actions in the [P3 evidence](evidence.md#w24-r0-p3-resources-and-transports) under the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md). Keep this review separate from the four testing types. No owner response gate is added. P4 retains the wider integration, compatibility, and performance review.

## Source PRD Docs

- [PRD 25: TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39: CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Stage 1 - Resource Scope

### Tasks

- [x] t1: Add explicit profile metadata for every native system resource in the upstream catalog and validate URI coverage.
- [x] t2: Dogfood the validated catalog and schema into this repo's `.make-docs/` instance.
- [x] t3: Filter native `resources/list` and reject out-of-profile `resources/read` while preserving allowed bytes and provenance.
- [x] t4: Reserve the Backlog Review UI resource for `backlog` and `all` and keep its implementation with the separate app package.

### Acceptance criteria

- A6: Every native resource has a nonempty explicit assignment. Metadata covers the exact provider URI inventory, and `all` is the exact union.
- A7: Allowed native reads return identical bytes, media type, and provenance in narrow and `all` profiles. The CLI inventory, canonical list/read results, and existing core resource tools remain unchanged.
- A8: Out-of-profile native reads fail before byte resolution and return no resource content. The error gives the selected profile and a resource-list recovery path.

See [P3 acceptance evidence](evidence.md#p3-acceptance-evidence). A6 through A10 are new case IDs; A1 through A5 remain owned by P2.

### Dependencies

- [P2](02-filtered-tool-discovery.md).

### Closeout Notes

The catalog, schema, and resource contract were authored upstream and copied exactly into dogfood. A6–A10 passed. Agent review found no remaining issue with actual lists, allowed reads, denial recovery, final help, or the guide text. CLI/common resource tools and allowed bytes/source data are preserved. App UI registration and rendering remain with W25.

## Stage 2 - Required Transport

### Tasks

- [x] t5: Record the stdio decision and bounded W25 context. Check the new P3 local stdio lists, allowed reads, and denied reads in its own evidence. All selected checks passed.
- [x] t6: Dispose of conditional HTTP work as not-needed at this closeout. No supported host has a confirmed HTTP need. No HTTP adapter or fixed HTTP path was implemented or tested.
- [x] t7: Keep stdio as the default. Default and explicit `all` passed the same wire checks. HTTP loopback, route startup, and teardown checks are not-needed because HTTP was not implemented.

### Acceptance criteria

- A9: The current stdio decision retains the W25 proof's exact commit, host version, scope, and limits. The default and named profiles prove the new P3 resource behavior. Default and `all` remain equal. P2 tool counts are unchanged. The future Backlog Review UI is absent from live lists and reads.
- A10: Agent review records observations, conclusions, limits, and next actions for actual resource lists, allowed reads, denied-read errors, guide changes, and built help. The source resource contract and its dogfood copy have equal bytes.
- If HTTP is implemented, no route can override its fixed profile from a call argument.
- HTTP, if present, has the same tool and resource contracts as the matching stdio profile.
- Transport choice does not widen caller identity, Store access, or write permission.

### Dependencies

- Stage 1 and the current stdio decision. HTTP tasks also require a later confirmed need from a supported host.

### Closeout Notes

The completed transport claim is local stdio. HTTP was not needed or implemented. The full suite passed before three help-string corrections. Focused help tests, the final build, final stdio replay, and agent review passed after those corrections. No runtime test was repeated for this document closeout.

P4 preflight is next under separate authority. P4 implementation also needs separate authority. W24 remains incomplete. The app package owns UI behavior and `ui/message` content. This closeout claims no push, release, public deployment, fresh installed-host acceptance, or app completion.
