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

## P3 Skills

Covers A19 and A20 in [P3](03-skills.md). Evidence date: 2026-11-18.

### Skill Text Changes

- `packages/skills/decompose-codebase/assets/templates/decomposition-plan.md`: Classification is now `new-wave` or `revision-wave`, with the legacy-alias note. The Evidence line names the outcome test or the revision Wave test and points to the Wave Model decision procedure.
- `packages/skills/backlog-review/references/review-method.md`:
  - A reopened Wave's status reason or detail names its revision Phase, for example `Revision phase P5 open`.
  - Each `BACKLOG-VAL-017` diagnostic is a wave-specific Attention item that names the entry and the fix.
  - The agent also checks plan-overview Change History, which the snapshot does not read.
- `packages/skills/preflight/SKILL.md`: a requested change to earlier or completed work is classified with the decision procedure, the agent asks only at its owner gates and otherwise states the choice and reason, and committed backlogs need Change History entries.
- The rule-map rows for 017 and 018 landed in P2 t12 (see the index Change History).

### Parity And Wording (A19, A20)

- The `backlog-review-skill.test.ts` test "maps every stable rule and marks judgment-only work" passes. `rule-map.md` lists all 18 catalog rules, and `BACKLOG-RULE-018`, which is `agent-only` in the catalog, is marked "Judgment-only".
- The 017 row describes deterministic support with an agent check of plan overviews. That matches the catalog's `full` support and its one-sided reason.
- A search of the three changed Skills finds no bare `revision` classification, and no instruction sends every correction to a new revision.

### Tests

- 11 Skill and consistency test files pass 212 of 212: `backlog-review-skill`, `skill-registry`, `skill-catalog`, `embedded-skills`, `w19-r5-standard-skill-layout`, `w19-r5-skill-adoption`, `w19-r5-skills-command`, `skills-adoption-cli`, `skill-adoption-store`, `skills-ui`, and `consistency`.
- `npm run validate:defaults -w packages/cli` passes 53 of 53. That includes the template-link check, which also covers Skill templates such as `decomposition-plan.md`.
- `npm run build -w packages/cli` passes. The build embeds the first-party Skills.

### Installed Skill Copies (Limit)

This repository tracks CLI-installed Skill copies under `.agents/skills/` and `.claude/skills/`. They are Store-managed outputs of `make-docs setup skills`, not authoring sources. Even on `main`, the installed `backlog-review` copy differed from `packages/skills/`. They were not hand-edited.

A built-CLI `node packages/cli/dist/index.js setup skills --dry-run` exited 0 and left `git status` unchanged. It reported "Selected skills: none" and planned no file operations, because this checkout has no installed record or Skill selection in this machine's Store (`portable-unregistered`, see P1). It ran outside the sandbox for Store access.

As a result, `.agents/skills/preflight/SKILL.md` now trails `packages/skills/preflight/SKILL.md` until a Skill sync runs from an adopted checkout with a CLI built from this branch. That sync, and the packed-tarball delivery check `scripts/verify-first-party-skill-delivery.mjs`, belong to P4 or release, and they need the owner's go-ahead.

## P4 Validation, Review, and Closeout

Covers A21 to A29 in [P4](04-validation-review-and-closeout.md). Evidence date: 2026-11-18. Node `v26.13.1`. The package candidate is `@brucewaynedecoy/make-docs@2.0.8`, built from this branch.

### Expected-Outcome Walkthrough (A21)

Each case was walked through the `## Decision Procedure` in the shipped `wave-model.md`, using facts from its own plan.

