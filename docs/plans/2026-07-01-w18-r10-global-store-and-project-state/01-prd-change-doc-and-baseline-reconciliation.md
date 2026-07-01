# Phase 1: PRD Change Doc and Baseline Reconciliation

## Scope

Author the numbered revision doc that makes the global store and unified project-state model an effective requirement, add the non-destructive baseline annotations, and reconcile the PRD index and living risk register. This phase mutates only `docs/prd/**`.

## Inputs

- [Global Store and Project State](../../designs/2026-07-01-global-store-and-project-state.md), all of D0–D11 and the Design Lineage and Coordinate Handoff sections.
- The revision template at `.make-docs/templates/system/prd-change-revision.md` and the annotation rules in `.make-docs/references/system/prd-change-management.md`.
- The impacted baselines: [PRD 21](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md), [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [PRD 17](../../prd/17-revise-system-asset-materialization-contract.md), [PRD 24](../../prd/24-revise-configuration-convention-overlay.md), [PRD 32](../../prd/32-revise-lifecycle-backup-state-agentics-pruning.md), and [PRD 35](../../prd/35-revise-run-playbook-state-machine.md), plus [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md) as a consumed-unchanged constraint.
- The work-execution evidence disposition in [migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md).

## Outputs

- `docs/prd/38-revise-global-store-and-project-state.md` from the revision template: Purpose, Change Type (`revision`), Baseline Being Revised or Removed (the in-repo runtime-state placement under `.make-docs/runs/**` including the per-repo checkpoint JSON, and path-keyed state assumptions), Rationale (the per-repo operational-noise pattern), an Effective Requirement section carrying the design's R-* IDs — the boundary principle, `~/.make-docs/` with global config plus global manifest plus SQLite database, schema versioning and migrations with WAL concurrency and graceful recovery, the manifest-minted stable project identity that is never path-keyed, the unified project-state model with run-state and work-execution evidence facets keyed to canonical work-item identity, the mirror-versus-relocated distinction, the uninstall/setup remove/update lifecycle behavior, and local-only privacy — plus Impacted Docs and Dependencies, Required Baseline Annotations, and Source Anchors.
- PRD 21 annotation: a `Superseded by` note appended newest-last to the existing runtime-state `### Change Notes` block, scoped to the runtime-state family's remaining inclusion of temporary run state — the work-lifecycle checkpoint state at `.make-docs/runs/<wave-slug>/state.json` — which relocates to the global store as work-execution evidence; `manifest.json`, `conflicts/`, provider/cache metadata, and audit state are unchanged.
- PRD 05 annotation: an `Enhanced by` note appended newest-last to the Contracts and Data `### Change Notes`, scoped to the manifest gaining the setup-minted stable project identifier and to setup remove pruning only the target project's store rows.
- PRD 17 annotation: an `Enhanced by` note as a `### Change Notes` block after the system asset boundary requirement text, scoped to the machine-level operational store being distinct from the pinned global asset cache and never weakening the non-optional local bootstrap.
- PRD 24 annotation: a W18 R10 paragraph appended newest-last to its doc-level `## Change Notes`, recording that a separate machine-level global configuration file exists in the global store and that project `.make-docs/config.yaml` is neither overridden by it nor changed by it.
- PRD 32 annotation: a W18 R10 paragraph appended newest-last to its doc-level `## Change Notes`, recording that tool uninstall must handle the global store explicitly and project setup remove must prune only that project's rows, with `.make-docs/backup/**` and legacy root `.backup/**` rules unchanged.
- PRD 35 annotation: an `Enhanced by` note under Impacted Docs and Dependencies resolving its cross-design sequencing dependency — the Runtime and Global Store lineage is now active as W18 R10 through PRD 38.
- `docs/prd/00-index.md` updates mirroring how PRDs 34 through 37 were added: a Document Map row for 38, the Reading Order item-3 link and description extension, Source Anchors additions, audience-path mentions, and an Apply W18 R10 bullet in Intended Follow-On placed in the W18 sequence.
- `docs/prd/03-open-questions-and-risk-register.md` updates: advance R-019 in place — the global-store dependency this design lands — by updating its Decision and Follow-Up to point at PRD 38 and the W18 R10 backlog as the store's landing path, and add one new rebuild risk at the next available number for the unified project-state model's migration and mirror-drift exposure; never renumber existing items.

## Validation

- PRD 38 is the next available number, no existing PRD doc was renumbered, and every baseline annotation uses the planned verb with the newest note last.
- The effective requirement is resolvable by following links from PRD 21, PRD 05, PRD 17, PRD 24, PRD 32, and PRD 35 to PRD 38, and baseline text remains visible unchanged.
- The register update modifies R-019 in place rather than duplicating it, and any new risk item uses the next available R-* number.
