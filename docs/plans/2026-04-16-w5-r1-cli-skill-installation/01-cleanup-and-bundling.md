# Phase 1 — Cleanup and Bundling

## Objective

Remove the invalid skill registration files from Wave 5 Phase 5, and extend the CLI's prepack pipeline to bundle `packages/skills/` into the published CLI package alongside the docs template.

## Files to Delete

| File | Reason |
| ---- | ------ |
| `.claude/settings.json` | Contains an invalid `skills` array that Claude Code doesn't recognize. Skill discovery in Claude Code is directory-based (`.claude/skills/`), not config-based. |
| `.agents/README.md` | Discovery index that no harness reads. Codex agent registration conventions are still evolving. |
| `.agents/` directory | Empty after README removal. |

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `scripts/copy-template-to-cli.mjs` | Extend to also copy `packages/skills/` → `packages/cli/skills/`. |
| `packages/cli/package.json` | Add `"skills"` to the `files` array so skills are included in the published tarball. |

## Detailed Changes

### 1. Delete invalid artifacts

Delete `.claude/settings.json`, `.agents/README.md`, and the `.agents/` directory. The `.claude/` directory itself stays (it still contains `settings.local.json`).

### 2. Extend prepack script

The current `scripts/copy-template-to-cli.mjs` copies `packages/docs/template/` → `packages/cli/template/`. Add a second copy step that copies `packages/skills/` → `packages/cli/skills/`.

The script should:
1. Define `skillsSource = path.join(repoRoot, "packages", "skills")` and `skillsTarget = path.join(repoRoot, "packages", "cli", "skills")`
2. Check `skillsSource` exists (skip with a warning if not — defensive for repos that haven't created skills yet)
3. Remove `skillsTarget` if it exists (same pattern as the template copy)
4. Copy with `cpSync(skillsSource, skillsTarget, { recursive: true })`

### 3. Update package.json files array

In `packages/cli/package.json`, the `files` array currently lists `["dist", "template", "README.md"]`. Add `"skills"`:

```json
"files": [
  "dist",
  "template",
  "skills",
  "README.md"
]
```

## Parallelism

- Deletion of invalid artifacts is independent of prepack/package.json changes.
- All changes can run in parallel.

## Acceptance Criteria

- [ ] `.claude/settings.json` no longer exists.
- [ ] `.agents/` directory no longer exists.
- [ ] `scripts/copy-template-to-cli.mjs` copies both `packages/docs/template/` and `packages/skills/` into the CLI package.
- [ ] `packages/cli/package.json` `files` includes `"skills"`.
- [ ] Running `npm run prepack -w starter-docs` produces both `packages/cli/template/` and `packages/cli/skills/`.
- [ ] The bundled `skills/` directory contains `decompose-codebase/` and `archive-docs/` with all their assets.
