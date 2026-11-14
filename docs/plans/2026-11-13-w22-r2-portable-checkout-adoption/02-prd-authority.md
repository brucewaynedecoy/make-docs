---
title: "W22 R2 Phase 2 PRD Authority"
kind: "plan"
status: "active"
coordinate: "W22 R2 P2"
source:
  type: "plan"
  path: "docs/plans/2026-11-13-w22-r2-portable-checkout-adoption/00-overview.md"
---

# Phase 2: PRD Authority

## Purpose

Make current product requirements state the reviewed adoption behavior.

## Scope

Update PRDs 05, 06, 07, 15, 18, 24, 38, and 39 in their existing owning sections. Keep the portable project ID separate from a local checkout ID and an installed ledger. State how setup registers a new checkout or reuses a valid bound checkout with no ledger. Give `--adopt`, `--conflicts keep|overwrite`, saved-method precedence, recovered resource choice, per-path ownership, and dry-run parity one consistent contract. Preserve the distinct legacy migration path.

Keep normative text in current sections. Add dated W22 R2 requirement history only for material replacements. Reconcile PRD 00 navigation and D-050 state after evidence review. Do not create a new PRD, renumber existing PRDs, or copy implementation order into product authority.

## Human Experience Trace

Each affected status, preview, setup review, dry-run, and apply requirement must name observable state and a useful next action. Link current outcomes back to the [source design](../../designs/2026-11-13-portable-checkout-adoption.md). Keep test executor and evidence decisions traceable without copying the full Human Experience Intent.

## Gate

Run the PRD authority validator against the working tree. Resolve every diagnostic before phase 3 treats the updated PRDs as source authority.
