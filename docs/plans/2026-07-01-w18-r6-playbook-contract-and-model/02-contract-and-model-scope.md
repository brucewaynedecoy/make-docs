# Phase 2: Contract Authoring and Parser/Validator Model Scope

## Scope

Settle the implementation-shaping decisions the delta backlog must encode so no implementing agent has to re-derive them: where the contract is authored, what the parser produces, what the validator enforces, and where the deterministic seams to other designs sit. This phase produces decisions recorded in the backlog phases, not code.

## Inputs

- Design decisions D0 (authoring location and parity), D2 (document schema), D3 (workflow contract and step model), D4 (dependency registry), D5 (model, parser, validator, diagnostics), and D6 (non-negotiables versus implementer freedom).
- [Playbook Architecture and Design](../../assets/artifacts/playbook-architecture.md) Sections 1–4, including the Section 2.6 worked example the implementation must parse without error (R-WF-7).
- PRD 33 packaging rails and PRD 29 runner expectations as downstream consumers of the model.

## Outputs

- Contract authoring scope: the normative contract is authored at `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and dogfooded to `./.make-docs/contracts/system/playbook-contract.md` (R-AUTH-1, R-AUTH-2); the contract states exactly what the validator enforces and nothing more (R-AUTH-3); an optional reader-facing guide under `docs/assets/library/<persona-slug>/` is a projection that adds no requirements (R-AUTH-4).
- Document schema scope: the `<slug>.playbook.md` suffix with deprecated `kind: playbook` plain-file detection and the PB-FILE-007 rename diagnostic (R-DOC-2); required frontmatter fields and enums including `schemaVersion` and `workflowSchemaVersion` (R-DOC-3); the eleven-heading spine in fixed order (R-DOC-5); the authoritative-versus-narrative line where only frontmatter, the dependency table, and the single workflow block carry machine meaning (R-DOC-6); unknown-section tolerance after the spine only (R-DOC-7).
- Workflow contract scope: one fenced block with info string `playbook` (R-WF-1), the workflow header with `id`, `state_model`, and `routing` (R-WF-3), orthogonal `executor`/`role`/`activation`/`mode` step dimensions with the `delegated` default (R-WF-4), the full per-step field set including `uses`/`requires`, `inputs`/`outputs`, `operation`/`command`/`instructions`, routing, gate semantics, validation, and safety (R-WF-5), the shared eight-value status vocabulary (R-WF-6), and the optional orchestration policy whose runtime semantics stay with the Run Playbook design (R-WF-8).
- Dependency registry scope: the six-column table as the registry of record (R-DEP-1, R-DEP-2), kind and requirement enums (R-DEP-3), and bidirectional cross-reference integrity with the required-versus-optional contradiction as an error and unreferenced dependencies as warnings (R-DEP-4).
- Model and validator scope: a pure, modular core library — no monolithic file, no filesystem effects beyond reading input (R-MODEL-1); one fully resolved Playbook model with source spans that downstream consumers read instead of re-parsing Markdown (R-MODEL-2); staged fail-soft/fail-closed parsing (R-MODEL-3); layered structural/registry/workflow/cross-reference/consistency validation (R-MODEL-4); the seven-code diagnostic catalog as the minimum set (R-MODEL-5); and `playbook.validate` plus `playbook.catalog` wrapping the library with a future language server able to wrap the same library (R-MODEL-6).
- Boundary confirmations: operation identifiers are consumed from the operation registry, never hardcoded CLI strings (R-SCOPE-2), and the runner, packaging, conformance, CLI-reorganization, and global-store surfaces remain owned by their own designs (R-SCOPE-1).

## Validation

- Every backlog decision traces to a D-section and R-* requirement, and everything D6 fixes as non-negotiable appears as an acceptance criterion rather than an open choice.
- Everything D6 leaves to the implementer (in-memory data structures, module layout, diagnostic wording, version-string persistence format) is left open in the backlog and not over-specified.
