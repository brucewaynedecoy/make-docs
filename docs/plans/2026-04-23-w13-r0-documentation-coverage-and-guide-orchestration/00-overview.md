# Documentation Coverage Audit and Guide Orchestration - Implementation Plan

## Purpose

Implement the strategy defined in [2026-04-23-documentation-coverage-and-guide-orchestration.md](../../designs/2026-04-23-documentation-coverage-and-guide-orchestration.md). This is **Wave 13 Revision 0** (`W13 R0`): a new documentation initiative that inventories the implemented product surface, normalizes that inventory into a capability coverage ledger, converts the ledger into a guide delivery map, and then executes the guide work in disjoint bundles with explicit assembly and validation ownership.

## Objective

- Produce one normalized capability coverage ledger before any guide drafting begins.
- Decide, for every current-state capability, whether it needs `developer`, `user`, `both`, `link-only`, or `none` coverage.
- Convert the ledger into a guide delivery map that locks target guide families, create-vs-update decisions, suggested path/title pairs, and priority batches.
- Update or create guide files under `docs/guides/user/` and `docs/guides/developer/` without overlapping write scopes.
- Add cross-links through `related` frontmatter and refresh at least one navigation surface outside the guides themselves.
- Validate guide-contract compliance, internal links, duplicate coverage risk, and ledger-to-guide traceability before closing the initiative.

## Coordinate Decision

- Coordinate: `W13 R0`
- Classification: `new-wave`
- Evidence: The originating design explicitly says `Coordinate Handoff: start downstream planning at W13 R0` and frames this as a new repo-wide documentation coverage and orchestration workflow rather than a revision to an earlier delivery wave. No prior plan, work backlog, or history record owns this initiative, so the design handoff is authoritative.

## Design Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Originating design | Markdown design doc | `docs/designs/2026-04-23-documentation-coverage-and-guide-orchestration.md` | High |
| Guide contract | Markdown reference | `docs/assets/references/guide-contract.md` | High |
| Planning and wave contracts | Markdown references | `docs/assets/references/planning-workflow.md`, `docs/assets/references/wave-model.md`, `docs/assets/references/output-contract.md` | High |
| Guide templates | Markdown templates | `docs/assets/templates/guide-developer.md`, `docs/assets/templates/guide-user.md` | High |
| Active guide inventory | Markdown guides | `docs/guides/developer/*.md`, `docs/guides/user/*.md` | High |
| Active PRD set | Markdown PRD docs | `docs/prd/00-index.md` through `docs/prd/10-packaging-validation-and-release-reference.md` | High |
| Wave artifacts | Markdown designs, plans, work, history | `docs/designs/`, `docs/plans/`, `docs/work/`, `docs/assets/history/` | High |
| Current product docs | Markdown docs | `README.md`, `packages/docs/README.md`, `packages/cli/README.md` | Medium |
| Current code truth | TypeScript, Markdown, scripts | `packages/cli/src/**`, `packages/docs/template/**`, `packages/skills/**`, selected `scripts/**` | Medium |
| Git history | Git commit metadata | `git log`, targeted commit lookups | Low as primary source; fallback only |

## Baseline Context

- Active `docs/guides/` status: non-empty. The repo already has onboarding, workflow, concept, development, and strategy guides, so this initiative is an audit-and-expansion effort rather than a greenfield guide system.
- Active `docs/prd/` status: current and comprehensive enough to act as the primary current-state validation layer for capability truth.
- Discovery pass required: yes.
- Discovery scope: existing guide coverage first; then wave artifacts for discovery; then PRD and targeted code inspection for current-state confirmation; then git commits only when chronology or capability lineage cannot be resolved from the higher-confidence sources.
- Commit history rule: secondary verification only. It must not become the primary driver for guide boundaries or audience decisions.

## Output Contract

- Plan directory: `docs/plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/`
  - entry point: `docs/plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-overview.md`
  - phase files:
    - `01-inventory-and-ledger.md`
    - `02-coverage-decisions-and-batch-map.md`
    - `03-onboarding-concepts-and-workflows.md`
    - `04-cli-lifecycle-and-skills.md`
    - `05-template-contracts-and-maintainer-operations.md`
    - `06-navigation-assembly-and-validation.md`
- Expected follow-on backlog directory after plan approval: `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/`
- Planned execution support artifacts:
  - `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/capability-coverage-ledger.md`
  - `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/guide-delivery-map.md`
- Guide outputs remain limited to:
  - `docs/guides/user/`
  - `docs/guides/developer/`
- Required non-guide navigation surface:
  - `README.md`
- Guide status rule:
  - every new guide created by this initiative starts with `status: draft`

## Coordinator Policy

