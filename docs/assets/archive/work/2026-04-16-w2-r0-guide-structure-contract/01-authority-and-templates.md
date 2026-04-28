# Phase 1: Authority and Templates

> Derives from [Phase 1 of the plan](../../plans/2026-04-16-w2-r0-guide-structure-contract/01-authority-and-templates.md).

## Purpose

Create the three foundational files for the guide structure contract in the template package (`packages/docs/template/`): the authority reference and two audience-specific templates.

## Overview

These three files establish the structural contract that all developer and user guides must follow. They define YAML frontmatter requirements, slug-mirrors-path naming, path depth rules, status lifecycle, and audience-appropriate heading suggestions. Creating them first unblocks all downstream phases.

## Source Plan Phases

- [01-authority-and-templates.md](../../plans/2026-04-16-w2-r0-guide-structure-contract/01-authority-and-templates.md)

## Stage 1 — Create guide-contract.md

### Tasks

1. Create `packages/docs/template/docs/.references/guide-contract.md`.
2. Add heading `# Guide Contract`.
3. Add `## Purpose` — governs developer and user guides in `docs/guides/developer/` and `docs/guides/user/`; does NOT apply to `docs/guides/agent/` (exempt, retains `agent-guide-contract.md`).
4. Add `## Required Frontmatter` — table with three required fields:
   - `title` (string): display title
   - `path` (string): virtual grouping/publication path, lowercase, forward-slash separated, 1-3 segments
   - `status` (enum): `draft`, `published`, or `deprecated`
5. Add `## Optional Frontmatter` — table with five optional fields:
   - `version` (string): guide version, freeform
   - `order` (integer): sort weight within path group, default 100
   - `tags` (list of strings): freeform labels
   - `applies-to` (list of strings): package names or capability areas
   - `related` (list of strings): relative paths to related guides/designs/references
6. Add `## Slug Convention` — pattern `<path-prefix>-<descriptive-slug>.md`, where `<path-prefix>` is the `path` value with `/` replaced by `-`. Include example table mapping `path` values to filenames (e.g., `cli/development` → `cli-development-local-build-and-install.md`).
7. Add `## Path Rules` — 1-3 segments depth cap; dual purpose (logical grouping + publication routing). Include depth table with examples.
8. Add `## Status Lifecycle` — table: `draft` (WIP, excluded from publication), `published` (complete, included), `deprecated` (superseded, retained with note). Transitions: `draft` → `published` → `deprecated`; `deprecated` → `draft` allowed for rewrites. Archival follows existing archive rules.
9. Add `## Scope` — applies to `docs/guides/developer/` and `docs/guides/user/` only; does NOT apply to `docs/guides/agent/`.
10. Add `## Cross-Audience Guides` — guide lives in primary audience's directory; use `related` for cross-references; do not duplicate.
11. Add `## Link Rules` — use relative Markdown links; every internal link must resolve.

### Acceptance criteria

- [x] File exists at `packages/docs/template/docs/.references/guide-contract.md`
- [x] Contains all 9 sections: Purpose, Required Frontmatter, Optional Frontmatter, Slug Convention, Path Rules, Status Lifecycle, Scope, Cross-Audience Guides, Link Rules
- [x] Tables are well-formatted and complete
- [x] Matches tone and structure of sibling files (`design-contract.md`, `agent-guide-contract.md`)

### Dependencies

- None (first task in the plan)

## Stage 2 — Create guide-developer.md

### Tasks

1. Create `packages/docs/template/docs/.templates/guide-developer.md`.
2. Add YAML frontmatter skeleton with required fields using placeholder tokens (`{{TITLE}}`, `{{PATH}}`), `status: draft`, and optional fields commented out with defaults.
3. Add blockquote: `> See \`docs/.references/guide-contract.md\` for frontmatter schema and slug rules.`
4. Add suggested headings with brief placeholder guidance:
   - `## Overview` — What this guide covers and who it is for.
   - `## Prerequisites` — Tools, access, or knowledge required.
   - `## Setup / Configuration` — Environment setup steps.
   - `## Usage` — How to use the feature, tool, or workflow.
   - `## Troubleshooting` — Common issues and solutions.
   - `## Related Resources` — Links to related guides or references.
5. Add closing HTML comment: `<!-- Headings above are suggestions. Add, remove, or rename sections to fit the guide's content. -->`

### Acceptance criteria

- [x] File exists at `packages/docs/template/docs/.templates/guide-developer.md`
- [x] YAML frontmatter is valid and includes all required fields as placeholders
- [x] Blockquote references `guide-contract.md`
- [x] Six suggested headings present
- [x] Matches tone of sibling templates (`design.md`, `agent-guide.md`)

### Dependencies

- None (parallel with Stage 1)

## Stage 3 — Create guide-user.md

### Tasks

1. Create `packages/docs/template/docs/.templates/guide-user.md`.
2. Add identical YAML frontmatter skeleton as the developer template.
3. Add identical blockquote referencing `guide-contract.md`.
4. Add suggested headings with brief placeholder guidance:
   - `## Overview` — What this guide covers and who it is for.
   - `## Prerequisites` — What you need before you begin.
   - `## Getting Started` — First steps to get up and running.
   - `## Step-by-Step Instructions` — Detailed walkthrough of the primary workflow.
   - `## Troubleshooting` — Common issues and how to resolve them.
   - `## FAQ` — Frequently asked questions.
5. Add closing HTML comment: `<!-- Headings above are suggestions. Add, remove, or rename sections to fit the guide's content. -->`

### Acceptance criteria

- [x] File exists at `packages/docs/template/docs/.templates/guide-user.md`
- [x] YAML frontmatter is valid and matches developer template structure
- [x] Six suggested headings present (user-audience appropriate)
- [x] Matches tone of sibling templates

### Dependencies

- None (parallel with Stages 1 and 2)
