# 23 Revise Generated Metadata Lifecycle Handoffs

## Purpose

Define the v2 metadata contract for make-docs generated documents and decide how lifecycle handoffs are represented for both humans and tooling.

## Change Type

- Type: Revision
- Route: `change-plan`
- Coordinate: `W16 R1`
- Source design: [../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md](../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- Plan: [../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md](../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md)
- Work backlog: [../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md](../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md)

## Change Notes

This PRD revises W16 lifecycle handoff requirements and adds a generated-document metadata layer. It depends on PRD 21 for the tool-resource boundary and PRD 22 for persona frontmatter.

Existing active documents remain valid even when they predate this metadata contract. Backfill occurs through planned template, package, or touched-file work, not broad opportunistic rewrites.

[24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md) builds on this PRD by allowing configured display labels in generated prose while preserving YAML frontmatter as the canonical metadata layer.

[29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) narrows playbook metadata consumers: generated or shipped playbooks must carry `kind: playbook`, `persona`, `stack: build | run`, and summary metadata, and Run Playbook validation must fail closed when those fields are missing or invalid.

W18 R4 extends playbook metadata with an optional `run` block for orchestration hints. That block may declare capability requirements, child-playbook permission, and concurrency intent, but it must not replace the minimum generated-document metadata fields or the `persona/slug` resolver identity.

## Requirements

### Canonical Metadata Layer

Generated make-docs documents use YAML frontmatter as the canonical machine-readable metadata layer. Human-readable body sections remain required where existing contracts require them.

Tooling should read YAML first, render required body sections from YAML when generating documents, and report drift when a generated body section disagrees with its frontmatter.

### Common Fields

Every generated make-docs document has:

```yaml
title: "<title>"
kind: "<kind>"
status: "<status>"
```

`kind` is one of `design`, `plan`, `prd`, `work`, `history`, `guide`, or `playbook`.

`status` is a shared field name whose allowed values are narrowed by the owning contract. Initial v2 contracts should preserve existing meanings such as guide `draft`, `published`, and `deprecated`, history `completed`, and planning-stage `draft`, `active`, `accepted`, `superseded`, or `deprecated` where applicable.

### Conditional Fields

Generated documents add conditional metadata when the condition applies:

| Field | Requirement |
| --- | --- |
| `coordinate` | Required when W/R/P lineage is known or when the document is the authority for a downstream coordinate handoff. Unknown levels are omitted, not filled with dummy values. |
| `persona` | Required for persona-scoped guides and playbooks; value is the canonical persona slug from the configured persona set in PRD 22. |
| `source` | Required when the document derives from an explicit source other than the immediately prior lifecycle artifact. |
| `lifecycle` | Required when a generation step skips, reorders, revisits, or straddles the default lifecycle. |
| `follow_on` | Required for generated documents that contain an `## Intended Follow-On` section. |

For playbooks, [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) also requires `stack: build | run` and `summary`; validators must report invalid stack values and path/persona drift before Run Playbook execution. Playbooks may also include the optional W18 R4 `run` orchestration block, whose known keys are `requires_capabilities`, `prefers_capabilities`, `child_playbooks`, and `concurrency`.

### Handoff Metadata

The canonical handoff metadata shape is:

```yaml
follow_on:
  route: "<route>"
  next_prompt: "<repo-relative-prompt-path>"
  why: "<short-reason>"
  coordinate_handoff: "<coordinate-handoff>"
```

Design docs, plan overviews, PRD indexes, and work indexes keep their body `## Intended Follow-On` sections for reader clarity. The body section renders the same four values in contract-specific wording:

- `Route:`
- `Next Prompt:` or `Next step:`
- `Why:`
- `Coordinate Handoff:`

Validators should flag YAML/body mismatch as drift. They should not fail a document solely because the recommended follow-on is deferred, overridden, or unresolved.

### Lifecycle Departure Metadata

```yaml
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "<departure-kind>"
  reason: "<short-reason>"
```

Initial `departure` values are `none`, `source-to-design-straddle`, `skip`, `reorder`, and `revisit`.

The current v2 design generation uses `source-to-design-straddle` because artifact roadmap inputs are being converted into design docs before the workflow resumes with design -> plan -> PRD -> work -> implementation.

### Source Metadata

```yaml
source:
  type: "<source-type>"
  path: "<repo-relative-path>"
```

Initial `source.type` values are `design`, `plan`, `prd`, `work`, `history`, `artifact-roadmap`, `artifact-seed`, `implementation-closeout`, and `manual-request`.

Later automation may add provider/cache provenance for tool resources, but that belongs to the `.make-docs/**` resource model and manifest contract rather than reader-facing document metadata.

### Configuration Boundary

Configuration overlays may change presentation labels in generated prose, but they must not rename canonical frontmatter fields, `kind` values, `persona`, route identifiers, prompt paths, source type values, lifecycle departure slugs, or `follow_on` keys unless a later design explicitly supersedes this PRD.

## Non-Requirements

- This PRD does not backfill every historical document.
- This PRD does not implement metadata validation.
- This PRD does not define provider/cache provenance for tool resources.
- This PRD does not make lifecycle follow-ons mandatory gates.
- This PRD does not settle coordinate and prefix configurability beyond recording known coordinate metadata.

## Affected Baseline Docs

- [02 Architecture Overview](02-architecture-overview.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)

## Acceptance Criteria

- Generated metadata requirements are linked from the PRD index and affected baseline docs.
- Future generated templates have `title`, `kind`, and `status` metadata.
- Conditional `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` fields are required only when their conditions apply.
- YAML/body handoff drift is a validation finding.
- Historical docs without v2 metadata remain valid until planned backfill or touched-file work applies.

## Source Anchors

- [../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md](../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- [../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md](../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md)
- [../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md](../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [../designs/2026-06-20-playbook-contract-and-run-playbook.md](../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- [../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md](../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
- [../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md](../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md)
- [../work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md](../work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md)
- `.make-docs/contracts/system/design-contract.md`
- `.make-docs/contracts/system/output-contract.md`
- `.make-docs/references/system/lifecycle.md`
- `packages/cli/src/rules.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/install.test.ts`
- `scripts/copy-template-to-cli.mjs`
- `scripts/smoke-pack.mjs`
