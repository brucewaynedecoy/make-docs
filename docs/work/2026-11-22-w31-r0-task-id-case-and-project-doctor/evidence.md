---
title: "W31 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W31 R0"
---

# W31 R0 Evidence Report

This report explains the acceptance evidence for the [W31 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## P1 Readers Accept Both Cases

Covers A1 to A3 in [P1](01-readers-accept-both-cases.md). Evidence date: 2026-11-22. Base commit: `55a175e4` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Changed

- `packages/cli/src/operations/work/index.ts`: the task line pattern accepts `t` and `T`. The parser keeps each task ID as written in the file. The phase task check compares IDs without regard to case, for both the order check and the duplicate check. Its warning text is unchanged, because P2 owns CLI text.
- `packages/cli/src/operations/work/backlog/snapshot.ts`: the task pattern accepts `T`, so `- [ ] T1: ...` is a task with ID `T1`. Before, it was a task with no ID. The result still upper-cases every task ID.
- `packages/skills/decompose-codebase/scripts/validate_output.py`: the shipped decompose-codebase validator is also a task ID reader. Its task item pattern and its "no task IDs in acceptance criteria" pattern accept `t` and `T`. Its error text is unchanged, because P2 owns written text.
- Task coordinate input needed no code change. `run work item resolve` and the other phase targets already read `W`, `R`, and `P` without regard to case, and they ignore a trailing task part in either case. The W29 R0 P1 project URI grammar already reads `t3` and `T3` and returns `T3`. A new test now holds both facts.
- No template, contract, reference, router, or backlog file changed.

### Same Facts for Lower, Upper, and Mixed Files (A1)

- `packages/cli/tests/w31-r0-p1-task-id-case.test.ts` writes one phase body three times: all `t`, all `T`, and mixed (`T1`, `t2`, `T3`, `t4`). The body has two stages, one checked task in each stage, and one `[X]` checkbox.
- The work phase parser gives the same tasks, checked state, text, line numbers, stages, open task count, and warnings for all three files, with IDs compared in upper case. A second test shows that it keeps each ID as written.
- The backlog snapshot gives the same task IDs (`T1` to `T4`), text, completion, recorded status, task counts (4 total, 2 complete, 2 open), and diagnostics for all three files.
- For each file, both parsers name the same task IDs.
- A file with only `T` gives snapshot task `T1` with its text, not a task with no ID.
- `test_validate_output.py` adds an upper, a mixed, and a reverse-mixed case. Each passes the decompose-codebase validator.

### Upper-Case File Passes the Phase Task Check (A2)

- A phase file with only `T` and a mixed file both give no warning from `parseWorkPhase`. `buildPhasePlan` on the `T` file gives no warning.
- The check still finds real problems in either case: a gap (`T5` where `T3` belongs) gives one warning, and `t1` followed by `T1` gives a duplicate warning. The validator test shows the same duplicate rule across case.

### Existing Tests Keep Their Lower-Case Inputs (A3)

- No existing test input or expected value changed. The only edit to an existing test file adds two new Python tests.
- Proof that the new tests test the change: with the three reader changes taken out, 7 of the 8 new TypeScript tests fail, and 4 Python checks fail. The coordinate input test passes either way, because that input already accepted both cases.

### Commands and Results

| Command | Result |
| --- | --- |
| `cd packages/cli && npx tsc --noEmit -p .` | Passed, exit 0. |
| `cd packages/cli && npx vitest run tests/w31-r0-p1-task-id-case.test.ts` | 8 passed. |
| `python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py` | 45 passed. |
| `cd packages/cli && npx vitest run` | 3 failed, 2105 passed, 6 skipped, of 2114. Files: 2 failed, 119 passed, 1 skipped. |

The three full-suite failures exist without this change: `tests/mcp-app-contract.test.ts` (2 tests, a Node v26 stderr warning) and `tests/p5-migration-safety.test.ts` fixture 11 (fails only inside a sandbox). The full suite ran after `node scripts/copy-template-to-cli.mjs` and `npm run build` in `packages/cli`, because many tests read the built template copy.

### Limits

- The work phase parser still reports IDs as written, so a `t` file and a `T` file show different letters in `run` output. P2 t3 changes the task `id` in `run` results to `T`.
- Warning and error text still names `t` (for example `expected task id t3`). P2 owns that text.
- Dependency bullets are named as a reader in the design, but no code parses them yet. The W29 R0 rule catalog (`packages/cli/src/operations/work/work-store/catalog.ts`, "task in this phase") already treats `t` and `T` as the same task. W29 R0 P3 builds that parser.
- The new test covers `resolveWaveTarget`. `resolveWorkItemIdentity` (`run work item resolve`) uses the same `parseCoordinateTarget`, so it behaves the same, but it has no separate test.
- Agent twin review: the snapshot reader change was reviewed against the backlog review agent fallback (`packages/skills/backlog-review/references/fallback.md` and its installed copy in `.agents/skills/`). The fallback now says that `t` and `T` are the same task ID and to report it with `T`, so an agent without the CLI gives the same facts.
- No command takes a full task coordinate today. The test covers the phase targets and the project URI grammar, which are the inputs that exist.
- Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now` for this phase.

## P2 Writers and Shipped Resources

Covers A4 to A6 in [P2](02-writers-and-shipped-resources.md). Evidence date: 2026-11-22. Base commit: `879a8866` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Changed

- Template, upstream in `packages/docs/template/`: `.make-docs/system/templates/work-phase.md`, `.make-docs/system/contracts/output-contract.md`, `.make-docs/system/references/execution-workflow.md`, `.make-docs/system/references/wave-model.md`, `docs/AGENTS.md`, `docs/CLAUDE.md`, `docs/AGENTS.codex-only.md`, `docs/CLAUDE.claude-only.md`, `docs/work/AGENTS.md`, and `docs/work/CLAUDE.md` write `T1`. The wave model and the output contract also say that readers accept a lower-case `t` as the same task ID. The full task coordinate form is now `W{W} R{R} P{P} T{T}`, and the task token is `T{T}`. Filename tokens such as `w{W}-r{R}-p{P}` stay lower case, because file names use lower case.
- Template, one more file: `.make-docs/system/references/human-experience.md` had a weak-request example, `w4 r1 p2 t19`. It is now `W4 R1 P2 T19`. The example stays weak, because it still shows an internal ID with no meaning.
- Dogfood copy: the nine changed files that this repository installs were copied byte for byte into `./.make-docs/` and `./docs/`. Each matched its upstream copy before the change. `docs/AGENTS.codex-only.md` and `docs/CLAUDE.claude-only.md` are install variants with no dogfood copy.
- CLI: `packages/cli/src/operations/work/index.ts` gives each task `id` as `T` and a number in its results, whatever case the file uses. The phase task check warnings now say `expected task id T3, found T5` and `duplicate task id T1`. `packages/cli/src/operations/work/work-store/catalog.ts` names the task part `T` in the work store ready order. This changes the W29 R0 rule catalog digest. Nothing pins that value, and the catalog's agent form, `work-store.md`, does not exist yet, so no agent form needs a review. The closeout history draft copies task IDs from the phase JSON that its caller gives. When that JSON comes from the phase state result, it has `T` too. That path has no separate test.
- Skills: the decompose-codebase Skill in `packages/skills/decompose-codebase/` changed its phase template (`assets/templates/rebuild-backlog-phase.md`), its two references, and three validator error texts (`TN`, `duplicate task id T1`, `expected T2 but found T1`). No installed copy of it exists under `.agents/skills/`. No other Skill or installed Skill names a task ID.
- Docs: `docs/assets/project/migrated-operations-inventory.md` names the task form `- [ ] TN: ...` and says that results give `T`.
- No backlog under `docs/work/` was rewritten, apart from this backlog's P2 closeout. P4 does the rewrite.

### No Lower-Case Task ID in Shipped Files (A4)

- A search of `packages/docs/template/` for `\bt\d+\b` and `t{T}` finds no hit. The new test `tests/w31-r0-p2-task-id-writers.test.ts` runs the same search on every Markdown file in the template.
- The search leaves out `.make-docs/system/references/project-doctor.md`. That file does not exist yet. P3 adds it, and it will show lower-case IDs as the problem the doctor finds, so P3 must check that file itself.
- A search of `packages/skills/`, `.agents/skills/`, `scripts/`, `packages/cli/src/`, this repository's `.make-docs/system/`, and its routers finds no lower-case task ID in written text. Code comments that name past coordinates, such as `W18 R11 P6 t5`, were left as written.

### Template and Dogfood Copies Match (A5)

- `cmp` passed for each of the nine reseeded files. The new test checks the same nine files byte for byte.
- `node scripts/copy-template-to-cli.mjs` refreshed the bundled template in `packages/cli/template/`. `tests/consistency.test.ts` checks that bundled copy against the template.

### Template Validation Passes (A6)

- `npm run validate:defaults -w packages/cli` passed: 3 files, 53 tests.
- `scripts/check-instruction-routers.sh` passed. It ran outside the sandbox, because the sandbox blocks the system temp folder that its `mktemp -d` uses.

### Test Expectations That Changed

- `tests/w31-r0-p1-task-id-case.test.ts`: the test "keeps each ID as written" became "gives T for every task ID", because the parser now gives `T`. The gap and duplicate warnings now expect `T3` and `T2`. The inputs did not change.
- `tests/operations.test.ts` and `tests/operation-domains.test.ts`: the task IDs that the parser gives now expect `T1` and `T2`. The fixture files still use `t`, so these tests also show that readers accept `t`.
- `tests/consistency.test.ts`: the work phase templates must contain `- [ ] T1: {{TASK}}`, and the work references must contain `- [ ] T1:`. Both now also fail on any lower-case task ID.
- `packages/skills/decompose-codebase/scripts/test_validate_output.py`: three error text checks now expect `TN`, `duplicate task id T1`, and `expected T2 but found T1`. The inputs did not change.
- Proof that the new tests test the change: with the two CLI source files reverted, the three CLI tests in the new file fail.

### Commands and Results

| Command | Result |
| --- | --- |
| `cd packages/cli && npx tsc --noEmit -p .` | Passed, exit 0. |
| `cd packages/cli && npx vitest run tests/w31-r0-p2-task-id-writers.test.ts` | 5 passed. |
| `python3 -B packages/skills/decompose-codebase/scripts/test_validate_output.py` | 46 passed. |
| `npm run validate:defaults -w packages/cli` | 53 passed in 3 files. |
| `scripts/check-instruction-routers.sh` | Passed. |
| `cd packages/cli && npx vitest run` | 3 failed, 2110 passed, 6 skipped, of 2119. Files: 2 failed, 120 passed, 1 skipped. |

The three full-suite failures exist without this change: `tests/mcp-app-contract.test.ts` (2 tests, a Node v26 stderr warning) and `tests/p5-migration-safety.test.ts` fixture 11 (fails only inside a sandbox). The full suite ran after `node scripts/copy-template-to-cli.mjs` and `npm run build`.

### Limits

- The P1 evidence lists 45 validator tests. The validator test file at the base commit has 46, and all 46 pass.
- The work phase parser no longer keeps an ID as written. P3 must read the file lines itself to find lower-case IDs, not the parser's `id`.
- This backlog still uses lower-case task IDs. P4 rewrites them with the doctor.
- Agent twin review: the backlog review agent fallback already says to report task IDs with `T` (P1). The decompose-codebase Skill text and its validator changed together.
- Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now` for this phase.
