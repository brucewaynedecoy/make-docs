# Phase 1: PRD Change Doc and Baseline Reconciliation

## Scope

Evolve the active PRD namespace: author the single revision change doc, add the non-destructive baseline annotations, and reconcile the shared PRD index and living risk register. This phase performs no work-backlog writing and no implementation.

## Inputs

- [Playbook Contract and Model](../../designs/2026-06-30-playbook-contract-and-model.md), all decision sections D0–D7 and every R-* requirement.
- `.make-docs/templates/system/prd-change-revision.md` as the change-doc shape.
- `.make-docs/references/system/prd-change-management.md` for annotation verbs, placement, and index/status rules.
- Baseline PRDs 29, 22, 30, and 33 plus `docs/prd/00-index.md` and `docs/prd/03-open-questions-and-risk-register.md`.

## Outputs

- `docs/prd/34-playbook-authoring-contract-and-model.md` — change type `revision`, coordinate `W18 R6`, source pointing at the design, and an Effective Requirement section that carries the design's requirement IDs verbatim by family: R-AUTH-1..5 (upstream-first authoring, contract location, contract/validator parity, optional guide, default-Playbook parity), R-SCOPE-1..2 (ownership boundaries and operation-registry consumption), R-DOC-1..7 (persona-scoped location, `<slug>.playbook.md` naming with deprecated-form detection, required frontmatter, optional fields, the eleven-heading spine, the authoritative-versus-narrative line, unknown-section handling), R-WF-1..8 (single `playbook` fenced block, no standalone workflow files, workflow header, the executor/role/activation/mode dimensions, per-step fields, shared status vocabulary, the canonical worked example, the optional orchestration policy), R-DEP-1..5 (registry table, fixed columns, kind/requirement enums, bidirectional cross-reference integrity, declaration-only materialization), R-MODEL-1..6 (pure modular library, single Playbook model, staged fail-soft/fail-closed parsing, layered validation, the diagnostic catalog PB-DOC-001 through PB-FILE-007, operation and language-server reuse), and R-TEST-1..4 (fixtures per diagnostic code, coverage areas, zero-error default Playbooks upstream and downstream, validate-time detection).
- `### Change Notes` annotations, newest note last where a block already exists: PRD 29 under Canonical Playbook Location, Minimum Frontmatter, Body Contract, and Harness Capability Mediation with `Superseded by`, plus a W18 R6 paragraph in its existing doc-level Change Notes section; PRD 22 under Managed Project Asset Namespace with `Superseded by`; PRD 30 under Playbook Boundary with `Superseded by`; PRD 33 under Contracts and Data with `Enhanced by`.
- `docs/prd/00-index.md` — Document Map row for 34 with Status Current, reading-order item-3 extension, audience-path and source-anchor lineage mentions, and an Intended Follow-On bullet pointing at the W18 R6 delta backlog.
- `docs/prd/03-open-questions-and-risk-register.md` — a new rebuild-risk item for contract/validator/template parity drift (next available R- number) and in-place extensions to the existing R-016 and R-017 decisions so runner and packaging drift language cites the single-model rule, without renumbering or duplicating items.

## Validation

- PRD 34 is the next available number, no existing doc is renumbered, and baseline text under every annotated heading remains intact.
- Every annotation uses an approved verb and links to `34-playbook-authoring-contract-and-model.md`, and the effective requirement is reachable by following links from each annotated baseline heading.
- The change doc stays inside the design's R-SCOPE-1 boundary: no runner state machine, packaging compiler, harness adapter, conformance, CLI reorganization, or global-store requirements are restated or redefined.
