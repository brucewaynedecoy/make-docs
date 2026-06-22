# New Docs Assets, Playbooks, and Persona Model

> Filename: `2026-06-19-new-docs-assets-playbooks-and-persona-model.md`. See `docs/assets/references/design-contract.md` for naming and structural rules.

## Purpose

Define the v2 reader-facing documentation asset model for guides and playbooks, decide how that model relates to archive storage, and define the persona schema that guide and playbook coverage can rely on.

This design is the second design in Batch 2, Canonical Information Architecture. It depends on [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md), which reserves `.make-docs/**` for make-docs-owned tool resources and runtime state while leaving `docs/assets/**` available for future reader-facing reusable documentation assets.

## Context

The v2 roadmap identifies this design as the point where make-docs moves from the older `docs/guides/` plus temporary `docs/library/playbooks/` shape to the canonical `docs/assets/{guides,playbooks}/` model. The same roadmap leaves archive placement open and requires enough persona schema detail to close `Q-009` later. See [v2 Proposed Design and Roadmap](../artifacts/v2-proposed-design-and-roadmap.md).

This design is being produced from artifact roadmap inputs as an intentional source-to-design straddle. That departs from the normal lifecycle only at this design-generation step. After the v2 design set is accepted, work should return to the default arc described by [lifecycle.md](../assets/references/lifecycle.md): design -> plan -> PRD -> work -> implementation.

Current repo state is mixed by design history. Active guide contracts still point to `docs/guides/developer/` and `docs/guides/user/`. The W16 lifecycle playbook created `docs/library/playbooks/agent/make-docs-lifecycle.md` as a temporary playbook home and uses `persona: "agent"` frontmatter. Older docs-assets work placed archive, history, prompts, references, and templates under `docs/assets/**`; the prior Batch 2 tool-directory design now moves product-owned prompts, references, templates, contracts, and scripts toward `.make-docs/**` instead of treating them as reader-facing docs assets.

The current coverage-pass contract already treats guide and playbook coverage as persona-scoped and keeps verdict and persona target as separate axes. It still points at a future configured persona set, so this design must give later metadata, coverage, and config designs a stable schema to build on.

## Decision

Use `docs/assets/**` as the v2 home for reader-facing reusable documentation assets only. It is not a general dumping ground for make-docs tool resources, runtime state, archive storage, or generated planning artifacts.

The v2 reader-facing asset tree is:

```text
docs/
  assets/
    guides/
      AGENTS.md
      <persona-slug>/
        <guide-slug>.md
    playbooks/
      AGENTS.md
      <persona-slug>/
        <playbook-slug>.md
```

`docs/assets/guides/**` contains explanatory, conceptual, operational, or reference material written for a configured persona. Guides help a reader understand a product, project, workflow, or maintenance surface and make current decisions. They are not implementation diaries.

`docs/assets/playbooks/**` contains persona-scoped repeatable process definitions. A playbook is content: it describes a workflow and can be run manually by an agent or person. It does not invoke tools, enforce gates, or become a plugin by existing in the tree. Batch 4 may define a Run Playbook plugin or executor, but that plugin layer must consume playbooks rather than redefine their storage model.

Move `docs/guides/**` intent into `docs/assets/guides/**` in the future implementation plan. Move the temporary `docs/library/playbooks/**` intent into `docs/assets/playbooks/**` in the same canonical structure. The `docs/library/**` namespace is not the v2 target; it remains only a historical or transitional W16 placement until a planned migration changes the active files.

Archive content does not belong under the new reader-facing `docs/assets/**` surface. Archive is lifecycle storage, not reusable reader-facing asset content. The future canonical archive surface is `docs/archive/**`, with implementation planning responsible for migrating or preserving references from the current `docs/assets/archive/**` shape without breaking lineage. This design does not separately decide the final placement of current history records under `docs/assets/history/**`; batch reconciliation should treat history placement as a follow-on lifecycle-storage question rather than silently leaving it inside reader-facing docs assets by accident.

Personas have two layers:

- Primitive: one of `agent`, `maintainer`, or `user`. Primitives are stable behavior categories used by coverage, routing, and fallback logic.
- Persona: a configured audience entry with a slug, label, description, and primitive.

The default persona set is:

```yaml
personas:
  - slug: agent
    label: Agent
    description: "Agents executing make-docs workflows, coverage passes, closeout, and lifecycle tasks."
    primitive: agent
  - slug: developer
    label: Developer
    description: "Maintainers, contributors, integrators, operators, validation owners, and extension authors."
    primitive: maintainer
  - slug: user
    label: User
    description: "People using the shipped product, reading task guidance, or adopting a documented workflow."
    primitive: user
```

Custom personas use the same schema. A custom `slug` must be lowercase kebab-case and unique in the configured persona set. A custom `label` is display text. A custom `description` explains the audience boundary. A custom `primitive` must map to one of the three primitives above. Later configuration work may decide where this schema lives physically and how overlays are merged, but it must preserve these canonical field names unless a later design explicitly supersedes this one.

