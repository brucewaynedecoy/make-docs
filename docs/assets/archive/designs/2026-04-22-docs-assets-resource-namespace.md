# Docs Assets Resource Namespace Overhaul

> Filename: `2026-04-22-docs-assets-resource-namespace.md`. See `docs/.references/design-contract.md` for naming and structural rules.

## Purpose

Define the replacement architecture for non-project document resources under `docs/` after Wave 9. The new model removes the collection of top-level hidden resource directories, consolidates document resources under one visible `docs/assets/` directory, and moves make-docs runtime state out of `docs/` into root `.make-docs/`.

This is a design-only step. It does not move files, update the CLI, or rewrite the docs template. It establishes the reviewed direction for a follow-on Wave 9 revision that must update both the shippable template at `packages/docs/template/docs/` and this repository's dogfood `docs/` tree.

## Context

Wave 9 moved make-docs operational state and session history into `docs/.assets/`, but it left the rest of the non-project docs resources as top-level hidden directories:

```text
docs/.archive/
docs/.assets/
docs/.prompts/
docs/.references/
docs/.templates/
```

The dogfood repository also currently has an empty `docs/.resources/` directory. The result is still a `docs/` root with several hidden resource namespaces next to project-facing output directories such as `docs/designs/`, `docs/guides/`, `docs/plans/`, `docs/prd/`, and `docs/work/`.

That shape is harder to explain than the desired mental model: project documents live directly under `docs/`, reusable document resources live under one `docs/assets/` root, and mutable make-docs runtime state lives outside the docs tree.

The package template is the source of truth for fresh installs, but this repository also dogfoods the same docs system. The implementation therefore has two required targets:

- First update `packages/docs/template/docs/` and the CLI asset pipeline that installs it.
- Then apply the same resource namespace change to this repository's own `docs/` directory.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-20-docs-assets-state-and-history.md](2026-04-20-docs-assets-state-and-history.md)
- Reason: The prior Wave 9 design introduced `docs/.assets/` for operational state and history. This design keeps the Wave 9 goal of separating project docs from support resources, but replaces the hidden `.assets` namespace and absorbs the other hidden resource directories into a single visible `docs/assets/` namespace.

## Decision

Use `docs/assets/` as the only top-level document-resource directory inside `docs/`. Store mutable make-docs runtime state in a root-level `.make-docs/` directory at the install target.

The canonical resource tree becomes:

```text
docs/
  assets/
    AGENTS.md
    CLAUDE.md
    archive/
    history/
    prompts/
    references/
    templates/
```

The canonical CLI state tree becomes:

```text
.make-docs/
  manifest.json
  conflicts/
    <run-id>/
```

The required directory mappings are:

| Current path | New path |
| --- | --- |
| `docs/.archive/` | `docs/assets/archive/` |
| `docs/.assets/history/` | `docs/assets/history/` |
| `docs/.prompts/` | `docs/assets/prompts/` |
| `docs/.references/` | `docs/assets/references/` |
| `docs/.templates/` | `docs/assets/templates/` |
| `docs/.assets/config/manifest.json` | `.make-docs/manifest.json` |
| `docs/.assets/config/conflicts/` | `.make-docs/conflicts/` |

No active resource should remain under a hidden top-level `docs/.<name>/` directory after the migration. The empty dogfood-only `docs/.resources/` directory should be removed unless a separate approved design gives it a concrete purpose.

### Project Docs Stay Direct

Project document outputs remain direct children of `docs/`:

```text
docs/designs/
docs/guides/
docs/plans/
docs/prd/
docs/work/
```

Routers should describe this distinction explicitly:

- `docs/` routes project document creation.
- `docs/assets/` routes reusable document resources: archive records, history records, prompts, references, and templates.
- `.make-docs/` stores make-docs CLI state and conflict staging outside the docs tree.

### Template First, Dogfood Second

The template implementation must land first because `packages/docs/template/docs/` defines what new installs receive and what the CLI asset catalog manages.

After the template and CLI agree on the new paths, this repository's root `docs/` tree should be migrated to match the template. The dogfood pass is not optional validation; it is part of the design because this repository is itself a make-docs consumer.

### CLI State Placement

The make-docs install manifest remains the CLI-owned state file unless a later design renames the file itself. Its canonical path becomes:

```text
.make-docs/manifest.json
```

The manifest should not live in `docs/assets/`, `docs/assets/config/`, or `docs/assets/state/`. The `docs/assets/` tree is for document resources, not mutable CLI runtime state.

Conflict staging remains CLI-owned operational state. Conflict files should stage under:

```text
.make-docs/conflicts/<run-id>/
```

The `.make-docs/` directory is a root-level hidden tool state directory in the same target directory where make-docs is installed. It is not inside `docs/`.

### Router and Link Contract

All active routers, contracts, templates, prompts, package READMEs, skill instructions, and generated links must use the new paths. Examples:

