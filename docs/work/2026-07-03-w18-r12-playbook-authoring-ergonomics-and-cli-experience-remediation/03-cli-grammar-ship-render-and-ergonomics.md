---
title: "Phase 3: CLI Grammar, Ship, Render, and Ergonomics"
kind: "work"
status: "active"
coordinate: "W18 R12 P3"
source:
  type: "prd"
  path: "docs/prd/41-revise-cli-human-experience-and-package-grammar.md"
---

# Phase 3: CLI Grammar, Ship, Render, and Ergonomics

## Purpose

Layer the human experience over the remediated operations without moving a byte agents depend on. This phase implements PRD 41 anchors R-INV-1, R-RENDER-1..3, R-GRAM-1..3, R-RUNID-1, R-FLAG-1..2, R-NOISE-1, and R-TEST-4..6.

## Overview

The packaging surface becomes intent-named — `plan` (with `--output`), `preview`, `write` with `--write` retired — and gains `run package ship` over the newly registered `package.ship` composite operation. The `run` dispatcher gains a render layer at the `printJson` seam keyed by the existing `OperationRenderMode`: TTY defaults to human text, `--json` and non-TTY defaults stay byte-identical JSON, MCP is untouched. Run-id prefixes and `--last`, root-flag defaults, a packaging-preconditions config block, and a targeted SQLite ExperimentalWarning filter remove the remaining ceremony.

## Source PRD Docs

- [41 Revise CLI Human Experience and Package Grammar](../../prd/41-revise-cli-human-experience-and-package-grammar.md)
- [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-revise-cli-command-reorganization-and-operation-registry.md) (still-constraining baseline: append-only registry, derived surfaces, operation core, one-way dependencies)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md) (still-constraining baseline: every fail-before-write stop, preserved unchanged)
- [24 Revise Configuration Convention Overlay](../../prd/24-revise-configuration-convention-overlay.md) (still-constraining baseline: config is convenience, never authority)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md) (still-constraining baseline: the MCP surface is untouched)

## Stage 1 - Package Grammar

### Tasks

- [ ] t1: Rename the packaging CLI spellings to `run package plan`, `run package preview` (today's `write` without `--write` — full pipeline, no writes), and `run package write` (today's `write --write`), retiring the `--write` flag with a failure message naming the new grammar; the underlying operations, dry-run inputs, and MCP tools are untouched (R-GRAM-1, R-GRAM-2, R-INV-1).
- [ ] t2: Add `--output <path>` to `run package plan`, writing the reviewable plan artifact directly, mirroring `run playbook run export --output` (R-GRAM-1).

### Acceptance criteria

- `preview` writes nothing under any input; `write` preserves every existing precondition, digest-mismatch, ownership-conflict, and fail-before-write stop.
- The retired `--write` spelling fails with guidance naming `plan`/`preview`/`write`.
- MCP tools and operation results are byte-identical to pre-change shapes.

### Dependencies

- Phase 2 compiler work merged, so grammar tests run against probe-based checks.

## Stage 2 - The Ship Composite

### Tasks

- [ ] t3: Register `package.ship` in the operation registry as a composite operation with typed input/output and a mutation classification, per the append-only rule and the W18 R11 parity rule — no CLI-only composites (R-GRAM-3; PRD 39 R-REG-1).
- [ ] t4: Implement the ship handler in the operation core: execute plan → preview → write through the operation core, aborting at the first stop, unresolved proposal, or warning with guidance naming the granular command (`plan`, `preview`, or `write`) to continue with; perform the classification write; preserve every fail-before-write rail (R-GRAM-3).
- [ ] t5: Surface `run package ship` on the CLI and derive the MCP tool from the registry identifier like every other operation, updating the derivation/consistency pins only as the registry addition requires (R-GRAM-3; PRD 39 R-REG-2, R-MIG-3).

### Acceptance criteria

