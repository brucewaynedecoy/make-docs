# Phase 4 - History and Documentation Migration

## Objective

Move active repository session history into `docs/.assets/history/` and update active documentation surfaces so users and agents see the new `.assets` model instead of the retired `docs/.make-docs/` and `docs/guides/agent/` locations.

## Depends On

- Phase 1 contracts and routers.
- Phase 2 asset-pipeline and renderer updates.
- Phase 3 CLI state path updates.

## Files to Modify or Move

| File or Directory | Change Summary |
| ----------------- | -------------- |
| `docs/guides/agent/*.md` | Move session records to `docs/.assets/history/`. |
| `docs/guides/agent/AGENTS.md` and `CLAUDE.md` | Remove after `docs/.assets/history/` routers exist. |
| `docs/.assets/history/*.md` | Add or preserve frontmatter where practical during migration; keep existing history content concise. |
| `README.md` | Update current CLI state-path descriptions. |
| `docs/guides/user/getting-started-installing-make-docs.md` | Update manifest, conflict, troubleshooting, and directory tree references. |
| `docs/guides/developer/cli-development-local-build-and-install.md` | Update smoke-pack and manifest expectations. |
| `packages/docs/README.md` | Update template router inventory and session-history descriptions. |
| `packages/skills/archive-docs/SKILL.md` | Scan `docs/.assets/history/` instead of `docs/guides/agent/`. |
| `packages/skills/archive-docs/references/archive-workflow.md` | Update archive workflow history lookup path. |
| `docs/assets/archive/designs/2026-04-16-archive-docs-skill.md` and active archive-skill plan docs if still used as current references | Update only if they are treated as active source-of-truth for the archive skill behavior. |
| `docs/AGENTS.md`, `docs/CLAUDE.md`, `docs/guides/AGENTS.md`, and `docs/guides/CLAUDE.md` | Keep aligned with Phase 1 after file moves. |

## Detailed Changes

### 1. Move current history records

Move current session history Markdown files from:

```text
docs/guides/agent/
```

to:

```text
docs/.assets/history/
```

The directory depth remains the same relative to `docs/`, so links like `../../designs/...`, `../../plans/...`, and `../../../scripts/...` should continue to resolve. Still run link validation because some self-links or guide-specific relative links may need adjustment.

### 2. Add migration frontmatter pragmatically

For moved records, prefer adding minimal frontmatter when the values can be inferred from filename and session content:

```yaml
---
date: "2026-04-20"
coordinate: "W8 R0 P5"
status: "completed"
---
```

Do not invent unknown client/model/provider values for older records. The contract is flexible; missing fields are allowed.

### 3. Update active docs

Update active user/developer docs and package READMEs that explain current behavior:

- replace `docs/.make-docs/manifest.json` with `docs/.assets/config/manifest.json`,
- replace `docs/.make-docs/conflicts/<run-id>/` with `docs/.assets/config/conflicts/<run-id>/`,
- describe `docs/.assets/history/` as the history destination,
- keep `docs/guides/` framed as stable user/developer guides.

### 4. Update archive skill lookup behavior

The archive-docs skill currently scans `docs/guides/agent/` when associating history with plan/work waves. Update skill instructions and references to scan `docs/.assets/history/`.

If the skill expects `w{W}-r{R}-p{P}` in filenames, revise the lookup to use either:

- `coordinate` frontmatter when present, or
- legacy filename parsing for moved older records that still include W/R/P in the filename.

This keeps archive behavior useful without forcing a wholesale rename of all historical files.

### 5. Avoid noisy historical rewrites

Do not rewrite every older design, plan, work backlog, or history record solely because it mentions the old path. Those docs may be describing prior behavior. The validation phase should distinguish active source-of-truth surfaces from historical artifacts.

## Parallelism

History moves and active doc updates can be split, but one coordinator should own final link repair because relative links and stale-reference allowlists cut across both scopes.

## Acceptance Criteria

- [ ] No active history records remain under `docs/guides/agent/`.
- [ ] `docs/.assets/history/` contains moved session records and history routers.
- [ ] Moved records have minimal frontmatter when values are known.
- [ ] Active user/developer docs describe `docs/.assets/config/manifest.json`.
- [ ] Archive-skill instructions scan `docs/.assets/history/`.
- [ ] Root and guide routers no longer send history work to `docs/guides/agent/`.
- [ ] Historical references to old paths are either updated or intentionally allowlisted.
