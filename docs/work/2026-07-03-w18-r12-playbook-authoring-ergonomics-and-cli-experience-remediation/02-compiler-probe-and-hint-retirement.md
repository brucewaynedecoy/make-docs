---
title: "Phase 2: Compiler Probe and Hint Retirement"
kind: "work"
status: "active"
coordinate: "W18 R12 P2"
source:
  type: "prd"
  path: "docs/prd/40-revise-playbook-authoring-contract-v2.md"
---

# Phase 2: Compiler Probe and Hint Retirement

## Purpose

Fix the two confirmed UAT defects on top of the Phase 1 model: F1 — generated dependency checks probe prose-derived tokens (register item [D-015](../../prd/03-open-questions-and-risk-register.md)) — and F2 — resume hints accumulate without retirement (register item [D-016](../../prd/03-open-questions-and-risk-register.md)). This phase implements PRD 40 anchors R-DEP-3, R-FIX-1, and R-TEST-2 and PRD 41 anchors R-FIX-2 and R-TEST-3.

## Overview

Dependency materialization retargets from `executableToken(source)` to the model's resolved `probe`, making the F1 defect structurally unrepresentable — nothing anywhere parses `source` prose. The regression is pinned with fixtures whose `source` prose does not begin with the binary name, the exact blind spot that let the defect through. Resume hints become subject-scoped with retirement on every mutating transition and full retirement at `close`; the evidence log remains the unchanged durable audit trail.

## Source PRD Docs

- [40 Revise Playbook Authoring Contract v2](../../prd/40-revise-playbook-authoring-contract-v2.md)
- [41 Revise CLI Human Experience and Package Grammar](../../prd/41-revise-cli-human-experience-and-package-grammar.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md) (still-constraining baseline: per-kind materialization, fail-before-write, adapter contracts)
- [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md) (still-constraining baseline: progression semantics, evidence log, status vocabulary)
- [38 Revise Global Store and Project State](../../prd/38-revise-global-store-and-project-state.md) (still-constraining baseline: schema versioning and migration for any run-state serialization change)

## Stage 1 - Probe-Targeted Dependency Materialization (F1)

### Tasks

- [x] t1: Remove `executableToken` and every `source`-derived probe path from `packages/cli/src/operations/playbook-packaging/materialization.ts`; generated `cli` and `package-manager` checks probe the model's resolved `probe` (declared value or `id` default) via `command -v` (PRD 40 R-DEP-3, R-FIX-1).
- [x] t2: Use `probe` as the manifest reference identifier for `skill` and `plugin` kind materialization where the model provides it, preserving every other R-DEPMAT-1 rule — per-kind emission, operation identifiers over CLI strings, explicit degradation (PRD 36 R-DEPMAT-1 as revised by PRD 40).
- [x] t3: Verify by search that no code path under `packages/cli/` parses the dependency `source` field for machine meaning (PRD 40 R-DEP-3; D-015 close bar).

### Acceptance criteria

- A dependency `git` with `source: system install of git` generates a check probing `git` — the UAT repro passes.
- A dependency declaring `probe` (for example `github-cli` probing `gh`) generates a check probing the declared value.
- No reference to `executableToken` or any `source`-token derivation remains in the compiler.

### Dependencies

- Phase 1 model exposing the resolved `probe` field.

## Stage 2 - F1 Regression Fixtures

### Tasks

- [x] t4: Add compiler fixtures whose `source` prose does not begin with the binary name — including the UAT repro — across `cli` and `package-manager` kinds, and a declared-`probe` fixture where `probe` differs from `id` (PRD 40 R-TEST-2).

### Acceptance criteria

- Generated-check tests fail if any future change re-derives the probe from `source` or from the first token of any prose field.
- The fixtures cover both the `id`-default and declared-`probe` paths.

### Dependencies

- Stage 1.

## Stage 3 - Resume-Hint Retirement (F2)

### Tasks

- [x] t5: Make hints subject-scoped in `packages/cli/src/operations/playbook/progression.ts`: each hint records the step or gate it advises about, extending `withHint` and the run-state record additively (PRD 41 R-FIX-2).
- [x] t6: Retire hints on every mutating transition — `advance`, `gate`, `resume`, `close` — for subjects that have reached a resolved status, and retire all guidance hints at `close` so a closed run's state carries none (PRD 41 R-FIX-2; D-016 close bar).
- [x] t7: Handle the run-state serialization change additively and migrate per the global store's schema-versioning rules, leaving the evidence log untouched (PRD 38; PRD 41 R-FIX-2).
- [x] t8: Land the R-TEST-3 suite: a run advanced past a delegated step no longer carries that step's waiting hint; a closed run carries no guidance hints; the evidence log is byte-identical before and after retirement (PRD 41 R-TEST-3).

### Acceptance criteria

- Hints for resolved subjects are retired on each state transition and `close` leaves zero guidance hints.
- Pre-change persisted run states load correctly through the store migration path.
- The evidence log is unchanged by any hint operation.

### Dependencies

- None on Stages 1–2; may proceed in parallel with them once Phase 1 lands.
