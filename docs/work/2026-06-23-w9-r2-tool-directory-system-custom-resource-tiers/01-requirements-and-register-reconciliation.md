# Requirements and Register Reconciliation

## Purpose

Trace PRD 21 into implementation surfaces and living risk entries.

## Source PRD Docs

- `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Stage 1 - Trace and Scope

### Tasks

- [ ] t1: Map PRD 21 requirements to architecture, manifest, template, package, audit, and validation surfaces.
- [ ] t2: Identify existing risk-register entries affected by the tool-directory migration.
- [ ] t3: Confirm no runtime state is proposed for `docs/assets/**`.

### Acceptance Criteria

- Requirements trace covers `.make-docs/**`, `docs/assets/**`, package template, dogfood, and provider/cache surfaces.
- Existing risk IDs remain stable.
- Runtime state remains outside `docs/assets/**`.

### Dependencies

- PRD 21 accepted in the active set.
