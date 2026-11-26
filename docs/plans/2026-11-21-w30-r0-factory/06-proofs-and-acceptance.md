---
title: "W30 R0 P6 Proofs and Acceptance"
kind: "plan"
status: "draft"
coordinate: "W30 R0 P6"
source:
  type: "design"
  path: "docs/designs/2026-11-21-factory.md"
---

# W30 R0 P6 Proofs and Acceptance

## Purpose

Prove the factory with real tools on an installed package, without tying the product to those tools.

## Outcome

Two capability proofs pass on one package candidate, and their evidence names the real tools used.

## Scope

- Proof A, smallest setup: one harness, its own subagents, and "wait in session". Run a staged backlog of at least two units through build then review, including one correction.
- Proof B, multi-tool setup: a multiplexer plus a human channel that the person can use from a phone. Run one lead and specialists unit and one escalation that the person answers away from the session.
- The owner picks the real tools at test time. The evidence and release notes name them. Support claims name only the combinations tested.
- Drift test: remove a wired tool and show the blocked state and the fix step before new work.
- Outside-git test: run a unit in a folder without git and show the backup, its cleanup, and the backup folder note.
- Package and installed parity for the Skills, resources, and operations.
- Human Experience Review for each promise in the plan overview. Reassess Unassisted Goal Testing for first setup.
- Record evidence in the work backlog's `evidence.md`.
- New on 2026-11-23: tag each proof case with the capability IDs it exercised and the tool versions; run a version drift test; scan factory records for never-log items.

## Exclusions

- No release or publish action without separate owner authority.

## Acceptance

- Every plan validation item has recorded evidence or a named limit.

## Dependencies

- P2 to P5 and one identified package candidate.
