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

## P3 Project Doctor

Covers A7 to A12 in [P3](03-project-doctor.md). Evidence date: 2026-11-22. Base commit: `08f405bd` on `docs/w29-w30-work-store-and-factory`, which includes W31 R0 P2. Node `v26.13.1`. CLI package version `2.0.9`. The work is uncommitted in its worktree.

### What Changed

- `packages/cli/src/operations/project/doctor/`: the check list (`DOCTOR_CHECKS`, one check: `task-id-case`), the `task-id-case` scanner, `check`, `fix`, and the two registry definitions. The scanner reads the raw Markdown lines itself. It does not use a parser's task `id`, because P2 makes the parser give `T`.
- `packages/cli/src/operations/registry.ts`: admits `project.doctor.check` (`mutates: read`, project read, no Store) and `project.doctor.fix` (`mutates: write`, Store write and project write) under `make-docs project doctor`. The fix projection lists `--check-json <file>` and `--dry-run`.
- `packages/cli/src/mcp/tools.ts`: MCP tools `project_doctor_check` and `project_doctor_fix` in the `quality` and `setup` profiles, and so in `all`. The fix input has the optional `reviewedFiles` list.
- `packages/cli/src/run/root-operations.ts` and `packages/cli/src/cli.ts`: the `project doctor check|fix` CLI with repeated `--exclude`, `--review`, `--check-json`, `--dry-run`, `--target-root`, and `--json`, plus help text.
- `packages/cli/src/store/installation-state.ts`: two small read helpers. One returns the active operation ID. One lists each journaled file's backup payload.
- `packages/docs/template/.make-docs/system/references/project-doctor.md`: the agent twin. It is in the resource catalog (profiles `setup` and `quality`) and in the always-projected reference list in `packages/cli/src/rules.ts`. It was reseeded to `./.make-docs/` and copied into the bundled CLI template.
- Nine existing inventory tests now pin the two new operations, tools, and resource.

### Owner Decisions Applied

- `--check-json` (MCP `reviewedFiles`) stays as an optional input. The owner adds it to the PRD 39 table.
- `task-id-case` skips every `AGENTS.md` and `CLAUDE.md` router file under `docs/work/` on purpose, with the reason "managed router; fixed upstream by reseed". The twin says the same.
- The symbolic link and hard link guards stay in the doctor only for this phase. Each test that makes a link first checks that the platform can make one. If it cannot, the test skips and its title names the reason. The twin says that a Windows junction counts as a link.
- The fix needs Store write access as well as project write access. The owner updates PRD 25.

### Independent Review Findings and Fixes

An independent review found eight problems. Each fix has a regression test in `packages/cli/tests/w31-r0-p3-project-doctor.test.ts`:

| Finding | Fix | Test |
| --- | --- | --- |
| 1. A wrong-case `--exclude` passed on a case-blind disk and excluded nothing, so `fix` changed that folder. | Each exclude part must match a name in its parent folder exactly. A wrong case fails closed with its own message. | "fails closed for an --exclude path in the wrong letter case" |
| 2. A link at `docs` let `check` read outside the project. `fix` then failed inside the write path and left a pending operation. | A link at `docs` or `docs/work`, or a link to a folder anywhere under `docs/work/`, stops the run with an error that names it, before any read through it and before any operation opens. A linked Markdown file is still only skipped. (The re-check found that a nested linked folder was first only skipped; it now stops, as the twin says.) | "stops when docs is a symbolic link", with no pending operation; "stops when docs/work … is reached through a link"; "stops with an error naming a linked folder nested under docs/work" |
| 3. `fix` wrote through a hard-linked file to a file outside the project. | A file with more than one link is skipped with the reason "hard link". The fix also refuses a reviewed file that became hard-linked. | "skips a hard-linked file"; "refuses the fix when a reviewed file becomes hard-linked" |
| 4. `--check-json`, `reviewedFiles`, and `--dry-run` were not shown everywhere. | They are in the registry usage, the top-level and doctor help, the MCP input, and the twin. A stale-review refusal names `--check-json` to a CLI caller and `reviewedFiles` to an MCP caller. | "names --check-json for CLI callers and reviewedFiles for MCP callers" |
| 5. A leading byte order mark hid a history record and a task line. | The scanner ignores a leading U+FEFF. | "ignores a leading byte order mark" |
| 6. Mixed-case lists such as `T1-t3` missed their lower-case part. `~~t3~~` was missed. `id="t3"` in HTML was changed. | Any `t`, `T`, or `A` ID with a valid left side anchors a joiner. `~` is a word edge. HTML tag text is left unchanged and listed with the reason "inside an HTML tag". The edge of a skipped part is a word edge, so `<b>t3</b>` is found. | "finds lower-case parts of mixed-case lists …" |
| 7. The twin did not match the code on curly quotes, a linked `docs/work`, and front matter. | The twin names the exact quote characters, says a linked folder stops the run with an error, and says front matter starts on line 1. | "states the twin rules exactly as the code applies them" |
| 8. The undo command used JSON quoting and offered `git restore` for files git does not track. | Names use single-quote shell quoting. `git restore` lists only files that `git ls-files` reports. Other files are named with their backup. | "names git only for tracked files …", which runs the command in a shell; "names the backup, not git …" |

