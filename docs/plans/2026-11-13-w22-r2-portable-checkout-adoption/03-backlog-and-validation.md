---
title: "W22 R2 Phase 3 Backlog and Validation"
kind: "plan"
status: "active"
coordinate: "W22 R2 P3"
source:
  type: "plan"
  path: "docs/plans/2026-11-13-w22-r2-portable-checkout-adoption/00-overview.md"
---

# Phase 3: Backlog and Validation

## Purpose

Turn the reconciled PRDs into an implementation queue and verify the document handoff.

## Scope

Create `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/` with an index and three phase files. Phase 1 owns adoption state and Store binding. Phase 2 owns saved choices, file and block ownership, conflict resolution, and dry-run review. Phase 3 owns the two-Store package regression, negative cases, coverage pass, Human Experience Review, and guide decision. Each task cites current PRD requirements and has an observable acceptance criterion.

Keep the three resource-file causes open if their source bytes remain unavailable. Their safe default is project-owned. The backlog must include tests for empty Store B, valid bound-without-ledger Store B, malformed config, changed files and blocks, unsafe paths, competing claims, stale plan, repeat setup, CLI/MCP parity, and unchanged git content. It must not prescribe a live Store repair or claim a new package release.

The 2.0.7 release check also covers plain setup on Store B. Plain setup must stop before writes and offer adopt, normal setup, and cancel when interactive. `setup --yes` must return blocked with `make-docs setup --adopt --yes` as the next action. Dry run must offer the same choice or block without writing. The two-Store test must then prove explicit adoption keeps the project ID and leaves git clean.

The implementation backlog must include a CLI version bump. The publishable package is currently `2.0.6`; the next patch candidate is `2.0.7`. Update workspace lock entries through the supported package process and prove the built package reports the new version. A version bump is part of implementation proof, not a claim that publication occurred.

## Validation

For the 2.0.8 patch, add a post-adopt phase to the active W22 R2 work. Test a two-Store clone with selected harnesses and changed valid routers and resources. Compare the adopt plan with the first bare saved-choice dry run. Check clean compatibility, only `noop` actions, no `skip-conflict`, the original project ID, and clean git. Test that a later edit to an adopted project-owned file still needs review. Check audit and Store ownership claims against the saved hashes. Record the packaged result and version in the evidence report.

Run the PRD authority validator after the backlog exists. Check every plan-to-PRD-to-work link, frontmatter, task checkbox, phase-local task ID, and plain acceptance bullet. Record any gap in D-050 or the work package. The implementation gate is a validated backlog, not a document-only completion claim for the product bug.
