---
title: "W27 R0 GitHub Copilot Support Work Backlog"
kind: "work"
status: "draft"
coordinate: "W27 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "The queue follows the accepted plan and the active PRD after P1 reconciliation."
  coordinate_handoff: "Use W27 R0 P1-P3 for task and evidence records."
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# W27 R0 GitHub Copilot Support Work Backlog

## Purpose

Provide a reviewable queue for [the W27 design](../../designs/2026-10-24-w27-r0-github-copilot-cli-and-app-support.md) and [plan](../../plans/2026-10-24-w27-r0-github-copilot-support/00-overview.md). P1 updated [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) before P2 source edits. The owner approved one managed CLI MCP entry. App-added entries stay user-owned. The implementation and its proof remain in progress.

## Human Experience Trace

| Promise | Phase | Observable result | Evidence |
| --- | --- | --- | --- |
| One reviewed setup with clear scope | P1-P2 | Preview names one native entry, Store scope, and exact change | Redacted preview and diff |
| Truthful CLI and app state | P2-P3 | Each client has its own verified status and recovery action | Real client tool and call trace |
| Store denial leaves resource work available | P3 | Denied Store call has one action; resource read still works | Allowed, denied, and resource trace |
| Setup finishes with clear manual work | P4 | A safe MCP block names the pending harness and prints the exact local entry | CLI setup trace and redacted evidence |

No deferred obligation ID is assigned. P3 must route any accepted unfinished promise through the normal obligation process.

## Phase Map

1. [P1 Contract and native probe](01-contract-and-native-probe.md).
2. [P2 Setup and lifecycle](02-setup-and-lifecycle.md).
3. [P3 Installed-client proof](03-installed-client-proof.md).
4. [P4 Setup completion and 2.0.5 readiness](04-setup-completion-and-205-readiness.md).

## Usage Notes

Follow the phases in order. P1 uses read-only installed-client checks and disposable settings. P2 follows the PRD text accepted after P1. P3 reports CLI and app outcomes separately. A blocked app result does not become a CLI failure; a CLI pass does not become an app pass.

Automated Implementation Testing is required. Performance Testing is `not-needed-now` because this wave sets no time target. Guided Progress Review is needed at the P1 and P3 gates. Unassisted Goal Testing is `not-needed-now` until P3 sees a real setup flow; revisit then. Human Experience Review is required for the direct promises.

## Intended Follow-On

- Route: finish P4 after the direct P3 client proof.
- Next step: Check safe partial setup, manual MCP instructions, platform selection, CLI copy, and version 2.0.5.
- Why: A blocked native entry must leave the project ready with a clear next action.
- Coordinate Handoff: Use W27 R0 for all phase evidence. Keep commit, push, PR, and installed connection changes as separate actions.