A re-check review confirmed these fixes and the owner decisions, and found more:

| Re-check finding | Fix | Test |
| --- | --- | --- |
| 1. (medium) The undo command ran in the current folder, so from another repository it restored that repository's file. | The command is `git -C '<project folder>' restore -- '<file>' …`, with every word single-quoted. | "names git only for tracked files …" runs the command from a second git folder with the same relative path; that folder's file stays as it was. |
| 2. (medium) A linked folder inside `docs/work` was skipped without a word, while the twin said the run stops. | It stops with an error that names the link, before any operation opens. | "stops with an error naming a linked folder nested under docs/work" |
| 3. (low) Router names matched only `AGENTS.md` and `CLAUDE.md` exactly. | Names compare without regard to letter case. The twin says so. | "skips router files in any letter case" |
| 4. (low) An HTML tag split over lines (`<a` then `id="t3">`) was not protected. | An open tag at the end of a line carries to the first `>` on a later line. A blank line or a fence ends it. The twin says so. | "carries an HTML tag that runs over more than one line" |
| 5. (low) The word-edge rule finds text glued to a skipped part. | Named as a known risk in `DOCTOR_NOTES` and the twin, with a shared example. | "names glued text next to a skipped part as a known risk" |
| 6. (low) An exclude name with accents could be refused. | Names compare in Unicode NFC form. The exclusion keeps the on-disk name. A real mismatch still fails, with a message about spelling, letter case, and accents. | "matches an exclusion with accents in either Unicode form" |
| 7. (nits) An unreachable archive check; a dry run that did not refuse an unregistered project; git found only by `<root>/.git`. | The archive check is gone (the scope never reaches `.make-docs/archive/`). A dry run refuses the same way as a real fix. Git is found by asking `git rev-parse --is-inside-work-tree`. | "refuses a dry-run fix of an unregistered project …"; "asks git, so a project inside a larger git folder …" |

With the re-check fixes 1 and 2 taken out of `index.ts` for a moment, their 4 tests fail. The file was then restored and compared byte for byte.

With the fixes for findings 1 to 3 taken out of `index.ts` for a moment, 4 of their 5 tests fail. The fifth covers the `docs/work` link rule, which was there before the review. The file was then restored and compared byte for byte. The disk on this machine ignores letter case, so the test for finding 1 runs the real failure path.

### How the Fix Writes

- The fix recomputes the check with the same exclusions. It runs only if the new digest equals the reviewed digest. The digest binds the findings, the exclusions, every file read with its SHA-256, the skipped files, and the text left unchanged.
- It writes through `withInstallationOperation` and `preparePlannedFileChange`, the same path as `project surface ensure`. Each changed file gets a backup in `.make-docs/backup/operations/<operation-id>/<n>-before`. A pending operation blocks the fix. A file that changes or gains a hard link before the write stops the fix with its name.
- Before a real or dry-run write, it checks that the project has a `projectId` in `.make-docs/config.yaml` and a registered Store checkout. Without these, the write path would add a project ID or register a checkout that the digest does not name. The fix refuses instead.
- The undo path is git for the files that git tracks, with a `git -C '<project folder>' restore` command that works from any current folder and a warning that it also drops earlier uncommitted edits. Git is found by asking git, so a project inside a larger git folder works. Every other changed file is named with its backup.

### No-Write Check and Parity (A7)

- On the fixture project, a byte snapshot of every file is the same before and after `check`, and no Store folder is created.
- The CLI `--json` result, the MCP result in the `quality`, `setup`, and `all` profiles, and the direct core result are equal.
- Human output puts the totals first, then each file, line, current text, and fixed text, then skipped files and text, then the digest and the next command.

### Reviewed Fix and Stale Files (A8)

- On the fixture project, the fix changes exactly the files with findings. The two fixture files match the hand-written `expected/` copies byte for byte, and a CRLF file keeps its line endings. The only new files are the backups, and each backup holds the exact prior bytes.
- A file edited after the check makes the fix refuse. With the saved check result, the refusal names the edited file, a new file, and a removed file. Without it, the refusal says the digest no longer matches and names the option for the caller's surface. No file changes, and no operation is left pending.
- A fix without write permission is refused on the core and on MCP. A dry run changes nothing.
- MCP `project_doctor_fix` with `allowWrite=true` but no harness Store grant returns the typed `store-not-configured` refusal and changes nothing. The CLI fix and the shared core give the same result.

