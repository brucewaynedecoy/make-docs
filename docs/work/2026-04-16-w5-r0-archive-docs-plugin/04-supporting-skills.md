# Phase 4: Supporting Skills

> Derives from [Phase 4 of the plan](../../plans/2026-04-16-w5-r0-archive-docs-plugin/04-supporting-skills.md).

## Purpose

Write the three supporting SKILL.md files: staleness-check, deprecate, and archive-impact.

## Overview

Three independent SKILL.md files, each following the decompose-codebase pattern. All reference the shared archive-workflow.md. Can be created in parallel.

## Source Plan Phases

- [04-supporting-skills.md](../../plans/2026-04-16-w5-r0-archive-docs-plugin/04-supporting-skills.md)

## Stage 1 — Write staleness-check SKILL.md

Create at `packages/skills/archive-docs/skills/staleness-check/SKILL.md`.

### Tasks

1. Frontmatter: name `staleness-check`, description with triggers
2. `## Overview` — advisory mode, scans without archiving
3. `## Staleness Signals` — table of 6 signals (downstream phases complete, downstream work complete, downstream plans+work complete, deprecated status, superseded by newer artifact, no active references)
4. `## Output` — grouped report of candidates with signals
5. `## References` — link to archive-workflow.md

### Acceptance criteria

- [ ] File exists at `packages/skills/archive-docs/skills/staleness-check/SKILL.md`
- [ ] All sections present (frontmatter, Overview, Staleness Signals, Output, References)

### Dependencies

- Phase 1 (scaffold and shared assets)

## Stage 2 — Write deprecate SKILL.md

Create at `packages/skills/archive-docs/skills/deprecate/SKILL.md`.

### Tasks

1. Frontmatter: name `deprecate`, description with triggers
2. `## Overview` — mark in-place without archiving
3. `## Deprecation Behavior` — 4 steps: add blockquote notice, set status: deprecated for guides, record replacement, do NOT move
4. `## Deprecation Notice Format` — the exact blockquote template
5. `## Relationship to Archival` — deprecation as precursor, staleness-check treats it as signal
6. `## References` — link to archive-workflow.md

### Acceptance criteria

- [ ] File exists at `packages/skills/archive-docs/skills/deprecate/SKILL.md`
- [ ] All sections present (frontmatter, Overview, Deprecation Behavior, Deprecation Notice Format, Relationship to Archival, References)

### Dependencies

- Phase 1 (scaffold and shared assets)

## Stage 3 — Write archive-impact SKILL.md

Create at `packages/skills/archive-docs/skills/archive-impact/SKILL.md`.

### Tasks

1. Frontmatter: name `archive-impact`, description with triggers
2. `## Overview` — read-only, modifies nothing
3. `## Output Format` — 5 items: files to move + destinations, broken links, proposed rewrites, guide reference counts, incomplete downstream warning
4. `## References` — link to archive-workflow.md

### Acceptance criteria

- [ ] File exists at `packages/skills/archive-docs/skills/archive-impact/SKILL.md`
- [ ] All sections present (frontmatter, Overview, Output Format, References)

### Dependencies

- Phase 1 (scaffold and shared assets)
