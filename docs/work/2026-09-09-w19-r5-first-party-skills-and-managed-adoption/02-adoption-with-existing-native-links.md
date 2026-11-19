---
title: "Phase 2: Adoption With Existing Native Links"
kind: "work"
status: "completed"
coordinate: "W19 R5 P2"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 2: Adoption With Existing Native Links

## Purpose

Repair reviewed Skill adoption for a project that already exposes its first-party Skills through native links, such as `.claude/skills/<name>` → `../../.agents/skills/<name>`. P1 delivered adoption, but its apply step rejected those projects with `ownership-unverified`: "Invalid predeclared native copy fallback."

Revises: [P1](01-skills-and-managed-adoption.md)

## Overview

This is a revision Phase, chosen by the owner on 2026-11-18. P1 is complete and committed. The fix changes one P1 result: adoption of existing copies when native links already exist. It reverses no approach, redoes no other completed Phase, and needs no design or multi-phase plan.

The adoption builder declared a copy fallback for every native link exposure. The detached-plan validator and the executor accept a fallback only for a planned step that creates a link from a missing path. An unchanged existing link has no planned change, so the validator rejected its fallback. Adoption now keeps a fallback only for a planned missing-to-link step. That covers new links and outdated native folders that are removed and then linked. Existing links stay links. No tracked link becomes a plain copy.

The defect is recorded as D-053 on the W28 R0 branch (PR #64). The released `make-docs` 2.0.8 has the same defect.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. A maintainer with a checked-in project that has native Skill links can review and apply adoption, and the installed Skills then match the packaged Skills.
- **Intended human outcome:** a `setup skills --adopt-existing … --review <digest> --yes` run completes. It keeps `.claude/skills/<name>` as links and backs up any replaced bytes.
- **Human-facing surface:** `make-docs setup skills` adoption output and the installed Skill trees.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing, plus real built-CLI adoption in a throwaway project and a dry run in this checkout.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

The governing requirements are [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) R-SKILL-ADOPT-2 and R-SKILL-ADOPT-3, which require adoption to review and reconcile file and link identities. Those requirements already state the correct behavior, so no PRD change is needed.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Add a regression test for adoption with existing native links, plus the focused Skill tests, `npm test`, `validate:defaults`, the build, and `smoke:pack:local`. |
| Performance Testing | not-needed-now | The fix only skips declaring a fallback. No performance decision depends on it. |
| Guided Progress Review | not-needed-now | Real built-CLI adoption runs settle the outcome. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md) (R-SKILL-ADOPT-CMD-1 and -2, unchanged)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- D-053 on the W28 R0 branch (PR #64)

## Stage 1 - Existing Native Links

### Tasks

- [x] t1: Add `packages/cli/tests/w19-r5-skill-adoption-existing-links.test.ts`. Build a throwaway project with `.agents/skills/preflight` and a relative `.claude/skills/preflight` link. Confirm that applying a reviewed adoption fails with "Invalid predeclared native copy fallback" before the fix.
- [x] t2: In `packages/cli/src/skills-adoption.ts`, declare a copy fallback only when the native exposure path is currently missing.
- [x] t3: Run the focused tests, `npm test`, `validate:defaults`, the build, and `smoke:pack:local`, plus a real built-CLI adoption in a throwaway project and an adoption dry run in this checkout.
- [x] t4: Keep the copy fallback when adoption replaces an outdated native folder with a link, by pruning fallbacks to planned missing-to-link steps after the plan is built. Add tests for a refused link, which must use the copy mirror, and for an allowed link.

### Acceptance criteria

- A15: Reviewed adoption of a project whose `.claude/skills/preflight` already links to `.agents/skills/preflight` completes. The link keeps its target, and a repeat review reports `unchanged`.
- A16: An outdated linked copy is refreshed with a backup of the replaced bytes, and the link still resolves to the refreshed canonical copy.
- A17: A native link that the plan creates still has its declared copy fallback, so the platform fallback for unavailable links is preserved.
- A18: When adoption replaces an outdated native folder with a link and the host refuses the link, adoption completes with the declared copy mirror. The replaced folder bytes are backed up. When links are allowed, the folder becomes a link.

### Dependencies

- P1 is complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. See the [evidence](evidence.md#p2-adoption-with-existing-native-links). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: In a throwaway project, the adoption output reports a ready plan, applies it, and leaves the native links in place, so the maintainer path works without manual Store or file edits. Limit: Windows link behavior is not exercised here.
- Optional experience handoff: run `make-docs setup skills --adopt-existing <skills> --dry-run` in a project with `.claude/skills` links, then apply with the printed `--review` digest. Notice that the links stay links. Feedback is optional.
- Explicit human acceptance gate: none.
- Evidence report: [P2 Adoption With Existing Native Links](evidence.md#p2-adoption-with-existing-native-links).
- Phase / capability status: Phase complete on commit. Capability complete for this defect.
