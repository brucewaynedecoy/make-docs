---
title: "Phase 3: Resources And Transports"
kind: "work"
status: "draft"
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

## Current Transport Decision

Stdio is the current selected transport. Keep `make-docs mcp` and its `all` default. HTTP work is conditional on a later confirmed need from a supported host.

Reuse the recorded W25 R0 P2 stdio proof as bounded context. Its source is commit `0c112e57fb0c197105c4eabe9d60395f772ab198` on `w25-r0-p1-live-delivery-contract`, file `docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md`, heading `P2 Current Evidence`. It used `ui://make-docs/host-proof/v1.html` in Claude Desktop 2.16120.0. It proved resource open, a page tool call, fixed message delivery after host Send, safe text, and missing-bridge fallback. It did not need an HTTP MCP adapter. It did not test one. The loopback fallback was an ordinary page check, not MCP over HTTP.

At the 2026-10-03 preflight, that commit was not an ancestor of this W24 branch. This recorded result does not prove the new W24 resource filters, a fresh installed-host path, or production use. t5 must still check the P3 stdio path. See the [P3 transport plan](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/03-resources-and-transports.md#stdio-and-http) for the evidence limits. The current draft W25 work file does not replace the completed record at the named commit. App implementation remains with W25.

## Human Experience Outcome

A person who chooses `backlog` can open the Backlog Review UI resource when the app package lands. A person who chooses another profile sees only relevant resources and gets a clear out-of-profile read error. Evidence is native resource list/read through each profile.

## Current Testing Decisions

- Automated Implementation Testing: needed for resource assignment coverage, union, read enforcement, byte parity, and stdio behavior. HTTP route and loopback checks apply only if HTTP is needed and implemented.
- Performance Testing: `not-needed-now` in P3. P4 owns performance evidence and measures HTTP only if it is implemented.
- Guided Progress Review: needed if new launch or help text or a host example is exposed.
- Unassisted Goal Testing: `not-needed-now`; profile and resource probes answer current questions.

Human Experience Review is required agent work during P3 coverage and closeout. The agent must inspect the actual native resource lists, allowed reads, denied-read errors, and any new launch or help text. Record per-promise observations, conclusions, limits, and next actions in the [central evidence](evidence.md) under the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md). Keep this review separate from the four testing types. No owner response gate is added. P4 retains the wider integration, compatibility, and performance review.

## Source PRD Docs

- [PRD 25: TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39: CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Stage 1 - Resource Scope

### Tasks

- [ ] t1: Add explicit profile metadata for every native system resource in the upstream catalog and validate URI coverage.
- [ ] t2: Dogfood the validated catalog and schema into this repo's `.make-docs/` instance.
- [ ] t3: Filter native `resources/list` and reject out-of-profile `resources/read` while preserving allowed bytes and provenance.
- [ ] t4: Reserve the Backlog Review UI resource for `backlog` and `all` and keep its implementation with the separate app package.

### Acceptance criteria

- Every native resource has a nonempty explicit assignment, and `all` is the exact union.
- Allowed resources return identical bytes and provenance in narrow and `all` profiles.
- Out-of-profile reads fail without exposing resource bytes.
- The CLI resource inventory and resolver behavior remain unchanged.

### Dependencies

- [P2](02-filtered-tool-discovery.md).

### Closeout Notes

Do not author shipped catalog metadata directly in the installed dogfood copy. Before P3 closeout, record agent review of the actual native resource lists, allowed reads, and denied-read errors in the central evidence. Keep the app UI implementation with W25.

## Stage 2 - Required Transport

### Tasks

- [ ] t5: Record the current stdio decision and reuse the bounded W25 R0 P2 host proof. Check the new P3 stdio resource lists, allowed reads, and denied reads within their own evidence scope. Confirm a later supported-host need before activating HTTP work.
- [ ] t6: Only if a supported host has a confirmed HTTP need, expose the six fixed `/mcp/<profile>` paths through the same factory and access policy.
- [ ] t7: Keep stdio as the default. Only if HTTP is implemented, check its default loopback bind and route startup and teardown for local use.

### Acceptance criteria

- The current stdio decision is recorded with the W25 host proof's exact commit, host version, scope, and limits. P3 proves its own filtered resource behavior.
- If HTTP is implemented, no route can override its fixed profile from a call argument.
- HTTP, if present, has the same tool and resource contracts as the matching stdio profile.
- Transport choice does not widen caller identity, Store access, or write permission.

### Dependencies

- Stage 1 and the current stdio decision. HTTP tasks also require a later confirmed need from a supported host.

### Closeout Notes

Record whether HTTP work was needed and implemented. If it was not needed, keep the completed transport claim to stdio. Agent review at P3 closeout must include any new launch or help text. P4 owns the wider integration, compatibility, and performance review. Public deployment is a separate release decision. The app package owns UI behavior and `ui/message` content.