The canonical machine-readable target for persona-scoped guide and playbook documents is the YAML frontmatter field `persona`. Its value is a persona slug from the configured persona set. Directory placement is secondary: `docs/assets/guides/<persona-slug>/` and `docs/assets/playbooks/<persona-slug>/` are discovery aids and default publication grouping, but coverage, validation, and generated metadata must read frontmatter as authority. If a file path and `persona` frontmatter disagree, validators should report drift instead of inferring a target from the directory.

Persona-scoped docs are single-primary-persona artifacts in this design. If one completed change affects multiple audiences, coverage should record distinct persona targets and either update/create one artifact per target or record a `link-only` or `none` reason for targets that do not warrant separate docs. The later generated metadata design may add relationship fields, but it should not rename `persona` or make directory placement authoritative.

## Alternatives Considered

Keep `docs/library/{guides,playbooks}/` as the v2 target. This matched older seed artifacts but conflicts with the accepted roadmap decision to use `docs/assets/` for future user-facing resources. Keeping `docs/library/**` would also make the W16 temporary playbook placement look more final than it is.

Leave guides in `docs/guides/**` and add only `docs/assets/playbooks/**`. This avoids a guide migration but leaves two parallel reader-facing asset models and prevents Batch 2 from giving metadata and config one canonical path shape.

Keep archive under `docs/assets/archive/**`. This preserves the current path, but it mixes lifecycle storage with reader-facing reusable assets and keeps the old docs-assets namespace ambiguity alive. Archive needs lineage-preserving storage, not guide/playbook discovery semantics.

Make persona directories canonical and omit persona frontmatter. This makes path inspection simple but fails the coverage-pass need for a stable machine-readable persona axis and makes later publication or relocation harder. Frontmatter must be the canonical target.

Defer persona schema entirely to the configuration overlay design. This would keep this design smaller, but it would leave `Q-009` and `R-011` unresolved for the generated metadata and lifecycle handoff designs that come next in Batch 2.

## Consequences

The next Batch 2 design, Generated Metadata and Lifecycle Handoffs, can rely on `persona` as a canonical frontmatter field for persona-scoped assets. It should define the full generated YAML contract around that field, not reopen the persona model unless it finds a conflict.

The Configuration and Convention Overlay design can relabel presentation vocabulary, but it should not rename canonical paths, field names, primitive names, or schema keys defined here. User-visible labels may vary; automation-facing slugs and fields stay stable.

The future implementation plan must update the shipped template source first, then dogfood and package surfaces. Relevant implementation surfaces include `packages/docs/template/`, root `docs/`, `packages/cli/template/`, package copy/prepack behavior, and smoke-pack validation. Code and tests that currently hard-code `docs/guides/**`, `docs/library/playbooks/**`, or current `docs/assets/{prompts,references,templates,archive}` assumptions must be audited before migration. Known source and test surfaces include `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/types.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/install.ts`, `packages/cli/tests/install.test.ts`, and `packages/cli/tests/consistency.test.ts`.

This design references but does not mutate the PRD or risk register. Relevant items include `Q-009` for persona model schema, `R-011` for the persona-target axis referencing future configuration, `Q-014` for the now-temporary W16 `docs/library/playbooks/` decision, `R-013` for restructure relocation risk, `R-004` for duplicated path knowledge, `D-014` for template-first source of truth, `R-003` for packed-template drift, and `D-007`/`Q-005`/`R-007` for dogfood freshness.

Future validation should include `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, `npm run smoke:pack`, Markdown link checks, template/dogfood/package parity checks, router checks, path-hygiene checks, and fixtures that prove default and custom personas validate consistently across guides, playbooks, and coverage-pass prompts.

Batch reconciliation must explicitly check that this design, the generated metadata design, and the config overlay design agree on canonical path names, `persona` field behavior, and the boundary between reader-facing assets and tool resources.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md), [Docs Assets Resource Namespace Overhaul](../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md), [Guide Structure Contract](../assets/archive/designs/2026-04-16-guide-structure-contract.md), [Coverage Pass Contract and Skill Evolution](2026-05-28-coverage-pass-contract-and-skill-evolution.md), [Make Docs Lifecycle Playbook and Terminology Overlay](2026-05-28-make-docs-lifecycle-playbook.md)

Reason: This design extends the accepted Batch 2 tool-directory decision into the reader-facing docs asset namespace. It also materially updates older docs-assets, guide, and temporary library/playbook intent by reserving `docs/assets/**` for guides and playbooks, moving archive intent to a separate lifecycle-storage surface, and making persona frontmatter the canonical targeting mechanism.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../assets/prompts/designs-to-plan-change.prompt.md)

Why: This design revises active path assumptions, guide/playbook routing, archive placement, coverage persona targeting, template/package/dogfood expectations, and future validation surfaces. It should become a change plan rather than a baseline plan.

Coordinate Handoff: unresolved; planner must resolve before writing. Treat the follow-on as a revision because this design standardizes earlier W16 R0 `docs/library/playbooks/` placement and older docs-assets/guide/archive namespace work under the accepted v2 information architecture.
