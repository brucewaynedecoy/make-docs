# Guide Structure Contract — Frontmatter, Slug Convention, and Publication Paths

> Filename: `2026-04-16-w2-r0-guide-structure-contract.md`. See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

Establish a structural contract for developer and user guides under `docs/guides/developer/` and `docs/guides/user/`. Today these directories have tone and content guidance (via the `docs/guides/` router) but no naming convention, no required metadata, and no mechanism for logical grouping or publication routing. This design introduces YAML frontmatter, a slug convention that mirrors a virtual path, and a contract reference file — bringing guides into parity with the structural rigor applied to designs, plans, work backlogs, and agent session summaries.

## Context

Every other output target in `starter-docs` has a contract:

| Artifact | Contract | Naming convention | Metadata |
| --- | --- | --- | --- |
| Designs | `design-contract.md` | `YYYY-MM-DD-w{W}-r{R}-<slug>.md` | Headings-based |
| Plans | `output-contract.md` | `YYYY-MM-DD-w{W}-r{R}-<slug>/` | Directory structure |
| Work | `output-contract.md` | `YYYY-MM-DD-w{W}-r{R}-<slug>/` | Directory structure |
| PRDs | `output-contract.md` | `NN-<slug>.md` | Headings-based |
| Agent guides | `agent-guide-contract.md` | `YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md` | Headings-based |
| **Developer guides** | *(none)* | *(none)* | *(none)* |
| **User guides** | *(none)* | *(none)* | *(none)* |

The `docs/guides/` router instructs agents on audience separation and general documentation quality, but imposes no structure on filenames, metadata, or logical organization. As the guide library grows — especially in monorepos or projects with multiple subsystems — the flat, unstructured approach will make discovery, grouping, and external publication difficult.

The two guides just created (`docs/guides/developer/local-build-and-install.md` and `docs/guides/user/installing-starter-docs.md`) surfaced this gap: they were written with good content but no structural metadata, no grouping convention, and no mechanism for a documentation pipeline to know where they belong.

### Constraints

- Guides are **living documents** — they are updated over time, unlike designs (point-in-time decisions) or agent guides (immutable breadcrumbs). Date prefixes in filenames would be misleading.
- The `docs/guides/agent/` directory already has its own contract (`agent-guide-contract.md`) with W/R/P naming. This new contract must not apply to agent guides.
- The contract must ship as part of the template (`packages/docs/template/`) so consumer projects inherit it.
- Flat file layout is preferred over nested directories for simplicity and consistency with the rest of the `docs/` tree.

## Decision

### 1. YAML Frontmatter Schema

Every guide in `docs/guides/developer/` and `docs/guides/user/` must begin with a YAML frontmatter block. Required and optional fields:

**Required fields:**

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Display title of the guide. |
| `path` | string | Virtual grouping and publication path. Lowercase, forward-slash separated, no leading or trailing slash. 1–3 segments. Examples: `cli/testing`, `template/customization`, `getting-started`. |
| `status` | enum | One of `draft`, `published`, `deprecated`. |

**Optional fields:**

| Field | Type | Description |
| --- | --- | --- |
| `version` | string | Guide version (freeform, e.g., `1.0`, `2026-04-16`). When omitted, freshness is tracked via git history. |
| `order` | integer | Sort weight within the guide's path group. Lower numbers sort first. Default: `100`. |
| `tags` | list of strings | Freeform labels for search and cross-referencing. |
| `applies-to` | list of strings | Package names or capability areas the guide covers (e.g., `cli`, `template`, `skills`). Useful in monorepos where a guide may span multiple subsystems. |
| `related` | list of strings | Relative paths to related guides, designs, or reference files. |

**Example frontmatter:**

```yaml
---
title: Building and Installing the CLI Locally
path: cli/development
status: published
order: 10
tags:
  - build
  - testing
  - npm-link
applies-to:
  - cli
related:
  - ../user/cli-getting-started-installing-starter-docs.md
---
```

### 2. Slug Convention — Slug Mirrors Path

Guide filenames follow this pattern:

```
<path-prefix>-<descriptive-slug>.md
```

