---
name: deprecate
description: Mark documents as superseded in-place without moving them to the archive. Adds a deprecation notice, updates guide frontmatter status, and optionally records what replaced the artifact. Triggers include requests to deprecate a document, mark something as superseded, or flag a guide as outdated.
---

# Deprecate

## Overview

Use this skill to mark artifacts as superseded without moving them to `docs/.archive/`. Deprecation is a lighter-weight alternative to archival for documents that are outdated but should remain discoverable in place. A deprecated artifact can later be archived via the `archive` skill.

This skill modifies files in-place but never moves them.

## Workflow

1. Identify the target artifact(s) from the user's request.
2. Determine the replacement (user-provided, detected via `## Design Lineage`, or detected via slug matching).
3. Confirm with the user: "Mark {target} as deprecated, superseded by {replacement}?"
4. Apply the deprecation (see behavior below).
5. Report what was changed.

## Deprecation Behavior

For each target artifact:

1. **Add deprecation notice** — insert a blockquote immediately after any YAML frontmatter (or at the top of the file if no frontmatter exists):
   ```markdown
   > **Deprecated:** This document has been superseded by [replacement title](relative-link). It is retained for historical reference.
   ```
   If no replacement is known, use:
   ```markdown
   > **Deprecated:** This document is no longer current. It is retained for historical reference.
   ```

2. **Update guide frontmatter** — for developer and user guides with YAML frontmatter, set `status: deprecated`.

3. **Record replacement** — if a replacement artifact is known, ensure the deprecation notice links to it with a relative Markdown link.

4. **Do NOT move the file** — the artifact stays in its original location. It is not moved to `docs/.archive/`.

## Relationship to Archival

- Deprecation is a precursor to archival, not a substitute.
- The `staleness-check` skill treats `status: deprecated` as a staleness signal.
- A user can later invoke the `archive` skill to move deprecated artifacts to `docs/.archive/`.
- Deprecating an artifact does not trigger the archive interview flow — it is a standalone operation.

## Batch Deprecation

The skill supports batch operations:

- "Deprecate all guides tagged {topic}" — scan guides for matching `tags` frontmatter and deprecate all matches.
- "Deprecate all designs related to {slug}" — use relationship tracing to find related designs and deprecate them.

Always present the full list of targets for user confirmation before applying batch deprecation.

## References

- [archive-workflow.md](../../references/archive-workflow.md) — shared authority for deprecation rules and relationship tracing.
