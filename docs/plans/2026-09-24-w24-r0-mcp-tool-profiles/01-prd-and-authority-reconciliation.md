---
title: "W24 R0 P1 PRD And Authority Reconciliation"
kind: "plan"
status: "draft"
coordinate: "W24 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-09-24-mcp-tool-profiles.md"
---
# Phase 1: PRD And Authority Reconciliation

## Purpose

Place current profile requirements in the PRDs that already own MCP exposure and operation metadata.

## Authority Decisions

| Candidate | Decision | Owner and reason |
| --- | --- | --- |
| Profile names, default `all`, stdio compatibility, HTTP route, scoped resources, and profile errors | `update-existing` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) owns MCP runtime and transport boundaries. |
| Explicit descriptor metadata, complete assignment, union, and cross-profile contract identity | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) owns registry derivation and parity. |
| Backlog Review widget layout, report review, and publication semantics | `none` | The separate app package owns this behavior. W24 supplies only its profile and resource seam. |
| New MCP profile PRD | `none` | Current PRDs 25 and 39 are coherent owners. A new editorial PRD would split authority. |
| PRD index and risk register | `none` | Existing PRD identities and navigation stay the same. The profile package found no separate current risk that needs a register entry. |

## Current Product Contract

The registry remains canonical for operation identity, access, CLI projection, and derived MCP tools. MCP profiles filter exposure only. The `all` profile is the exact union, and the default stdio launch preserves the existing one-server configuration. Every ready tool and native resource has an explicit nonempty profile set. Profile selection does not grant access or alter core invocation.

PRD 25 owns the observable human outcomes: a task-named selection, a full compatible default, clear invalid-profile errors, and the same permissions and results. PRD 39 owns completeness and contract-identity rules for registry-derived descriptors. Backlog cache tools belong to `backlog` by intent despite Store use.

## Requirement History And Scope

No requirement-history entry is needed for this additive profile contract. The default `all` exposure preserves the prior full catalog. Keep current requirements inline and preserve all existing PRD text outside the profile sections. The separate Backlog Review package may update PRD 51; W24 does not edit that owner.

## Human Experience And Testing

The direct effect is profile selection and predictable compatibility. P4 tests the visible CLI help, host example, profile lists, errors, and actual access results. No human acceptance gate is defined. Automated Implementation Testing is needed for assignment and transport invariants. Performance Testing is a bounded characterization. Guided Progress Review can inspect the final help and example. Unassisted Goal Testing is `not-needed-now` because current profile selection and compatibility questions are answerable with direct inspection and deterministic probes.

## Acceptance

- PRD 25 and PRD 39 state current normative requirements inline.
- Each candidate has the decision and owner shown above.
- PRD validation passes before work consumes the edited authority.
- No W23 R0 or app package file is changed by this phase.
