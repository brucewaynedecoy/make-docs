---
name: archive
description: Archive documents under docs/ with relationship-aware tracing, user interview, and post-archive link rewriting. Supports 4 modes: direct archive (named target + related docs interview), related archive (archive docs related to a target without archiving the target), replacement archive (archive superseded artifacts when a new one replaces them), and project archive (archive an entire initiative by slug). Triggers include requests to archive, move to archive, clean up completed work, or handle document replacement.
---

# Archive

## Scope

This skill handles the interactive archival workflow: target resolution, relationship discovery, user interview, file moves, and link rewriting. It does not handle staleness detection (see `staleness-check`), deprecation marking (see `deprecate`), or dry-run impact analysis (see `archive-impact`). Those sibling skills feed into this one but operate independently.

The skill operates exclusively on artifacts under `docs/`. It does not archive source code, configuration files, or assets outside the documentation tree.

## Overview

This is the primary skill in the archive-docs plugin. It enables relationship-aware archival of documents under `docs/`, covering the full lifecycle from target identification through post-archive cleanup. The skill traces upstream (work to plan to design), downstream (design to plan to work to guides), and lateral (developer/user guides) relationships, interviews the user about what else to archive, and rewrites broken links after artifacts are moved. All archival operations require explicit user approval at every stage — the skill never moves files autonomously.

## Workflow

1. **Preflight** — inspect the doc tree structure under `docs/`. Enumerate the top-level artifact directories (`designs/`, `plans/`, `work/`, `guides/`, `prd/`). Identify the target artifact(s) from the user's request. Resolve ambiguous references (e.g., multiple plans with the same slug but different dates) before proceeding. If the target cannot be resolved to a concrete path, ask the user to clarify.
2. **Mode detection** — infer the archival mode (direct, related, replacement, project) from the user's intent. See the Archival Modes table below for trigger phrases and behavior per mode. State the detected mode explicitly and confirm with the user before tracing begins.
3. **Relationship tracing** — run upstream, downstream, and lateral tracing per `references/archive-workflow.md`. For large doc trees with many cross-references, optionally use `scripts/trace_relationships.py` to automate the scan and reduce manual inspection. Collect all discovered artifacts into a candidate list with their relationship type noted.
4. **Present findings** — show the user a grouped summary organized by relationship type (upstream, downstream, lateral, slug-matched). For each artifact include: file path, artifact type, relationship to the target, and a recommendation (archive, skip, or flag for review). Provide a brief rationale for each recommendation.
5. **Confirm** — wait for explicit user approval. The user may select all, some, or none of the proposed artifacts. Do not proceed without confirmation. If the user modifies the set, re-display the final approved list before executing.
6. **Execute** — move approved artifacts to `docs/.archive/` per the sub-directory mapping defined in `docs/.archive/AGENTS.md`. Create target directories on demand. Preserve original filenames and internal directory structure within the archive. Report each move as it completes.
7. **Post-archive link rewriting** — scan remaining active artifacts for broken links pointing to newly archived files. Compute corrected paths and propose rewrites. Apply only after user confirmation. See the Link Rewriting section for the full protocol.

## Archival Modes

Mode detection is intent-based. Infer the mode from user phrasing and confirm before proceeding. When multiple modes could apply, default to the narrower mode (direct over project) and ask the user to confirm.

| Mode | Trigger examples | Behavior |
| --- | --- | --- |
| **Direct** | "archive this plan", "move the work backlog to archive" | Archive the named target. Trace relationships and interview the user about related artifacts that may also be archival candidates. The target itself is always included in the archive set. |
| **Related** | "archive all docs related to this work backlog", "archive the plan for this design" | Find related artifacts via upstream, downstream, and lateral tracing. Do NOT archive the named target itself — it serves only as the tracing origin. Present only the discovered relatives for approval. |
| **Replacement** | "this new design replaces the old one", detected via Design Lineage | Archive the superseded artifact. Offer to rewrite downstream links to point to the replacement. See Replacement Detection for the four detection signals. The replacement artifact is never archived. |
| **Project** | "archive everything for guide-structure-contract", "archive wave 2" | Trace the full chain from the project slug or wave scope. Collect all designs, plans, work backlogs, and guides sharing the identifier. Present the complete artifact set grouped by type for approval. |

When the mode is ambiguous — for example, "clean up the old plans" could be direct or project — state the ambiguity explicitly and ask the user to confirm which mode applies before proceeding.

