---
name: archive-impact
description: Dry-run impact analysis for archival. Shows what would happen if one or more artifacts were archived — files that would move, links that would break, proposed rewrites, and warnings about incomplete downstream work. Read-only; modifies nothing. Triggers include requests to show impact of archiving, dry-run archive, or "what would happen if I archived this".
---

# Archive Impact

## Overview

Use this skill to assess the consequences of archiving one or more artifacts before committing to the operation. It is read-only — it inspects the doc tree and produces an impact report without modifying any files.

This skill answers the question: "What would happen if I archived this?"

## Workflow

1. Identify the target artifact(s) from the user's request.
2. Trace relationships (upstream, downstream, lateral) per `references/archive-workflow.md`.
3. Determine the archive destination for each target per the sub-directory mapping.
4. Scan all active (non-archived) artifacts for links pointing to the target(s).
5. Compute proposed link rewrites (original path → archive path).
6. Check for incomplete downstream work (a warning signal).
7. Present the impact report.

## Impact Report Format

```text
## Archive Impact Report

### Target: docs/plans/2026-04-16-w2-r0-guide-structure-contract/

**Destination:** docs/.archive/plans/2026-04-16-w2-r0-guide-structure-contract/

**Files that would move:**
- docs/plans/2026-04-16-w2-r0-guide-structure-contract/00-overview.md
- docs/plans/2026-04-16-w2-r0-guide-structure-contract/01-authority-and-templates.md
- (... all phase files)

**Links that would break (5):**
| Source file | Current link | Proposed rewrite |
| --- | --- | --- |
| docs/work/.../00-index.md | ../../plans/2026-04-16-w2-r0-.../ | ../../.archive/plans/2026-04-16-w2-r0-.../ |
| docs/guides/agent/...p1... | ../../plans/2026-04-16-w2-r0-.../ | ../../.archive/plans/2026-04-16-w2-r0-.../ |

**Guide references (3):**
- 5 agent guides reference this plan
- 0 developer guides
- 0 user guides

**Warnings:**
- None (all downstream work is complete)
```

If the target has incomplete downstream work, include a warning:
```text
**Warnings:**
- ⚠ Downstream work backlog docs/work/2026-04-16-w2-r0-guide-structure-contract/ has unchecked acceptance criteria in 01-authority-and-templates.md
```

## Multi-Target Analysis

When the user asks about archiving multiple artifacts (e.g., "what's the impact of archiving wave 2"), produce a separate section per target, followed by a combined summary:

```text
## Combined Summary
- Total files that would move: 25
- Total links that would break: 12
- Targets with incomplete downstream work: 1
```

## References

- [archive-workflow.md](../../references/archive-workflow.md) — shared authority for impact analysis output format and relationship tracing rules.
