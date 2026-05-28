# Guide Contract

## Purpose

Use this contract for developer and user guides under `docs/guides/developer/` and `docs/guides/user/`.

This contract does NOT apply to history records, which use `docs/assets/references/history-record-contract.md`.

Guides are living documentation for the current usable or maintainable product surface. They should not read like phase logs, release notes, or implementation summaries. Use phase, plan, PRD, design, and history docs as evidence, then write the guide around what a reader needs to do next.

## Audience Contract

### Developer Guides

Developer guides live in `docs/guides/developer/`. Write them for contributors, maintainers, integrators, and operators who need to understand, extend, validate, troubleshoot, or safely change the project.

A developer guide should help a capable developer quickly reach a first useful PR or maintenance action. Prefer:

- codebase and documentation navigation
- local setup, validation, release, or operational procedures
- extension points, generated files, contracts, and source-of-truth boundaries
- maintainer workflows, troubleshooting, and safe-change notes
- links to deeper designs, PRDs, work backlogs, and reference contracts

Avoid writing developer guides as implementation diaries. Historical context belongs only where it helps the reader make a current decision.

### User Guides

User guides live in `docs/guides/user/`. Write them for people who use what the project ships, including novices who need orientation and advanced users who want to explore deeper workflows.

A user guide should help the reader understand the product from a user's perspective and complete real tasks. Prefer:

- getting-started orientation and first successful use
- task-based workflows, product concepts, and decision points
- practical examples, prerequisites, expected results, and troubleshooting
- progressive depth: start with the common path, then link or section advanced usage

Avoid exposing internal implementation detail unless it directly affects user behavior, configuration, or troubleshooting.

## Required Frontmatter

Every guide must begin with a YAML frontmatter block. Required fields:

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Display title of the guide. |
| `path` | string | Virtual grouping and publication path. Lowercase, forward-slash separated, no leading or trailing slash. 1-3 segments. Examples: `cli/development`, `getting-started`, `template/customization`. |
| `status` | enum | One of `draft`, `published`, `deprecated`. |

## Optional Frontmatter

| Field | Type | Description |
| --- | --- | --- |
| `version` | string | Guide version (freeform, e.g., `1.0`, `2026-04-16`). When omitted, freshness is tracked via git history. |
| `order` | integer | Sort weight within the guide's path group. Lower numbers sort first. Default: `100`. |
| `tags` | list of strings | Freeform labels for search and cross-referencing. |
| `applies-to` | list of strings | Package names or capability areas the guide covers (e.g., `cli`, `template`, `skills`). |
| `related` | list of strings | Relative paths to related guides, designs, plans, PRDs, work backlogs, history records, or reference files. |

Do not add frontmatter fields for deferred guide work. Use `## Future Coverage` in the guide body instead.

## Guide Coverage Decision

Before creating a guide, inspect existing guides for overlap. Prefer updating or linking an existing guide when that produces a clearer documentation set than adding a new file.

Resolve each documentation-worthy capability to one of these outcomes:

| Outcome | Use when |
| --- | --- |
| `developer` | The durable knowledge is maintainer-facing, contributor-facing, operational, validation-related, or extension-related. |
| `user` | The durable knowledge helps people use the shipped product, understand a concept, or complete a task. |
| `both` | The capability has distinct user and developer needs that should not be collapsed into one audience. |
| `update-existing` | A current guide already owns the topic and should be expanded instead of creating a new guide. |
| `link-only` | The capability is covered well enough by a related guide, reference, design, PRD, or existing navigation surface. |
| `none` | The capability is obsolete, too internal, too narrow, or only useful as a history entry. |

When both audiences are relevant, avoid duplicating the same guide in both directories. Put the detailed guide in the primary audience directory and use `related` frontmatter plus concise companion coverage when the secondary audience needs a different entry point.

After creating or updating guide content, re-check overlapping developer and user guides. Add reciprocal links, `related` frontmatter, or concise supplemental context when the new guide work helps an existing guide become easier to discover, navigate, or apply.

When no guide is needed during closeout or generation, record the no-guide decision in the history entry or planning artifact with the reason.

## Partial and Future Coverage

Do not block useful guide work just because downstream capabilities are incomplete. Write or update the guide with the current confirmed behavior, and defer only the blocked portion.

Use a `## Future Coverage` section when a guide would benefit from a known downstream capability, phase, or decision that is not complete yet. Keep it as an actionable guide-maintenance note, not a risk register replacement.

Each future coverage item should state:

- `Blocked by`: the missing downstream phase, capability, decision, or artifact
- `Update when`: the concrete signal that should trigger the guide update
- `Guide change`: what should be added, revised, or removed later

Do not create a design doc, architecture decision, or PRD risk-register item solely to remember future guide work. Use those artifacts only when the repo already needs them for product or architecture decisions beyond guide maintenance.

## Slug Convention

Guide filenames follow the pattern:

```
<path-prefix>-<descriptive-slug>.md
```

`<path-prefix>` is the `path` frontmatter value with `/` replaced by `-`. The descriptive suffix must be unique within the directory.

Rules:

- Slugs are lowercase, hyphens only, no special characters.
- The path-prefix portion of the slug must exactly match the `path` field with `/` replaced by `-`.
- No date prefix. Guides are living documents; freshness is tracked via `version` or git history.

Examples:

| `path` value | Filename |
| --- | --- |
| `cli/development` | `cli-development-local-build-and-install.md` |
| `cli/testing` | `cli-testing-smoke-pack.md` |
| `getting-started` | `getting-started-installing-make-docs.md` |
| `template/customization` | `template-customization-adding-capabilities.md` |

## Path Rules

The `path` field is limited to 1-3 segments. This prevents deeply nested virtual paths from undermining the flat-file layout.

| Depth | Example | Use case |
| --- | --- | --- |
| 1 | `getting-started` | Top-level topics without subsystem specificity. |
| 2 | `cli/development` | Subsystem plus topic area, which is most common. |
| 3 | `cli/testing/integration` | Subsystem plus topic plus sub-topic. Use sparingly. |

The `path` field serves dual purposes:

1. **Logical grouping**: guides sharing the same `path` form a virtual section for search and discovery.
2. **Publication routing**: external documentation pipelines can map `path` to URL structure.

## Status Lifecycle

| Status | Meaning | Publication |
| --- | --- | --- |
| `draft` | Work in progress. May be incomplete or inaccurate. | Excluded from publication pipelines by default. |
| `published` | Complete and current. | Included in publication pipelines. |
| `deprecated` | Superseded or no longer applicable. Retained with a deprecation note at the top. | Excluded from publication pipelines. |

New guides always start as `draft`. An agent must never set `status: published` on a newly created guide. Only the user or an explicit user request promotes a guide to `published`.

Transitions: `draft` to `published` to `deprecated`. A `deprecated` guide may return to `draft` for substantial rewrites. Archival, moving to `docs/assets/archive/guides/`, follows existing archive rules and happens only when the user explicitly asks.

## Scope

- Applies to `docs/guides/developer/` and `docs/guides/user/` only.
- Does NOT apply to history records, which use `docs/assets/references/history-record-contract.md`.

## Link Rules

- Use relative Markdown links between guides and related designs, plans, PRDs, work backlogs, history records, or reference files.
- Apply `docs/assets/references/path-and-link-hygiene.md` for repo-relative path rules, sanitized placeholders, and full-path exceptions.
- Every internal link must resolve.
- Use `related` frontmatter for companion guides and high-value source artifacts.
