# Phase 1: Scaffold and Shared Assets

> Derives from [Phase 1 of the plan](../../plans/2026-04-16-w5-r0-archive-docs-plugin/01-scaffold-and-shared-assets.md).

## Purpose

Create the plugin directory structure, manifest, shared workflow reference, and relationship-tracing script.

## Overview

The scaffold creates all directories (including empty skill directories for later phases). Three shared assets are created in parallel: plugin.json, archive-workflow.md, and trace_relationships.py.

## Source Plan Phases

- [01-scaffold-and-shared-assets.md](../../plans/2026-04-16-w5-r0-archive-docs-plugin/01-scaffold-and-shared-assets.md)

## Stage 1 — Create directory scaffold

### Tasks

1. Create the plugin root: `mkdir -p packages/skills/archive-docs/`
2. Create skill directories: `mkdir -p packages/skills/archive-docs/skills/{archive,staleness-check,deprecate,archive-impact}/`
3. Create agents directory: `mkdir -p packages/skills/archive-docs/agents/`
4. Create references directory: `mkdir -p packages/skills/archive-docs/references/`
5. Create scripts directory: `mkdir -p packages/skills/archive-docs/scripts/`
6. Add `.gitkeep` to each empty directory that will be populated in later phases: `skills/archive/`, `skills/staleness-check/`, `skills/deprecate/`, `skills/archive-impact/`, `agents/`.

### Acceptance criteria

- [x] Full directory tree under `packages/skills/archive-docs/` exists matching the plan structure.
- [ ] Empty skill directories (`archive/`, `staleness-check/`, `deprecate/`, `archive-impact/`) and `agents/` contain `.gitkeep` so git tracks them. (Deferred — git will track once SKILL.md files are added in Phases 3-4.)

### Dependencies

- None — this is the first stage.

## Stage 2 — Create plugin.json

> Can run in parallel with Stages 3 and 4 once Stage 1 is complete.

### Tasks

1. Create `packages/skills/archive-docs/plugin.json` with the following content:
   ```json
   {
     "name": "archive-docs",
     "version": "0.1.0",
     "description": "Relationship-aware document archival, staleness detection, deprecation, and impact analysis for make-docs projects.",
     "skills": [
       {
         "name": "archive",
         "path": "skills/archive/SKILL.md",
         "description": "Core archival with 4 modes (direct, related, replacement, project), user interview flow, and post-archive link rewriting."
       },
       {
         "name": "staleness-check",
         "path": "skills/staleness-check/SKILL.md",
         "description": "Advisory scan of the doc tree for archival candidates based on completion, deprecation, supersession, and reference signals."
       },
       {
         "name": "deprecate",
         "path": "skills/deprecate/SKILL.md",
         "description": "Mark artifacts as superseded in place without moving them to the archive."
       },
       {
         "name": "archive-impact",
         "path": "skills/archive-impact/SKILL.md",
         "description": "Dry-run impact analysis showing files to move, broken links, proposed rewrites, and warnings."
       }
     ]
   }
   ```

### Acceptance criteria

- [x] `plugin.json` is valid JSON.
- [x] Contains `name: "archive-docs"` and `version: "0.1.0"`.
- [x] Lists all 4 skills (`archive`, `staleness-check`, `deprecate`, `archive-impact`) with correct relative `path` values.

### Dependencies

- Stage 1 (directory scaffold must exist).

## Stage 3 — Create archive-workflow.md

> Can run in parallel with Stages 2 and 4 once Stage 1 is complete.

### Tasks

