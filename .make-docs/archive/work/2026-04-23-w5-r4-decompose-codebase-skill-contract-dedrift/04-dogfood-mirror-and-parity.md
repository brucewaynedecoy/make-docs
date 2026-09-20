# Phase 4: Dogfood Mirror and Parity

> Derives from [Phase 4 of the plan](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/04-dogfood-mirror-and-parity.md).

## Purpose

Refresh `.agents/skills/decompose-codebase/` from the packaged decompose skill source and add an automated mapped-file parity guardrail so future drift fails fast.

## Overview

The `.agents` copy is a dogfood mirror of the shipped skill, not a second source of truth. This phase reseeds that mirror from the packaged source and adds a consistency test that only compares the files the mirror is intentionally supposed to carry.

## Source PRD Docs

None. This backlog is derived from the `w5-r4` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 4 - Dogfood Mirror and Parity](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/04-dogfood-mirror-and-parity.md)

## Stage 1: Define and reseed the mirrored file set

### Tasks

- [x] Define the mapped mirrored file set for `packages/skills/decompose-codebase/` to `.agents/skills/decompose-codebase/`.
- [x] Include `SKILL.md`, `agents/openai.yaml`, `references/*.md`, retained `assets/templates/*.md`, `scripts/probe_environment.py`, and `scripts/validate_output.py`.
- [x] Exclude intentional package-only files such as `assets/README.md`, `scripts/test_validate_output.py`, and `scripts/__pycache__/`.
- [x] Refresh the mirrored files from the packaged source after Phases 1 through 3 settle the final surface.
- [x] Remove stale mirror-only files when the packaged source retires them.

### Acceptance criteria

- [x] The mirrored file set is explicit and package-driven.
- [x] The `.agents` mirror contains the refreshed mapped files and no stale retired mirror-only files.

### Dependencies

- Phases 1 through 3.

## Stage 2: Add automated parity enforcement

### Tasks

- [x] Add a mapped-file parity assertion to `packages/cli/tests/consistency.test.ts` or a new dedicated consistency test.
- [x] Assert that every mapped packaged file exists in the `.agents` mirror.
- [x] Assert byte equality for each mapped file.
- [x] Assert that no stale retired mapped file remains only in the mirror.
- [x] Treat `packages/skills/decompose-codebase/` as authoritative and `.agents/skills/decompose-codebase/` as the mirror.

### Acceptance criteria

- [x] The parity test fails on missing, extra, or divergent mapped files.
- [x] The parity test is package-driven, not mirror-driven.

### Dependencies

- Stage 1.
