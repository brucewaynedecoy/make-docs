---
title: "W24 R0 P4 Compatibility And Validation"
kind: "plan"
status: "draft"
coordinate: "W24 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-09-24-mcp-tool-profiles.md"
---
# Phase 4: Compatibility And Validation

## Purpose

Prove that grouping changes discovery without changing operation behavior or the current full connection.

## Deterministic Checks

Build a fixture from the ready tool and native-resource inventories. Reject missing, empty, or unknown assignments. Compare the set for `all` to the exact union of the five named profiles. Compare repeated tool contracts by name, schema, description, access facts, and handler identity. Compare allowed resource bytes and provenance across profiles. Reject out-of-profile reads and calls. Keep the current operation-registry parity check in place.

Run representative Store-free reads and write-class calls with and without `allowWrite`. The same operation must return the same result or typed access error independent of profile. Do not turn a Store denial into an apparent profile authorization success or a global task stop.

## Compatibility Checks

Capture `tools/list` and `resources/list` from current `make-docs mcp` at a fixed package build. Replay the same single-server launch after implementation. Compare names and contracts for the `all` default. Check the CLI help, `--profile` values, an invalid value, and stdio startup. If HTTP is needed, check all six route paths with the same MCP client test harness. Do not infer host support from a successful local server test alone.

## Characterization Packet

Record one bounded comparison with the same machine, package build, host mode, and workload for `all` and each narrow profile. Capture unique tool count, native resource count, serialized tool-definition bytes, and actual model-visible tokens where the host exposes that measure. Capture cold startup and warm `tools/list` and `resources/list` elapsed time with a small fixed repeat count and observed range. Separate stdio and HTTP results. Do not claim token savings from endpoint count alone. No pass/fail latency threshold is set by this package.

This is a `characterize-now` performance profile owned by W24 plan/work. Give it a stable `PERF-###` identity when execution begins, with a finite run budget, environment fingerprint, comparability rule, and expiry decision under the [performance contract](../../../.make-docs/system/contracts/performance-evidence-governance.md). The measurements do not create product support claims.

## Human Experience Review

Inspect real CLI help, one current single-server configuration, one narrow configuration, the profile lists, and unknown or out-of-profile errors. For each accepted promise, record the observed result, conclusion, limit, and next action. A maintainer can confirm task-name clarity and recovery without reading internal IDs first. This is an agent review. Human feedback is optional.

## Testing Decisions

| Type | Current decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Needed | Set, parity, access, resource, and startup invariants are deterministic. |
| Performance Testing | `characterize-now` | Context size and discovery latency inform the design claim. |
| Guided Progress Review | Needed at final review | CLI help, host setup, and errors are human-facing. |
| Unassisted Goal Testing | `not-needed-now` | Current questions can be answered by direct inspection and bounded probes. Revisit if real users cannot select a profile from the published help. |

## Completion Boundary

Run PRD authority validation and documentation link checks. Record exact commands, results, host limits, and any later obligation. Do not mark the app's separate review, publication, or task creation behavior complete from W24 evidence. Do not stage, commit, install, or change a host configuration as part of this planning package.
