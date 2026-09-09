# Documentation Coverage Audit and Guide Orchestration - Work Backlog

> See `docs/assets/references/wave-model.md` for W/R semantics.

## Purpose

This backlog executes [the `W13 R0` plan](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-overview.md) and the originating [design](../../designs/2026-04-23-documentation-coverage-and-guide-orchestration.md). It turns the documentation initiative into dependency-ordered implementation work: inventory the current guide surface, synthesize a capability coverage ledger, convert that ledger into a guide delivery map, deliver the guide bundles with disjoint write scopes, and finish with shared navigation and validation.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-inventory-and-ledger.md](01-inventory-and-ledger.md) | Create the canonical capability coverage ledger from existing guides, wave artifacts, PRD truth, and targeted code validation. |
| [02-coverage-decisions-and-batch-map.md](02-coverage-decisions-and-batch-map.md) | Resolve final documentation outcomes, lock guide families and targets, and create the execution-facing guide delivery map. |
| [03-onboarding-concepts-and-workflows.md](03-onboarding-concepts-and-workflows.md) | Deliver onboarding, concepts, workflows, and companion developer-workflow guides assigned to Bundle A. |
| [04-cli-lifecycle-and-skills.md](04-cli-lifecycle-and-skills.md) | Deliver the CLI lifecycle and skills guide families through separate non-overlapping lanes inside Bundle B and Bundle C scope. |
| [05-template-contracts-and-maintainer-operations.md](05-template-contracts-and-maintainer-operations.md) | Deliver developer-facing template, contract, maintainer, packaging, validation, and release guides for Bundle D. |
| [06-navigation-assembly-and-validation.md](06-navigation-assembly-and-validation.md) | Update shared discovery, normalize cross-bundle links, validate traceability, and apply scoped mechanical fixes only. |

## Usage Notes

- Read Phases 01 and 02 in order. No guide drafting begins until both the ledger and the guide delivery map exist.
- Create the support artifacts during execution at `docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/capability-coverage-ledger.md` and `docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/guide-delivery-map.md`.
- Treat existing guides under `docs/guides/user/` and `docs/guides/developer/` as reuse candidates first. New guides should appear only where the delivery map explicitly calls for them.
- Use evidence in this order throughout the backlog: existing guides, wave artifacts, active PRD set, targeted code inspection, then git history only as a fallback.
- Phases 03, 04, and 05 may run in parallel after Phase 02 because their write scopes are intentionally disjoint.
- Reserve `README.md` and final cross-bundle link normalization for Phase 06. Bundle workers should not compete for shared navigation files.
- When delegated workers are available, keep the coordinator on orchestration only. Inventory, bundle drafting, assembly, and validation should each have owned write scopes or read-only scopes.
- Use `jdocmunch` first for docs and `jcodemunch` first for code. Use `rg` only as an exact-match supplement for stale filenames, frontmatter, and link checks.