- A plan with zero unresolved items ships end-to-end without human judgment, with the classification write recorded.
- The first stop, unresolved proposal, or warning aborts before any disk write, and the guidance names the granular command to continue with.
- `package.ship` appears in the registry, the derived CLI tree, and the derived MCP tools; the registry remains append-only.

### Dependencies

- Stage 1 grammar, whose granular commands ship's abort guidance names.

## Stage 3 - Render Layer

### Tasks

- [ ] t6: Build the render layer at the `printJson(invocation.value)` seam in `packages/cli/src/run/cli.ts`, keyed by the existing `OperationRenderMode` in `packages/cli/src/operations/types.ts`: TTY default renders per-operation human text — what just happened (the execution report), where the run stands (a compact cursor/status line), and what to do next (the next hint and the exact next command) (R-RENDER-1).
- [ ] t7: Keep `--json` emitting the full operation result byte-identical to today, keep the non-TTY default as full JSON, and leave MCP derivation untouched (R-RENDER-1, R-RENDER-3, R-INV-1).
- [ ] t8: Render the capability snapshot once at `start` and reference rather than restate it in later text renderings; never repeat the evidence log in text mode — the full record stays reachable via `--json` and `status --json` (R-RENDER-2).

### Acceptance criteria

- `--json` output and non-TTY default output are byte-identical to the pre-remediation operation results modulo additive fields (R-TEST-4).
- TTY output for a mid-run `advance` fits on one screen and ends with the exact next command.
- MCP derivation parity tests pass unchanged.

### Dependencies

- Stages 1–2 fix the command spellings the rendered next-command guidance prints.

## Stage 4 - Run-Id, Flags, Preconditions, and Noise

### Tasks

- [ ] t9: Resolve unambiguous run-id prefixes at every `--run-id` acceptor and add `--last` selecting the most recent run for the resolved project; an ambiguous prefix fails listing the candidates (R-RUNID-1).
- [ ] t10: Default `--repo-root` to the nearest ancestor of the working directory carrying `.make-docs/manifest.json` and `--store-root` to the real global store, keeping both flags as overrides (R-FLAG-1).
- [ ] t11: Add a packaging-preconditions block to project config (for example in `.make-docs/config.yaml`) absorbed as defaults with explicit `--precondition` flags always overriding — convenience, never authority — and author any config-schema documentation upstream in `packages/docs/template/` first (R-FLAG-2; PRD 24).
- [ ] t12: Suppress the Node SQLite ExperimentalWarning with a targeted process-warning filter at CLI entry matching only that warning; never a blanket suppression (R-NOISE-1).

### Acceptance criteria

- A run addressed by prefix and by `--last` resolves identically to its full id; ambiguity fails with candidates listed.
- Commands run without `--repo-root`/`--store-root` inside a project behave identically to today's fully flagged invocations.
- Config-supplied preconditions are overridden by explicit flags, and missing config changes no behavior.
- No ExperimentalWarning prints on any invocation, and other process warnings still surface.

### Dependencies

- None beyond Stage 1; may proceed in parallel with Stage 3.

## Stage 5 - Grammar and Ship Test Bar

### Tasks

- [ ] t13: Land the R-TEST-5 suite: `plan --output` writes the reviewable plan; `preview` writes nothing under any input; `write` preserves every existing stop; the retired `--write` spelling fails with guidance naming the new grammar (R-TEST-5).
- [ ] t14: Land the R-TEST-6 suite: ship completes end-to-end on a zero-unresolved plan with the classification write recorded; ship aborts before any disk write at the first stop, unresolved proposal, or warning with granular-command guidance; `package.ship` is present in the registry and derives to MCP (R-TEST-6).

### Acceptance criteria

- Every R-TEST-5 and R-TEST-6 assertion is covered by a test that fails on regression.
- The render-invariance suite (R-TEST-4) passes alongside the grammar and ship suites.

### Dependencies

- Stages 1–4.