Where `<path-prefix>` is the `path` frontmatter value with `/` replaced by `-`.

| `path` value | Filename |
| --- | --- |
| `cli/development` | `cli-development-local-build-and-install.md` |
| `cli/testing` | `cli-testing-smoke-pack.md` |
| `getting-started` | `getting-started-installing-starter-docs.md` |
| `template/customization` | `template-customization-adding-capabilities.md` |

Rules:

- Slugs are lowercase, hyphens only, no special characters.
- The path prefix portion of the slug must exactly match the `path` field (with `/` → `-`).
- The descriptive suffix must be unique within the directory.
- No date prefix — guides are living documents; freshness is tracked via `version` or git history.

### 3. Path Depth Cap

The `path` field is limited to **1–3 segments**. This prevents the flat-file benefit from being undermined by deeply nested virtual paths while still allowing meaningful grouping.

| Depth | Example | Use case |
| --- | --- | --- |
| 1 | `getting-started` | Top-level topics without subsystem specificity |
| 2 | `cli/development` | Subsystem + topic area (most common) |
| 3 | `cli/testing/integration` | Subsystem + topic + sub-topic (rare, use sparingly) |

Agents and validation tools should warn if a guide uses a 3-segment path and suggest whether a 2-segment path would suffice.

### 4. Path as Publication Route

The `path` field serves dual purposes:

1. **Logical grouping** — guides sharing the same `path` form a virtual section. Tools, indexes, and search can group by path without needing directory structure.
2. **Publication routing** — external documentation pipelines can map `path` to URL structure. A guide with `path: cli/testing` in `docs/guides/developer/` could publish to `docs.example.com/developer/cli/testing/<slug>.html`. The mapping convention is defined by the publication pipeline, not by this contract — but the `path` field provides the necessary input.

### 5. Agent Guide Exemption

This contract applies only to `docs/guides/developer/` and `docs/guides/user/`. It does **not** apply to `docs/guides/agent/`, which retains its own contract (`docs/.references/agent-guide-contract.md`) with W/R/P naming and immutable-breadcrumb semantics.

The `docs/guides/` router will be updated to direct agents to the appropriate contract based on the target subdirectory.

### 6. Cross-Audience Guides

When a guide is relevant to both developers and users, it should live in the **primary audience's directory** with a `related` frontmatter entry pointing to a companion or summary in the other directory. Do not duplicate full guides across directories — write one authoritative guide and one shorter cross-reference or summary.

Example: A "CLI Architecture Overview" guide lives in `docs/guides/developer/cli-architecture-overview.md` (primary audience is developers). A shorter "How the CLI Works" summary in `docs/guides/user/cli-internals-how-the-cli-works.md` links back to the developer guide for depth.

### 7. Status Lifecycle

| Status | Meaning | Visibility |
| --- | --- | --- |
| `draft` | Work in progress. May be incomplete or inaccurate. | Visible in the directory; excluded from publication pipelines by default. |
| `published` | Complete and current. | Included in publication pipelines. |
| `deprecated` | Superseded or no longer applicable. | Retained in the directory with a note at the top explaining the deprecation. Excluded from publication pipelines. |

Transitions: `draft` → `published` → `deprecated`. A `deprecated` guide may return to `draft` if it's being substantially rewritten. Archival (moving to `docs/.archive/guides/`) follows the existing archive rules: only when the user explicitly asks.

### 8. Contract and Template Files to Create

| File | Location | Purpose |
| --- | --- | --- |
| `guide-contract.md` | `docs/.references/` | Authority file defining the frontmatter schema, slug convention, path rules, and status lifecycle. |
| `guide-developer.md` | `docs/.templates/` | Template for developer guides with frontmatter skeleton and required heading suggestions. |
| `guide-user.md` | `docs/.templates/` | Template for user guides with frontmatter skeleton and required heading suggestions. |

Both templates include the YAML frontmatter block with placeholder values and a minimal set of suggested headings appropriate to their audience.

### 9. Router Updates

The `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md` routers will be updated to:

- Direct agents to read `docs/.references/guide-contract.md` before writing developer or user guides.
- Direct agents to read the appropriate template (`guide-developer.md` or `guide-user.md`).
- Clarify that `docs/guides/agent/` follows a separate contract.