| Case | Facts from its plan | Result under the shipped rules | Design expectation | Match |
| --- | --- | --- | --- | --- |
| W22 R2 P4 | R2 P1–P3 were committed and released as 2.0.7. A second-machine report exposed a new failure of the same adoption promise, fixed in one phase. | Not new work. Lineage W22 R2. The affected phases are complete. No revision Wave test passes. **Revision Phase**, decided by the agent alone. | Revision Phase | Yes |
| W17 R3 | W17 R2 was complete. The R3 design replaces R2's generated-stub exposure decision with native harness exposure. It has its own design and a four-phase plan. | Test 1 passes (it reverses an architecture choice), and so does test 3. **Revision Wave**, behind an owner gate. | Revision Wave | Yes |
| W26 R1 | "The owner selected W26 R1." It changes the MCP name projection "that W26 R0 left outside its scope." | Step 1 (explicit guidance) keeps **W26 R1**. Without that guidance, the outcome is outside R0's scope, so it is new work. With R0 unfinished, the owner chooses between extending R0 and a new Wave. | In-place edit or new Phase in R0 | **No** |
| W18 R16 | A defect in the R11 validator source scope. R11 was complete. R16 has its own design (`2026-09-26-prd-authority-source-scope.md`) and a three-phase plan. | Not new work. Lineage W18 R11, complete. Test 3 passes, so the result is a **revision Wave**. It is borderline because the work is a defect fix, so an owner gate applies. | Revision Phase in R11 | **No** |
| W19 R7 | It corrects completed W19 R3, R5, and R6 outcomes and has its own design. R8 replaced it the next day, before any R7 commit. | Test 2 passes (it redoes two or more completed phases), and so does test 3. That makes R7 a **revision Wave**, behind an owner gate. R8's replacement of unfinished R7 is a significant deviation, so the owner chooses to pivot R7 in place or finish first. | In-place edit of the open backlog | **Partial**: it matches for R8, not for R7 |

Result: 2 cases match, 1 matches in part, and 2 do not.

**Cause.** The design's expected-outcomes table came from summary-level case descriptions, before each case was checked against its own plan. The shipped rules follow owner-approved PRD 14 R-COORD-1 to R-COORD-21. Under those rules, the extra design and multi-phase plan in W18 R16 and W19 R7, and the owner's explicit choice in W26 R1, decide the result.

**Not fixed.** A21 says a mismatch is "fixed in P1 before closure". Either fix needs the owner:
- correcting the design table changes accepted expectations;
- changing the rules changes owner-approved PRD 14 and a completed phase.

Recommendation: keep the rules and correct the design's expected-outcomes table. **Open item 3, waiting on Tyler.**

### Human Experience Review (A22, A23, A24)

The agent drafted the two samples below. They are not live harness output.

**Sample gated owner question (W17 R3):**

> **Decision needed: make W17 R3 a revision Wave for native harness Skill exposure?**
> W17 R2 is complete and committed. The new design replaces its choice to expose Skills through generated harness stubs with native harness Skill paths. That reverses an architecture choice in the W17 R2 plan, and it needs its own design and a four-phase plan, so the Wave Model treats it as a change order.
>
> - **Recommended — revision Wave W17 R3:** a new plan and backlog at W17 R3. The W17 R2 backlog gets a Change History entry that points to R3.
> - **Alternative — revision Phase W17 R2 P5:** keeps one backlog, but hides an architecture reversal inside routine continuation.
>
> Your answer is required. Planning for this work waits on it. After you answer, I write the plan at the coordinate you choose.

- Observation: the question names the choice, the reason (an architecture reversal plus its own design and plan), and the effect of each option. It says the answer is required and what it blocks, and it states the next step. It explains "change order" in context. It needs no link to be understood.
- Conclusion: **satisfied** for A22, within the limits below.

**Sample agent-alone reply (W22 R2 P4):**

> I added this fix as W22 R2 P4, a revision Phase in the same Wave. W22 R2 P1–P3 are complete and committed, and the fix repairs the same adoption promise without reversing the plan's approach or redoing more than one completed phase. I recorded the change in the backlog's Change History. No decision is needed from you.

- Observation: the first sentence names the coordinate. The second gives the reason in terms of the revision Wave test. The reply says that no action is needed.
- Conclusion: **satisfied** for A23.

**Change History template (A24):**

