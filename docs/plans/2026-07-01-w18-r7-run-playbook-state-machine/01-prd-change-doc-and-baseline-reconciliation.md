# Phase 1: PRD Change Doc and Baseline Reconciliation

## Scope

Author the numbered revision doc that makes the Run Playbook state machine an effective requirement, add the non-destructive baseline annotations, and reconcile the PRD index and living risk register. This phase mutates only `docs/prd/**`.

## Inputs

- [Run Playbook State Machine](../../designs/2026-07-01-run-playbook-state-machine.md), all of D0–D10 and the Design Lineage and Coordinate Handoff sections.
- The revision template at `.make-docs/templates/system/prd-change-revision.md` and the annotation rules in `.make-docs/references/system/prd-change-management.md`.
- The impacted baselines: former PRD 29 (now incorporated in [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md#requirements)), [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md), [PRD 21](../../prd/21-project-tool-directory-and-resource-tiers.md), [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), and [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), plus [PRD 34](../../prd/34-playbook-authoring-contract-and-model.md) and [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) as consumed-unchanged constraints.

## Outputs

- `docs/prd/35-run-playbook-state-machine-and-portability.md` from the revision template: Purpose, Change Type (`revision`), Baseline Being Revised or Removed (the W18 R4 `.make-docs/runs/playbooks/<run-id>/state.json` location and the create-and-read-only runner), Rationale, an Effective Requirement section carrying the design's R-* IDs — the progression operation set `playbook.start`/`status`/`next`/`advance`/`gate`/`resume`/`close` with its read-versus-mutate classification, the shared status vocabulary, global-store storage keyed by project identifier plus run identifier, execution by step mode with the delegated default, digest-aware resume that blocks by default, the nested/parallel/unattended guardrails, export/import portability, and the three-tier degradation — plus Impacted Docs and Dependencies, Required Baseline Annotations, and Source Anchors.
- PRD 29 annotations: a W18 R7 paragraph appended to the doc-level `## Change Notes`, a `Superseded by` note under Run State, Nesting, and Concurrency for the run-state location and required field set, and an `Enhanced by` note under Generic Run Playbook Model for the progression engine that now realizes its steps; resolver identity, harness capability mediation, nesting permission, and concurrency rules remain governed there and are not rewritten.
- PRD 30 annotation: a `Superseded by` note appended newest-last to the existing Playbook Boundary Change Notes block, scoped to the `.make-docs/runs/playbooks/**` state literal; the delegation of execution semantics to the runner is unchanged.
- PRD 21 annotation: a `Superseded by` note immediately after the runtime-state requirement text, scoped to playbook run state no longer remaining in-repo runtime state; manifest, conflicts, provider/cache metadata, and audit state are unchanged.
- PRD 05 annotation: a `Superseded by` note appended newest-last to the Contracts and Data Change Notes, scoped to the W18 R4 note that placed playbook run state under `.make-docs/runs/playbooks/**`; manifest and config ownership are unchanged.
- PRD 10 annotation: a `Superseded by` note appended newest-last to its Change Notes, scoped to the W18 R4 packaged-runner validation coverage of `.make-docs/runs/playbooks/**` state, redirecting packaged validation to global-store-backed progression operations and the no-repo-run-state proof.
- `docs/prd/00-index.md` updates mirroring how PRD 34 was added: a Document Map row for 35, the Reading Order item-3 link and description extension, Source Anchors additions, audience-path mentions, and an Apply W18 R7 bullet in Intended Follow-On placed in the W18 sequence.
- `docs/prd/03-open-questions-and-risk-register.md` updates: extend R-016's Decision and Follow-Up in place with the W18 R7 run-state relocation, progression operation set, and digest-blocked resume, and add one new rebuild risk for the run-state relocation's dependency on the unlanded global store and stable project identifier; never renumber existing items.

## Validation

- PRD 35 is the next available number, no existing PRD doc was renumbered, and every baseline annotation uses the planned verb with the newest note last.
- The effective requirement is resolvable by following links from PRD 29, PRD 30, and PRD 21 to PRD 35, and baseline text remains visible unchanged.
- The register update modifies R-016 in place rather than duplicating it, and the new risk item uses the next available R-* number.
