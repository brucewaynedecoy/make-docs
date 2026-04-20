# Phase 4: History and Documentation Migration

> Derives from [Phase 4 of the plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/04-history-and-documentation-migration.md).

## Purpose

Move current repository session history into `docs/.assets/history/` and update active documentation surfaces to use the new `.assets` model.

## Overview

This phase owns existing repository content. It should move current history records, update active user/developer/package docs, repair links, and update archive-skill references. Historical design, plan, and work docs should not be bulk-rewritten just to erase old-path descriptions.

## Source PRD Docs

None. This backlog is derived from the `w9-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [04-history-and-documentation-migration.md](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/04-history-and-documentation-migration.md)

## Stage 1 - Move current history records

### Tasks

1. Move current session record Markdown files from `docs/guides/agent/` to `docs/.assets/history/`.
2. Remove `docs/guides/agent/AGENTS.md` and `docs/guides/agent/CLAUDE.md` after the new history routers exist.
3. Preserve existing filenames unless a collision requires a targeted rename.
4. Add minimal YAML frontmatter to moved records when values can be inferred.
5. Infer `date` and `coordinate` from existing filenames when possible.
6. Do not invent unknown `client`, `model`, or `provider` values.
7. Repair self-links or relative links that break after the move.

### Acceptance criteria

- [ ] Current session records live under `docs/.assets/history/`.
- [ ] No active session record remains under `docs/guides/agent/`.
- [ ] Moved records have minimal frontmatter when inferable.
- [ ] `coordinate` values use a combined string such as `W8 R0 P5`.
- [ ] No moved record introduces separate `wave`, `revision`, `phase`, `stage`, or `task` frontmatter fields.
- [ ] Links inside moved records resolve.

### Dependencies

- Phases 1 and 2.

## Stage 2 - Update active user, developer, and package docs

### Tasks

1. Update `README.md` to describe `docs/.assets/starter-docs/manifest.json` and the new conflict staging path.
2. Update `packages/cli/README.md` with the same current state paths.
3. Update `packages/cli/src/README.md` examples and conflict explanations.
4. Update `docs/guides/user/getting-started-installing-starter-docs.md` manifest, conflict, troubleshooting, and directory tree references.
5. Update `docs/guides/developer/cli-development-local-build-and-install.md` smoke-pack and manifest references.
6. Update `packages/docs/README.md` router inventory and session-history descriptions.
7. Keep historical design/plan/work references unchanged unless they are active source-of-truth instructions.

### Acceptance criteria

- [ ] Active user docs describe `docs/.assets/starter-docs/manifest.json`.
- [ ] Active developer docs describe `docs/.assets/starter-docs/manifest.json`.
- [ ] Package README docs use the new manifest and conflict paths.
- [ ] Template package docs describe `.assets` routers and history correctly.
- [ ] Historical docs are not noisily rewritten.

### Dependencies

- Phase 3 for implemented state paths.

## Stage 3 - Update archive-skill history lookup references

### Tasks

1. Update `packages/skills/archive-docs/SKILL.md` to scan `docs/.assets/history/`.
2. Update `packages/skills/archive-docs/references/archive-workflow.md` to scan `docs/.assets/history/`.
3. If needed, document that archive lookup should prefer `coordinate` frontmatter.
4. Preserve fallback parsing for moved history files whose filenames still include W/R/P.
5. Update active archive-skill design or plan docs only when they are treated as current behavior references.

### Acceptance criteria

- [ ] Archive-skill instructions scan `docs/.assets/history/`.
- [ ] Archive-skill references no longer require `docs/guides/agent/`.
- [ ] Lookup guidance can use `coordinate` frontmatter.
- [ ] Legacy filename parsing remains available for moved older records when useful.

### Dependencies

- Stage 1.

## Stage 4 - Repair routing and stale references

### Tasks

1. Re-run exact-match searches for `docs/guides/agent` across active docs and package sources.
2. Re-run exact-match searches for `docs/.starter-docs` across active docs and package sources.
3. Update active source-of-truth files that still route users or agents to retired paths.
4. Leave clearly historical references in old designs, plans, work backlogs, and moved history records when they describe prior behavior.
5. Record any intentional stale-reference allowlist in the final validation notes or implementation closeout.

### Acceptance criteria

- [ ] Active source-of-truth docs do not route new history work to `docs/guides/agent/`.
- [ ] Active source-of-truth docs do not route users to `docs/.starter-docs/`.
- [ ] Remaining old-path references are historical or explicitly allowlisted.
- [ ] Internal links introduced or changed by this phase resolve.

### Dependencies

- Stages 1-3.
