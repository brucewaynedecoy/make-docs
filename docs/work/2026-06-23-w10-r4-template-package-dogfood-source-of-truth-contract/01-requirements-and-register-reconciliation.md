# Requirements and Register Reconciliation

## Purpose

Keep implementation work grounded in PRD 19 and the active risk register before source or validation changes begin.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Stage 1 - Requirements Trace

### Tasks

- [x] t1: Map PRD 19 requirements to source, docs, tests, and validation surfaces.
- [x] t2: Identify which existing risk-register items will be narrowed by implementation evidence.
- [x] t3: Confirm no new PRD or risk-register item is required before coding.
- [x] t4: Record the W10 R3 link-rewrite hardening requirements as deferred future migration work unless W10 R4 directly depends on moved user Markdown trees.

### Acceptance Criteria

- Every implementation phase references PRD 19.
- Existing risk-register IDs remain stable.
- Any intentionally deferred requirement is recorded as a follow-on, not silently dropped.
- W10 R4 does not implement or claim V1-to-V2 Markdown-tree migration unless it records that dependency explicitly.

### Dependencies

- PRD 19 accepted in the active set.

## Implementation Notes

Phase 1 reconciled W10 R4 against the active PRD namespace before source, template, package, or dogfood changes begin. PRD 19 is accepted in [docs/prd/00-index.md](../../prd/00-index.md), defines the effective source-of-truth order in [docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md), and is already linked from the baseline PRDs and risk register entries that W10 R4 affects.

### Requirement Trace

| PRD 19 requirement | Implementation owner | Validation surface |
| --- | --- | --- |
| `packages/docs/template/` is the first mutation target for shipped template-owned docs assets. | Phase 2 documents the source ownership boundary before any package copy or dogfood reseed work. | Template/router path checks, changed-file review, and package-template parity checks in Phase 4. |
| Root `docs/` is dogfood validation, not the product source of truth. | Phases 2 and 3 distinguish template-owned routers and starter structure from project-owned designs, plans, PRDs, work backlogs, local library content, archive history records, artifact content, overlays, and config. | Dogfood/template parity checks only for files expected to match exactly; project-owned records are excluded from shipped-template proof. |
| `packages/cli/template/` is a generated package-bundled copy, not an authoring surface. | Phase 3 keeps regeneration tied to `scripts/copy-template-to-cli.mjs` and package `prepack`. | `npm run smoke:pack`, package dry-run checks when contents change, and direct drift review of `packages/cli/template/`. |
| Managed asset path changes update CLI catalogs, rules, tests, and manifest expectations. | Phases 2 and 3 own package/template source changes; Phase 4 proves the resulting install/package surface. | `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, instruction-router checks, and targeted path scans. |
| Reseeding is reviewed and scoped, with local managed-file changes handled by PRD 18 compatibility/conflict rules. | Phase 3 owns reviewed dogfood reseed guidance and conflict-safety wording. | Compatibility review evidence, no blind recursive dogfood copy, and any residual migration dependency recorded before closeout. |
| Dogfood freshness is proven by targeted parity checks for files expected to match exactly. | Phase 4 owns final parity validation and risk-register evidence. | Targeted dogfood/template parity, instruction-router validation, `git diff --check`, and final history closeout. |

### Risk-Register Trace

No new PRD or risk-register item is required before coding. PRD 19 already identifies the affected register entries, and the active risk register preserves their IDs:

- `D-006` remains closed by W10 R1 package-boundary evidence; W10 R4 must preserve README/package-surface agreement if package contents or package docs change.
- `D-007` remains open until dogfood freshness has stronger parity proof; W10 R4 can narrow it with targeted dogfood/template parity checks while preserving reviewed reseeding.
- `D-014` remains closed by the prior reverse-seed evidence; W10 R4 must preserve template-first authoring so the drift does not recur.
- `Q-005` remains open until dogfood freshness proof is contract-level; W10 R4 can add or improve proof points but should not claim the broader question is closed unless evidence covers the full question.
- `R-003` remains closed by W10 R1 local-template and packed-template validation; W10 R4 must preserve both proof surfaces for release-sensitive template changes.
- `R-004` remains open because path knowledge is still duplicated across source, tests, docs, and package copies; W10 R4 should narrow it with focused consistency checks rather than inventing a broad centralization refactor inside this wave.
- `R-007` remains open until manual dogfood reseeding has reliable drift detection; W10 R4 can narrow it with package-template copy, dogfood/template parity, and classifier-related proof where directly touched.

### Deferred Migration Hardening

The W10 R3 link-rewrite hardening requirements remain future backlog requirements, not open W10 R4 implementation tasks. W10 R4 can proceed because the template/package/dogfood source-of-truth work does not require moving user-authored Markdown trees. If a later W10 R4 phase creates a direct dependency on moved user/project Markdown trees, that phase must stop or explicitly record a blocking dependency on packaged CLI/shared-core move planning, deterministic Markdown link rewriting, review or manual-review routing, and full destination-tree link validation before claiming migration behavior.
