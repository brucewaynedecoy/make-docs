---
title: "Phase 4: Compatibility And Evidence"
kind: "work"
status: "draft"
coordinate: "W24 R0 P4"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---
# Phase 4: Compatibility And Evidence

## Purpose

Prove profile completeness, old-connection compatibility, access invariance, and actual discovery effects.

## Overview

Compare `all` against the existing single-server launch. Compare each narrow profile against its explicit assignments. Record bounded context and latency characterization. Keep app-specific review and publication outside this phase.

## Human Experience Outcome

A person can choose a group from help, retain an existing full connection, and understand a rejected profile or resource. Evidence is the actual CLI, MCP, and host result. The agent records an observation, conclusion, limit, and next action for each promise.

## Current Testing Decisions

- Automated Implementation Testing: needed for the exact union, contract identity, permission invariance, resources, and compatibility.
- Performance Testing: `characterize-now` for serialized and model-visible tool context plus startup and discovery time. Use a finite `PERF-###` packet at execution.
- Guided Progress Review: needed for CLI help, host example, and errors.
- Unassisted Goal Testing: `not-needed-now`; reopen only if observed profile selection remains unclear after direct review.
- Human Experience Review: required agent review of the actual help, connection, lists, and errors; optional human feedback is not a gate.

## Source PRD Docs

- [PRD 25: TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39: CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Stage 1 - Contract And Access Proof

### Tasks

- [ ] t1: Prove tool and resource assignment completeness and exact `all` union with the current inventory.
- [ ] t2: Prove shared names, schemas, descriptions, access facts, handlers, resource bytes, and provenance agree across profiles.
- [ ] t3: Run representative Store-free and write-class operations through each relevant profile and compare allowed and denied outcomes.
- [ ] t4: Replay the current `make-docs mcp` one-server configuration against the new default.

### Acceptance criteria

- No ready tool or native resource lacks a valid profile.
- The existing full configuration lists the same current tools and system resources with compatible contracts.
- Profile selection never changes authorization, write access, or operation behavior.
- Unsupported profile, hidden tool, and out-of-profile resource failures are clear and bounded.

### Dependencies

- [P2](02-filtered-tool-discovery.md) and [P3](03-resources-and-transports.md).

### Closeout Notes

Record exact inventory versions and access limitations. A Store denial stops only its probe.

## Stage 2 - Context, Latency, And Experience

### Tasks

- [ ] t5: Create a finite `PERF-###` characterization packet with host, build, workload, repeats, budget, comparability, and stop rule.
- [ ] t6: Measure unique tool and resource counts, definition bytes, actual model-visible context where available, and startup or discovery times for `all` and each narrow profile.
- [ ] t7: Review the real help, configuration examples, profile lists, and errors against each Human Experience promise.
- [ ] t8: Run PRD authority and documentation checks and record supported conclusions and limits.

### Acceptance criteria

- Measurements identify the host mode and do not claim token savings from endpoint count alone.
- The agent review records observation, conclusion, limit, and next action per promise.
- PRD authority validation and link checks pass for the final package.
- Closeout does not claim the separate Backlog Review app is complete.

### Dependencies

- Stage 1 and a fixed measurement environment.

### Closeout Notes

Do not convert a characterization baseline into a product target without separate authority.
