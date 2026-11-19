---
title: "W28 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W28 R0"
---

# W28 R0 Evidence Report

This report explains the acceptance evidence for the [W28 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## P1 Template Resources and Dogfood

Covers A1 to A9 and A30 in [P1](01-template-resources-and-dogfood.md). Evidence date: 2026-11-18. Branch: `docs/w28-wave-revision-rules`. Node `v26.13.1`. CLI package version `2.0.8`, built from this branch.

### Shipped Resource Content (A1 to A6)

- `packages/docs/template/.make-docs/system/references/wave-model.md` now holds `## Decision Procedure` with the five steps, `### Significant Deviation Test`, `### Revision Wave Test`, `### Owner Gates` (seven rows), and `### Recording The Decision`. It also holds `## Change History` (five `Kind` values and eight fields), `## Plans, PRDs, And Work`, `## Rebuild From The PRD`, `## Adoption`, and `## Deterministic Support`. The "redesigned design" Revision example and the "extended to designs" claim are gone.
- The planning, execution, PRD-maintenance, and lifecycle references, the output and design contracts, and the two prompts point to the decision procedure. They no longer give the next revision for every correction or require a delta backlog.
- The four plan templates offer `new-wave` or `revision-wave` and explain the legacy `revision` value. The plan and work index templates carry an optional `## Change History` with the PRD 14 R-COORD-14 entry shape. The work phase template carries an optional `Revises:` line.
- Limit: `## Deterministic Support` in `wave-model.md` describes snapshot facts that P2 adds. Until P2 lands, the snapshot does not report them.

### Template Token Fix (A5)

The first `validate:defaults` run failed the template-link check. The checker treats any token whose name contains `LINK` as a link, and it rejects Markdown links built from tokens. The templates now use `{{PRD_DECISION}}`, `{{RELATIVE_SOURCE_REFERENCE}}`, and `{{REVISED_PHASE_REFERENCE}}`. The template comments state the allowed values and that `Source` and `Revises` take relative Markdown links. The `wave-model.md` reference keeps the full link example, because the checker does not scan references.

### Retired Text Search (A2, A3, A6, A9)

A search of `packages/docs/template/`, `.make-docs/system/`, the plans and work routers, and `docs/assets/user/` for the retired trigger list, "delta backlog", "delta work directory", "not retroactively", and "keep the lineage wave and increment" now finds one unrelated hit: "Do not retroactively fail completed phases" in the performance-evidence contract. Two user guides, `workflows-choosing-the-right-route-for-your-project.md` and `workflows-how-make-docs-stages-fit-together.md`, still described delta backlogs. Both were corrected under t13.

### Template And Dogfood Parity (A7)

Each of the 19 changed template-owned files was copied into `./.make-docs/` or `./docs/` and compared with `cmp`. All 19 pairs match. No project-owned file was changed by the reseed. `scripts/check-instruction-routers.sh` passes. It ran outside the sandbox because the sandbox blocks the system temporary directory that `mktemp -d` uses.

### Concept Guide (A8)

`docs/assets/user/concepts-wave-revision-phase-coordinates.md` now explains each part of a coordinate, the selection order, and Change History, and it answers "Why do older records have so many revisions?". A reader can follow it without opening `wave-model.md`. The guide still links there for the full procedure.

### Validators (A9)

- `make-docs run prd authority validate --target-root .`: `passed`.
- `make-docs project path-hygiene validate`: `valid: true`, zero failing findings.

### Catalog, Package, And Digest Checks (A30)

- Both `system-resources.catalog.json` copies are byte-identical, and they list all 15 changed resource URIs. No resource was added, renamed, or removed, so the catalog needs no edit. The catalog holds URIs only; the resource provider computes digests at run time.
- `npm run validate:defaults -w packages/cli`: 3 test files and 53 tests pass, after two fixes:
  - `node scripts/copy-template-to-cli.mjs` refreshed the git-ignored bundled template;
  - `packages/cli/tests/consistency.test.ts` pins the exact open-question list in PRD 03, so it now includes `Q-025`, which PRD 03 gained in the approved PRD step.
- `npm run build -w packages/cli`: success.
- Built CLI `node packages/cli/dist/index.js resource read make-docs://system/reference/wave-model.md` serves the new section structure.
- Built CLI `setup --dry-run --json`: `blocked` before planning, because this checkout has a project ID but no installed record in this machine's Store (`portable-unregistered`). No file was compared, and no project file changed.
- Built CLI `setup --adopt --dry-run --json`: `planned`, with 90 project actions, all `noop`. These include the reseeded `wave-model.md`, `planning-workflow.md`, `output-contract.md`, `plan-overview.md`, `work-index.md`, `docs/plans/AGENTS.md`, and `docs/work/AGENTS.md`. The reseeded local bodies therefore match the bytes that the built provider ships. `git status` was identical before and after.
- Both setup dry runs needed Store access in the home folder, so they ran outside the sandbox. Neither applied a change.

### Full Test Suite

`npm test` ran 113 test files: 110 passed, 2 failed, and 1 was skipped. Of 2,010 tests, 3 failed and 6 were skipped.

- `p5-migration-safety` fixture 11 fails only inside the sandbox. It passes outside it.
- Two `mcp-app-contract` stdio tests fail inside and outside the sandbox. Both expect empty stderr. Node `v26.13.1` writes a `DEP0205` deprecation warning for `module.register()` from the `tsx` loader. No file in this change touches those tests or the loader. Treat this as an environment limit to re-check on the supported CI Node version.

`npm run smoke:pack` was not run in P1, because Bun is not installed on this machine. P4 records the package-proof decision.
