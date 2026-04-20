# Guide Contract

## Purpose

Use this contract for developer and user guides under `docs/guides/developer/` and `docs/guides/user/`.

This contract does NOT apply to agent history records, which use `docs/.references/agent-guide-contract.md`.

## Required Frontmatter

Every guide must begin with a YAML frontmatter block. Required fields:

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Display title of the guide. |
| `path` | string | Virtual grouping and publication path. Lowercase, forward-slash separated, no leading or trailing slash. 1–3 segments. Examples: `cli/development`, `getting-started`, `template/customization`. |
| `status` | enum | One of `draft`, `published`, `deprecated`. |

## Optional Frontmatter

| Field | Type | Description |
| --- | --- | --- |
| `version` | string | Guide version (freeform, e.g., `1.0`, `2026-04-16`). When omitted, freshness is tracked via git history. |
| `order` | integer | Sort weight within the guide's path group. Lower numbers sort first. Default: `100`. |
| `tags` | list of strings | Freeform labels for search and cross-referencing. |
| `applies-to` | list of strings | Package names or capability areas the guide covers (e.g., `cli`, `template`, `skills`). |
| `related` | list of strings | Relative paths to related guides, designs, or reference files. |

## Slug Convention

Guide filenames follow the pattern:

```
<path-prefix>-<descriptive-slug>.md
```

`<path-prefix>` is the `path` frontmatter value with `/` replaced by `-`. The descriptive suffix must be unique within the directory.

Rules:

- Slugs are lowercase, hyphens only, no special characters.
- The path-prefix portion of the slug must exactly match the `path` field (with `/` → `-`).
- No date prefix — guides are living documents; freshness is tracked via `version` or git history.

Examples:

| `path` value | Filename |
| --- | --- |
| `cli/development` | `cli-development-local-build-and-install.md` |
| `cli/testing` | `cli-testing-smoke-pack.md` |
| `getting-started` | `getting-started-installing-starter-docs.md` |
| `template/customization` | `template-customization-adding-capabilities.md` |

## Path Rules

The `path` field is limited to 1–3 segments. This prevents deeply nested virtual paths from undermining the flat-file layout.

| Depth | Example | Use case |
| --- | --- | --- |
| 1 | `getting-started` | Top-level topics without subsystem specificity. |
| 2 | `cli/development` | Subsystem + topic area (most common). |
| 3 | `cli/testing/integration` | Subsystem + topic + sub-topic (rare, use sparingly). |

The `path` field serves dual purposes:

1. **Logical grouping** — guides sharing the same `path` form a virtual section for search and discovery.
2. **Publication routing** — external documentation pipelines can map `path` to URL structure.

## Status Lifecycle

| Status | Meaning | Publication |
| --- | --- | --- |
| `draft` | Work in progress. May be incomplete or inaccurate. | Excluded from publication pipelines by default. |
| `published` | Complete and current. | Included in publication pipelines. |
| `deprecated` | Superseded or no longer applicable. Retained with a deprecation note at the top. | Excluded from publication pipelines. |

New guides always start as `draft`. An agent must never set `status: published` on a newly created guide — only the user or an explicit user request promotes a guide to `published`.

Transitions: `draft` → `published` → `deprecated`. A `deprecated` guide may return to `draft` for substantial rewrites. Archival (moving to `docs/.archive/guides/`) follows existing archive rules: only when the user explicitly asks.

## Scope

- Applies to `docs/guides/developer/` and `docs/guides/user/` only.
- Does NOT apply to agent history records, which use `docs/.references/agent-guide-contract.md`.

## Cross-Audience Guides

When a guide is relevant to both developers and users, it lives in the primary audience's directory. Use the `related` frontmatter field to link to a companion or summary in the other directory. Do not duplicate full guides across directories.

## Link Rules

- Use relative Markdown links between guides and related designs, plans, or reference files.
- Every internal link must resolve.
