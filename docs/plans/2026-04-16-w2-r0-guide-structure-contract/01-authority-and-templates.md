# Phase 1 — Authority and Templates

## Objective

Create the three foundational files that define and scaffold the guide structure contract: the authority reference file (`guide-contract.md`) and the two audience-specific guide templates (`guide-developer.md`, `guide-user.md`). All three files are created in the template package so they ship to consumer projects on install.

## Files to Create

| File | Purpose |
| ---- | ------- |
| `packages/docs/template/docs/.references/guide-contract.md` | Authority reference defining frontmatter schema, slug convention, path rules, status lifecycle, and scope. |
| `packages/docs/template/docs/.templates/guide-developer.md` | Template for developer guides with frontmatter skeleton and suggested headings. |
| `packages/docs/template/docs/.templates/guide-user.md` | Template for user guides with frontmatter skeleton and suggested headings. |

## Detailed Specifications

### 1. `guide-contract.md` — Authority Reference

Create at `packages/docs/template/docs/.references/guide-contract.md`.

Match the tone and structure of the existing `design-contract.md` and `agent-guide-contract.md` reference files: short purpose statement, then discrete sections with tables where appropriate.

#### Heading: `# Guide Contract`

#### Section: `## Purpose`

State that this contract governs developer and user guides under `docs/guides/developer/` and `docs/guides/user/`. Note that it does NOT apply to `docs/guides/agent/` (which retains `agent-guide-contract.md`).

#### Section: `## Required Frontmatter`

Every guide must begin with a YAML frontmatter block. Required fields table:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `title` | string | Display title of the guide. |
| `path` | string | Virtual grouping and publication path. Lowercase, forward-slash separated, no leading or trailing slash. 1-3 segments. |
| `status` | enum | One of `draft`, `published`, `deprecated`. |

#### Section: `## Optional Frontmatter`

Optional fields table:

| Field | Type | Description |
| ----- | ---- | ----------- |
| `version` | string | Guide version (freeform). When omitted, freshness is tracked via git history. |
| `order` | integer | Sort weight within the guide's path group. Lower numbers sort first. Default: `100`. |
| `tags` | list of strings | Freeform labels for search and cross-referencing. |
| `applies-to` | list of strings | Package names or capability areas the guide covers. |
| `related` | list of strings | Relative paths to related guides, designs, or reference files. |

#### Section: `## Slug Convention`

Pattern: `<path-prefix>-<descriptive-slug>.md`

- `<path-prefix>` is the `path` frontmatter value with `/` replaced by `-`.
- The descriptive suffix must be unique within the directory.
- Slugs: lowercase, hyphens only, no special characters.
- No date prefix — guides are living documents.

Include an example table:

| `path` value | Filename |
| ------------ | -------- |
| `cli/development` | `cli-development-local-build-and-install.md` |
| `cli/testing` | `cli-testing-smoke-pack.md` |
| `getting-started` | `getting-started-installing-starter-docs.md` |

#### Section: `## Path Rules`

- 1-3 segments depth cap.
- Dual purpose: logical grouping + publication routing.

Include a depth table:

| Depth | Example | Use case |
| ----- | ------- | -------- |
| 1 | `getting-started` | Top-level topics without subsystem specificity. |
| 2 | `cli/development` | Subsystem + topic area (most common). |
| 3 | `cli/testing/integration` | Subsystem + topic + sub-topic (rare, use sparingly). |

#### Section: `## Status Lifecycle`

Table:

| Status | Meaning |
| ------ | ------- |
| `draft` | Work in progress. May be incomplete or inaccurate. Excluded from publication pipelines by default. |
| `published` | Complete and current. Included in publication pipelines. |
| `deprecated` | Superseded or no longer applicable. Retained with a deprecation note. Excluded from publication pipelines. |

Transitions: `draft` -> `published` -> `deprecated`. A `deprecated` guide may return to `draft` for substantial rewrites. Archival follows existing archive rules (only when the user explicitly asks).

#### Section: `## Scope`

- Applies to `docs/guides/developer/` and `docs/guides/user/` only.
- Does NOT apply to `docs/guides/agent/`, which retains its own contract (`agent-guide-contract.md`).

#### Section: `## Cross-Audience Guides`

- A guide lives in the primary audience's directory.
- Use `related` frontmatter to cross-reference companion guides in the other directory.
- Do not duplicate full guides across directories.

#### Section: `## Link Rules`

- Use relative Markdown links.
- Every internal link must resolve.

---

### 2. `guide-developer.md` — Developer Guide Template

Create at `packages/docs/template/docs/.templates/guide-developer.md`.

Match the tone and minimalism of the existing `design.md` and `agent-guide.md` templates: a skeleton with placeholder values, not a verbose how-to.

#### Content structure:

1. YAML frontmatter block:

```yaml
---
title: "{{TITLE}}"
path: "{{PATH}}"
status: draft
# version: ""
# order: 100
# tags: []
# applies-to: []
# related: []
---
```

Required fields use placeholder tokens. Optional fields are commented out with sensible defaults.

2. Blockquote note immediately after the frontmatter:

```markdown
> See `docs/.references/guide-contract.md` for frontmatter schema and slug rules.
```

3. Suggested headings (with brief placeholder guidance under each):

- `## Overview` — What this guide covers and who it is for.
- `## Prerequisites` — Tools, access, or knowledge required before starting.
- `## Setup / Configuration` — Environment setup or configuration steps.
- `## Usage` — How to use the feature, tool, or workflow.
- `## Troubleshooting` — Common issues and solutions.
- `## Related Resources` — Links to related guides, designs, or external references.

4. A closing HTML comment: `<!-- Headings above are suggestions. Add, remove, or rename sections to fit the guide's content. -->`

---

### 3. `guide-user.md` — User Guide Template

Create at `packages/docs/template/docs/.templates/guide-user.md`.

Same structural conventions as the developer template above.

#### Content structure:

1. Same YAML frontmatter block as the developer template (identical skeleton).

2. Same blockquote note referencing `guide-contract.md`.

3. Suggested headings (with brief placeholder guidance under each):

- `## Overview` — What this guide covers and who it is for.
- `## Prerequisites` — What you need before you begin.
- `## Getting Started` — First steps to get up and running.
- `## Step-by-Step Instructions` — Detailed walkthrough of the primary workflow.
- `## Troubleshooting` — Common issues and how to resolve them.
- `## FAQ` — Frequently asked questions.

4. Same closing HTML comment: `<!-- Headings above are suggestions. Add, remove, or rename sections to fit the guide's content. -->`

## Parallelism

All three files target disjoint paths within the template package:

- `guide-contract.md` goes to `docs/.references/`
- `guide-developer.md` goes to `docs/.templates/`
- `guide-user.md` goes to `docs/.templates/`

The files have no cross-dependencies at creation time. An implementing agent can create all three in parallel.

## Acceptance Criteria

- [ ] `packages/docs/template/docs/.references/guide-contract.md` exists and contains all sections specified above: Purpose, Required Frontmatter, Optional Frontmatter, Slug Convention, Path Rules, Status Lifecycle, Scope, Cross-Audience Guides, Link Rules.
- [ ] `packages/docs/template/docs/.templates/guide-developer.md` exists with YAML frontmatter skeleton, blockquote reference to the contract, and suggested developer-audience headings.
- [ ] `packages/docs/template/docs/.templates/guide-user.md` exists with YAML frontmatter skeleton, blockquote reference to the contract, and suggested user-audience headings.
- [ ] All three files match the tone and structure of their sibling files in the same directories.
- [ ] No modifications to any files outside these three paths.
