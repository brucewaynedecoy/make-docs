# 23 Generated Document Metadata and Lifecycle Handoffs

## Purpose

This document defines the current product contract for generated-document metadata, relationship fields, and lifecycle handoffs. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns generated-document metadata, relationship fields, and lifecycle handoffs. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Testing Decision Body Authority and Handoff

The PRD 50 testing decision record is document-body authority in the first release. It does not add top-level frontmatter fields.

Lifecycle handoffs must preserve the current decision, selected or skipped testing types, reason, executor, gate effect, valid evidence links, any accepted future obligation, and rerun trigger when these facts affect downstream work. Handoffs must not copy full testing policy or imply that a recorded candidate is mandatory.

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

`kind` is one of `design`, `plan`, `prd`, `work`, `history`, or `guide`.

`status` is a shared field name whose allowed values are narrowed by the owning contract. Current meanings include guide `draft`, `published`, and `deprecated`, history `completed`, and planning-stage `draft`, `active`, `accepted`, `superseded`, or `deprecated` where applicable.

### Conditional Fields

Generated documents add conditional metadata when the condition applies:

| Field | Requirement |
| --- | --- |
| `coordinate` | Required when W/R/P lineage is known or when the document is the authority for a downstream coordinate handoff. Unknown levels are omitted, not filled with dummy values. |
| `persona` | Required for persona-scoped guides; value is the canonical persona slug from the configured persona set in [47-persona-model.md](./47-persona-model.md). |
| `source` | Required when the document derives from an explicit source other than the immediately prior lifecycle artifact. |
| `lifecycle` | Required when a generation step skips, reorders, revisits, or straddles the default lifecycle. |
| `follow_on` | Required for generated documents that contain an `## Intended Follow-On` section. |

Playbooks and Protocols are not current document kinds and define no frontmatter keys, conditional fields, routing authority, or generated-document validation rules.

### Human Experience Body Authority

- Human Experience Intent is document-body authority. It is not frontmatter or a new metadata schema.
- Governed designs use the stable body field names and conditional shapes defined by [PRD 49](49-human-experience-standard-and-intent.md).
- Plans, PRDs, work, evidence, and review records link to the owning requirement or source artifact and record their own mapping or verdict. They do not copy the full intent section.
- Current handoff metadata and `source` links carry traceability without a new Human Experience metadata key.
- Project configuration cannot rename the body field names, change the allowed impact values, or weaken the conditional rules.
- Existing artifacts remain valid under prospective adoption. A minor edit does not require unrelated metadata or body rewrites.

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

<a id="run-playbook-output-and-handoff-routing"></a>
### Lifecycle Run Output and Handoff Routing

- A bounded lifecycle run may record outputs only in an artifact, history, plan, work, or run-evidence surface authorized by the invoked operation or an explicit caller instruction; it must not infer a new write destination from presentation labels, optional agentics, or harness behavior.
- Generated documents created during a run carry the canonical metadata and relationship fields in this PRD. When a generated output includes an `## Intended Follow-On` section, its `follow_on` metadata and body projection must agree as required by Handoff Metadata.
- Lifecycle operations return typed receipts. A completed receipt identifies the run, operation, resulting state, and any authorized output/evidence references; paused and failed receipts preserve the checkpoint or typed failure without inventing document metadata. Mutable `runs` and `run_evidence` remain Store records rather than reader-facing document frontmatter.
- Configuration overlays may supply labels, defaults, and presentation, but they never change canonical lifecycle routing, artifact ownership, metadata keys, receipt fields, or output destinations.

### Configuration Boundary

Configuration overlays may change presentation labels in generated prose, but they must not rename canonical frontmatter fields, `kind` values, `persona`, route identifiers, prompt paths, source type values, lifecycle departure slugs, or `follow_on` keys unless a later approved product requirement changes this contract in its owning PRD.
## Non-Requirements

- Human Experience Intent does not add `impact`, `affected_humans`, experience promises, hidden complexity, or evidence fields to YAML frontmatter.

- This PRD does not backfill every historical document.
- This PRD does not implement metadata validation.
- This PRD does not define provider/cache provenance for tool resources.
- This PRD does not make lifecycle follow-ons mandatory gates.
- This PRD does not settle coordinate and prefix configurability beyond recording known coordinate metadata.
- This PRD does not define Playbook- or Protocol-specific metadata, state, or handoffs.
## Acceptance Criteria

- A governed design keeps one valid Human Experience Intent section in the body. Downstream handoffs preserve source and W/R lineage without copying that full section. Configuration cannot rename its field names or impact values.

- Generated metadata requirements are linked from the PRD index and affected current authorities.
- Generated templates must have `title`, `kind`, and `status` metadata.
- Conditional `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` fields are required only when their conditions apply.
- YAML/body handoff drift is a validation finding.
- Historical docs without v2 metadata remain valid until planned backfill or touched-file work applies.
- Bounded lifecycle outputs preserve canonical generated-document metadata, while typed run receipts and evidence remain operational records.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

- [PRD 49](49-human-experience-standard-and-intent.md) owns Human Experience Intent semantics. This PRD owns its body-versus-metadata boundary and traceable lifecycle handoffs.

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

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Common Fields`, `Conditional Fields`, `Lifecycle Run Output and Handoff Routing`, `Configuration Boundary`, `Non-Requirements`, and `Acceptance Criteria`
- Previous contract: `playbook` was a document kind with dedicated metadata, orchestration fields, output declarations, and Run Playbook handoff authority.
- Replacement contract: Playbooks and Protocols define no current metadata; generated documents keep general lifecycle metadata, and bounded lifecycle operations route only authorized outputs while returning typed receipts whose run evidence remains operational Store data.
- Rationale: Generated-document metadata must remain independent of the retired workflow product model and align with the accepted bounded lifecycle recovery contract.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-28 — W20 R0

- Affected requirement or section: conditional fields, handoff metadata, configuration boundary, non-requirements, acceptance criteria, and `Human Experience Body Authority`.
- Previous contract: Generated-document metadata carried source and lifecycle relationships, but no authority stated where Human Experience Intent belongs.
- Replacement contract: Human Experience Intent is body authority with stable conditional fields. Existing metadata and source links carry downstream traceability without a new schema key.
- Rationale: Human intent must remain readable and adaptable without turning document frontmatter into a second product model.
- Source: [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: requirements, non-requirements, acceptance, contracts, and lifecycle handoffs.
- Previous contract: Human Experience Intent was body authority, but no common testing decision or handoff boundary existed.
- Replacement contract: Testing decisions remain compact body records, and handoffs preserve only the decision, effect, evidence, obligation, and rerun facts needed downstream.
- Rationale: The testing model needs continuity without frontmatter growth or policy duplication.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

## Source Anchors

- [Human Experience Standard and Intent design](../designs/2026-08-28-human-experience-standard-and-intent.md)
- [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md](../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- [../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md](../plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-overview.md)
- [../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md](../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [47 Persona Model](47-persona-model.md)
- `packages/docs/template/.make-docs/contracts/system/design-contract.md`
- `packages/docs/template/.make-docs/contracts/system/output-contract.md`
- `packages/docs/template/.make-docs/references/system/lifecycle.md`
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
