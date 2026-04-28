# Phase 3 — Core Archive Skill

## Objective

Write the primary `archive` SKILL.md — the central skill in the archive-docs plugin. This skill handles four archival modes (direct, related, replacement, project), a structured user interview flow, relationship tracing, replacement detection, and post-archive link rewriting. The SKILL.md must follow the same pattern established by `packages/skills/decompose-codebase/SKILL.md` (YAML frontmatter followed by structured prose sections).

## Depends On

- **Phase 1** (`01-scaffold-and-shared-assets.md`) — the shared `references/archive-workflow.md` must exist before the core skill can reference it. The plugin directory structure and `plugin.json` must also be in place.

## Files to Create

| File | Purpose |
| ---- | ------- |
| `packages/skills/archive-docs/skills/archive/SKILL.md` | Core archive skill with 4 modes, interview flow, replacement detection, and link rewriting. |

## Detailed Specification

The SKILL.md must contain the following sections in order.

### 1. YAML Frontmatter

```yaml
---
name: archive
description: >-
  Archive documentation artifacts across the doc tree. Supports direct,
  related, replacement, and project-level archival with relationship tracing,
  user interview, and post-archive link rewriting. Triggers include requests
  to archive, archive docs, archive design, archive plan, archive work,
  move to archive, or replace a document.
---
```

- `name` is `archive`.
- `description` must include the trigger phrases: archive, archive docs, archive design, archive plan, archive work, move to archive, replace.

### 2. Overview

- State the skill's purpose: move documentation artifacts into the project's archive directory while preserving traceability and link integrity.
- List the four archival modes and give a one-sentence description of each:
  - **Direct** — archive a single, explicitly named artifact.
  - **Related** — archive an artifact plus its upstream/downstream/lateral relatives.
  - **Replacement** — archive an artifact that is being superseded by a new version, establishing a predecessor link.
  - **Project** — archive an entire project-scoped set of artifacts (e.g., all plans and PRDs for a completed initiative).
- Note that mode selection is inferred from context but always confirmed with the user.

### 3. Workflow

Define the end-to-end workflow as an ordered list:

1. **Preflight** — inspect the `docs/` tree structure and identify the target artifact(s). Read the relevant directory's `AGENTS.md` or `CLAUDE.md` to confirm archive paths.
2. **Mode Detection** — determine which of the four modes applies based on the user's request and the artifact context. When ambiguous, default to direct mode and confirm.
3. **Relationship Tracing** — run relationship tracing (see section below) to discover upstream, downstream, and lateral connections. Reference the shared `references/archive-workflow.md` for tracing rules.
4. **User Interview** — present findings to the user grouped by relationship type and walk through the 6-step interview flow (see section below).
5. **Confirmation** — obtain explicit user approval before any file moves. This is a hard rule — never archive without approval.
6. **Execution** — move artifacts to the archive directory per the structure defined in `docs/.archive/AGENTS.md`. Preserve directory structure within the archive.
7. **Post-Archive Link Rewriting** — scan the remaining doc tree for broken links caused by the archive operation. Present proposed path transformations and apply only after user confirmation.

### 4. Archival Modes

For each mode, specify:

- **Decision criteria** — what signals indicate this mode.
- **Example user triggers** — 2-3 example phrases or request patterns.

#### Direct Mode

- Criteria: user names a specific file or directory to archive; no mention of related docs or replacement.
- Triggers: "archive `docs/designs/2026-04-01-foo.md`", "move that design to the archive", "archive this plan".

#### Related Mode

- Criteria: user mentions related, connected, or dependent documents; or the target has known upstream/downstream links that the user acknowledges.
- Triggers: "archive the migration design and everything related to it", "archive all docs connected to the v2 migration".

#### Replacement Mode

- Criteria: replacement detection fires (see section below); user explicitly states a new document replaces an old one; or Design Lineage / guide frontmatter indicates succession.
- Triggers: "this new design replaces the old one", "archive the old PRD — we have a new version", "replace `docs/prd/05-auth.md` with the updated version".

#### Project Mode

- Criteria: user requests archival of a complete initiative or project scope; multiple artifact types (designs, plans, PRDs, work items) are involved.
- Triggers: "archive everything from the v1 migration project", "the onboarding initiative is done — archive it all".

