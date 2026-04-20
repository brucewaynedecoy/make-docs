# Archive Workflow

## Purpose

Shared authority for the `archive-docs` skill. All modes in this skill defer to this file for workflow rules. Archive structure and the hard "never archive unless asked" rule are authoritative in `docs/.archive/AGENTS.md`; this file governs the workflow for getting there.

## Archival Modes

Mode detection is intent-based: infer the mode from user phrasing and confirm before proceeding.

| Mode | Trigger phrases | Behavior |
| --- | --- | --- |
| **Direct** | "archive this file", "move X to archive" | Archive the named artifact(s) only. No relationship tracing. |
| **Related** | "archive this and anything related", "archive the whole chain" | Archive the target plus all upstream, downstream, and lateral relatives. |
| **Replacement** | "this replaces X", "archive the old version" | Archive the superseded artifact and link the replacement. |
| **Project** | "archive everything for this project", "clean up wave N" | Archive all artifacts sharing a wave/revision scope. |

## Relationship Tracing

### Upstream Tracing

- **Work backlog** — scan `00-index.md` and phase files for links into `docs/plans/`.
- **Plan** — scan `00-overview.md` for links into `docs/designs/`.
- **History record** — read `coordinate` frontmatter; find the matching plan and work directory sharing the same wave/revision.

### Downstream Tracing

- **Design** — scan `docs/plans/` for overview files linking back to the design.
- **Plan** — scan `docs/work/` for index files linking back to the plan.
- **Plan/Work** — scan `docs/.assets/history/` for history records whose `coordinate` matches the same wave/revision.

### Lateral Tracing

- **Any artifact** — scan `docs/guides/developer/` and `docs/guides/user/` for guides with `related` frontmatter pointing to the artifact.

### Slug-Based Heuristic

When link-based tracing produces no results, fall back to slug matching. A plan with slug `guide-structure-contract` is likely related to a design with the same slug. Use slug matches as candidates, not certainties — always present them for confirmation.

## Interview Flow

1. **Identify target(s)** — resolve the user's request to one or more concrete file paths.
2. **Trace relationships** — run upstream, downstream, and lateral tracing from each target.
3. **Present findings** — group results by relationship type (upstream, downstream, lateral, slug-matched) with a recommendation for each (archive, skip, or flag for review).
4. **Confirm** — wait for explicit user approval. The user may select all, some, or none.
5. **Execute** — move approved artifacts to `docs/.archive/` per the sub-directory mapping below.
6. **Post-archive link rewriting** — scan remaining active artifacts for broken links and propose rewrites.

## Replacement Detection

Four signals indicate an artifact has been replaced:

1. **Explicit user statement** — the user says "X replaces Y" or "archive the old version."
2. **Design lineage** — a design's lineage frontmatter contains `updated-existing`, indicating it supersedes a prior design.
3. **Guide deprecation** — a guide's frontmatter has `status: deprecated` with a `related:` field pointing to the replacement.
4. **Same-slug heuristic** — a newer artifact exists with the same slug but a different date or wave. Treat as a candidate, not a certainty.

## Link Rewriting

After archival, scan all remaining active artifacts for links to newly archived files. Transform relative paths from the original location to the archive location. Present all proposed rewrites for user confirmation before applying. Never auto-rewrite.

## Staleness Signals

| # | Signal | Applies to | Detection |
| --- | --- | --- | --- |
| 1 | All downstream phases complete | Work backlogs | Every `- [ ]` in every phase file is `- [x]` |
| 2 | All downstream work complete | Plans | Every derived work backlog is fully complete per signal 1 |
| 3 | All downstream plans and work complete | Designs | Every derived plan's work is complete per signal 2 |
| 4 | Status is `deprecated` | Developer/user guides | Frontmatter contains `status: deprecated` |
| 5 | Superseded by newer artifact | Designs, plans | Detected via lineage frontmatter or same-slug heuristic |
| 6 | No active references | Any | No non-archived artifact contains a link to it |

## Deprecation Rules

- Add a blockquote notice at the top of the file:
  ```
  > **Deprecated:** This document has been superseded by [replacement](relative-link). It is retained for historical reference.
  ```
- For guides with YAML frontmatter, set `status: deprecated`.
- Record the replacement path in frontmatter if known.
- Do NOT move the file — deprecation is an in-place operation.
- Relationship to archival: deprecation is a precursor, not a substitute. The staleness-check skill treats deprecated status as one of several archival signals.

## Impact Analysis Output

When running in dry-run or impact mode, produce the following:

- **Files that would move** — each file with its archive destination path.
- **Active artifacts with links to target(s)** — these links would break on archival.
- **Proposed link rewrites** — old path to new path for each affected link.
- **Guide and history reference count** — number of history records, developer guides, and user guides referencing the target.
- **Incomplete downstream warning** — flag if any target has downstream work that is not yet complete.

## Archive Sub-Directory Mapping

This mapping mirrors `docs/.archive/AGENTS.md`. Sub-directories are created on demand, not pre-created.

| Artifact type | Archive target |
| --- | --- |
| Design | `docs/.archive/designs/` |
| Plan | `docs/.archive/plans/` |
| Work | `docs/.archive/work/` |
| PRD set | `docs/.archive/prds/YYYY-MM-DD/` |
| History record | `docs/.archive/.assets/history/` |
| Developer guide | `docs/.archive/guides/developer/` |
| User guide | `docs/.archive/guides/user/` |

## Hard Rules

- NEVER archive without explicit user approval.
- Archive structure authority is `docs/.archive/AGENTS.md`.
- Archived artifacts preserve their original filenames.
- W/R naming is preserved when archived (not rewritten).
- PRD archives use dated sub-directories; use `-XX` zero-padded increment suffix when the same date repeats.