Mode transitions are allowed mid-workflow. If the user starts in direct mode but then says "actually, archive everything related too", switch to project mode and re-run tracing from the expanded scope. Re-present the updated candidate list for confirmation.

## Relationship Tracing

Relationship tracing follows the rules defined in [archive-workflow.md](../../references/archive-workflow.md). The summary below covers the three tracing directions and the slug fallback. Defer to the reference file for edge cases, detection mechanics, and staleness signal definitions.

Tracing runs from every target in the candidate set. If tracing from target A discovers artifact B, and artifact B is also a target, do not trace from B again — deduplicate the candidate list before presenting findings.

### Upstream

Trace from the target toward its origin. Upstream tracing answers: "what higher-level artifacts produced or authorized this one?"

- **Work backlog** — scan `00-index.md` and phase files for links into `docs/plans/`. The linked plan is the upstream parent. If the work backlog uses a wave prefix (e.g., `w2-r0`), also check for plans with the same prefix.
- **Plan** — scan `00-overview.md` for links into `docs/designs/`. The linked design is the upstream parent. Check the plan's `source-design` frontmatter field if present.
- **Agent guide** — parse `w{W}-r{R}-p{P}` from the filename to locate the matching plan and work directory sharing the same wave. Agent guides are leaf nodes; their upstream chain typically includes both a plan and a work backlog.

### Downstream

Trace from the target toward its deliverables. Downstream tracing answers: "what artifacts were derived from or depend on this one?"

- **Design** — scan `docs/plans/` for overview files linking back to the design. Each linking plan is a downstream child. A single design may have multiple downstream plans across different waves.
- **Plan** — scan `docs/work/` for index files linking back to the plan. Each linking work backlog is a downstream child.
- **Plan/Work** — scan `docs/guides/agent/` for guides whose filename matches the same wave/revision scope. These guides were authored to support the plan's execution.

### Lateral

Trace siblings and cross-references. Lateral tracing answers: "what other artifacts reference this one without being in its direct chain?"

- Scan `docs/guides/developer/` and `docs/guides/user/` for guides with `related` frontmatter pointing to the target artifact.
- Lateral relationships are advisory. They surface guides that reference the target but do not imply a parent-child dependency.
- A lateral match does not automatically mean the guide should be archived — it means the user should be informed and asked.

### Slug Heuristic Fallback

When link-based tracing produces no results, fall back to slug matching. A plan with slug `guide-structure-contract` is likely related to a design with the same slug but a different date prefix. Treat slug matches as candidates, not certainties, and always present them with a lower confidence marker for user confirmation. If slug matching also produces no results, report that no related artifacts were found and proceed with the user-requested targets only.

## User Interview Flow

The interview is the core interaction pattern. Every archival operation passes through this flow regardless of mode. The skill should feel collaborative, not automated — the user drives the decisions, the skill provides the analysis.

1. **Identify targets** — resolve the user's request to one or more concrete file paths under `docs/`. Display the resolved targets and ask for confirmation if there is any ambiguity. For project mode, enumerate all artifacts matching the slug or wave scope.
2. **Trace relationships** — run upstream, downstream, and lateral tracing from each confirmed target. Collect all candidates into a single deduplicated list. Note the tracing path that discovered each candidate (e.g., "found via downstream link from plan overview").
3. **Present findings** — group results by relationship type (upstream, downstream, lateral, slug-matched). For each artifact, include a recommendation and rationale (e.g., "upstream design — recommend archiving since all downstream work is complete"). Use staleness signals from `references/archive-workflow.md` to inform recommendations.
4. **Distinguish request from suggestion** — clearly separate user-requested targets from agent-suggested additions. Mark each item with its origin: `[requested]` for user-specified targets, `[traced]` for discovered relatives. The user must know which items they asked for and which the skill found.
5. **Wait for approval** — do not proceed until the user explicitly confirms the final set of artifacts to archive. The user may add items, remove items, or change recommendations. If the set changes, re-display the updated list.
6. **Execute and rewrite** — move confirmed artifacts to `docs/.archive/` per the sub-directory mapping, then run post-archive link rewriting per the Link Rewriting section. Report results for each step.

## Replacement Detection

Four signals indicate an artifact has been superseded. Check them in priority order; the first match is sufficient to flag replacement. Higher-numbered signals require user confirmation; signal 1 is taken at face value.

