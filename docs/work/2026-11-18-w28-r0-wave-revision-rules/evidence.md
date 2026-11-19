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

## P2 CLI Snapshot Facts and Rule

Covers A10 to A18 and A31 in [P2](02-cli-snapshot-facts-and-rule.md). Evidence date: 2026-11-18. Node `v26.13.1`.

### Schema-Consumer Preflight (A10)

Every consumer of `BacklogSnapshotV1Schema` was searched in `packages/cli/src`: the cache operations, live contracts, review contracts and operation, and agent contracts. None of them parses snapshot JSON that was persisted earlier.

- The optional Store review cache (`cache-service.ts`) stores report-record fragments, not snapshots. It keys them by a SHA-256 digest of the current snapshot record. New facts change that digest, so an older fragment becomes a cache miss and is rebuilt by a fresh review. It is never a validation failure.
- Saved static HTML reports render embedded JSON in the browser without the strict schema.

Decision: the new keys are additive keys of the version 1 snapshot, as R-BACKLOG-SNAPSHOT-30 allows. No schema-version change and no owner question were needed. `BACKLOG_RULE_CATALOG_VERSION` moves from 1 to 2 because the catalog gained two rules. That version is part of the cache key, so older fragments miss cleanly.

### Baseline (A11)

Before any shared surface changed, the 18 backlog, registry, MCP-derivation, operations, and operation-domain test files passed: 376 of 376.

### New Facts And Rule (A12 to A16)

The new file `packages/cli/tests/backlog-coordinate-facts.test.ts` adds 21 tests. All of them pass.

- **Committed facts.** In a real temporary Git repository, a clean committed phase reports `committed: true`, a changed phase reports `false`, and an untracked linked phase reports `false`. The record-level `closeout.committed` is `false` when any of these files is not clean, and `true` when the index and every linked phase are clean. With no repository, both facts are `{ value: null, evidence: [] }`, and Git capability is `not-a-repository`.
- **Closeout notes.** The fact is `false` when the section is absent, `true` for filled notes, and `false` for an unresolved `{{` placeholder or a comment-only section.
- **Coordinate facts.** A portfolio of W1 R0, W1 R1, an unsupported W1 R2, and an archived W3 R0 reports `highestWave` 3, revisions `[0,1,2]` with `nextRevision` 3 for W1, and `[0]` with 1 for W3. `nextPhase` is 3, 2, and 1 for the supported records and `null` for the unsupported one. An empty project reports `{ highestWave: null, waves: [] }`.
- **No combined signals (A14).** No fact combines signals into completion or a coordinate choice. `closeoutAccepted` stays `null`.
- **Change History rule (A15).** `BACKLOG-VAL-017` stays quiet for valid entries and for an absent section. It fires exactly once for each of these defects: a malformed heading, an unfilled template heading, a foreign coordinate, a missing field, an invalid `Kind`, an invalid `PRD decision`, and out-of-order dates. Each diagnostic carries the record, the file path, the entry heading's file line, a reason, and a remediation.
- **Catalog entries (A16).** `BACKLOG-RULE-017` is `full` support with severity `warning`. `BACKLOG-RULE-018` is `agent-only`, with a one-sided reason. `BACKLOG-AGENT-018` is never emitted.

### Generated Files (A31)

The strict schema is bundled into `packages/skills/backlog-review/scripts/report-contract.mjs` and `agent-contract.mjs`, and through them into the MCP App widget. All three were regenerated with the repository scripts. The Skill rule map gained rows for 017 and 018, which moved from P3 t2. The index Change History records that move. After regeneration, all 18 baseline files passed again: 376 of 376. The CLI build also passed, including its widget `--check` step.

### Full Suite And Real Run (A17, A18)

- `npm test` ran 114 test files: 111 passed, 2 failed, and 1 was skipped. Of 2,031 tests, 2,022 passed, 3 failed, and 6 were skipped. The 3 failures are the known environment cases recorded under P1.
  - An earlier full run also failed `w26-p3-cross-interface` "CLI and MCP source facts track dirty files and a moved checkout" once. That file passed 3 times out of 3 when run alone, and the test passed in the next full run. Treat it as a one-time flake under suite load.