1. Create `packages/skills/archive-docs/references/archive-workflow.md` as the shared authority file.
2. Write the **Four archival modes** section: define Direct archive, Related archive, Replacement archive, and Project archive with a decision table (trigger and behavior for each). Include the rule that mode detection is intent-based.
3. Write the **Relationship tracing rules** section: document upstream tracing (work->plan, plan->design, guide->plan via wave prefix), downstream tracing (design->plan, plan->work, plan/work->guides), lateral tracing (guides with `related` frontmatter), and the slug-based heuristic fallback with confidence distinction.
4. Write the **Interview flow** section: document the six-step flow (identify targets, trace relationships, present findings, confirm, execute, post-archive link rewriting). Include the recommendation template and the link rewrite template.
5. Write the **Replacement detection rules** section: document the four signals (explicit user statement, Design Lineage section, guide frontmatter, same-slug heuristic) and the offer to archive superseded artifacts.
6. Write the **Link rewriting rules** section: document the path transformation pattern (`docs/{type}/{name}` to `docs/.archive/{type}/{name}`), the side-by-side presentation requirement, and the user confirmation requirement.
7. Write the **Staleness detection signals** section: define the signal table covering all six signals (downstream phases complete, downstream work complete, downstream plans/work complete, deprecated status, superseded by newer artifact, no active references) with applies-to and detection columns.
8. Write the **Deprecation rules** section: document the notice format (blockquote after frontmatter), frontmatter update for guides, replacement recording, no-file-move rule, and the relationship between deprecation and archival.
9. Write the **Impact analysis output format** section: define the structured output covering files to move, broken links, proposed rewrites, reference counts, and warnings.
10. Write the **Relationship to existing authorities** section: state boundary with `docs/.archive/AGENTS.md` (archive structure and "never archive unless user asks" rule), `docs/.references/output-contract.md` (PRD archive rules), and this file's scope (workflow only).

### Acceptance criteria

- [x] `archive-workflow.md` exists at `packages/skills/archive-docs/references/archive-workflow.md`.
- [x] Contains all nine sections: archival modes, relationship tracing, interview flow, replacement detection, link rewriting, staleness signals, deprecation rules, impact analysis format, and relationship to existing authorities.
- [x] All internal references (to `docs/.archive/AGENTS.md`, `docs/.references/output-contract.md`) resolve correctly.
- [x] Mode decision table is present with all four modes.
- [x] Interview flow documents all six steps with question templates.
- [x] Staleness signal table covers all six signals.

### Dependencies

- Stage 1 (directory scaffold must exist).

## Stage 4 — Create trace_relationships.py

> Can run in parallel with Stages 2 and 3 once Stage 1 is complete.

### Tasks

1. Create `packages/skills/archive-docs/scripts/trace_relationships.py` as a standalone Python 3.9+ script using only stdlib modules (`argparse`, `pathlib`, `re`, `json`, `os`, `datetime`).
2. Implement `--doc-root` required argument (path to the `docs/` directory to scan).
3. Implement `--output` optional argument (path to write JSON report; defaults to stdout).
4. Implement `--format` optional argument (`json` default or `text` for human-readable summary).
5. Implement scanning logic: walk the doc root and identify artifact directories under `designs/`, `plans/`, `work/`, `guides/agent/`, `guides/developer/`, `guides/user/`.
6. Implement markdown link extraction: for each artifact, extract all relative markdown links (`[text](path)`) from its files.
7. Implement link resolution: resolve relative links to absolute paths relative to doc root.
8. Implement relationship classification: classify each link as upstream, downstream, or lateral based on artifact type rules (plan->design is upstream, work->plan is upstream, design->plan-back-ref is downstream, guide `related` frontmatter is lateral).
9. Build the relationship graph: for each artifact, record its upstream, downstream, and lateral relationships with source and link location metadata.
10. Implement slug-based heuristic fallback: after link-based tracing, scan for artifacts with matching slugs (portion after date-wave prefix) that have no link-based relationship. Mark these with `"source": "slug-heuristic"`.
11. Output valid JSON matching the plan's schema (`doc_root`, `scanned_at`, `artifacts` map with `type`, `upstream`, `downstream`, `lateral` arrays).
12. Skip `docs/.archive/` when scanning for active artifacts.
13. Handle broken links gracefully (report but do not crash).
14. Exit code 0 on success, non-zero on errors (missing doc root, parse failures).

### Acceptance criteria

- [x] `trace_relationships.py` exists at `packages/skills/archive-docs/scripts/trace_relationships.py`.
- [x] Script accepts `--doc-root`, `--output`, and `--format` arguments.
- [x] Scans `designs/`, `plans/`, `work/`, and `guides/` sub-directories.
- [x] Extracts markdown links and builds upstream/downstream/lateral relationship graph.
- [x] Implements slug-based heuristic fallback with `"source": "slug-heuristic"` marker.
- [x] Outputs valid JSON matching the plan schema.
- [x] `python packages/skills/archive-docs/scripts/trace_relationships.py --doc-root docs/` runs without errors against the dogfood doc tree (80 artifacts, 202 relationships, 32 heuristic matches).
- [x] Skips `docs/.archive/` when scanning.
- [x] Uses only Python stdlib (no `pip install` required).
