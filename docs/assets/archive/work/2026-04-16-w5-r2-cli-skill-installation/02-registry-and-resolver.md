# Phase 2: Registry and Resolver

> Derives from [Phase 2 of the plan](../../plans/2026-04-16-w5-r2-cli-skill-installation/02-registry-and-resolver.md).

## Purpose

Create the data layer that all later phases consume: a static skill registry, a typed loader, and a `local:` protocol resolver. This phase has no dependency on Phase 1 and can execute in parallel with it.

> Implemented divergence: the shipped registry is remote-only, contains two skills (`archive-docs` and `decompose-codebase`), and no longer uses `plugin` fields or `local:` sources. See the [updated design](../../designs/2026-04-16-cli-skill-installation-r2.md) and [phase-5 agent guide](../../guides/agent/2026-04-17-w5-r2-p5-cli-skill-installation.md).

## Overview

Four stages build the registry and resolver bottom-up. First, author the static JSON registry listing all five bundled skills. Second, implement the typed loader that reads and validates that file. Third, implement the `local:` protocol resolver that turns registry URIs into filesystem content. Fourth, verify everything compiles and the modules integrate correctly.

## Source Plan Phases

- [02-registry-and-resolver.md](../../plans/2026-04-16-w5-r2-cli-skill-installation/02-registry-and-resolver.md)

## Stage 1 — Create skill-registry.json

### Tasks

1. Create `packages/cli/skill-registry.json` containing the `skills` array with all 5 bundled skills (`decompose-codebase`, `archive`, `archive-impact`, `deprecate`, `staleness-check`).
2. Populate each entry with `name`, `source` (using `local:` prefix), `entryPoint` (`SKILL.md`), `installName`, `required` (`false` for all), `description`, and `assets` array.
3. Set the `plugin` field to `"archive-docs"` on the four archive-related skills.
4. Declare shared assets (`archive-workflow.md`, `trace_relationships.py`) on the `archive` skill entry with correct `source` and `installPath` values.
5. Add the `$schema` pointer to `./src/schemas/skill-registry.schema.json`.

### Acceptance criteria

- [x] File exists at `packages/cli/skill-registry.json` and is valid JSON.
- [x] Contains exactly 5 skill entries with correct `name` values.
- [x] Every entry has `name`, `source`, `entryPoint`, `installName`, `required`, `description`, and `assets` fields.
- [x] The `archive` entry declares 2 shared assets with correct `source` and `installPath`.
- [x] All four archive-docs skills have `"plugin": "archive-docs"`.
- [x] `decompose-codebase` has no `plugin` field and an empty `assets` array.

### Dependencies

- None.

## Stage 2 — Implement skill-registry.ts (Loader)

### Tasks

1. Create `packages/cli/src/skill-registry.ts`.
2. Define and export the `SkillAssetEntry`, `SkillRegistryEntry`, and `SkillRegistry` interfaces matching the plan specification.
3. Implement `loadSkillRegistry(packageRoot: string): SkillRegistry` that reads `skill-registry.json` relative to `packageRoot`, parses it, and returns a typed object. Throw on missing file or unparseable JSON.
4. Add per-entry validation: check that each entry has `name`, `source`, `entryPoint`, `installName`, and `assets`. Log a warning and skip invalid entries instead of aborting.
5. Implement `getOptionalSkills(registry: SkillRegistry): SkillRegistryEntry[]` returning entries where `required === false`.
6. Implement `getRequiredSkills(registry: SkillRegistry): SkillRegistryEntry[]` returning entries where `required === true`.
7. Implement `getSkillsByPlugin(registry: SkillRegistry, plugin: string): SkillRegistryEntry[]` returning entries matching the given `plugin` value.

### Acceptance criteria

- [x] `SkillAssetEntry`, `SkillRegistryEntry`, and `SkillRegistry` are exported as TypeScript interfaces.
- [x] `loadSkillRegistry` reads and parses `skill-registry.json` from the given `packageRoot`.
- [x] Missing or malformed JSON throws a descriptive error.
- [x] Invalid individual entries are skipped with a console warning, not a crash.
- [x] `getOptionalSkills` correctly filters on `required === false`.
- [x] `getRequiredSkills` correctly filters on `required === true`.
- [x] `getSkillsByPlugin` returns only entries with a matching `plugin` field.
- [x] All exports compile without errors.

### Dependencies

- Stage 1 (the JSON file must exist for integration use, but not required for compilation).

## Stage 3 — Implement skill-resolver.ts (local: Protocol)

### Tasks

1. Create `packages/cli/src/skill-resolver.ts`.
2. Define and export the `ResolvedSkill` type with `entryPointContent: string` and `assets: Array<{ installPath: string; content: string | Buffer }>`.
3. Define and export an `UnsupportedProtocolError` class extending `Error`.
4. Implement `resolveLocalPath(localUri: string, repoRoot: string): string` that strips the `local:` prefix, resolves against `repoRoot` using `path.resolve`, and throws if the resolved path escapes `repoRoot` (path-traversal guard).
5. Implement `resolveSkillSource(source: string, entryPoint: string, assets: SkillAssetEntry[], repoRoot: string): ResolvedSkill` that dispatches on protocol prefix. For `local:`, read the entry-point file from the resolved directory and each asset source. For any other prefix, throw `UnsupportedProtocolError`.
6. Use UTF-8 string reads for `.md` files and `Buffer` reads for all other extensions.

### Acceptance criteria

- [x] `ResolvedSkill` type is exported with correct shape.
- [x] `UnsupportedProtocolError` is exported and extends `Error`.
- [x] `resolveLocalPath` strips the `local:` prefix and returns an absolute path.
- [x] `resolveLocalPath` throws when the resolved path escapes `repoRoot`.
- [x] `resolveSkillSource` reads entry-point content as a UTF-8 string for `local:` URIs.
- [x] `resolveSkillSource` reads `.md` assets as strings and non-`.md` assets as Buffers.
- [x] `resolveSkillSource` throws `UnsupportedProtocolError` for non-`local:` protocols.
- [x] All exports compile without errors.

### Dependencies

- Stage 2 (imports `SkillAssetEntry` from `skill-registry.ts`).

## Stage 4 — Build Verification

### Tasks

1. Run `npm run build -w make-docs` and fix any compilation errors in the new modules.
2. Verify that `skill-registry.ts` and `skill-resolver.ts` are included in the build output.
3. Confirm no regressions in existing tests with `npm test -w make-docs`.

### Acceptance criteria

- [x] `npm run build -w make-docs` succeeds with zero errors.
- [x] Build output includes compiled `skill-registry.js` and `skill-resolver.js`.
- [x] `npm test -w make-docs` passes with no regressions.

### Dependencies

- Stages 1, 2, and 3 (all source files must be in place).
