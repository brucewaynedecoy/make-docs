# Requirements and Register Reconciliation

## Purpose

Trace PRD 21 into implementation surfaces and living risk entries.

## Source PRD Docs

- `docs/prd/21-project-tool-directory-and-resource-tiers.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Stage 1 - Trace and Scope

### Tasks

- [x] t1: Map PRD 21 requirements to architecture, manifest, template, package, audit, and validation surfaces.
- [x] t2: Identify existing risk-register entries affected by the tool-directory migration.
- [x] t3: Confirm no runtime state is proposed for `docs/assets/**`.

### Acceptance Criteria

- Requirements trace covers `.make-docs/**`, `docs/assets/**`, package template, dogfood, and provider/cache surfaces.
- Existing risk IDs remain stable.
- Runtime state remains outside `docs/assets/**`.

### Dependencies

- PRD 21 accepted in the active set.

### Trace Notes

| Surface | PRD 21 requirement trace |
| --- | --- |
| Architecture and `.make-docs/**` | `docs/prd/21-project-tool-directory-and-resource-tiers.md` makes `.make-docs/` the in-project tool directory for runtime state, tool resources, local bootstrap, and the reserved `agentics/` surface. |
| Manifest, provider, and cache | `.make-docs/manifest.json`, provider/cache metadata, audit state, temporary run state, and provider provenance stay runtime state and stay outside `docs/assets/**`. Provider-backed and hybrid-pinned-cache modes must preserve provider identity, immutable refs or versions, hash details, offline behavior, and recovery guidance. |
| Template and package | Shipped defaults still start in `packages/docs/template/`, selected dogfood copies remain review surfaces, and package validation must prove generated `packages/cli/template/` behavior after copy/prepack for `.make-docs/**` tool-resource moves. |
| Audit, backup, uninstall, and migration | Tool-resource migration must use the existing compatibility/audit safety model: classify source state, preserve custom resources, avoid overwriting custom tiers, and keep backup/uninstall tied to one reviewed audit snapshot. |
| Validation | Focused validation must cover template/package copy, dogfood parity, smoke-pack, managed routers, path/link hygiene, migration classification, backup/uninstall behavior, and runtime-state exclusion from `docs/assets/**`. |

Existing risk-register IDs stay stable. The affected entries are D-007, D-008, D-014, Q-005, Q-007, Q-012, R-003, R-004, R-006, R-007, and R-014. The live register already carries PRD 21 references for these migration, provider/cache, dogfood, package, shared-agentics, audit, and no-scripts boundaries, so this phase records the mapping without adding duplicate risk items.

Runtime state is not proposed for `docs/assets/**`. PRD 21 keeps runtime state under `.make-docs/**`; PRD 22 narrows future reader-facing docs assets toward guide and playbook content, not manifest, provider/cache, conflict, audit, or temporary run state.
