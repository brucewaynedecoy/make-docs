# Phase 02: PRD and Risk Register Reconciliation

## Purpose

Reconcile active PRDs and risk entries with the W10 R7 runtime pivot.

## Tasks

- [x] t1: Update PRD 16, PRD 25, and PRD 26 as primary owners.
- [x] t2: Update supporting PRDs and PRD index where future-facing Rust/PATH-order or optional-MCP assumptions remain.
- [x] t3: Update risk register entries that mention runtime ownership, MCP parity, package validation, no-scripts migration, or shared agentics behavior.
- [x] t4: Preserve historical references where they describe completed past work.

## Implementation Notes

- Reconciled active PRD language in place because these are future-facing requirements, not a new feature family.
- Kept W16 R3 evidence active for lifecycle helper migration while moving future implementation expectations to W10 R8.

## Acceptance Criteria

- Future-facing PRD language treats TypeScript as v2 runtime authority.
- Future-facing PRD language treats MCP as required.
- Future-facing PRD language does not require Rust parity or PATH-order runtime selection.
