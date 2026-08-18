# Generated Metadata and Lifecycle Handoffs

## Purpose

Define the v2 metadata contract for make-docs generated documents and decide how lifecycle handoffs are represented for both humans and tooling.

This design exists because Batch 2 needs a single canonical model before configuration overlays, CLI/MCP automation, template migration, and playbook/plugin work can safely depend on document metadata.

## Context

The Batch 2 roadmap names this design after the tool directory and persona decisions because metadata depends on both. The accepted [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md) design keeps make-docs tool resources under `.make-docs/**` in the v2 model while reserving `docs/assets/**` for reader-facing reusable documentation assets. The accepted [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md) design makes `persona` frontmatter canonical for persona-scoped guides and playbooks, with directory placement secondary.

Current contracts already use metadata unevenly. Guide templates use YAML frontmatter with `title`, `path`, and `status`; history records use flexible YAML with fields such as `date`, `client`, `model`, `coordinate`, `repo`, `branch`, `status`, and `summary`; design, plan, PRD, and work handoffs are currently body sections. The [design contract](../../.make-docs/contracts/system/design-contract.md) requires design docs to include `## Intended Follow-On`, and the [output contract](../../.make-docs/contracts/system/output-contract.md) frames downstream handoffs as advisory-default-but-overridable, not gates.

This v2 design batch is also a deliberate lifecycle straddle. The default lifecycle in [lifecycle.md](../../.make-docs/references/system/lifecycle.md) runs design -> plan -> PRD -> work -> implementation, but these v2 designs are being generated from artifact roadmap inputs, especially [v2-proposed-design-and-roadmap.md](../assets/artifacts/v2-proposed-design-and-roadmap.md), before returning to the normal lifecycle. That departure is intentional and must be visible rather than silently absorbed.

## Decision

Generated make-docs documents use YAML frontmatter as the canonical machine-readable metadata layer. Human-readable body sections remain required where existing contracts require them. Tooling should read YAML first, render required body sections from YAML when generating documents, and report drift when a generated body section disagrees with its frontmatter.

Existing active documents are not invalid merely because they predate this metadata contract. Backfill happens through planned template, package, or touched-file work, not through opportunistic rewrites.

Every make-docs-generated document has these common frontmatter fields:

```yaml
title: "{{TITLE}}"
kind: "{{KIND}}"
status: "{{STATUS}}"
```

`kind` is one of `design`, `plan`, `prd`, `work`, `history`, `guide`, or `playbook`. `status` is a shared field name whose allowed values are narrowed by the owning contract. Initial v2 contracts should preserve existing meanings such as guide `draft`, `published`, and `deprecated`, history `completed`, and planning-stage `draft`, `active`, `accepted`, `superseded`, or `deprecated` where applicable.

Generated documents add conditional metadata when the condition applies:

- `coordinate`: required when W/R/P lineage is known or when the document is the authority for a downstream coordinate handoff. Unknown coordinate levels are omitted, not filled with placeholders.
- `persona`: required for persona-scoped guides and playbooks. Its value is the canonical persona slug from the configured persona set.
- `source`: required when the document derives from an explicit source other than the immediately prior lifecycle artifact, such as an artifact roadmap, archived planning file, PRD reconciliation, or implementation closeout.
- `lifecycle`: required when a generation step skips, reorders, revisits, or straddles the default lifecycle.
- `follow_on`: required for generated documents that contain an `## Intended Follow-On` section.

The canonical handoff metadata shape is:

```yaml
follow_on:
  route: "{{ROUTE}}"
  next_prompt: "{{REPO_RELATIVE_PROMPT_PATH}}"
  why: "{{SHORT_REASON}}"
  coordinate_handoff: "{{COORDINATE_HANDOFF}}"
```

Design docs, plan overviews, PRD indexes, and work indexes keep their body `## Intended Follow-On` sections for reader clarity. The body section renders the same four values in the contract-specific wording:

- `Route:`
- `Next Prompt:` or `Next step:` as required by the owning contract
- `Why:`
- `Coordinate Handoff:`

