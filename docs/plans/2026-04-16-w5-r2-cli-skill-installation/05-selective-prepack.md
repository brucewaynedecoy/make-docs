# Phase 5 — Selective Prepack

## Objective

Update the prepack pipeline so it reads `skill-registry.json` and copies only the entry points and declared assets for each registered skill into a staging directory. The staging directory and registry file are added to the `files` array in `packages/cli/package.json`, replacing any bulk skill copy. This ensures the published tarball contains exactly the skill files the registry declares — nothing more, nothing less.

> Implemented divergence: the shipped CLI does not publish a staged skill directory. Prepack validates and publishes registry metadata only, while skills are resolved remotely at install time. See the [updated design](../../designs/2026-04-16-cli-skill-installation-r2.md) and [phase-5 agent guide](../../guides/agent/2026-04-17-w5-r2-p5-cli-skill-installation.md).

## Dependencies

- Phase 2 (registry must exist). The prepack script imports and parses `skill-registry.json` to determine which files to stage.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `scripts/copy-template-to-cli.mjs` | Add a registry-driven skill staging step that reads `skill-registry.json`, resolves each skill's entry point and declared assets, and copies only those files to a staging directory inside `packages/cli/`. |
| `packages/cli/package.json` | Add the staging directory and `skill-registry.json` to the `files` array. |

## Detailed Changes

### 1. `scripts/copy-template-to-cli.mjs` — Registry-driven skill staging

After the existing template sync call, add a new section:

1. Read and parse `skill-registry.json` from the repo root (or a known path such as `packages/skills/skill-registry.json` — match wherever Phase 2 places it).
2. For each skill entry in the registry:
   - Resolve the `entryPoint` path relative to the skill's source directory.
   - Resolve every path listed in the skill's `assets` array (if any).
   - Collect the full set of source paths.
3. Define a staging target directory (e.g., `packages/cli/skills-staging/`).
4. Remove the staging target if it already exists (same `rmSync` pattern used for the template copy).
5. For each collected source file, compute its relative path within the skills source tree and copy it to the corresponding path inside the staging directory, creating intermediate directories as needed.
6. Copy `skill-registry.json` itself into the CLI package root (e.g., `packages/cli/skill-registry.json`).

Use the existing `syncDir` helper for directory-level copies where possible. For individual file copies, use `cpSync` directly with `{ recursive: true }` on the parent directory or file-level copy with manual `mkdirSync`.

If the registry file is missing, exit with an error — unlike the defensive skip used for optional directories, the registry is required once Phase 2 is complete.

### 2. `packages/cli/package.json` — Update `files` array

The current `files` array is:

```json
"files": [
  "dist",
  "template",
  "README.md"
]
```

Update to include the staging directory and registry:

```json
"files": [
  "dist",
  "template",
  "skills-staging",
  "skill-registry.json",
  "README.md"
]
```

If Phase 1 (R1) previously added a bulk `"skills"` entry, remove it in favor of `"skills-staging"`. The staging directory name is intentionally distinct to avoid confusion with any source `skills/` directory.

## Parallelism

- The two file changes are independent and can be edited in parallel.
- This phase can run in parallel with Phases 3, 4, and 6 once Phase 2 is complete.

## Acceptance Criteria

- [ ] `scripts/copy-template-to-cli.mjs` reads `skill-registry.json` and copies only declared entry points and assets.
- [ ] Files not declared in the registry are excluded from the staging directory.
- [ ] `skill-registry.json` is copied into the CLI package root.
- [ ] `packages/cli/package.json` `files` array includes `"skills-staging"` and `"skill-registry.json"`.
- [ ] Running `npm run prepack -w starter-docs` produces `packages/cli/skills-staging/` containing exactly the registry-declared files and nothing else.
- [ ] `npm run build -w starter-docs` succeeds.
- [ ] `npm test -w starter-docs` passes with no regressions.