- One entry was filled from the shipped `work-index.md` template: `### 2042-06-10 — W1 R0 P1`, kind `edit`, PRD decision `update-existing`, and a relative Source link. In a temporary project, the built-CLI snapshot emitted no `BACKLOG-VAL-017` for it.
- An unfilled copy of the template example (`{{DATE}} — {{COORDINATE}}`) emitted two `BACKLOG-VAL-017` diagnostics on its heading line: one for the heading form and one for the placeholder fields. A copied-but-unfilled entry is therefore caught.
- The filled entry shows what changed, why, which PRD decision applied, and who approved it, without git history. The backlog's own two real Change History entries also emit no `BACKLOG-VAL-017`.
- Conclusion: **satisfied** for A24.

**Limits.** The samples are agent-authored, so no person's reaction is claimed. No live harness session produced them. The optional experience handoff is in the closeout notes.

### Package And Document Checks (A25, A26)

- `npm test` ran 114 test files: 111 passed, 2 failed, and 1 was skipped. Of 2,033 tests, 2,024 passed, 3 failed, and 6 were skipped. The 3 failures are the known environment cases: two Node 26 `DEP0205` stdio tests, which also fail on `main` (see P2), and one fixture that fails only inside the sandbox (see P1).
- `npm run validate:defaults -w packages/cli`: 53 of 53 pass.
- `npm run smoke:pack` (full mode): **blocked in preflight**. Its package-runner validation needs `bun`, and Bun is not installed on this machine. **Open item 2, waiting on Tyler.**
- `npm run smoke:pack:local`: **PASS** in 20.8 s. It packed the candidate, checked packed upstream router parity, ran isolated setup flows, and passed the W22 R1 package proof against the published 2.0.5 tarball.
  - Candidate SHA-256: `08713ce414b6e1feae931c0f515c51ec17f6140350c50c210804752fa8efb5d0`.
  - It ran outside the sandbox, because Node's `fetch` does not use the sandbox network proxy.
  - The script sets `HOME` and `MAKE_DOCS_HOME` to temporary directories. This machine's `~/.make-docs/store.db` kept its size and timestamp (`1531904`, `Nov 17 10:00`).