- Highest intended delegation tier: parallel agents when available; subagents as fallback; single-agent execution only if delegation is unavailable.
- Coordinator role: orchestration only.
- Coordinator write scope: none when delegation is available.
- Coordinator responsibilities: preflight, task routing, worker review, blocker handling, merge sequencing, and final acceptance.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-inventory-and-ledger.md` | Inventory existing guides and wave artifacts, validate against PRD/code, and synthesize the capability coverage ledger. |
| `02-coverage-decisions-and-batch-map.md` | Apply the five-outcome rubric, collapse multi-wave capabilities, assign priorities, and lock guide bundles and write scopes. |
| `03-onboarding-concepts-and-workflows.md` | Update or create onboarding, concepts, and workflow guides for the user-facing entry paths and companion developer workflow docs. |
| `04-cli-lifecycle-and-skills.md` | Deliver the CLI/lifecycle and skills guide bundles with disjoint write scopes and current-state command/capability coverage. |
| `05-template-contracts-and-maintainer-operations.md` | Deliver developer-facing guides for template/contracts, dogfood workflow, packaging, validation, and release operations. |
| `06-navigation-assembly-and-validation.md` | Refresh shared navigation, normalize cross-bundle links, and validate the final guide set against the ledger and guide contract. |

## Dependencies

- Phase 1 must finish before any guide writing begins.
- Phase 2 depends on Phase 1 because the guide map and write scopes are derived from the completed ledger.
- Phases 3 through 5 depend on Phase 2 and may then run in parallel because their write scopes are disjoint.
- Phase 6 depends on Phases 3 through 5 because assembly and validation need the full guide set.
- No worker outside Phase 6 may edit `README.md`.

## Worker Ownership

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Inventory worker A | Waves `W1-W4`, existing guide overlaps in foundational docs, and any early contract/setup capabilities | none | Originating design | Normalized ledger candidate rows with evidence links and overlap notes |
| Inventory worker B | Waves `W5-W8`, especially skills, lifecycle, help, backup, uninstall, and workflow capabilities | none | Originating design | Normalized ledger candidate rows with evidence links and overlap notes |
| Inventory worker C | Waves `W9-W12`, especially docs assets/state, rename, skills command, and current PRD decomposition surfaces | none | Originating design | Normalized ledger candidate rows with evidence links and overlap notes |
| Ledger synthesis worker | Merge inventory output, validate with PRD/code, and write the canonical ledger | `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/capability-coverage-ledger.md` | Inventory workers A-C | Canonical capability coverage ledger |
| Guide-map worker | Apply the rubric, assign guide families/priorities, and lock bundle write scopes | `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/guide-delivery-map.md`, ledger updates if needed | Ledger synthesis worker | Final guide delivery map and priority batches |
| Bundle worker A | Onboarding, concepts, and workflows | `docs/guides/user/getting-started-*.md`, `docs/guides/user/concepts-*.md`, `docs/guides/user/workflows-*.md`, `docs/guides/developer/development-workflows-*.md`, and any new files with those path prefixes approved in Phase 2 | Guide-map worker | Updated/new onboarding, concept, and workflow guides |
| Bundle worker B | CLI lifecycle | `docs/guides/user/cli-*.md`, `docs/guides/developer/cli-*.md`, existing `docs/guides/developer/cli-development-local-build-and-install.md`, and any approved CLI guide files | Guide-map worker | Updated/new CLI lifecycle guides |
| Bundle worker C | Skills | `docs/guides/user/skills-*.md`, `docs/guides/developer/skills-*.md`, and any approved skills guide files | Guide-map worker | Updated/new skills guides |
| Bundle worker D | Template/contracts, maintainer operations, packaging, validation, release | `docs/guides/developer/template-*.md`, `docs/guides/developer/maintainer-*.md`, `docs/guides/developer/release-*.md`, and any approved developer-only guide files in that family | Guide-map worker | Updated/new maintainer and contract guides |
| Assembly worker | Shared navigation and cross-bundle linking | `README.md`, targeted cross-link fixes across the guide files written in Phases 3-5, final updates to the guide delivery map if needed | Bundle workers A-D | Guide discovery entry point and normalized cross-bundle links |
| Validation worker | Contract checks, broken links, duplicate-coverage review, traceability, and scoped fixups | validation-only fixups across touched guide files and `README.md` | Assembly worker | Validation report and any mechanical cleanup needed for acceptance |

## MCP Strategy

- Use `jdocmunch` first for design docs, guide docs, PRD docs, prior plans, and history records.
- Use `jcodemunch` first for targeted code validation where guide truth depends on the current CLI, template, skills, or maintainer implementation.
- Use `rg` for exact-match searches on guide filenames, frontmatter fields, stale terminology, or unresolved path references.
- Use git commit inspection only when higher-confidence sources do not explain capability chronology or when two historical sources conflict.

## Validation

Validation must confirm all of the following before the initiative closes:

1. Every ledger row resolves to one of `developer`, `user`, `both`, `link-only`, or `none`.
2. Every created or updated guide traces back to one or more ledger rows and to the evidence links that justified it.
3. New and updated guides follow `docs/assets/references/guide-contract.md`, including valid frontmatter, path/slug alignment, and `status: draft` on new files.
4. Internal guide links and `related` frontmatter links resolve.
5. `README.md` includes a current guide-discovery entry point outside the guide directories themselves.
6. Multi-wave capabilities are represented as current-state guide decisions, not one guide per wave.
7. Where historical artifacts and current PRD/code disagree, the ledger records the mismatch and the resulting guide follows current truth.
8. `git diff --check` passes.
