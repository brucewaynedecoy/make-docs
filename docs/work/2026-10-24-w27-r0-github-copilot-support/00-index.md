---
title: "W27 R0 GitHub Copilot Support Work Backlog"
kind: "work"
status: "complete"
coordinate: "W27 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "P1–P4 are complete in the owner-accepted macOS client scope. Release review retains the untested limits."
  coordinate_handoff: "Keep app-added entry conflicts and Windows/Linux Copilot clients outside the tested 2.0.5 claim."
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# W27 R0 GitHub Copilot Support Work Backlog

## Purpose

Provide a reviewable queue for [the W27 design](../../designs/2026-10-24-w27-r0-github-copilot-cli-and-app-support.md) and [plan](../../plans/2026-10-24-w27-r0-github-copilot-support/00-overview.md). P1 updated [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) before P2 source edits. The owner approved one managed CLI MCP entry. App-added entries stay user-owned. The source and macOS CLI and app proof merged as PR #42. On 2026-10-26, the owner accepted a bounded W27 closeout: P1 t2 and P3 t4 are discharged by scope decisions, not passed tests.

## Human Experience Trace

| Promise | Phase | Observable result | Evidence |
| --- | --- | --- | --- |
| One reviewed setup with clear scope | P1-P2 | Preview names one native entry, Store scope, and exact change | Redacted preview and diff |
| Truthful CLI and app state | P2-P3 | Each client has its own verified status and recovery action | Real client tool and call trace |
| Store denial leaves resource work available | P3 | Denied Store call has one action; resource read still works | Allowed, denied, and resource trace |
| Setup finishes with clear manual work | P4 | A safe MCP block names the pending harness and prints the exact local entry | CLI setup trace and redacted evidence |

No deferred obligation ID is assigned. The untested app-owned conflict and Windows/Linux client paths are outside the accepted macOS support claim. A later expanded claim needs its own direct proof.

## Phase Map

1. [P1 Contract and native probe](01-contract-and-native-probe.md).
2. [P2 Setup and lifecycle](02-setup-and-lifecycle.md).
3. [P3 Installed-client proof](03-installed-client-proof.md).
4. [P4 Setup completion and 2.0.5 readiness](04-setup-completion-and-205-readiness.md).

## Usage Notes

Follow the phases in order. P1 uses read-only installed-client checks and disposable settings. P2 follows the PRD text accepted after P1. P3 reports CLI and app outcomes separately. A blocked app result does not become a CLI failure; a CLI pass does not become an app pass.

Automated Implementation Testing is required. Performance Testing is `not-needed-now` because this wave sets no time target. Guided Progress Review is needed at the P1 and P3 gates. Unassisted Goal Testing is `not-needed-now` until P3 sees a real setup flow; revisit then. Human Experience Review is required for the direct promises.

## Intended Follow-On

- Route: 2.0.5 release review.
- Next step: Review the [release notes](../../assets/project/2026-10-24-v2.0.5-release-notes.md) and [security review](../../assets/project/2026-10-24-v2.0.5-security-review.md) with the tested macOS Copilot scope and named limits.
- Why: The owner accepted W27 closeout without tested app-owned collision or Windows/Linux Copilot client claims.
- Coordinate Handoff: Keep P1 t2 and P3 t4 as scope dispositions, not test passes. Any expanded client claim, installed connection change, or publication needs separate authority.

## 2.0.5 Release Scope Decision

On 2026-10-26, the owner accepted macOS as the tested GitHub Copilot client scope for the 2.0.5 release review. The owner then directed bounded W27 closeout. P1 t2 is discharged because a user-created app-owned same-name entry is outside the claimed app path. P3 t4 is discharged because direct Windows and Linux Copilot client tests cannot be completed before release. Neither task records a passed test. CI contract checks do not support a tested Windows or Linux Copilot client claim. PRD 28 still blocks a `current` app claim when an app-owned same-name entry or unknown source exists. This decision does not publish 2.0.5.
