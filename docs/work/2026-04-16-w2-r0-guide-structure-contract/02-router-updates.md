# Phase 2: Router Updates

> Derives from [Phase 2 of the plan](../../plans/2026-04-16-w2-r0-guide-structure-contract/02-router-updates.md).

## Purpose

Update the six router/instruction files in the template package so agents writing developer or user guides are directed to the new guide contract and templates.

## Overview

Three pairs of AGENTS.md/CLAUDE.md files need updating: the guide-level routers, the docs-level routers, and the templates-level routers. Each pair must remain byte-identical after editing.

## Source Plan Phases

- [02-router-updates.md](../../plans/2026-04-16-w2-r0-guide-structure-contract/02-router-updates.md)

## Stage 1 — Update guide-level routers

### Tasks

1. Replace the full content of `packages/docs/template/docs/guides/AGENTS.md` with the updated version that:
   - Adds bold labels for each guide audience
   - Directs developer guide authors to read `docs/.references/guide-contract.md` and `docs/.templates/guide-developer.md`
   - Directs user guide authors to read `docs/.references/guide-contract.md` and `docs/.templates/guide-user.md`
   - Explicitly states agent guides follow a SEPARATE contract (`docs/.references/agent-guide-contract.md`) and are exempt
   - Preserves the directory-creation-on-demand instruction
   - Trims the quality paragraph to one sentence (structural authority now lives in the contract)
2. Copy the exact same content to `packages/docs/template/docs/guides/CLAUDE.md`.
3. Verify both files are byte-identical.

### Acceptance criteria

- [x] Both files exist and are byte-identical
- [x] Content references `guide-contract.md`, `guide-developer.md`, `guide-user.md`, and `agent-guide-contract.md`
- [x] Agent guide exemption is explicitly stated
- [x] Directory creation instruction preserved

### Dependencies

- None (can run in parallel with Phase 1)

## Stage 2 — Update docs-level routers

### Tasks

1. In `packages/docs/template/docs/AGENTS.md`, replace the guides routing line (the bullet starting with "- For guides, continue in `docs/guides/`") with updated text that:
   - References `docs/.references/guide-contract.md` and the matching template for developer/user guides
   - Keeps the agent guide references (`agent-guide-contract.md` and `agent-guide.md`) intact
   - Shortens "Agent session summary breadcrumbs" to "Agent session summaries"
2. Copy the exact same change to `packages/docs/template/docs/CLAUDE.md`.
3. Verify both files are byte-identical.

### Acceptance criteria

- [x] Both files are byte-identical
- [x] Guides routing line references `guide-contract.md` and both guide templates
- [x] Agent guide routing unchanged
- [x] All other lines in the file unchanged

### Dependencies

- None (can run in parallel with Stage 1)

## Stage 3 — Update templates-level routers

### Tasks

1. In `packages/docs/template/docs/.templates/AGENTS.md`, update the template listing line to include `guide-developer.md` and `guide-user.md` between `design.md` and the `plan-*`/`prd-*`/`work-*` families.
2. Copy the exact same change to `packages/docs/template/docs/.templates/CLAUDE.md`.
3. Verify both files are byte-identical.

### Acceptance criteria

- [x] Both files are byte-identical
- [x] Template listing mentions `guide-developer.md` and `guide-user.md`
- [x] Existing template family listings preserved
- [x] All other lines unchanged

### Dependencies

- None (can run in parallel with Stages 1 and 2)
