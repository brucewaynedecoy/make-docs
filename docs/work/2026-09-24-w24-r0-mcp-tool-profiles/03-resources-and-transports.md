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

## Human Experience Outcome

A person who chooses `backlog` can open the Backlog Review UI resource when the app package lands. A person who chooses another profile sees only relevant resources and gets a clear out-of-profile read error. Evidence is native resource list/read through each profile.

## Current Testing Decisions

- Automated Implementation Testing: needed for resource assignment coverage, union, read enforcement, byte parity, and transport routing.
- Performance Testing: `not-needed` in P3; P4 measures both transports if HTTP lands.
- Guided Progress Review: needed if a new HTTP launch or host example is exposed.
- Unassisted Goal Testing: `not-needed-now`; profile and resource probes answer current questions.
- Human Experience Review: agent inspects the real resource and error results in P4.

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

Do not author shipped catalog metadata directly in the installed dogfood copy.

## Stage 2 - Required Transport

### Tasks

- [ ] t5: Confirm the Backlog Review app host's supported transport and implement Streamable HTTP only if needed.
- [ ] t6: If HTTP is needed, expose the six fixed `/mcp/<profile>` paths through the same factory and access policy.
- [ ] t7: Keep stdio as the default and check that HTTP binds to loopback by default for local use.

### Acceptance criteria

- No route can override its fixed profile from a call argument.
- HTTP, if present, has the same tool and resource contracts as the matching stdio profile.
- Transport choice does not widen caller identity, Store access, or write permission.

### Dependencies

- Stage 1 and a confirmed host need.

### Closeout Notes

Public deployment is a separate release decision. The app package owns UI behavior and `ui/message` content.