### Exclusions (A9)

- An excluded folder is not read, its files are not in the digest, and the digest differs from the run without it. `./path`, `path/`, and repeated forms give the same digest.
- After a fix with the exclusion, the excluded file is byte-identical.
- Traversal, absolute paths, `~`, backslashes, empty parts, missing paths, wrong letter case, and paths through a symbolic link fail closed. A fix with other exclusions than the check is refused.

### Clean Project (A10)

- A clean project returns status `clean`, no findings, and the summary `No problems found in 1 file. Nothing changed.` The CLI exit code is 0. A check with findings exits 1, like `path-hygiene validate`.

### Skip Rules and Agent Twin Parity (A11, A12)

- Fixture cases: task lines with and without a colon, an indented checkbox, ranges, chains, mixed-case lists, strikethrough, table cells, quotes, possessives, link text (found) and link targets (skipped), reference definitions, inline code, bare URLs and autolinks, an HTML tag, backtick and tilde fences, an unclosed fence, a CRLF file, a byte order mark, an HTML tag split over lines, a `kind: history` file, router files, a non-Markdown file, and a file outside `docs/work/`.
- False-hit guards with fixtures: `at3`, `t3x`, `t3_a`, `foo_t3`, `v1.t3`, `t3.5`, `t3.md`, `.t3/worktrees`, `t3/w31-r0`, `t3-56a6`, `t2026`, `t0`, `t01`, `\t2026`, `t1-6`, `a/t3/t4`, `x-T1-t2`, `_t3_`, and `id="t3"` (also in a tag split over lines) are not changed.
- Accepted risks, shown in every check result and covered by shared examples: a stand-alone `t3` that is not a task ID, such as `an AWS t3 instance`, is found; and text glued to a skipped part, such as `word<span>t3</span>word`, is found. The person rejects either in review.
- The test reads every `before:` and `after:` pair in the reference's `## Shared Examples` block (15 pairs) and checks that the scanner gives the same answer.
- The template, the dogfood copy, and the bundled CLI copy of `project-doctor.md` are byte-identical. Both catalogs list it with profiles `setup` and `quality`.

### Read-Only Run on This Repository

`make-docs project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption/`, run with the built CLI after the re-check fixes and before these closeout edits:

- Found 3,288 lower-case task IDs on 2,915 lines in 268 files: 2,558 task lines and 730 prose references. It read 370 files, skipped 2 (`docs/work/AGENTS.md` and `docs/work/CLAUDE.md`, managed routers), and excluded 6. No text was left unchanged inside an HTML tag. Exit code 1. No file changed, and no Store folder was created.
- A wrong-case exclusion (`Docs/Work/2026-11-13-W22-R2-PORTABLE-CHECKOUT-ADOPTION`) stops with the exact-case message and reads nothing.
- A review of the 92 prose findings with the least task-like context found no false hit.
- The numbers and digest change as this backlog changes. P4 runs the check again and uses that digest.

### Commands and Results

| Command | Result |
| --- | --- |
| `cd packages/cli && npx tsc --noEmit -p .` | Passed, exit 0. |
| `cd packages/cli && npx vitest run tests/w31-r0-p3-project-doctor.test.ts` | 46 passed. |
| `npm run validate:defaults -w packages/cli` | 53 passed. |
| `cd packages/cli && npx vitest run` | 3 failed, 2156 passed, 6 skipped, of 2165. Files: 2 failed, 121 passed, 1 skipped. |

The full suite ran in this checkout with P2 and P3 together, after `node scripts/copy-template-to-cli.mjs` and `npm run build`. The three failures are the known ones: `tests/mcp-app-contract.test.ts` (2 tests) and `tests/p5-migration-safety.test.ts` fixture 11 (sandbox only). On this machine no link test skipped. One earlier full run, made while a read-only `check` of this repository ran at the same time, also had two 15-second timeouts (`tests/backup.test.ts` and `tests/cli.test.ts`). Both files then passed alone (152 tests), and the next full run with nothing else running had only the three known failures.

### Limits

- `--check-json` (MCP `reviewedFiles`) is not yet in the PRD 39 table, and PRD 25 R-MCP-PROFILE-9 does not yet say that the fix needs Store write access. The owner updates both.
- No MCP fix ran with a real harness Store grant. The test shows the typed refusal without a grant and the same core result as the CLI.
- The link and hard-link tests ran on macOS only. On a platform that cannot make links they skip and say why. No Windows run was made.
- The git undo test runs its shell command only where `sh` exists, which is every platform but Windows.
- Columns count UTF-16 code units, after a byte order mark.
- Performance Testing and Unassisted Goal Testing are `not-needed-now`. The Guided Progress Review of the check and fix wording happens with the owner in P4.