1. **Explicit user statement** — the user says "X replaces Y", "archive the old version", or otherwise declares a replacement relationship directly. This is the highest-confidence signal and does not require additional confirmation.
2. **Design Lineage frontmatter** — a design's `## Design Lineage` section contains `Update Mode: new-doc-related`, indicating the new design supersedes an earlier one rather than updating it in place. Surface the lineage section to the user for confirmation.
3. **Guide deprecation** — a guide's YAML frontmatter has `status: deprecated` with a `related:` field pointing to the replacement artifact. The `related` link identifies the replacement target. Confirm with the user that the deprecation is intentional and the replacement is correct.
4. **Same-slug heuristic** — a newer artifact exists with the same slug but a different date or wave/revision prefix. This is the lowest-confidence signal. Always treat as a candidate requiring explicit confirmation, never as an automatic replacement.

When replacement is detected via signals 2-4, surface the finding to the user and confirm before treating it as a replacement archival. In replacement mode, the replacement artifact (the newer one) is never archived — only the superseded artifact moves to the archive.

## Link Rewriting

After archival, scan all remaining active artifacts under `docs/` for links pointing to newly archived files. Check every markdown file in `designs/`, `plans/`, `work/`, `guides/`, and `prd/` for relative links whose targets no longer resolve. For each broken link, compute the corrected path from the original location to the archive location.

Example transformations:

```
../../plans/2026-04-16-w2-r0-slug/  -->  ../../.archive/plans/2026-04-16-w2-r0-slug/
../designs/2026-03-01-feature/      -->  ../.archive/designs/2026-03-01-feature/
```

Present all proposed rewrites in a side-by-side table with three columns: the file containing the link, the old path, and the new path. Group rewrites by the file being edited so the user can review changes per-file.

For replacement mode, link rewriting has an additional step: offer to update downstream links that pointed to the superseded artifact so they point to the replacement instead of the archive copy. Present both options (rewrite to archive path vs. rewrite to replacement path) and let the user choose per-link.

Rules:
- Apply changes only after explicit user confirmation. Never auto-rewrite links.
- If a link points to an artifact that was archived in a previous session (not the current operation), do not rewrite it automatically. Flag it for user review with a note that the target was already archived.
- If a file has multiple broken links, present them together rather than one at a time.
- Do not modify links inside archived files. Only active artifacts under `docs/` are candidates for rewriting.
- Preserve link text (the display portion of markdown links). Only the URL path changes.

## Archive Rules

**HARD RULE:** never archive without explicit user approval. This applies to every mode, every artifact, every operation. There are no exceptions. Even when the skill strongly recommends archival, the user must confirm.

Additional rules:

- Defer to `docs/.archive/AGENTS.md` for archive structure and sub-directory mapping. That file is the structural authority for where archived artifacts land.
- Archived artifacts preserve their original filenames and internal directory structure.
- W/R naming conventions (wave/revision prefixes) are preserved when archived, not rewritten or renumbered.
- PRD archives use dated sub-directories (`docs/.archive/prds/YYYY-MM-DD/`). Use a `-XX` zero-padded increment suffix when the same date repeats.
- Create archive sub-directories on demand, not ahead of time. Do not pre-create empty archive folders.
- When archiving a directory (e.g., a full work backlog with phase files), move the entire directory as a unit. Do not flatten its contents into the archive root.
- If an artifact is referenced by a non-archived artifact, warn the user before archiving. The link rewriting step will handle corrections, but the user should be aware of the impact upfront.
- Never delete artifacts. Archival is a move operation, not a removal.

## Error Handling

- If the target artifact does not exist at the resolved path, report the error and ask the user to verify the path. Do not guess.
- If `docs/.archive/` does not exist, create it during the execute step. Do not fail because the archive root is missing.
- If a file move fails (permissions, path conflict), report the failure for that specific artifact and continue with the remaining moves. Do not abort the entire operation.
- If link rewriting produces a path that does not resolve, flag it rather than writing a known-broken link.
- If relationship tracing discovers a circular reference (A links to B, B links to A), include both in the candidate list but note the circularity so the user can make an informed decision.
- If the user declines all suggested artifacts in the interview, proceed with only the explicitly requested targets (direct mode) or abort gracefully (related mode, since there is nothing to archive).

## References

- [archive-workflow.md](../../references/archive-workflow.md) — shared workflow authority for the archive-docs plugin
- `docs/.archive/AGENTS.md` — structural authority for archive sub-directory mapping and naming rules
- `scripts/trace_relationships.py` — optional automation for relationship tracing on large doc trees
