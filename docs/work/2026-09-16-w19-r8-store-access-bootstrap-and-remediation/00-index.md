---
title: "W19 R8 Store Access Bootstrap and Remediation Work Backlog"
kind: "work"
status: "completed"
coordinate: "W19 R8"
source:
  type: "plan"
  path: "docs/plans/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/00-overview.md"
follow_on:
  route: "separate-commit-review"
  why: "W19 R8 P1 is complete. Commit, push, publish, and release remain separate owner actions."
  coordinate_handoff: "Keep the Performance Evidence projection failures with their owning backlog."
---

# W19 R8 Store Access Bootstrap and Remediation Work Backlog

## Purpose

Preserve the completed implementation record for the setup and Store-access correction. This backlog supersedes the unimplemented W19 R7 backlog. It keeps all code, guidance, proof, and review work in one phase.

The owner authorized P1 implementation on 2026-09-16. The phase remains open until every close rule passes.

## Remediation Execution Rule

This work repairs the Make Docs CLI and Store-access path. Store access, MCP access, harness receipts, Store-backed lifecycle state, and successful setup are not prerequisites.

A missing or unreachable Store is expected evidence. It must not stop source work, tests, package construction, isolated-home proof, or review. The agent must not ask the user to repair Make Docs before the agent repairs it. The agent must not create a local operational fallback.

The agent can stop only for a real safety risk, missing authority, missing required source material, a required product choice, or an environment fault that also prevents isolated proof.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| HX-1: normal installed launcher verifies or gives exact repair detail | [Design](../../designs/2026-09-16-store-access-bootstrap-and-remediation.md) and [plan](../../plans/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/00-overview.md) | [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), and [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | [P1](01-store-access-bootstrap-and-remediation.md) | Automated link matrix and isolated installed transcript | Exact candidate passes V1 and V2 | None |
| HX-2: independent setup subplans keep valid results | Design and plan above | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 08](../../prd/08-skills-catalog-and-distribution.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | P1 | Fault-injected integration and package proof | Exact candidate passes V3 and V4 | None |
| HX-3: setup and upgrade are safe to run again | Design and plan above | [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), PRD 38, and PRD 39 | P1 | Upgrade and recovery matrix | Exact candidate passes V9 and V10 | None |
| HX-4: no Store configuration remains valid | Design and plan above | PRD 25, PRD 38, and PRD 39 | P1 | Store-open spy and agent continuation transcript | Exact candidate passes V5 | None |
| HX-5: Store errors are typed and scoped | Design and plan above | PRD 25, PRD 38, and PRD 39 | P1 | Human, JSON, MCP, and agent parity | Exact candidate passes V6 | None |
| HX-6: mid-task access retries only the affected operation | Design and plan above | PRD 28 and PRD 39 | P1 | Active-task before/setup/refresh/retry transcript | Exact candidate passes V7 | None |
| HX-7: generic MCP clients receive bounded setup | Design and plan above | PRD 25 and PRD 28 | P1 | Identity, ceiling, rotation, removal, and file-preservation proof | Exact candidate passes V8 | None |
| HX-8: remediation never depends on the broken Store path | Design and plan above | PRD 10 and PRD 39 | P1 | Store-off implementation and package transcript | No Store-based work gate appears | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-store-access-bootstrap-and-remediation.md](01-store-access-bootstrap-and-remediation.md) | Implement and prove the complete correction through four ordered stages inside one phase. |

## Usage Notes

- Read and execute the one phase in stage order.
- Do not run the W19 R7 backlog separately. W19 R8 contains its remaining required work.
- Do not use Make Docs Store or MCP access as a phase admission check.
- Use jcodemunch and jdocmunch when available. Refresh stale indexes before direct fallback reads.
- Preserve unrelated worktree changes. Stage and commit only through separate authority.
- Use temporary homes, Store roots, and project copies for candidate proof.
- Build one exact tarball after source tests pass. Use that same identity for every installed acceptance case.
- Create `evidence.md` during implementation. Add case folders only for durable captures that the report cannot link elsewhere.
- Keep D-034, D-035, and D-038 open until the accepted implementation record meets their close rules.
- Human Experience Review is agent-owned. Human feedback is optional and non-blocking.

## Intended Follow-On

This handoff is authoritative unless the user overrides it. It does not authorize a commit, push, publish, or release.

- Route: `separate-commit-review`.
- Next step: Review the completed [W19 R8 P1](01-store-access-bootstrap-and-remediation.md) result. Use separate authority for any commit, push, publish, or release.
- Why: The exact W19 R8 package and installed matrix pass. The owner accepted a bounded exception for failures owned by the separate Performance Evidence backlog.
- Coordinate Handoff: Keep those projection failures with their owning backlog. Do not reopen W19 R8 unless its implementation or supported claims change.
