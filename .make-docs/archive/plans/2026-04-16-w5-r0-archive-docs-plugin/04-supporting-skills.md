# Phase 4 — Supporting Skills

## Objective

Create the three supporting SKILL.md files (`staleness-check`, `deprecate`, `archive-impact`) under `packages/skills/archive-docs/skills/`. Each skill follows the `decompose-codebase/SKILL.md` pattern (YAML frontmatter with `name` and `description`, then structured Markdown sections) and references the shared `archive-workflow.md` for authoritative rules.

## Depends On

- **Phase 1** (`01-scaffold-and-shared-assets.md`) — the shared `references/archive-workflow.md` must exist before these skills can reference it.

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `packages/skills/archive-docs/skills/staleness-check/SKILL.md` | Advisory scan that identifies archival candidates without modifying anything |
| 2 | `packages/skills/archive-docs/skills/deprecate/SKILL.md` | Mark artifacts as superseded in-place without moving them |
| 3 | `packages/skills/archive-docs/skills/archive-impact/SKILL.md` | Read-only dry-run analysis of what archiving a target would affect |

## Detailed Specifications

### Skill 1 — `staleness-check`

**Frontmatter:**

```yaml
---
name: staleness-check
description: >-
  Scan the doc tree for artifacts that are ready to archive. Advisory mode only —
  reports candidates without modifying any files. Triggers: "check for stale docs",
  "what's ready to archive", "run staleness check".
---
```

**Sections:**

- **Overview** — Advisory mode. Scans the doc tree for archival candidates using the staleness signals below. Never moves, edits, or deletes files.
- **Staleness Signals** — Table of signals the skill evaluates:

  | Signal | Applies To | Condition |
  |--------|-----------|-----------|
  | All downstream phases complete | Work backlogs | Every `- [ ]` checkbox is `- [x]` |
  | All downstream work complete | Plans | Every derived backlog is fully complete |
  | All downstream plans and work complete | Designs | Every derived plan and its backlogs are complete |
  | Status is `deprecated` | Developer/user guides | YAML frontmatter contains `status: deprecated` |
  | Superseded by newer artifact | Designs, plans | A newer artifact with the same slug exists, or lineage metadata names a successor |
  | No active references | Any artifact | No non-archived artifact contains a link to this artifact |

- **Output** — Grouped report of archival candidates. Each entry includes the artifact path, the staleness signal(s) that triggered it, and a suggested action (archive, deprecate first, or investigate).
- **Reference** — `references/archive-workflow.md`

### Skill 2 — `deprecate`

**Frontmatter:**

```yaml
---
name: deprecate
description: >-
  Mark artifacts as superseded in-place without moving them to the archive.
  Adds a deprecation notice and updates frontmatter status. Triggers:
  "deprecate this design", "mark as superseded",
  "deprecate all guides tagged X".
---
```

**Sections:**

- **Overview** — Marks artifacts as superseded in-place. Does NOT move files to the archive directory. Deprecation is a precursor to archival; the `staleness-check` skill treats deprecated status as one of its staleness signals.
- **Behavior** — Ordered steps the skill performs:
  1. Add a deprecation notice blockquote immediately after the YAML frontmatter (or at the top of the file if no frontmatter exists):
     ```markdown
     > **Deprecated:** This document has been superseded by [replacement](relative-link). It is retained for historical reference.
     ```
  2. For guides that have YAML frontmatter, set `status: deprecated`.
  3. Optionally record which artifact replaced this one (replacement path or title), either in the blockquote link or as a `superseded_by` frontmatter field.
  4. Do NOT move the file. Moving is the responsibility of the `archive` skill.
- **Relationship to Archival** — Deprecation is a soft precursor step. An artifact can be deprecated without being archived. The `staleness-check` skill treats `status: deprecated` as a staleness signal, and the `archive` skill can archive deprecated artifacts when the user is ready.
- **Reference** — `references/archive-workflow.md`

### Skill 3 — `archive-impact`

**Frontmatter:**

```yaml
---
name: archive-impact
description: >-
  Read-only analysis of what would happen if one or more artifacts were archived.
  Modifies nothing. Triggers: "what would happen if I archived",
  "show impact of archiving", "dry-run archive".
---
```

**Sections:**

- **Overview** — Read-only impact analysis. Examines the consequences of archiving one or more target artifacts without modifying any files. Useful as a pre-flight check before running the `archive` skill.
- **Output Format** — The report includes the following sections:
  1. **Files that would move** — List of target files and their computed archive destinations (e.g., `docs/designs/foo.md` -> `docs/.archive/designs/foo.md`).
  2. **Active artifacts with links to target(s)** — Every non-archived artifact that contains a link to one of the targets. These links would break after archival unless rewritten.
  3. **Proposed link rewrites** — Table of old path -> new path rewrites that the `archive` skill would apply to maintain link integrity.
  4. **Guide reference count** — Count of agent, developer, and user guides that reference each target.
  5. **Incomplete downstream work warning** — If any target has downstream plans or backlogs with incomplete work, emit a warning with the incomplete item paths.
- **Reference** — `references/archive-workflow.md`

## Parallelism

- All three SKILL.md files are independent of each other and can be created in parallel.
- Phase 4 can run in parallel with Phase 3 (`03-core-archive-skill.md`); both depend only on Phase 1.

## Acceptance Criteria

1. All three SKILL.md files exist at the paths listed in the Files to Create table.
2. Each file has valid YAML frontmatter with `name` and `description` fields.
3. Each `description` includes natural-language trigger phrases.
4. Each file follows the `decompose-codebase/SKILL.md` structural pattern (frontmatter, then heading-based sections).
5. Each file references `references/archive-workflow.md`.
6. The `staleness-check` skill documents all six staleness signals from the specification.
7. The `deprecate` skill documents the four-step behavior sequence and explicitly states it does not move files.
8. The `archive-impact` skill documents all five output sections (files that would move, active links, proposed rewrites, guide reference count, incomplete work warning).
9. No files outside the three SKILL.md paths are created or modified.
