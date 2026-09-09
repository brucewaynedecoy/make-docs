# Phase 1: Cleanup and Bundling

> Derives from [Phase 1 of the plan](../../plans/2026-04-16-w5-r1-cli-skill-installation/01-cleanup-and-bundling.md).

## Purpose

Remove invalid skill registration artifacts from Wave 5 Phase 5, extend the CLI prepack pipeline to bundle skills alongside the docs template, and update the package manifest so skills ship in the published tarball.

## Overview

Three independent cleanup and configuration tasks run in parallel: deleting invalid artifacts, extending the prepack copy script, and updating the package.json files array. A final verification stage confirms the bundling pipeline works end to end.

## Source Plan Phases

- [01-cleanup-and-bundling.md](../../plans/2026-04-16-w5-r1-cli-skill-installation/01-cleanup-and-bundling.md)

## Stage 1 — Delete invalid artifacts

### Tasks

1. Delete `.claude/settings.json` (contains an invalid `skills` array that Claude Code does not recognize).
2. Delete `.agents/README.md` (discovery index that no harness reads).
3. Delete the `.agents/` directory (empty after README removal).

### Acceptance criteria

- [x] `.claude/settings.json` no longer exists.
- [x] `.agents/` directory no longer exists.
- [x] `.claude/` directory still contains `settings.local.json`.

### Dependencies

- None — independent of all other stages.

## Stage 2 — Extend prepack script

### Tasks

1. Open `scripts/copy-template-to-cli.mjs`.
2. Define `skillsSource = path.join(repoRoot, "packages", "skills")` and `skillsTarget = path.join(repoRoot, "packages", "cli", "skills")`.
3. Add an existence check for `skillsSource` — skip with a warning if it does not exist (defensive for repos without skills yet).
4. Remove `skillsTarget` if it already exists (same pattern as the template copy: `rmSync` with `{ recursive: true, force: true }`).
5. Copy skills with `cpSync(skillsSource, skillsTarget, { recursive: true })`.

### Acceptance criteria

- [x] `scripts/copy-template-to-cli.mjs` defines `skillsSource` and `skillsTarget` variables pointing to the correct paths.
- [x] Script checks `skillsSource` existence before copying.
- [x] Script removes `skillsTarget` if it exists before copying.
- [x] Script copies `packages/skills/` to `packages/cli/skills/` via `cpSync`.
- [x] Running the script copies both `packages/docs/template/` and `packages/skills/` into the CLI package.

### Dependencies

- None — independent of all other stages.

## Stage 3 — Update package.json files array

### Tasks

1. Open `packages/cli/package.json`.
2. Add `"skills"` to the `files` array (alongside existing entries `"dist"`, `"template"`, `"README.md"`).

### Acceptance criteria

- [x] `packages/cli/package.json` `files` array includes `"skills"`.

### Dependencies

- None — independent of all other stages.

## Stage 4 — Verify bundling

### Tasks

1. Run `npm run prepack -w make-docs`.
2. Verify `packages/cli/skills/` directory exists after the prepack run.
3. Confirm `packages/cli/skills/decompose-codebase/` is present with its assets.
4. Confirm `packages/cli/skills/archive-docs/` is present with its assets.

### Acceptance criteria

- [x] `npm run prepack -w make-docs` completes without errors.
- [x] `packages/cli/skills/decompose-codebase/` exists in the bundled output.
- [x] `packages/cli/skills/archive-docs/` exists in the bundled output.

### Dependencies

- Stage 2 (prepack script must copy skills).
- Stage 3 (package.json must include skills in files array).