For generated handoff-bearing docs, YAML is canonical for tooling and the body is the required human-readable rendering. Validators should flag a YAML/body mismatch as drift. They should not fail a document solely because the recommended follow-on is deferred, overridden, or unresolved; that advisory behavior from the output contract remains intact.

Lifecycle departure metadata uses this shape:

```yaml
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "{{DEPARTURE_KIND}}"
  reason: "{{SHORT_REASON}}"
```

`departure` values are canonical slugs. Initial values are `none`, `source-to-design-straddle`, `skip`, `reorder`, and `revisit`. The current v2 design generation uses `source-to-design-straddle` because artifact roadmap inputs are being converted into design docs before the workflow resumes with design -> plan -> PRD -> work -> implementation.

`source` metadata uses repository-relative paths and records only known facts:

```yaml
source:
  type: "{{SOURCE_TYPE}}"
  path: "{{REPO_RELATIVE_PATH}}"
```

Initial `source.type` values are `design`, `plan`, `prd`, `work`, `history`, `artifact-roadmap`, `artifact-seed`, `implementation-closeout`, and `manual-request`. Later automation may add provider/cache provenance for tool resources, but that belongs to the `.make-docs/**` resource model and manifest contract rather than reader-facing document metadata.

Configuration overlays may change presentation labels in generated prose, but they must not rename canonical frontmatter fields, `kind` values, `persona`, route identifiers, prompt paths, or lifecycle departure slugs unless a later design explicitly supersedes this one.

## Alternatives Considered

Keep follow-ons body-only. This preserves the current design, plan, PRD, and work contracts, but it forces tooling to parse prose and leaves no stable surface for route, coordinate, lifecycle departure, or persona-aware generation.

Move follow-ons to frontmatter only. This gives tooling a clean source but removes visible handoff guidance from documents. That conflicts with the current design and output contracts, which use body sections as the readable handoff between lifecycle stages.

Require immediate frontmatter on every historical document. This would create a large migration with little decision value and high link/template drift risk. The safer rule is to require metadata for generated docs going forward and backfill existing docs only through planned work.

Infer metadata from directories and filenames. This works for some current history and work paths, but it conflicts with the accepted persona design, which makes frontmatter authoritative and directory placement secondary.

## Consequences

Template updates must be handled as product-owned template work. The future implementation plan should update source templates first, then dogfood and package copies through the existing package copy and smoke paths. Relevant implementation surfaces include `packages/cli/src/rules.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/install.ts`, `packages/cli/src/planner.ts`, `packages/cli/tests/consistency.test.ts`, `packages/cli/tests/install.test.ts`, `scripts/copy-template-to-cli.mjs`, and `scripts/smoke-pack.mjs`.

Validation should grow in layers. Markdown style tooling already protects frontmatter, archive and guide scripts already parse selected YAML fields, and consistency tests already cover template parity. Future work should add fixtures for required generated metadata, conditional `persona`, lifecycle departure records, handoff YAML/body drift, and package-template parity.

This design references but does not mutate the PRD or risk register. Relevant items for the later plan include `Q-009` and `R-011` for persona validation, `Q-011` for coordinate and prefix configurability, `R-004` for duplicated path knowledge, `D-014` for template-first source of truth, `R-003` for packed-template drift, `R-013` for relocation and link risk, and `R-014` for the no-scripts transition.

The next Batch 2 design, Configuration and Convention Overlay, must treat metadata names as structural. It may map presentation vocabulary around them, but it cannot redefine the schema without explicitly superseding this design.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md), [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md), [Make Docs Lifecycle Foundation](../assets/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md), and [Make Docs Lifecycle Playbook and Terminology Overlay](../assets/archive/designs/2026-05-28-make-docs-lifecycle-playbook.md)
- Reason: This design extends the accepted Batch 2 directory and persona decisions, converts the W16 stage handoff work into a v2 generated metadata contract, and preserves the lifecycle straddle rule as explicit metadata rather than prose-only process memory.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)
- Why: This design changes active contracts, templates, package surfaces, and validation expectations while extending prior lifecycle and handoff work.
- Coordinate Handoff: Prior related coordinate is W16 R0 P4 for stage follow-on handoffs; recommended downstream coordinate is unresolved; planner must resolve before writing.