### 10. Migration of Existing Guides

The two existing guides will be migrated to the new convention:

| Current filename | New filename | `path` |
| --- | --- | --- |
| `developer/local-build-and-install.md` | `developer/cli-development-local-build-and-install.md` | `cli/development` |
| `user/installing-starter-docs.md` | `user/getting-started-installing-starter-docs.md` | `getting-started` |

Frontmatter will be added to both files. This is a small, low-risk migration since only two files exist.

## Alternatives Considered

**Nested directories instead of flat files with slug prefixes.** Directories like `docs/guides/developer/cli/testing/` would provide filesystem-level grouping natively. Rejected because: it fragments the guide library across many small directories, makes `ls` and glob less useful for discovery, adds routing complexity for agents, and is inconsistent with how the rest of `docs/` organizes artifacts (flat within output targets).

**No frontmatter; grouping via filename convention only.** Slug prefixes alone could provide grouping without requiring YAML. Rejected because: it provides no mechanism for status tracking, publication routing, versioning, or cross-referencing. The slug convention gives filesystem discoverability; frontmatter gives machine-readable metadata for tooling and pipelines.

**Frontmatter with independent slugs (path does not constrain filename).** More flexible — a guide could change its logical group without a file rename. Rejected because: filesystem browsing becomes disconnected from logical organization. When an agent or human `ls`'s the directory, the grouping should be immediately visible without parsing frontmatter. The rename cost when a guide changes groups is real but rare.

**Date-prefixed filenames like designs and agent guides.** Would provide chronological ordering. Rejected because: guides are living documents updated over time. A date prefix implies a point-in-time snapshot and would become misleading as the guide evolves. Freshness is better tracked via the optional `version` field or git history.

**A single shared contract for all guide types including agent guides.** Would unify the three subdirectories under one reference file. Rejected because: agent guides have fundamentally different semantics (immutable breadcrumbs with W/R/P naming) that would complicate a shared contract. Keeping `agent-guide-contract.md` separate preserves clarity.

## Consequences

**What improves:**

- Guides gain structural parity with every other output target in `starter-docs`.
- Agents have a clear contract to follow, reducing inconsistency as the guide library grows.
- The `path` field enables both logical grouping (for search/discovery) and publication routing (for external doc sites) without imposing directory structure.
- The slug convention makes filesystem browsing immediately informative — `ls docs/guides/developer/` reveals grouping at a glance.
- Consumer projects that install `starter-docs` inherit the contract, templates, and convention automatically.

**What shifts:**

- The `docs/.references/` directory gains one more file (`guide-contract.md`).
- The `docs/.templates/` directory gains two files (`guide-developer.md`, `guide-user.md`).
- The `docs/guides/` router files need updating to point at the new contract.
- Existing guides (currently two files) need migration to the new naming and frontmatter convention.
- The CLI's `renderers.ts` and `catalog.ts` may need awareness of the new reference and template files so they're included in the shipped template for the appropriate install profiles.

**Risks:**

- If the `path` vocabulary grows organically without coordination, different guide authors may use inconsistent path segments for the same subsystem (`cli` vs `installer` vs `command-line`). Mitigation: the contract should recommend a canonical vocabulary, and the `applies-to` field provides a secondary grouping mechanism that's less sensitive to path naming.
- The slug-mirrors-path rule means renaming a guide's logical group requires renaming the file. This is intentional friction (discourages casual regrouping) but could be surprising. Mitigation: document this explicitly in the contract.

**Deferred:**

- Index generation — a `docs/guides/developer/INDEX.md` or `docs/guides/user/INDEX.md` that auto-generates from frontmatter. Useful but not needed until the guide count grows.
- Validation tooling — a script or hook that checks frontmatter schema, slug-path consistency, and status values. Worth adding once the contract is stable.
- Canonical path vocabulary — a list of recommended path segments per subsystem. Defer until the guide library has enough entries to reveal natural groupings.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: This design defines the contract, templates, router updates, and migration steps needed — a baseline plan should sequence that implementation work.