- Design workflow references move from `docs/.references/design-workflow.md` to `docs/assets/references/design-workflow.md`.
- Design template references move from `docs/.templates/design.md` to `docs/assets/templates/design.md`.
- Plan follow-on prompts move from `docs/.prompts/` to `docs/assets/prompts/`.
- Archive guidance moves from `docs/.archive/` to `docs/assets/archive/`.
- History guidance moves from `docs/.assets/history/` to `docs/assets/history/`.
- make-docs state guidance moves from `docs/.assets/config/` to root `.make-docs/`.

The follow-on implementation should update both hardcoded TypeScript paths and Markdown links. It should prefer centralized path constants for the asset root and common child directories so future resource moves do not require edits across unrelated modules.

### Installer and Managed Asset Behavior

The CLI asset pipeline should treat `docs/assets/**` as the managed document-resource namespace for fresh installs and updates.

Managed assets that currently point at `docs/.archive/**`, `docs/.assets/**`, `docs/.prompts/**`, `docs/.references/**`, or `docs/.templates/**` should be rewritten to the new locations. Generated `AGENTS.md` and `CLAUDE.md` routers should be emitted under `docs/assets/` and its child resource directories where the current model has child routers.

The CLI state path should move separately to `.make-docs/`. For existing alpha installs, the implementation does not need indefinite legacy behavior, but it should avoid leaving duplicate managed resource files or stale CLI state in the dogfood repository. The planner should decide whether to handle that through explicit repository file moves, state-path retirement, or both.

## Alternatives Considered

### Keep Wave 9's `docs/.assets/` Namespace

This would preserve the current implementation and require fewer code changes, but it would still leave `docs/` with several top-level hidden resource directories. It does not satisfy the requested model of one `assets` directory.

### Move Everything Under `docs/.assets/`

This would create a single resource root while keeping it hidden, but the requested directory is `docs/assets/`. A visible assets directory is also easier to document because these files are intentional docs-system resources, not incidental hidden state.

### Put CLI State Under `docs/assets/state/`

This would keep state near the document resources and give `manifest.json` and `conflicts/` a coherent parent. It was not chosen because mutable CLI state is not a document resource. Keeping it under `docs/assets/` would still force docs tooling, archive rules, link validation, and resource routers to special-case runtime state.

### Put CLI State Directly Under `docs/assets/`

This would keep the tree shallow, but it would mix loose runtime files with reusable document resources. `docs/assets/manifest.json` and `docs/assets/conflicts/` would make the assets root harder to explain and validate.

### Keep a `config/` Child Directory

Keeping `docs/assets/config/manifest.json` would mirror the current Wave 9 structure, but `config` misnames the data. The manifest and conflicts are mutable CLI state, not user-authored configuration, and they should not live under the document-resource tree.

### Create Top-Level `docs/archive/`, `docs/prompts/`, `docs/references/`, and `docs/templates/`

This would remove hidden directories, but it would blur the distinction between project document outputs and support resources. Keeping those children under `docs/assets/` preserves a clean top-level project-doc surface.

## Consequences

This change touches more than file moves. The path model is embedded in CLI source, tests, template files, router renderers, docs contracts, prompt links, skill instructions, and package documentation.

The CLI will need updates in at least the asset catalog, rules, renderers, manifest path constants, conflict staging paths, audit/uninstall/backup expectations, and tests that enumerate managed paths. The resource-path work and state-path work should remain conceptually separate: `docs/assets/**` for document resources, `.make-docs/**` for mutable CLI state.

The docs template will need a physical resource tree under `packages/docs/template/docs/assets/`, with all previous hidden resource children moved and router instructions rewritten. The template should not include `.make-docs/`; that directory is runtime state created in the install target.

The dogfood docs tree will need the same resource migration under this repo's `docs/assets/`, and the current dogfood manifest should move to root `.make-docs/manifest.json`. Existing active docs should point to the new paths. Historical records may keep old path mentions when they are documenting past work, but active instructions should not route future work to the old hidden directories.

The current design contract still requires this document's follow-on prompt link to use the existing `docs/.prompts/` path. The implementation of this design should update that contract so future generated design docs link to `docs/assets/prompts/` instead.

Validation should include a stale-path search for active files, template completeness checks, focused CLI tests for root `.make-docs/` manifest/conflict behavior, and a dogfood install or equivalent managed-asset check that proves the root `docs/` tree matches the new template structure without CLI state under `docs/assets/`.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../.prompts/designs-to-plan-change.prompt.md)
- Why: This revises Wave 9's completed docs resource architecture rather than defining a new baseline docs system. The next step should produce a change plan that updates the existing template, CLI, tests, and dogfood docs tree.
- Coordinate Handoff: prior coordinate `W9 R0`; recommended downstream coordinate `W9 R1` because this is a revision of the Wave 9 resource namespace.
