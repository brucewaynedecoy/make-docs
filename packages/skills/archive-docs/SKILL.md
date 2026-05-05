---
name: archive-docs
description: Archive, deprecate, inspect archival impact, or scan for stale docs under `docs/`. Detect one of four modes (`archive`, `staleness-check`, `deprecate`, `archive-impact`) from the request, announce the chosen mode before acting, and then follow the matching workflow.
---

# Archive Docs

## Delegation First

Before intent routing or relationship tracing, first attempt to spawn a worker agent to run this skill. If you are already the spawned worker for this skill invocation, do not spawn another worker; execute the workflow directly.

Use the active harness's native delegation mechanism when available: Codex `spawn_agent`, Claude Code `Task`, or any other exposed agent-spawn/subagent capability. Do not inspect the reference workflow, trace docs, or load broad repo context in the primary agent before this attempt.

When spawning succeeds, the primary agent becomes coordinator only. Hand the worker a minimal, self-contained prompt containing:

- the user's request
- the current working directory
- the skill name and `packages/skills/archive-docs/SKILL.md` path
- the inferred mode if it is obvious from the request, or instructions to resolve mode ambiguity
- the required output contract: mode, candidate or changed files, approvals needed, validation run, blockers, and concise summary

The worker must read this skill and its referenced resources in its own context, prefer `jdocmunch` and `jcodemunch` first, reindex if stale, and only fall back to direct file reads after reindexing does not work. The worker owns relationship tracing, approval-gate preparation, link impact analysis, and any approved archive/deprecation edits.

When spawning is unsupported or the spawn attempt fails, state that delegation is unavailable or failed, include the short reason, and continue by executing this skill directly.

## Intent Router

This skill consolidates four documentation-maintenance workflows into one entrypoint:

- `archive` — move approved artifacts into `docs/assets/archive/`
- `staleness-check` — report archival candidates without changing files
- `deprecate` — mark artifacts as superseded in place
- `archive-impact` — produce a dry-run impact report

Before taking action, infer the mode from the user request and explicitly state it:

- Requests about "what's ready to archive", "stale docs", or "run a staleness check" map to `staleness-check`.
- Requests about "what would happen if I archived", "dry-run archive", or "show the impact" map to `archive-impact`.
- Requests about "deprecate", "mark as superseded", or "keep this in place but outdated" map to `deprecate`.
- Requests about "archive", "move to archive", "clean up completed work", or "this replaces the old one" map to `archive`.

If more than one mode could apply, explain the ambiguity and ask before taking any mutating action.

## Shared Rules

- Operate only on artifacts under `docs/`.
- Treat [`references/archive-workflow.md`](./references/archive-workflow.md) as the shared authority for tracing, replacement detection, staleness signals, deprecation rules, impact reporting, and archive path mapping.
- Treat `docs/assets/archive/AGENTS.md` as the structural authority for where archived artifacts belong.
- Use [`scripts/trace_relationships.py`](./scripts/trace_relationships.py) when the doc tree is large enough that manual tracing would be noisy or error-prone.
- Never archive without explicit user approval.
- When the mode is mutating (`archive` or `deprecate`), confirm the final target set before writing anything.

## Mode: `archive`

Use this mode when the user wants to move docs into `docs/assets/archive/`.

1. Resolve the target artifact(s) under `docs/`.
2. Infer the archival submode:
   - `direct` for the named artifact itself
   - `related` for related artifacts without archiving the named origin
   - `replacement` when a newer artifact supersedes an older one
   - `project` when the user wants the full initiative, slug, or wave archived
3. State `Mode: archive (<submode>)` before continuing.
4. Trace upstream, downstream, lateral, and slug-based relationships per [`references/archive-workflow.md`](./references/archive-workflow.md).
5. Present a grouped candidate list, clearly separating:
   - `[requested]` user-specified targets
   - `[traced]` artifacts discovered by relationship analysis
6. Wait for explicit approval of the final archive set.
7. Move approved artifacts into `docs/assets/archive/`, preserving filenames and directory structure.
8. After the move, scan active artifacts for broken links and propose rewrites for user approval.

Archive-mode reminders:

- `related` mode does not archive the named origin unless the user later adds it.
- `replacement` mode archives the superseded artifact, never the replacement.
- If the user expands scope mid-flow, restate the new submode and re-present the candidate set.

## Mode: `staleness-check`

Use this mode when the user wants advisory analysis without moving or editing files.

1. State `Mode: staleness-check`.
2. Scan `docs/designs/`, `docs/plans/`, `docs/work/`, `docs/guides/developer/`, `docs/guides/user/`, and `docs/assets/history/`.
3. Evaluate staleness signals from [`references/archive-workflow.md`](./references/archive-workflow.md), including:
   - downstream completion
   - deprecated status
   - supersession
   - no active references
4. For history records, prefer `coordinate` frontmatter for W/R/P matching; fall back to W/R/P filename parsing for older moved records when frontmatter is absent.
5. Use [`scripts/trace_relationships.py`](./scripts/trace_relationships.py) when needed for relationship scans.
6. Present a grouped staleness report with the signal and rationale for each candidate.
7. Do not archive anything in this mode. If the user wants to proceed, switch to `archive`.

## Mode: `deprecate`

Use this mode when the artifact should stay in place but be marked as no longer current.

1. State `Mode: deprecate`.
2. Resolve the target artifact(s) and detect the replacement when possible.
3. Confirm the final set of artifacts to deprecate.
4. For each target:
   - add a deprecation notice after any YAML frontmatter, or at the top if none exists
   - set `status: deprecated` for developer and user guides that use frontmatter
   - link to the replacement artifact when one is known
5. Report what changed.

Deprecation-mode reminders:

- Do not move files to `docs/assets/archive/`.
- Batch deprecation is allowed, but always confirm the full set first.
- Deprecation is a precursor to archival; it is not archival itself.

## Mode: `archive-impact`

Use this mode when the user wants a dry run before deciding whether to archive.

1. State `Mode: archive-impact`.
2. Resolve the target artifact(s).
3. Trace relationships per [`references/archive-workflow.md`](./references/archive-workflow.md).
4. Determine each archive destination.
5. Scan active artifacts for links that would break.
6. Compute proposed link rewrites and identify incomplete downstream work warnings.
7. Present an impact report that includes:
   - files that would move
   - archive destinations
   - links that would break
   - proposed rewrites
   - guide reference counts
   - warnings about incomplete downstream work

This mode is strictly read-only. If the user wants to proceed afterward, switch to `archive`.

## Additional Resources

- [`references/archive-workflow.md`](./references/archive-workflow.md) — tracing rules, staleness signals, deprecation rules, impact-report contract, and archive target mapping
- [`scripts/trace_relationships.py`](./scripts/trace_relationships.py) — optional helper for large relationship scans
- [`agents/openai.yaml`](./agents/openai.yaml) — harness metadata for environments that consume packaged agent config
