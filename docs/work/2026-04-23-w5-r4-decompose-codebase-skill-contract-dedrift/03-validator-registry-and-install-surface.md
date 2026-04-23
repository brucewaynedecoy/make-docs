# Phase 3: Validator, Registry, and Install Surface

> Derives from [Phase 3 of the plan](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/03-validator-registry-and-install-surface.md).

## Purpose

Update the decompose validator, shipped asset declarations, and install/test surface so the distributed optional skill enforces and installs the corrected v2 contract.

## Overview

This phase is where the contract rewrite becomes executable and testable. The validator should enforce the same archive/work model that the docs now describe, and the registry plus install tests should project the retained packaged file set exactly.

## Source PRD Docs

None. This backlog is derived from the `w5-r4` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 3 - Validator, Registry, and Install Surface](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/03-validator-registry-and-install-surface.md)

## Stage 1: Update validator rules to the v2 model

### Tasks

- [x] Update `packages/skills/decompose-codebase/scripts/validate_output.py` to validate archived PRD sets under `docs/assets/archive/prds/...`.
- [x] Update `validate_output.py` to validate directory-based work outputs under `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/`.
- [x] Add or update rules for `00-index.md` plus `0N-<phase>.md` backlog files.
- [x] Remove validator rules that still encode `docs/prd/archive/...` and `YYYY-MM-DD-rebuild-backlog.md` as current behavior.

### Acceptance criteria

- [x] The validator enforces the v2 archive/work-directory model.
- [x] The validator no longer encodes the legacy single-file backlog contract as current behavior.

### Dependencies

- Phases 1 and 2.

## Stage 2: Extend validator tests for v2 acceptance and legacy rejection

### Tasks

- [x] Add `test_validate_output.py` coverage for a valid v2 work directory with `00-index.md` and at least one phase file.
- [x] Add coverage for the `docs/assets/archive/prds/...` archive namespace.
- [x] Add explicit checks that legacy single-file backlog assumptions are rejected or fail where appropriate under the new contract.
- [x] Keep the existing Wave 6 false-positive link regression coverage intact.

### Acceptance criteria

- [x] Validator tests cover both v2 acceptance and legacy rejection.
- [x] Wave 6 false-positive link protections remain intact.

### Dependencies

- Stage 1.

## Stage 3: Align the registry and install/test surface

### Tasks

- [x] Remove `assets/templates/rebuild-backlog.md` from `packages/cli/skill-registry.json`.
- [x] Update `packages/cli/tests/skill-catalog.test.ts` so the expected decompose optional-skill asset surface matches the retained packaged files.
- [x] Update `packages/cli/tests/skill-registry.test.ts` to assert the intended decompose asset set.
- [x] Update `packages/cli/tests/install.test.ts` so optional decompose installs prove retained files install and retired files do not.
- [x] Keep source-only files such as `assets/README.md` and `scripts/test_validate_output.py` out of the installed asset set unless execution proves they are required at runtime.

### Acceptance criteria

- [x] The registry no longer declares the retired one-file backlog template.
- [x] Install and skill-catalog tests prove the retained decompose skill asset set installs correctly.
- [x] Registry, packaged source, and install tests agree on the intended decompose skill file surface.

### Dependencies

- Stages 1 and 2.