### 5. Relationship Tracing

- Define three relationship types:
  - **Upstream** — documents that the target references or was derived from (e.g., a design that produced a plan).
  - **Downstream** — documents that reference or were derived from the target (e.g., PRDs generated from a plan).
  - **Lateral** — documents at the same level that share context but have no derivation relationship (e.g., sibling subsystem PRDs under the same index).
- State that tracing uses `references/archive-workflow.md` rules and, when available, the `trace_relationships.py` script from the plugin's `scripts/` directory.
- Tracing depth: one hop by default; the user interview can expand scope.

### 6. User Interview Flow

Define the 6-step interview:

1. **Identify Targets** — confirm the primary artifact(s) the user wants to archive.
2. **Trace** — run relationship tracing and collect results.
3. **Present Findings** — display results grouped by relationship type (upstream, downstream, lateral). For each related artifact, show its path and relationship to the target.
4. **Confirm Scope** — ask the user which related artifacts (if any) should also be archived. Default to direct-only unless the user expands.
5. **Execute** — move confirmed artifacts to the archive directory.
6. **Link Rewriting** — present broken-link scan results and proposed fixes; apply after user confirmation.

### 7. Replacement Detection

Define the four detection signals:

1. **Explicit Statement** — the user explicitly says a document replaces another.
2. **Design Lineage** — the new document's frontmatter or content references a prior version via a `replaces` or `supersedes` field, or the design doc contains a lineage section pointing to a predecessor.
3. **Guide Frontmatter** — a guide's YAML frontmatter contains a `replaces` or `predecessor` field pointing to the target.
4. **Same-Slug Heuristic** — the new document shares the same slug (filename minus date prefix and extension) as the target, suggesting it is a newer version.

When any signal fires, switch to replacement mode and confirm with the user. When multiple signals fire, note all of them in the confirmation prompt.

### 8. Link Rewriting

- After archive execution, scan all non-archived markdown files in `docs/` for links pointing to moved artifacts.
- For each broken link, compute the path transformation: `<original path>` → `<archive location>`.
- Present the full list of proposed rewrites to the user as a table (original path, new path, file containing the link).
- Apply rewrites only after explicit user approval.
- If no broken links are found, report that and skip this step.

### 9. Archive Rules

- Defer to `docs/.archive/AGENTS.md` for the authoritative archive directory structure and sub-directory mappings.
- **HARD RULE**: never archive any artifact without explicit user approval. This applies to all modes, including related and project modes where the scope may expand during the interview.
- Preserve the original directory hierarchy within the archive (e.g., `docs/designs/foo.md` → `docs/.archive/designs/foo.md`).

### 10. References

- Link to `references/archive-workflow.md` as the shared reference for archival modes, tracing rules, interview flow, replacement detection, and link rewriting details.

## Parallelism

This phase can run in parallel with **Phase 4** (`04-supporting-skills.md`). Both depend only on Phase 1 and operate on disjoint files — Phase 3 writes `skills/archive/SKILL.md` while Phase 4 writes `skills/staleness-check/SKILL.md`, `skills/deprecate/SKILL.md`, and `skills/archive-impact/SKILL.md`.

## Acceptance Criteria

1. `packages/skills/archive-docs/skills/archive/SKILL.md` exists and is valid markdown.
2. YAML frontmatter contains `name: archive` and a `description` that includes all specified trigger phrases.
3. The file contains all ten sections listed in the Detailed Specification above, in order.
4. The Overview section lists all four archival modes with descriptions.
5. The Workflow section defines the 7-step end-to-end flow (preflight through link rewriting).
6. Each archival mode section includes decision criteria and at least two example triggers.
7. Relationship Tracing defines upstream, downstream, and lateral types and references `references/archive-workflow.md`.
8. User Interview Flow defines the 6-step sequence.
9. Replacement Detection defines all four signals (explicit statement, Design Lineage, guide frontmatter, same-slug heuristic).
10. Link Rewriting describes post-archive scanning, path transformation, and user-confirmed application.
11. Archive Rules include the hard rule about explicit user approval and defer to `docs/.archive/AGENTS.md`.
12. References section links to `references/archive-workflow.md`.
13. The overall structure follows the pattern of `packages/skills/decompose-codebase/SKILL.md` (YAML frontmatter + structured prose sections).
