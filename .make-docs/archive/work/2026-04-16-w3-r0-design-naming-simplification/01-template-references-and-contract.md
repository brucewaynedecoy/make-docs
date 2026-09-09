# Phase 1: Template References and Contract

> Derives from [Phase 1 of the plan](../../plans/2026-04-16-w3-r0-design-naming-simplification/01-template-references-and-contract.md).

## Purpose

Update the wave model, design contract, and design workflow reference files in the template package to remove W/R encoding from design naming and exempt designs from wave resolution rules.

## Overview

Three reference files in `packages/docs/template/docs/.references/` carry the W/R pattern for designs. After this phase, designs are exempt from wave naming — parallel to the existing PRD exemption.

## Source Plan Phases

- [01-template-references-and-contract.md](../../plans/2026-04-16-w3-r0-design-naming-simplification/01-template-references-and-contract.md)

## Stage 1 — Update wave-model.md

### Tasks

1. In `packages/docs/template/docs/.references/wave-model.md`, remove the Design row from the Naming Patterns table (leaving 7 rows: Plan directory, Plan overview, Plan phase, Work directory, Work index, Work phase, Agent guide).
2. In the Resolution Rules section, change "When writing a new design, plan directory, or work directory" to "When writing a new plan directory or work directory".
3. In Resolution Rules step 2, remove `docs/designs/` from the list of target directories to scan.
4. Add a new `## Design Exemption` section after `## PRD Exemption` and before `## Archive Integration`. Content:
   - Designs are exempt from W/R encoding. Filenames use `YYYY-MM-DD-<slug>.md`.
   - The date provides chronological ordering; the slug provides topical identity.
   - When a design is revised or superseded, write a new dated design and use `## Design Lineage` (defined in `design-contract.md`) to link back.
   - Designs are inputs to a wave cycle, not products of one.

### Acceptance criteria

- [x] Design row removed from Naming Patterns table
- [x] Resolution Rules no longer mention `docs/designs/`
- [x] `## Design Exemption` section exists after `## PRD Exemption`
- [x] No other sections modified

### Dependencies

- None (first task)

## Stage 2 — Update design-contract.md

### Tasks

1. In `packages/docs/template/docs/.references/design-contract.md`, replace the Required Path section:
   - Change `docs/designs/YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `docs/designs/YYYY-MM-DD-<slug>.md`
   - Replace "See `docs/.references/wave-model.md` for W/R semantics and resolution rules." with "`YYYY-MM-DD` is today's date (never backdated). `<slug>` is lowercase, hyphens only."

### Acceptance criteria

- [x] Required Path shows `YYYY-MM-DD-<slug>.md`
- [x] No wave-model.md reference in the Required Path section
- [x] All other sections unchanged (Required Headings, Design Lineage, Link Rules, etc.)

### Dependencies

- None (parallel with Stage 1)

## Stage 3 — Update design-workflow.md

### Tasks

1. In `packages/docs/template/docs/.references/design-workflow.md`, replace all occurrences of `YYYY-MM-DD-w{W}-r{R}-<slug>.md` with `YYYY-MM-DD-<slug>.md`.
2. Remove the standalone "See `docs/.references/wave-model.md` for W/R semantics." line at the top of the file (if present).
3. In the Validation Checklist, update the naming check from `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`.

### Acceptance criteria

- [x] No occurrences of `w{W}-r{R}` in design path patterns
- [x] No standalone wave-model.md reference for design naming
- [x] Validation checklist updated
- [x] All other workflow logic unchanged (Preflight, Create vs Update, Lineage, Follow-On, Stop Rule)

### Dependencies

- None (parallel with Stages 1 and 2)
