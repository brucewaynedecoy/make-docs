# Portable Agentic Fallback

Use this method only when neither the compatible MCP snapshot tool nor the Make Docs CLI snapshot command is available. Call the method `agentic fallback` in the report. Do not claim a deterministic run. This method is also the full stateless review method when the optional cache is unavailable after a deterministic snapshot. It does not read, imitate, or create cache state.

## Discover records

Use the selected project root. Stay inside it. Do not follow a symlink that can escape the root.

Discover every immediate dated work directory under:

- `docs/work/` for live records; and
- `.make-docs/archive/work/` for archived records.

A record directory starts with `YYYY-MM-DD-wN-rN`, where wave is positive and revision is zero or positive. Keep the repository-relative directory path as record identity. Do not merge duplicate coordinates.

Count a discovered directory even when it has no readable `00-index.md`.

## Read supported records

Fully interpret a record only when `00-index.md` has readable current frontmatter with:

- `kind: work`;
- a valid wave `coordinate`;
- a nonempty `title`; and
- a nonempty `status`.

When these fields are partial, use only the values that can be read safely and state the limit. When current frontmatter is absent, keep inventory facts only. Do not infer old body formats.

For a supported index, use its `## Phase Map` as phase authority. Follow safe local Markdown links to numbered phase files. Do not interpret an unlinked phase as part of the record. Report broken, unsafe, mismatched, and unlinked phase evidence.

Read task checkboxes, dependencies, blockers, recorded source links, and distinct closeout facts only from the supported index and its linked phases. Keep task completion, accepted closeout, commit evidence, closed history, release, and archive as separate signals.

## Collect dates

Get `createdAt` from the record directory date.

For `lastUpdatedAt`, use this evidence order:

1. the newest scoped modification time for a current working-tree change;
2. the newest Git commit time scoped to discovered record files;
3. the newest scoped filesystem modification time; or
4. the directory creation date with date-only precision.

If Git is not available, keep repository facts and state that the file-time result is less precise. If no usable time exists, keep the value unknown.

## Preserve diagnostics

Keep these conditions visible:

- unsafe or unreadable root;
- missing index;
- partial current frontmatter;
- unsupported record shape;
- duplicate coordinate;
- broken phase-map link;
- unlinked current phase;
- recorded status and task-state conflict;
- missing or unsafe source authority;
- Git fallback;
- created-date fallback; and
- separate lifecycle evidence.

Use [the rule map](rule-map.md) for stable rule IDs and parity meaning. Explain each material result in natural language. Raw codes remain secondary evidence.
