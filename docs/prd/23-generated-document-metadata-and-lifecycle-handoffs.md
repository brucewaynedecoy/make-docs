# 23 Generated Document Metadata and Lifecycle Handoffs

## Purpose

This document defines the current product contract for generated-document metadata, relationship fields, and lifecycle handoffs. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns generated-document metadata, relationship fields, and lifecycle handoffs. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Canonical Metadata Layer

Generated make-docs documents use YAML frontmatter as the canonical machine-readable metadata layer. Human-readable body sections remain required where existing contracts require them.

Tooling should read YAML first, render required body sections from YAML when generating documents, and report drift when a generated body section disagrees with its frontmatter.

### Common Fields

Every generated make-docs document has:

```yaml
title: "23 Generated Document Metadata and Lifecycle Handoffs"
kind: "<kind>"
status: "<status>"
```

`kind` is one of `design`, `plan`, `prd`, `work`, `history`, `guide`, or `playbook`.

`status` is a shared field name whose allowed values are narrowed by the owning contract. Current meanings include guide `draft`, `published`, and `deprecated`, history `completed`, and planning-stage `draft`, `active`, `accepted`, `superseded`, or `deprecated` where applicable.

### Conditional Fields

Generated documents add conditional metadata when the condition applies:

| Field | Requirement |
| --- | --- |
| `coordinate` | Required when W/R/P lineage is known or when the document is the authority for a downstream coordinate handoff. Unknown levels are omitted, not filled with dummy values. |
| `persona` | Required for persona-scoped guides and playbooks; value is the canonical persona slug from the configured persona set in [47-persona-model.md](./47-persona-model.md). |
| `source` | Required when the document derives from an explicit source other than the immediately prior lifecycle artifact. |
| `lifecycle` | Required when a generation step skips, reorders, revisits, or straddles the default lifecycle. |
| `follow_on` | Required for generated documents that contain an `## Intended Follow-On` section. |

For playbooks, [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) also requires `stack: build | run` and `summary`; validators must report invalid stack values and path/persona drift before Run Playbook execution. Playbooks may also include the optional workflow orchestration policy whose known keys are `requires_capabilities`, `prefers_capabilities`, `child_playbooks`, and `concurrency`.

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

Allowed base `departure` values are `none`, `source-to-design-straddle`, `skip`, `reorder`, and `revisit`.

Artifact-roadmap-to-design generation declares `source-to-design-straddle` before the workflow resumes with design -> plan -> PRD -> work -> implementation.

### Source Metadata

```yaml
source:
  type: "<source-type>"
  path: "<repo-relative-path>"
```

Allowed base `source.type` values are `design`, `plan`, `prd`, `work`, `history`, `artifact-roadmap`, `artifact-seed`, `implementation-closeout`, and `manual-request`.

Later automation may add provider/cache provenance for tool resources, but that belongs to the `.make-docs/**` resource model and manifest contract rather than reader-facing document metadata.

### Run Playbook Output and Handoff Routing

- A Playbook's required `## Outputs` section declares its expected artifacts and handoff surfaces. A Run Playbook surface may record outputs only in the artifact, history, plan, work, or run-log surface named by the Playbook, or in a surface named by an explicit caller instruction; it must not infer a new write destination from presentation labels or harness behavior.
- Generated documents created during a run carry the canonical metadata and relationship fields in this PRD. When a generated output includes an `## Intended Follow-On` section, its `follow_on` metadata and body projection must agree as required by Handoff Metadata.
- Configuration overlays may supply labels, defaults, and presentation, but they never change canonical lifecycle routing, artifact ownership, metadata keys, or output destinations. The runner in [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md) records these destinations as claimed output surfaces before mutation and applies its overlap guardrails; [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) owns the Playbook declaration that feeds this routing.

### Configuration Boundary

Configuration overlays may change presentation labels in generated prose, but they must not rename canonical frontmatter fields, `kind` values, `persona`, route identifiers, prompt paths, source type values, lifecycle departure slugs, or `follow_on` keys unless a later approved product requirement changes this contract in its owning PRD.
## Non-Requirements

- This PRD does not backfill every historical document.
- This PRD does not implement metadata validation.
- This PRD does not define provider/cache provenance for tool resources.
- This PRD does not make lifecycle follow-ons mandatory gates.
- This PRD does not settle coordinate and prefix configurability beyond recording known coordinate metadata.
## Acceptance Criteria

- Generated metadata requirements are linked from the PRD index and affected current authorities.
- Generated templates must have `title`, `kind`, and `status` metadata.
- Conditional `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` fields are required only when their conditions apply.
- YAML/body handoff drift is a validation finding.
- Historical docs without v2 metadata remain valid until planned backfill or touched-file work applies.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 29.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W16 R1

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current generated-document metadata, relationship fields, and lifecycle handoffs requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Generated metadata design](../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
## Source Anchors

- [../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md](../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- [../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md](../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md)
- [../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md](../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [47 Persona Model](47-persona-model.md)
- [34 Playbook Authoring Contract and Model](34-playbook-authoring-contract-and-model.md)
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
