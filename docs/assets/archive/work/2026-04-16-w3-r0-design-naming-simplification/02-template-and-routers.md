# Phase 2: Template and Routers

> Derives from [Phase 2 of the plan](../../plans/2026-04-16-w3-r0-design-naming-simplification/02-template-and-routers.md).

## Purpose

Update the design document template and design directory routers in the template package to reflect the simplified naming convention.

## Overview

Three files change: the design template's filename blockquote, and the design directory AGENTS.md/CLAUDE.md pair's naming convention section and example.

## Source Plan Phases

- [02-template-and-routers.md](../../plans/2026-04-16-w3-r0-design-naming-simplification/02-template-and-routers.md)

## Stage 1 — Update design.md template

### Tasks

1. In `packages/docs/template/docs/.templates/design.md`, replace the filename blockquote:
   - From: `> Filename: \`YYYY-MM-DD-w{W}-r{R}-<slug>.md\`. See \`docs/.references/wave-model.md\` for W/R semantics.`
   - To: `> Filename: \`YYYY-MM-DD-<slug>.md\`. See \`docs/.references/design-contract.md\` for naming and structural rules.`

### Acceptance criteria

- [x] Blockquote uses `YYYY-MM-DD-<slug>.md` pattern
- [x] References `design-contract.md` instead of `wave-model.md`
- [x] All other template content unchanged

### Dependencies

- None (can run in parallel with Phase 1)

## Stage 2 — Update design directory routers

### Tasks

1. In `packages/docs/template/docs/designs/AGENTS.md`, update the Naming Convention section:
   - Pattern: change `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`
   - Example: change `2026-04-15-w1-r0-authentication-flow.md` to `2026-04-16-authentication-flow.md`
   - Remove the line "See `docs/.references/wave-model.md` for W/R semantics and resolution rules."
2. In the Agent Instructions section, if there is a reference to wave-model.md specifically for design naming, remove it. Keep all other instructions intact.
3. Copy the exact same content to `packages/docs/template/docs/designs/CLAUDE.md`.
4. Verify both files are byte-identical.

### Acceptance criteria

- [x] `designs/AGENTS.md` uses simplified pattern and example (no W/R)
- [x] No wave-model.md reference for design naming
- [x] All other agent instructions preserved
- [x] `designs/CLAUDE.md` is byte-identical to `designs/AGENTS.md`

### Dependencies

- None (parallel with Stage 1)
