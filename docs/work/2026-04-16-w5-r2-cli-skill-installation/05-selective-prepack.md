# Phase 5: Selective Prepack

> Derives from [Phase 5 of the plan](../../plans/2026-04-16-w5-r2-cli-skill-installation/05-selective-prepack.md).

## Purpose

Update the prepack pipeline so it reads `skill-registry.json` and copies only the declared entry points and assets for each registered skill into a staging directory. Replace any bulk skill copy with a registry-driven selective copy, and update the package manifest to ship only the staging directory and registry file.

## Overview

Three stages run mostly in parallel: updating the prepack script with registry-driven staging logic, updating the package.json files array, and a final verification pass that confirms the selective copy produces exactly the declared files.

## Source Plan Phases

- [05-selective-prepack.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/05-selective-prepack.md)

## Stage 1 — Registry-driven skill staging in prepack script

### Tasks

1. Open `scripts/copy-template-to-cli.mjs`.
2. After the existing template sync section, add a new block that reads and parses `skill-registry.json` from its canonical location (match wherever Phase 2 places it).
3. For each skill entry in the parsed registry:
   - Resolve the `entryPoint` path relative to the skill's source directory.
   - Resolve every path listed in the skill's `assets` array (if any).
   - Collect the full set of source file paths.
4. Define a staging target directory at `packages/cli/skills-staging/`.
5. Remove the staging target if it already exists (`rmSync` with `{ recursive: true, force: true }`).
6. For each collected source file, compute its relative path within the skills source tree and copy it to the corresponding path inside the staging directory, creating intermediate directories with `mkdirSync` as needed.
7. Copy `skill-registry.json` itself into the CLI package root at `packages/cli/skill-registry.json`.
8. If the registry file is missing, exit with a non-zero error code and a clear message (the registry is required once Phase 2 is complete — do not skip defensively).
9. If a previous bulk `skills/` copy exists in the script, remove it in favor of the new selective staging logic.

### Acceptance criteria

- [ ] `scripts/copy-template-to-cli.mjs` reads and parses `skill-registry.json` from the correct location.
- [ ] Script iterates each registry skill entry and resolves `entryPoint` and `assets` paths.
- [ ] Script removes `packages/cli/skills-staging/` before copying.
- [ ] Script copies only registry-declared files into `packages/cli/skills-staging/`, preserving relative directory structure.
- [ ] Script copies `skill-registry.json` to `packages/cli/skill-registry.json`.
- [ ] Script exits with a non-zero code and error message if the registry file is missing.
- [ ] Any previous bulk `skills/` copy logic is removed from the script.

### Dependencies

- Phase 2 (registry must exist and be parseable).

## Stage 2 — Update package.json files array

### Tasks

1. Open `packages/cli/package.json`.
2. Add `"skills-staging"` to the `files` array.
3. Add `"skill-registry.json"` to the `files` array.
4. If a previous bulk `"skills"` entry exists, remove it.

### Acceptance criteria

- [ ] `packages/cli/package.json` `files` array includes `"skills-staging"`.
- [ ] `packages/cli/package.json` `files` array includes `"skill-registry.json"`.
- [ ] No bulk `"skills"` entry remains in the `files` array.

### Dependencies

- None — independent of all other stages.

## Stage 3 — Verification

### Tasks

1. Run `npm run prepack -w starter-docs`.
2. Verify `packages/cli/skills-staging/` exists and contains only files declared in `skill-registry.json`.
3. Verify files not declared in the registry are absent from the staging directory.
4. Verify `packages/cli/skill-registry.json` exists.
5. Run `npm run build -w starter-docs` and confirm it succeeds.
6. Run `npm test -w starter-docs` and confirm no regressions.

### Acceptance criteria

- [ ] `npm run prepack -w starter-docs` completes without errors.
- [ ] `packages/cli/skills-staging/` contains exactly the registry-declared entry points and assets — nothing more.
- [ ] `packages/cli/skill-registry.json` is present after prepack.
- [ ] `npm run build -w starter-docs` succeeds.
- [ ] `npm test -w starter-docs` passes with no regressions.

### Dependencies

- Stage 1 (prepack script must implement selective staging).
- Stage 2 (package.json must include new entries in files array).
