# Phase 3: Core Archive Skill

> Derives from [Phase 3 of the plan](../../plans/2026-04-16-w5-r0-archive-docs-plugin/03-core-archive-skill.md).

## Purpose

Write the core `archive` SKILL.md — the primary skill with 4 archival modes, user interview flow, replacement detection, and link rewriting.

## Overview

One file: `packages/skills/archive-docs/skills/archive/SKILL.md`. This is the largest single skill and the plugin's primary entry point.

## Source Plan Phases

- [03-core-archive-skill.md](../../plans/2026-04-16-w5-r0-archive-docs-plugin/03-core-archive-skill.md)

## Stage 1 — Write archive SKILL.md

### Tasks

1. Create `packages/skills/archive-docs/skills/archive/SKILL.md`.
2. Add YAML frontmatter: `name: archive`, `description` with trigger phrases (archive, archive docs, archive design, archive plan, archive work, move to archive, replace a document).
3. Add `## Overview` — purpose (move documentation artifacts into the project's archive directory while preserving traceability and link integrity), the 4 modes table:
   - **Direct** — archive a single, explicitly named artifact.
   - **Related** — archive an artifact plus its upstream/downstream/lateral relatives.
   - **Replacement** — archive an artifact being superseded by a new version, establishing a predecessor link.
   - **Project** — archive an entire project-scoped set of artifacts.
   - Note that mode selection is inferred from context but always confirmed with the user.
4. Add `## Workflow` — 7-step ordered list:
   1. Preflight — inspect `docs/` tree, identify target artifact(s), read relevant `AGENTS.md`/`CLAUDE.md` for archive paths.
   2. Mode Detection — determine which mode applies; default to direct when ambiguous and confirm.
   3. Relationship Tracing — discover upstream, downstream, lateral connections; reference `references/archive-workflow.md`.
   4. User Interview — present findings grouped by relationship type, walk through 6-step interview flow.
   5. Confirmation — obtain explicit user approval before any file moves (hard rule).
   6. Execution — move artifacts to archive per `docs/.archive/AGENTS.md` structure; preserve directory hierarchy.
   7. Post-Archive Link Rewriting — scan for broken links, present proposed path transformations, apply after user confirmation.
5. Add `## Archival Modes` — for each mode, include decision criteria and 2-3 example trigger phrases:
   - **Direct Mode** — criteria: user names a specific file/directory, no mention of related docs or replacement. Triggers: "archive `docs/designs/2026-04-01-foo.md`", "move that design to the archive", "archive this plan".
   - **Related Mode** — criteria: user mentions related/connected/dependent documents, or target has known upstream/downstream links. Triggers: "archive the migration design and everything related to it", "archive all docs connected to the v2 migration".
   - **Replacement Mode** — criteria: replacement detection fires, user states a new document replaces an old one, or frontmatter indicates succession. Triggers: "this new design replaces the old one", "archive the old PRD — we have a new version", "replace `docs/prd/05-auth.md` with the updated version".
   - **Project Mode** — criteria: user requests archival of a complete initiative, multiple artifact types involved. Triggers: "archive everything from the v1 migration project", "the onboarding initiative is done — archive it all".
6. Add `## Relationship Tracing` — define three relationship types:
   - **Upstream** — documents the target references or was derived from.
   - **Downstream** — documents that reference or were derived from the target.
   - **Lateral** — documents at the same level sharing context without derivation.
   - State tracing uses `references/archive-workflow.md` rules and, when available, `trace_relationships.py` from `scripts/`.
   - Tracing depth: one hop by default; user interview can expand scope.
7. Add `## User Interview Flow` — the 6-step sequence:
   1. Identify Targets — confirm primary artifact(s) the user wants to archive.
   2. Trace — run relationship tracing, collect results.
   3. Present Findings — display grouped by relationship type (upstream, downstream, lateral); show path and relationship for each.
   4. Confirm Scope — ask which related artifacts should also be archived; default to direct-only unless user expands.
   5. Execute — move confirmed artifacts to archive.
   6. Link Rewriting — present broken-link scan results and proposed fixes; apply after user confirmation.
8. Add `## Replacement Detection` — 4 detection signals:
   1. Explicit Statement — user explicitly says a document replaces another.
   2. Design Lineage — new document's frontmatter/content references a prior version via `replaces`/`supersedes` field or lineage section.
   3. Guide Frontmatter — guide's YAML contains `replaces`/`predecessor` field pointing to target.
   4. Same-Slug Heuristic — new document shares the same slug (filename minus date prefix and extension) as the target.
   - When any signal fires, switch to replacement mode and confirm. When multiple fire, note all in confirmation prompt.
9. Add `## Link Rewriting` — post-archive scan of all non-archived markdown in `docs/` for links to moved artifacts. For each broken link, compute path transformation (`<original path>` to `<archive location>`). Present as table (original path, new path, file containing link). Apply only after explicit user approval. If none found, report and skip.
10. Add `## Archive Rules` — defer to `docs/.archive/AGENTS.md` for authoritative directory structure and sub-directory mappings. **HARD RULE**: never archive any artifact without explicit user approval (all modes). Preserve original directory hierarchy within archive (e.g., `docs/designs/foo.md` to `docs/.archive/designs/foo.md`).
11. Add `## References` — link to `references/archive-workflow.md` as the shared reference for archival modes, tracing rules, interview flow, replacement detection, and link rewriting details.

### Acceptance criteria

- [x] File exists at `packages/skills/archive-docs/skills/archive/SKILL.md`
- [x] Follows decompose-codebase SKILL.md pattern (YAML frontmatter + structured prose sections)
- [x] YAML frontmatter contains `name: archive` and description with all trigger phrases
- [x] All 10 sections present: Overview, Workflow, Archival Modes, Relationship Tracing, User Interview Flow, Replacement Detection, Link Rewriting, Archive Rules, References (plus frontmatter)
- [x] Overview lists all 4 modes with descriptions
- [x] Workflow defines 7-step end-to-end flow
- [x] Each archival mode includes decision criteria and at least 2 example triggers
- [x] Relationship Tracing defines upstream/downstream/lateral and references `references/archive-workflow.md`
- [x] User Interview Flow defines 6-step sequence
- [x] Replacement Detection defines all 4 signals
- [x] Link Rewriting describes scan, transformation, and user-confirmed application
- [x] Archive Rules include hard rule about explicit user approval
- [x] References section links to `references/archive-workflow.md`

### Dependencies

- Phase 1 (`01-scaffold-and-shared-assets.md`) — shared `references/archive-workflow.md` must exist.