- `npm pack -w packages/cli` reproduced the same SHA-256. The packed `template/.make-docs/system/references/wave-model.md` contains `## Decision Procedure` and `## Change History`. The packed `work-index.md` contains `## Change History`, and the packed `docs/plans/AGENTS.md` contains the amendment rule.
- `scripts/verify-first-party-skill-delivery.mjs --tar <candidate>`: **failed at its first assertion**, before any install. Its fixed list of seven first-party Skills omits `backlog-review`, which the package has shipped since 2026-09-20. The script last changed on 2026-09-11, and W28 does not touch it.
  - The run used a temporary `HOME` and Store, and it ran outside the sandbox because it needs `sandbox-exec`.
  - Recorded as [D-052](../../prd/03-open-questions-and-risk-register.md#d-052-first-party-skill-delivery-check-omits-backlog-review).
- `make-docs run prd authority validate --target-root .`: `passed`.
- `make-docs project path-hygiene validate`: valid, zero failing findings.
- `git diff main --check`: clean.
- The built-CLI snapshot reports the W28 R0 record as `supported`, with 5 phases and no `BACKLOG-VAL-017`. Repository diagnostics stay at 60 (48 `VAL-004`, 10 `VAL-009`, 1 `VAL-008`, 1 `VAL-006`).

**A25 is not fully met.** The full `smoke:pack` and the packed Skill delivery proof could not pass here. **A26 is met.**

### Coverage Pass (A27)

| Surface | Candidate | Verdict | Reason |
| --- | --- | --- | --- |
| System resources | Wave Model, workflows, contracts, prompts, templates, routers | `update-existing` | Changed in P1, upstream first, with dogfood parity. |
| User guides | `concepts-wave-revision-phase-coordinates.md`, `workflows-choosing-the-right-route-for-your-project.md`, `workflows-how-make-docs-stages-fit-together.md` | `update-existing` | Updated in P1. |
| Maintainer guides | `development-workflows-choosing-the-right-route.md`, `development-workflows-stage-model-and-artifact-relationships.md` | `update-existing` | P4 found delta-backlog and "increment the revision" guidance and replaced it with the lineage-amendment rules. |
| Skills | `decompose-codebase`, `backlog-review`, `preflight` | `update-existing` | Updated in P2 and P3. The installed copies wait on open item 1. |
| PRD reconciliation | PRDs 14, 51, 04 | `none` | Current: PRD 14 R-COORD-1 to 21, PRD 51 R-BACKLOG-SNAPSHOT-27 to 30 (29 updated in P5) and R-BACKLOG-RULES-11 to 12, and the PRD 04 terms match the shipped behavior. |
| PRD reconciliation | PRD 03 risk register | `update-existing` | Q-025 (planned) and D-052 (new confirmed drift). |
| History | P1, P2, P3, P4, P5 | `create` | One record per phase in `.make-docs/archive/history/`. |
| Testing | Four testing types per phase | `none` | Each phase records its four decisions. Unassisted Goal Testing stays `not-needed-now`. |
| Deferred obligations | Open items 1–3 | `none` | These are pending owner decisions and release-environment checks, not accepted later work, so no `O-###` is created. |
| Documentation hygiene | All changed files | `none` | No unresolved placeholders outside templates, `git diff main --check` is clean, and the path-hygiene and PRD validators pass. |

### Open Items Waiting On Tyler

1. **Installed Skill copies and Store writes.** Refreshing `.agents/skills/` and `.claude/skills/` needs `make-docs setup skills` from an adopted checkout. That writes to this machine's Make Docs Store, so it was not run, as directed. Until then, the installed `preflight` copy trails `packages/skills/preflight/SKILL.md`. Decide whether to adopt and sync here or leave it to release.
2. **Full `smoke:pack` and packed Skill delivery proof.** The full `smoke:pack` needs Bun. The Skill delivery runner needs the D-052 fix. Run both on a machine with Bun or in CI after D-052 is fixed.
3. **Walkthrough mismatches (A21).** Confirm that the shipped rules stand and that the design's expected-outcomes table should be corrected for W26 R1, W18 R16, and W19 R7, or direct a rule change.

## Owner Follow-Up (2026-11-18)

Covers A36 to A38 in [P4](04-validation-review-and-closeout.md) and the three open items above. Tyler made these decisions at 8:00 PM CST, and the coordinator relayed them. The index Change History records the scope change.

### Open Item 3: Design Table (A36)

Tyler kept the rules. The W26 R1, W18 R16, and W19 R7 rows of the design's [expected-outcomes table](../../designs/2026-11-18-wave-revision-and-backlog-amendment-rules.md#expected-outcomes-for-past-cases) now state the walkthrough results, and a note under the table records the correction and the owner's decision. All five rows now match the walkthrough. No PRD changed, so no Requirement History entry is needed.

### Open Item 1: Skill Sync (A38) — Blocked By D-053

1. **Plain sync dry run.** `setup skills --dry-run` with the built CLI planned nothing ("Selected skills: none"). The existing installed copies are not recorded in this machine's Store.
2. **Reviewed adoption dry run.** `setup skills --selected-skills backlog-review,factory,human-experience,preflight --adopt-existing <same> --dry-run` reported `ready`, with no blockers and review digest `56880f4a…`. The plan had 21 path changes, 6 backups under the git-ignored `.make-docs/backup/`, and 32 ownership entries to register. It would update five installed `backlog-review` files, add `report-contract.mjs`, and update `preflight/SKILL.md`. It left `factory` and `human-experience` unchanged.
3. **Apply.** `--review <digest> --yes` exited 1 with `ownership-unverified`: "Invalid predeclared native copy fallback." The CLI printed "No adoption changes have been applied."
   - `git status` stayed unchanged, and no `.make-docs/backup/` folder was created.
   - `project state status` still reports `portable-unregistered`, with no pending operation.
   - The Store database file kept its size (`1531904` bytes), but its timestamp moved to `Nov 18 20:02`. The command opened a Store session even though it applied no change.
4. **Cause.** Adoption declares a copy fallback for each native link exposure (`packages/cli/src/skills-adoption.ts`), but the detached-plan check in `packages/cli/src/store/installation-state.ts` accepts a fallback only when the plan creates the link. This repository already has `.claude/skills/<name>` links to `.agents/skills/<name>`. W28 did not change either file.
5. **Reproduction.** The same project shape, in a throwaway project with a throwaway `HOME` and Store, fails the same way with the W28 build and with the released `make-docs` 2.0.8 from `/opt/homebrew/bin`.
6. **Not done.** The only bypass, `MAKE_DOCS_DISABLE_SKILL_SYMLINKS=1`, would replace the tracked `.claude/skills` links with copies. It was not used. Recorded as [D-053](../../prd/03-open-questions-and-risk-register.md#d-053-reviewed-skill-adoption-rejects-existing-native-skill-links).
7. **Result.** The installed `.agents/skills/preflight/SKILL.md` and `.agents/skills/backlog-review/` files still differ from `packages/skills/`. The `.claude/skills/*` entries are links to `.agents/skills/*`, so they show the same content. `factory` and `human-experience` already match.

### Open Item 2: Package Proof (A25, A37)

- `scripts/verify-first-party-skill-delivery.mjs` needed two fixes:
  - its fixed Skill list now includes `backlog-review`, and its check label says "eight";
  - its `setup` calls pass `--codex-method none` and `--claude-code-method none`, as setup has required since W19 R6, plus `--no-github-copilot`. That was the second stop.
- Against a fresh pack of this branch (`@brucewaynedecoy/make-docs@2.0.8`, SHA-256 `08713ce414b6e1feae931c0f515c51ec17f6140350c50c210804752fa8efb5d0`), the runner reports **status `passed`**: all 6 checks and 22 isolated install runs. Those runs are 8 individual Skills, 12 scope × harness × mode cases, `none`, and `bare`.
- It needed no Bun. It ran outside the sandbox because it uses `sandbox-exec`, and its runs used temporary `HOME` and Store directories. This machine's Store file did not change during the run. D-052 is closed, and no register item was renumbered.
- The full `npm run smoke:pack` still stops in preflight. "Smoke pack package-runner validation requires: bun (bun x)." Bun is not installed here. That is the only remaining package-proof gap, and it is recorded as a bounded caveat in the P4 closeout.

### Open Item 1 Closed: Skill Sync After The D-053 Fix

On 2026-11-18, after the D-053 fix in PR #65 (`9fb05c4d`), the reviewed Skill sync ran on this checkout. The CLI was built from a temporary local merge of this branch (`8c13ec96`) and #65 in a separate worktree, which was removed afterwards. The checkout was on `docs/w28-wave-revision-rules`, so its `packages/skills/` held the source that the build ships. The run had owner approval to write to this machine's Store.

- The adoption dry run reported `ready`: 21 path changes, 6 backups, 32 ownership entries, and no blockers. The apply with review digest `4865e966…` reported `completed`, and a repeat review reported `unchanged`.
- `preflight`, `backlog-review`, `factory`, and `human-experience` under `.agents/skills/` now match `packages/skills/`. The `.claude/skills/*` entries are still links to `../../.agents/skills/*`.
- `git status` was empty before the sync. Afterwards it showed only the planned Skill files: six modified `backlog-review` and `preflight` files, and the new `.agents/skills/backlog-review/scripts/report-contract.mjs`. The replaced bytes are in the git-ignored `.make-docs/backup/skill-adoption-fa3a32059e33/`.
- Store side effects: the Store file grew from 1,531,904 to 33,873,920 bytes, and `project state status` now reports `ready`, because adoption records this checkout's ownership.

## P6 CI and Review Corrections

Covers A39 to A41 in [P6](06-ci-and-review-corrections.md). Evidence date: 2026-11-18. Inputs: CodeQL alert 44 and the CodeRabbit review of PR #64, which had 11 inline comments, 12 minor comments that repeat in its second review, and 1 outside-diff comment.

### CodeQL Alert 44 (A39)

- **Alert.** `js/incomplete-multi-character-sanitization` at `snapshot.ts:682`, on `found.text.replace(/<!--[\s\S]*?-->/g, "")`. The same pattern was at `snapshot.ts:712`, in the Change History parser. A search of the W28 diff found no other copy. `packages/cli/src/layout-plan.ts:363` has a similar regex, but it predates W28 and protects regions rather than sanitizing them.
- **Fix.** Both sites now call `stripHtmlComments`. It is a comment-aware scan. An unterminated `<!--` runs to the end of the text, and the scan repeats when a removal joins fragments into a new `<!--`. Each pass removes at least one complete opener, so the loop always ends.
- **Tests.** These inputs leave no `<!--` in the output:
  - `<!<!--x-->--` gives `""`;
  - `<!--a<!--b-->c-->` gives `c-->` (HTML comments do not nest);
  - `<<!--a-->!<!--b-->--text-->tail` gives `tail`;
  - an unterminated comment is removed to the end of the text;
  - text without comments is unchanged.

  A line-preserving call keeps line breaks, and Closeout Notes made only of `<!<!--x-->--` count as absent.

### Snapshot Corrections (A40)

- `nextPhase` counts linked phase files that are missing: a missing linked `09-nine.md` gives `nextPhase` 10, and `BACKLOG-VAL-006` is kept.
- Record-level `committed` checks the index and every linked phase. A deleted linked phase gives `false`.
- Git paths are normalized with `git rev-parse --show-prefix`, and `ls-files` now reports paths relative to the target. A project in a repository subdirectory reports the correct per-phase `committed` facts. Its `lastUpdatedAt` now sees working-tree changes, which repairs the same pre-existing assumption in the date logic.
- A `####` Change History entry emits `BACKLOG-VAL-017`, and the message names the `###` form.
- `backlog-coordinate-facts.test.ts` passes 35 of 35.

### Procedure Order (A41)

- `wave-model.md` (template and dogfood, byte-identical), PRD 14 R-COORD-4 and R-COORD-5, and the design procedure now agree:
  - a stated coordinate or the outcome test can decide the coordinate, but the deviation test and the owner gates still apply;
  - archived lineage is checked and restored before any lineage decision;
  - an empty scan gives `w1-r0` inside the outcome test.
- The flagged guides now name the owner gates and the new-Wave and revision-Wave backlogs. They describe in-place owning-PRD updates instead of change documents.
- Older "change docs" text in `development-workflows-stage-model-and-artifact-relationships.md` (lines 88, 139, 146, 152, and 201) predates W28 and was not touched here.

### Checks

- Focused backlog, consistency, Skill-adoption, and registry tests: 21 files, 491 tests, all passing.
- `validate:defaults`: 53 of 53.
- `npm test` ran 114 test files: 111 passed, 2 failed, and 1 was skipped. Of 2,045 tests, 2,036 passed, 3 failed, and 6 were skipped. The 3 failures are the known environment cases.
- The build passes. The regenerated Skill bundles and MCP App widget are unchanged.
- `smoke:pack:local`: PASS. This machine's Store file was unchanged by the smoke run.

### CodeRabbit Triage

| # | Location | Finding | Disposition |
| --- | --- | --- | --- |
| 1 | `wave-model.md:47` | A stated coordinate skips the owner gates | **Fixed** (A41) |
| 2, 11 | `wave-model.md:57` (dogfood and template) | Archived lineage is checked after the Phase decision | **Fixed** (A41) |
| 6 | Design `:103` | Same archived-lineage order | **Fixed** (A41) |
| Minor | Template `wave-model.md:49` | Empty-scan fallback sits outside the outcome test | **Fixed** (A41) |
| 3 | Maintainer route guide `:148` | Retired change-document workflow | **Fixed** |
| 4 | Maintainer route guide `:167` | Missing owner gate for significant changes | **Fixed** |
| 5 | Maintainer route guide `:203` | No new-Wave path for a new outcome | **Fixed** |
| Minor | User concept guide `:104` | Missing owner choice for an absorbable Wave | **Fixed** |
| Minor ×2 | User route guide `:130` | Completed work needs a revision Phase; significant changes need the owner gate | **Fixed** |
| Minor | User stages guide `:144` | Revision Waves missing from the backlog step | **Fixed** |
| Minor | `snapshot.ts:691` | `nextPhase` ignores missing linked phases | **Fixed** (A40) |
| Minor | `snapshot.ts:658` | Git paths wrong for a nested target | **Fixed** (A40) |
| Minor | `snapshot.ts:1013` | Record `committed` ignores broken links | **Fixed** (A40) |
| Minor | P2 work `:116` | A non-`###` Change History heading is not reported | **Fixed** (A40) |
| Minor | P4 work `:130` | Stage 5 heading embedded in t8 | **Fixed** in `bfb4aab8` (Stage 4 restored) |
| 10 | P4 work `:158` | A38 should state the installed-copy incompatibility | **Fixed** in `bfb4aab8` (A38 resolved, consequence stated) |
| Minor | Plan `03-backlog-and-validation.md:28` | P1 acceptance summary is too broad | **Not fixed**: the plan bullet is a summary, P1's operative criteria A1–A9 already scope each rule to its owning resource, and P1 is complete |
| 7 | Design `:231` | `committed` (clean working tree) is not the same as prior completion | **Tyler** — see question 1 |
| 8 | PRD 14 `:78` | Does deployment replace commitment? | **Tyler** — see question 2 |
| Minor | PRD 04 `:82` | Two `Phase complete` glossary rows | **Tyler** — see question 3 |
| 9 | P4 work `:157` | P4 closed with A25 (full `smoke:pack`) unmet | **Tyler** — see question 4 |
| Outside diff | `report-contract.mjs:25` | New required snapshot keys under `schemaVersion: 1` | **Tyler** — see question 5 |

### Questions For Tyler

1. **Prior completion versus a clean tree (CodeRabbit 7).** `committed` means "tracked and no uncommitted change". A completed phase with a later uncommitted progress edit reads `false`. Should the snapshot add a separate "was committed at some point" fact, or should the agent keep judging this from history? Recommendation: keep agent judgment now, and add a history-based fact in a later change.
2. **Deployed but not committed (CodeRabbit 8).** The rule reads "committed (or deployed)", and also "done but not committed is not complete". Does deployment alone make a phase complete? Recommendation: no; require a commit, and treat deployment as extra evidence.
3. **Two `Phase complete` definitions (glossary).** PRD 45's row means "passed its gate with no orphaned accepted outcomes". The W28 row means "done, closed out, and committed". Merge them as both conditions, or keep two named terms? Recommendation: one row that requires both, citing PRD 14 and PRD 45.
4. **A25 and P4 closure (CodeRabbit 9).** P4 is marked complete while the full `smoke:pack` (Bun) is unmet. Record your 2026-11-18 decision as an authorized bounded caveat, or reopen P4 until the Bun run? Recommendation: record it as an authorized caveat, and keep it in "Open before merge".
5. **Snapshot schema version (outside diff).** The new keys are required under `schemaVersion: 1`. A new Skill rejects snapshots from an older CLI, and an older Skill rejects snapshots from this CLI. The installed copies are now synced. Bump to `schemaVersion: 2` with an explicit version-1 handling rule, or keep version 1 and make the new keys optional when parsing? Recommendation: bump to version 2, with the Skill rejecting version 1 and printing a clear "upgrade the CLI" message.

## P7 Schema Version and Completion Rules

Covers A42 to A44 in [P7](07-schema-version-and-completion-rules.md). Evidence date: 2026-11-19. Tyler decided questions 1–6 at 12:05 AM CST, and the coordinator relayed the decisions.

### Owner Decisions Applied

| Question | Decision | Where |
| --- | --- | --- |
| Q1 Prior completion | The agent decides from history. A Git-history fact comes later. | PRD 14 R-COORD-21; `wave-model.md` Deterministic Support |
| Q2 Deployed but not committed | Not complete. A commit is required, and deployment is extra evidence. | PRD 14 R-COORD-2; `wave-model.md` Terms; design Terms; PRD 04 |
| Q3 Two glossary rows | Merged into one row that requires both conditions, with a Requirement History entry | PRD 04 |
| Q4 A25 | Approved caveat that explains Bun as a tested user package runner. It stays under "Open before merge". | P4 closeout; index Change History |
| Q5 Snapshot schema | Version 2. Version 1 is refused with "upgrade the make-docs CLI to 2.0.9 or later". | `schemas.ts`, `snapshot.ts`, `review-contracts.ts`; PRD 51; Skill `report-model.md` |
| Q6 Version and digest | The package is 2.0.9, with `v2.0.9.sha256`. `v2.0.8.sha256` is unchanged, as RELEASING.md step 1 calls for a version that is absent from npm. | `packages/cli/package.json`, `package-lock.json`, `.github/release-candidates/` |

### Schema Version (A42)

- `backlog-snapshot-schema-version.test.ts` passes 5 of 5:
  - version 2 is accepted;
  - version 1 gives exactly the upgrade message;
  - version 3 gives "Unsupported backlog snapshot schemaVersion 3";
  - the CLI agent gate `validateBacklogRebuiltModel` refuses a version 1 latest snapshot with the upgrade message;
  - the dependency-free Skill bundle `packages/skills/backlog-review/scripts/agent-contract.mjs` refuses it the same way and accepts version 2.
- The cache-key and lookup literals move to snapshot version 2, so older cache entries miss cleanly.
- The report and live-envelope versions stay 1. Only their embedded snapshot uses version 2. Older reports are rebuilt, not migrated.
- The Skill bundles and the MCP App widget were regenerated, and the build's widget `--check` passes.

### Completion Rules (A43)

- No live rule in the template, PRD 14, PRD 04, the design, or the guides says "committed or deployed".
- PRD 04 has one Phase complete row, citing PRD 45 and PRD 14. Its 2026-11-19 Requirement History entry records the merge.

### Package Candidate (A44)

- `npm version 2.0.9 -w packages/cli --no-git-tag-version` changed only `packages/cli/package.json` and the workspace entry in `package-lock.json`.
- `w22-r2-portable-adoption.test.ts` had simulated a 2.0.7 adoption by replacing the hard-coded string `2.0.8`. It now reads the current version from `package.json`, so it still exercises a prior-version adoption.
- Two independent `npm pack -w packages/cli` runs produced the same tarball, `brucewaynedecoy-make-docs-2.0.9.tgz`:
  - build 1: `8b9e48838ca989e6c41e9e8cd32f9bfaef160c32448b3aa55db17e110a3fa732`
  - build 2: `8b9e48838ca989e6c41e9e8cd32f9bfaef160c32448b3aa55db17e110a3fa732`
- `smoke:pack:local` reported the same candidate digest.
- The procedure is [RELEASING.md](../../../RELEASING.md) step 2: save the final tarball's SHA-256 as one lowercase hex line in `.github/release-candidates/v<package-version>.sha256`. The digest file is the last content change. The package files list (`dist`, `template`, `skill-registry.json`, `skill-registry.schema.json`, `README.md`) excludes this evidence and the history records.
- Release notes for 2.0.9 are not part of this change.

### Checks

- Focused tests: 25 files, 535 tests, all passing.
- `validate:defaults`: 53 of 53.
- `npm test` ran 115 test files: 112 passed, 2 failed, and 1 was skipped. Of 2,050 tests, 2,041 passed, 3 failed, and 6 were skipped. The 3 failures are the known environment cases.
- The build passes. `smoke:pack:local` passes, and this machine's Store file was unchanged by it.

### Limit

The Skill source changed again (`report-model.md` and the two regenerated bundles). The installed `.agents/skills/backlog-review/` copy therefore trails the source. Because it bundles the earlier schema, it refuses this CLI's version 2 snapshots until a reviewed Skill sync runs. That sync writes to this machine's Store and needs owner approval.
