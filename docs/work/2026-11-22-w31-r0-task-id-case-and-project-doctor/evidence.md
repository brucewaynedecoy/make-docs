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