- `node packages/cli/dist/index.js run work backlog snapshot --target-root . --json` on this repository exits 0.
  - It reports `highestWave` 28. W22 has revisions `[0,1,2]` and next R3. W18 has revisions `[1..13,16]` and next R17.
  - The W28 R0 record is `supported`, with 4 phases, `nextPhase` 5, and record `committed: true`. P1 reports `closeoutNotesPresent: true`, and P2 to P4 report `false`.
  - The 60 diagnostics match the pre-P2 total: 48 `VAL-004`, 10 `VAL-009`, 1 `VAL-008`, and 1 `VAL-006`. There is no `VAL-017`.
- Limit: the coordinate facts count work directories only. A revision that exists only as a plan, such as W18 R15, is not counted. The agent still checks `docs/plans/` under the decision procedure.

### MCP Stdio Failures Are The Node 26 Warning

Two `mcp-app-contract` tests fail on this machine because they expect empty stderr from a spawned `tsx` process, and Node `v26.13.1` writes `DEP0205` (`module.register()` is deprecated). The proof:

- **With `NODE_OPTIONS=--no-deprecation`:** "gives a typed chat fallback for an unproved transport" passes, because its `spawnSync` child inherits the environment. "opens the same factory and resource over real stdio" still fails with the same warning, because the MCP SDK stdio transport does not pass `NODE_OPTIONS` to its child.
- **On unchanged `main`:** in a temporary worktree at `main` (`ad84ffb8`, before any W28 commit), both tests fail with the identical `DEP0205` message. The worktree was removed after the run.

This branch does not cause the failures. Re-check them on the supported CI Node version.

## P5 Coordinate Facts Corrections

Covers A32 to A35 in [P5](05-coordinate-facts-corrections.md), the revision Phase for P2. Evidence date: 2026-11-18.

- **Coordinate classification.** P2 was complete and committed (`b7eb5dcd`). No revision Wave test passes, so the fix is a revision Phase, recorded in the index Change History with kind `revision-phase`. PRD 51 R-BACKLOG-SNAPSHOT-29 was updated first.
- **Plan directories (A32).** New tests show that a work W1 R0 with plans W1 R0 and W1 R1 reports revisions `[0,1]` and `nextRevision` 2. A plan-only W4 R0 raises `highestWave` to 4, has `recordPaths: []`, and creates no work record. A non-coordinate folder under `docs/plans/` is ignored.
- **Per-Wave archived (A33).** A Wave with archived work and archived plans reports `archived: true`. A Wave with archived work and a live plan reports `false`.
- **Parity text (A34).** `BACKLOG-RULE-017` and `BACKLOG-RULE-018` name `wave-model.md` and its section URI in `parityMapping`. `BACKLOG-AGENT-018` keeps the instruction location `make-docs://system/reference/wave-model.md#decision-procedure` and its non-null `oneSidedReason`.
- **Tests and build.** `backlog-coordinate-facts.test.ts` passes 23 of 23. The 19 backlog, registry, MCP-derivation, operations, and operation-domain files pass 399 of 399. The Skill bundles and the MCP App widget were regenerated, and `npm run build -w packages/cli` passes.
- **Real snapshot (A35).** The built CLI on this repository reports `highestWave` 28 and 60 diagnostics (unchanged).
  - W18 revisions are now `[1..13, 15, 16]`, with next R17. R15 exists only as a plan. Next R did not change here, because R16 already exists, but the list is now complete.
  - W19 revisions are now `[0..8]`, with next R9. R0 exists only as a plan.
  - W22 has `[0,1,2]` with next R3, and W28 has `[0]` with next R1.
  - Archived Waves: W2 to W8 and W11 to W15.
- **Supersedes.** This section supersedes the P2 limit that said the coordinate facts count work directories only.
