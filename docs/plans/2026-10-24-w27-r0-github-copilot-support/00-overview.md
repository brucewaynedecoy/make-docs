---
title: "W27 R0 GitHub Copilot Support Plan"
kind: "plan"
status: "draft"
coordinate: "W27 R0"
follow_on:
  route: "prd-maintenance"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The active harness PRD must own Copilot support before implementation."
  coordinate_handoff: "Carry W27 R0 into PRD changes and P1-P3 work."
source:
  type: "design"
  path: "docs/designs/2026-10-24-w27-r0-github-copilot-cli-and-app-support.md"
---

# W27 R0 GitHub Copilot Support Plan

**Date:** 2026-10-24

**Repository:** `make-docs`

## Purpose

Plan a first-party local MCP setup path for GitHub Copilot CLI and the GitHub Copilot app. Use the [design](../../designs/2026-10-24-w27-r0-github-copilot-cli-and-app-support.md) as the proposal. This package is for review. It does not authorize implementation or a native connection change.

## Objective

One reviewed Copilot setup must produce one owned MCP entry and separate, truthful CLI and app status. Each live client must prove tool discovery, allowed Store use, denial, and recovery before its support label changes.

## Governing Invariant

The active native entry and current Store grants decide access. A prior receipt, client label, process count, or detected executable does not grant access. Unknown and user-owned configuration stays intact.

## Coordinate Decision

W27 R0 is a new wave. W26 R0 delivered shared Store access and W26 R1 changed MCP names. This work extends a new harness family after those changes. It is not a W26 revision.

## Maintenance Inputs

- [Design](../../designs/2026-10-24-w27-r0-github-copilot-cli-and-app-support.md).
- [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) for static adapters, setup, grants, and client status.
- [PRD 38](../../prd/38-global-store-and-project-state.md) for current Store evidence and receipt history.
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) for MCP runtime and caller admission.
- [R-021 and R-022](../../prd/03-open-questions-and-risk-register.md) for native path and installed-client proof risks.
- GitHub's [CLI MCP](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers), [CLI reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference), and [app customization](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app) docs. Recheck them during P1 against installed clients.

## Human Experience Propagation

| Promise | Owner | Surface | Phase | Evidence | Obligation route |
| --- | --- | --- | --- | --- | --- |
| One reviewed setup and clear scope | PRD 28 | `make-docs setup` preview and apply | P1-P2 | Redacted preview, native diff, receipt | Complete in W27 R0 |
| Separate, true CLI and app state | PRD 28, PRD 38 | Setup status and recovery text | P2-P3 | Real CLI and app sessions | Complete in W27 R0; blocked client stays blocked |
| Store denial does not stop resource work | PRD 25, PRD 28 | MCP tool and resource calls | P3 | Allowed, denied, and Store-free calls | Complete in W27 R0 |

The agent must review the real setup text and both client flows. Human owner review of this package is a planning gate. It is not a substitute for installed-client proof.

## Active Authority Baseline

PRD 28 admits Codex and Claude Code static adapters and a generic MCP profile. It does not admit Copilot as a first-party adapter. PRD 38 already separates grants, receipts, and current proof. PRD 25 already binds MCP calls to the operation policy.

## Candidate Decision Matrix

| Candidate | Decision | Reason |
| --- | --- | --- |
| Copilot static adapter | Proposed new PRD 28 requirement | New supported harness method |
| Copilot app as second consumer | Proposed PRD 28 requirement | App shares CLI or repository MCP setup |
| New Store schema | No current change | W26 records appear to fit; prove this in P1 |
| New PRD file | None | Existing owners cover the product |
| Copilot skills path | Verify, then update guide if needed | `.agents/skills` is already shared |

## Existing PRDs To Update

- PRD 28: add `github-copilot` MCP adapter, one-entry ownership, CLI/app status, proof and fallback rules.
- PRD 38: update only if P1 finds a missing durable field or access rule. Stop before schema edits and return for product authority if safe records do not fit.
- PRD 25: update only if P1 finds a new caller or MCP admission boundary. Do not weaken existing W26 checks.

Write a dated W27 R0 requirement-history entry for each changed PRD. Update the [user guide](../../assets/user/cli-setting-up-projects-and-harness-access.md) only after native behavior is proved.

## Phase Map

1. [P1 Contract and native probe](01-contract-and-native-probe.md): inspect installed CLI and app behavior; reconcile PRD 28; freeze exact owned entry and fallback.
2. [P2 Setup and lifecycle](02-setup-and-lifecycle.md): implement the static adapter, reviewed setup, status, repair, rotation, and removal.
3. [P3 Installed-client proof](03-installed-client-proof.md): prove CLI and app use, denial, sandbox behavior, packaging, and rollback.

## Output Contract

P1 must leave the active PRD as the product authority before P2 source edits. P2 must keep one source-owned method inventory. P3 must publish redacted, repeatable evidence for each client and platform claim. The [work index](../../work/2026-10-24-w27-r0-github-copilot-support/00-index.md) is a proposed queue until owner review and P1 PRD reconciliation.

## Worker Ownership And Dependencies

One owner can execute each phase in order. P1 owns the PRD and native probe. P2 owns setup code and tests. P3 owns real-client and release evidence. No agent delegation is required. P2 depends on P1's accepted native entry shape. P3 depends on a built package from P2.

## MCP Strategy

Use the existing generic profile for a manual fallback. The proposed static adapter owns a Copilot user MCP entry only after exact review. Do not write repository MCP files, app settings, or secrets into Git. A failed Store or MCP call stops only that operation; continue independent Store-free work.

## Validation

Check PRD ownership and links; run focused setup and policy tests; inspect the packaged executable; compare before and after native JSON; run real CLI and app sessions; test allowed and denied Store calls; test drift, rollback, and removal. Mark a client `blocked` if its real proof is missing. Do not infer app support from CLI support.

Testing decisions: Automated Implementation Testing is required for P2 and P3. Performance Testing is `not-needed-now`; no threshold is proposed. Guided Progress Review is required at the P1 contract and P3 evidence gates. Unassisted Goal Testing is `not-needed-now` until a working human setup flow exists; P3 must revisit that decision from the real result. Human Experience Review is required in P3.

## Intended Follow-On

- Route: `prd-maintenance`, then the [W27 R0 work queue](../../work/2026-10-24-w27-r0-github-copilot-support/00-index.md).
- Next step: Owner reviews this package. P1 then updates PRD 28 and proves the native contract before source edits.
- Why: Current PRD authority names the supported harness set.
- Coordinate Handoff: Use W27 R0 for the PRD delta, phase records, and later code commits. Commit, push, and PR steps remain separate actions.
