---
title: "W19 R8 P1 Store Access Bootstrap and Remediation Evidence"
kind: "work"
status: "completed"
coordinate: "W19 R8 P1"
source:
  type: "work"
  path: "docs/work/2026-09-16-w19-r8-store-access-bootstrap-and-remediation/01-store-access-bootstrap-and-remediation.md"
---

# W19 R8 P1 Evidence

## Current Result

W19 R8 P1 is reclosed after the Codex TOML array-table correction. Its focused source and installed-package correction checks pass. The real W19 R2 setup command now reaches Codex MCP planning in dry-run mode.

The owner accepted `W19-R8-GATE-EXCEPTION-1`. This bounded exception excludes repository-wide failures that cover only the separate Performance Evidence projection work. It does not convert those failures to passes. It does not waive a W19 R8 test.

The replacement exact installed matrix passes. It covers the original cases plus a sanitized Codex file with 21 repeated `[[skills.config]]` elements, repeated nested tables, dry run, apply, repeat, repair, and byte preservation. Receipt-bound adapter proof covers exact removal and restoration.

## P1 Correction Cause and Scope

Live W19 R2 use invalidated the first package's broad Codex MCP setup claim. The real configuration shape has 21 valid `[[skills.config]]` array-table elements. The old bounded validator stored all table and value paths in flat global sets. It therefore treated the second element and its repeated nested table path as duplicate declarations.

P1 reopened for this missed case. The correction replaces the flat sets with an internal container tree. Each array-table header appends one distinct table element. Assignments and nested tables resolve against the active element. Existing malformed-input and conflict blocks remain in force.

This correction adds no TOML dependency and no public interface. It keeps W19 R2 work unchanged. It adds Stage 5 inside P1. It does not create P2 or another wave.

## Safety Boundary

- Branch: `make-docs-v2`.
- Original implementation starting and ending HEAD before its separate commit: `ca0909a0c0f596d74051056510ff4345f537d606`.
- Stage 5 correction starting and ending HEAD: `0e5e90bed5139020c6fa9fd5f15a51650c7d75c0`.
- The worktree was dirty before W19 R8 implementation.
- The earlier user work includes Performance Evidence resources, router changes, tests, and smoke-pack changes.
- The Stage 5 correction preserved all 20 earlier Performance Evidence paths. It did not stage, restore, or rewrite them.
- No W19 R8 command applied setup to the real project or real Codex configuration. The required real command used `--dry-run` only.
- No persistent setup result was written to the user's real Store. The real dry run used normal transient Store session controls.
- Package installs, homes, Store roots, and project fixtures used `/private/tmp` or test-created temporary folders.
- No file was staged, committed, pushed, published, or released.
- Free disk space at the final review was 59 GiB.

## Implemented Result

### Setup and package identity

- The verifier accepts a normal package-manager link only when it resolves to the declared Make Docs package bin.
- The verifier keeps the launch path and resolved path.
- The verifier returns stable codes for path, link, file, mode, runner, fingerprint, and package failures.
- A method cannot appear as both available and blocked in one review.
- Machine subplans can finish when another machine method blocks.
- Existing setup keeps the saved Skills choice. It routes Skills changes to `make-docs setup skills` and continues independent setup work.
- Pending setup state is admitted before the interactive questions.
- Incomplete plans do not offer resume. A proved no-effect rollback changes no project file or ledger entry.

### Store state and agent continuation

- Store-backed operations return `store-not-configured`, `store-unavailable`, `store-unsafe`, or `store-denied`.
- Each result includes the affected operation, the reason, the scope, task continuation state, and one safe next action when available.
- Store-free operations do not open or create the Store.
- Store-free MCP operations do not require project harness intent.
- Stable MCP tools stay visible. The operation policy returns the typed Store result at call time.
- Shipped agent guidance says that no Store is a valid state.
- Shipped guidance tells an agent to continue independent work.
- Shipped guidance says that this repair cannot depend on Store or MCP access.

### Generic MCP and recovery

- Setup supports `--generic-mcp-client <label>`.
- Setup supports `configure`, `rotate`, `repair`, and `remove` actions.
- The output is a standard MCP configuration object.
- Make Docs writes its own intent only. It does not edit an unknown client file.
- Generic identity needs a bounded proof. A caller-controlled label or environment value alone is not enough.
- Machine intent and project intent remain separate.
- Repeat setup hides the old secret proof. Rotation and repair make a new proof.
- An active agent can continue Store-free work, add access, refresh access, and retry only the failed operation.

## Replaced Package Candidate

The following first candidate remains prior evidence. Live W19 R2 use replaced it because its Codex TOML validator rejected valid repeated array tables.

| Field | Value |
| --- | --- |
| File | `/private/tmp/make-docs-w19-r8-final.XYQhpJ/brucewaynedecoy-make-docs-2.0.0-rc.tgz` |
| Package | `@brucewaynedecoy/make-docs` |
| Version | `2.0.0-rc` |
| SHA-256 | `15383b307cec71f4544972b13925330812d6034875d1b567af33b78de5bcbe17` |
| npm SHA-1 | `7adbb06bd236bb036c837d752c6260a111967b34` |
| npm integrity | `sha512-S8bOCealLeS7dXnV24DR3/CZij9skMaXo+/vjivyyPpIUVMEyDuH8Ue5pn36H9easEadammBN/OrJteT0wSlnA==` |
| Package entries | 139 |
| Packed size | 1,473,399 bytes |
| Unpacked size | 6,985,169 bytes |
| Installed package root | `/private/tmp/make-docs-w19-r8-final.XYQhpJ/install/lib/node_modules/@brucewaynedecoy/make-docs` |
| Declared bin | `make-docs: dist/index.js` |
| Launcher | `/private/tmp/make-docs-w19-r8-final.XYQhpJ/install/bin/make-docs` |
| Link target | `../lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Resolved bin | `/private/tmp/make-docs-w19-r8-final.XYQhpJ/install/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Included guidance | `package/template/AGENTS.md` and `package/template/CLAUDE.md` |

The normal npm launcher passed Codex MCP setup and Claude Code MCP setup in separate isolated homes. Each result had `status: configured` and `mutationState: verified`.

The same package passed generic MCP configure, repeat, rotate, repair, and remove. The repeat result had `changed: false`. Remove ended with `state: missing`.

## Replacement Package Candidate

| Field | Value |
| --- | --- |
| File | `/private/tmp/make-docs-w19-r8-correction.w7lICL/brucewaynedecoy-make-docs-2.0.0-rc.tgz` |
| Package | `@brucewaynedecoy/make-docs` |
| Version | `2.0.0-rc` |
| SHA-256 | `aae05c724b209817644ae546a8935aaadd37f448d3716c01602fe4ca05e7ec38` |
| npm SHA-1 | `d611e4297f8d46bda722043d0413b91642df806e` |
| npm integrity | `sha512-VmLNHTJPYwxXPVmveW5q/21PfULYoEhsV7gf2/G7wCppAZDt0tB5xEmjCYulFstbjthVYHUecpJXdUIGe4u8Aw==` |
| Package entries | 139 |
| Packed size | 1,474,804 bytes |
| Unpacked size | 6,988,827 bytes |
| Installed package root | `/private/tmp/make-docs-w19-r8-correction.w7lICL/install/lib/node_modules/@brucewaynedecoy/make-docs` |
| Declared bin | `make-docs: dist/index.js` |
| Launcher | `/private/tmp/make-docs-w19-r8-correction.w7lICL/install/bin/make-docs` |
| Link target | `../lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Resolved bin | `/private/tmp/make-docs-w19-r8-correction.w7lICL/install/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |

The exact installed setup and upgrade matrix passes 5 of 5 tests. The new case uses this option shape:

`setup --target <project> --dry-run --yes --codex-method mcp --claude-code-method none --project-resources contract,reference,prompt,template --json`

The dry run changed no Codex file. Apply kept all 21 user-owned elements and added the Make Docs managed block. Repeat kept the same bytes. Removing the managed block and running setup again repaired only that block.

The focused adapter test proves receipt-bound removal. It restores the complete original user-owned file byte for byte.

## Real W19 R2 Dry Run

- Command shape: the same full setup shape above, with the real project as `--target .`.
- Configuration evidence recorded: 21 repeated `[[skills.config]]` elements. No private values were recorded.
- Result: exit 0, `status: planned`, Codex method `mcp`, machine state `incomplete`, mutation state `planned`, and `failedCondition: null`.
- Observation: Codex MCP planning succeeds. The prior duplicate-table error is absent.
- Separate result: the project plan still reports the existing `work-phase.md` projection conflict. That conflict belongs to W19 R2 and does not affect the TOML correction.
- Mutation boundary: dry run only. No project, Store, or Codex configuration change was applied.

## Original Validation Results

This table records the first package result. Keep it as prior evidence. The Stage 5 table below is the active reclose result.

| Check | Result |
| --- | --- |
| Final combined W19 R8 check | Pass. 26 of 26 source and exact installed tests. |
| W19 R8 focused Store and setup tests | Pass. 10 of 10 tests. |
| Exact installed active-task and recovery tests | Pass. 6 of 6 tests. |
| Exact installed state and help tests | Pass. 6 of 6 tests. |
| Exact installed setup and upgrade matrix | Pass. 4 of 4 tests. |
| TypeScript check | Pass. `npx tsc -p packages/cli/tsconfig.json --noEmit`. |
| PRD authority | Pass. 36 PRD files, 573 Markdown files, 196 structured files, 1,115 links, and no diagnostic. |
| Diff check | Pass. `git diff --check` returned no error. |
| Full CLI test set | Accepted external failure. 1,279 of 1,290 tests pass. The 11 failures are in the separate Performance Evidence projection work. |
| Default validation | Accepted external failure. 52 of 53 tests pass. The one failure is the separate `work-phase.md` Performance Evidence projection mismatch. |
| Local package smoke | Accepted external failure. The installed smoke reaches setup, then stops because the separate dogfood file `.make-docs/system/contracts/performance-evidence-governance.md` is absent. |

## Stage 5 Correction Validation

| Check | Result |
| --- | --- |
| TypeScript check | Pass. `npx tsc -p packages/cli/tsconfig.json --noEmit`. |
| Focused Codex adapter tests | Pass. 33 of 33 tests. |
| Combined correction focus | Pass. 49 of 49 tests across the Store remediation, Codex adapter, active-task, and installed setup matrix files. |
| Exact installed state, recovery, active-task, and setup matrix | Pass. 17 of 17 tests against the replacement package. |
| Exact installed setup and upgrade matrix | Pass. 5 of 5 tests. The fifth case is the 21-element Codex TOML correction. |
| Build and pack | Pass. One replacement package was built, packed, installed, and reused for every exact installed correction check. |
| Real W19 R2 dry run | Pass. Exit 0, `status: planned`, Codex MCP planning reached, and `failedCondition: null`. |
| PRD authority | Pass. 36 PRD files, 573 Markdown files, 196 structured files, 1,115 links, and no diagnostic. |
| Diff check | Pass. `git diff --check` returned no error. |
| Full CLI test set | Accepted external failure. 1,284 tests pass, 11 fail, and 5 exact-installed tests skip without their opt-in environment variable. The 11 failures are the same separate Performance Evidence projection checks. |
| Default validation | Accepted external failure. 52 of 53 tests pass. The one failure is the separate `work-phase.md` Performance Evidence projection mismatch. |

### Separate failed checks

The full test failures are these existing Performance Evidence projection checks:

- One source-to-dogfood mismatch for `.make-docs/system/templates/work-phase.md`.
- One Human Experience resource check that reads the same projection.
- Nine Performance Evidence catalog and router projection checks.

These failures do not show a W19 R8 code failure. They still keep the shared package gates open.

## Bounded Gate Exception

Exception: `W19-R8-GATE-EXCEPTION-1`.

- Owner: project owner.
- Accepted: 2026-09-16.
- Scope: The 11 full-suite failures, the one default-validation failure, and the one local package-smoke failure listed above.
- Covered claim: Performance Evidence resource and dogfood projection parity only.
- Reason: The unfinished Performance Evidence wave depends on the setup and Store-access changes delivered by W19 R8. Making its unfinished projection block W19 R8 creates the same closed dependency loop that W19 R8 repairs.
- Risk: The repository-wide package gate is not fully green. The Performance Evidence package and dogfood projections remain unproved.
- Owning backlog: The Performance Evidence work backlog.
- W19 R8 effect: None. All focused source, type, package identity, first-party MCP, generic MCP, Store-state, recovery, upgrade, and active-task cases pass against the exact package candidate.
- Exclusions: This exception does not claim that the Performance Evidence work is complete. It does not authorize release. It does not hide a failed W19 R8 case.
- Reopen rule: Reopen W19 R8 P1 if its production files, exact package identity, setup or Store claims, or focused results change. Do not reopen it only because the Performance Evidence backlog is still unfinished.

This exception follows the lifecycle straddle rule. The owner directed a bounded departure from the normal repository-wide gate. The close record states the reason and the exact limit.

## Acceptance Review

| Rule | Result | Evidence or open item |
| --- | --- | --- |
| A1 | Pass | The normal npm link resolves to the declared package bin and configured both first-party MCP clients. |
| A2 | Pass | Link, runner, file, mode, fingerprint, and package cases return stable verifier codes. |
| A3 | Pass | Method state is computed after prerequisites. The W19 test proves one consistent state. |
| A4 | Pass | A valid machine method applies when another method blocks. Later work does not erase it. |
| A5 | Pass | Existing setup locks the saved Skills choice and gives the exact Skills route before later work. |
| A6 | Pass | Missing Store and harness intent returns `store-not-configured`. |
| A7 | Pass | Store-free CLI and MCP tests prove no Store open, creation, session, receipt, or harness need. |
| A8 | Pass | Typed Store errors have operation scope and `taskCanContinue: true`. |
| A9 | Pass | Upstream and dogfood guidance require independent work to continue. |
| A10 | Pass | Shared serialization preserves code, reason, operation, scope, action, and continuation state. |
| A11 | Pass | The exact installed active-task test proves setup, refresh, one-operation retry, and continuation. |
| A12 | Pass | Generic setup prints the standard object and changes no client-owned file. |
| A13 | Pass | Proof, package identity, machine intent, project intent, and access ceiling are checked. |
| A14 | Pass | Repeat, drift rejection, rotate, repair, remove, and project access have focused test proof. |
| A15 | Pass | Recovery tests prove incomplete-plan rollback and no unsafe resume. |
| A16 | Pass | Failure detail remains in shared operation and recovery result shapes after restart. |
| A17 | Pass | Independent machine and project results remain current after later failure or refresh. |
| A18 | Pass | Every W19 R8 automated and exact installed case passes. `W19-R8-GATE-EXCEPTION-1` excludes only failed checks that cover the separate Performance Evidence projection. |
| A19 | Pass | The installed launcher is the recorded normal npm link to the exact candidate bin. |
| A20 | Pass | The exact package passes fresh, invalid option, repeat, v1, early-v2, and partial-install cases. |
| A21 | Pass | No-Store, first-party MCP, and generic MCP cases keep their stated access limits and use no project-local state file. |
| A22 | Pass | The exact installed active-task test preserves progress and retries only the affected operation. |
| A23 | Pass | D-034, D-035, and D-038 have complete W19 R8 close evidence. The unrelated Performance Evidence failures do not cover their close rules. |
| A24 | Pass | HX-1 through HX-8 are reviewed below. No human response is required. |
| A25 | Pass | The final status review shows the unrelated user changes remain unstaged. |
| A26 | Pass | The 21-element fixture repeats keys and `[skills.config.metadata]` in separate elements without a false conflict. |
| A27 | Pass | Negative tests keep duplicate keys, duplicate normal tables, table-kind conflicts, malformed input, and invalid parents blocked without file changes. |
| A28 | Pass | Dry run changes no file. Apply adds the managed block. Repeat changes nothing. Receipt-bound removal restores the original bytes. |
| A29 | Pass | The exact installed matrix uses the full setup option shape and proves dry run, apply, repeat, and repair. |
| A30 | Pass | No TOML dependency or public CLI, MCP, Store, schema, or configuration interface was added. |
| A31 | Pass | The replacement package passes TypeScript, focused tests, build, installed checks, and the real W19 R2 planning dry run. |
| A32 | Pass | No TOML, setup, MCP, native-file, or W19 R8 failure uses the Performance Evidence exception. |
| A33 | Pass | The 20 pre-existing Performance Evidence paths remain unstaged and outside this correction. |
| A34 | Pass | The first package remains recorded as replaced evidence. This reclose uses the replacement package identity. |

## Human Experience Review

Reviewer: Codex implementation agent.

Reviewer limit: This is an agent review of terminal, JSON, package, and test evidence. It is not an unassisted human test. It did not change the real user Store, home setup, or another real project.

### HX-1 - Installed launcher

- Evidence: The npm link, resolved bin, package name, version, and declared bin match. Codex and Claude Code MCP setup both finished.
- Observation: The package-manager link no longer causes a false package verification block.
- Conclusion: Pass.
- Limit: Wrapper and unsafe-link cases use automated fault tests.
- Next action: Keep the link matrix in the release gate.

### HX-2 - Independent setup results

- Evidence: The focused setup test applies one valid machine subplan while another method is blocked.
- Observation: One failed method does not hide or undo a valid machine result.
- Conclusion: Pass.
- Limit: The review uses isolated configuration files.
- Next action: Keep subplan results visible in future setup changes.

### HX-3 - Safe setup and upgrade retry

- Evidence: The exact package passes fresh recovery, interrupted recovery, resume, rollback, state, and help tests. Incomplete plans do not offer resume.
- Observation: The tested recovery paths give a reachable action and keep failure detail.
- Conclusion: Pass.
- Limit: No real legacy project was changed.
- Next action: Keep the exact installed matrix in the release gate.

### HX-4 - Valid no-Store work

- Evidence: Store-open spy tests and the exact installed active-task test complete Store-free work before access exists.
- Observation: No Store configuration is treated as a normal project state.
- Conclusion: Pass.
- Limit: The test uses isolated Store roots.
- Next action: Keep Store-free operations free of Store session construction.

### HX-5 - Typed and scoped Store errors

- Evidence: Focused tests cover not configured, unavailable, unsafe, and denied states.
- Observation: Each result names one operation and says that the task can continue.
- Conclusion: Pass.
- Limit: Human text is checked through deterministic render tests, not a live owner interview.
- Next action: Do not convert these operation results into task-wide stops.

### HX-6 - Mid-task access

- Evidence: The exact installed test uses one MCP process before and after access setup.
- Observation: Store-free work continues. The failed Store operation is retried once after access refresh.
- Conclusion: Pass.
- Limit: The agent harness is a controlled test client.
- Next action: Keep the refresh path within the active task context.

### HX-7 - Generic MCP

- Evidence: The exact package prints a standard configuration. Repeat, rotate, repair, and remove all pass. No client file is named as an edit target.
- Observation: An unsupported client has a reachable path without a client-specific adapter.
- Conclusion: Pass.
- Limit: The user must copy the output into the real client.
- Next action: Add client-specific adapters only when their ownership rules are known.

### HX-8 - Repair without the broken path

- Evidence: All source work, build work, package work, and review work ran without Make Docs Store or MCP access as a prerequisite.
- Observation: A Store failure did not stop this repair.
- Conclusion: Pass.
- Limit: Store-backed acceptance used isolated fixtures only.
- Next action: Keep this rule in future Store and setup correction packages.

### Repeated HX-2 review - Independent setup result

- Evidence: The replacement installed matrix plans and applies Codex MCP with 21 repeated array-table elements. The real W19 R2 dry run reports a planned Codex machine change and no failed condition.
- Observation: Existing user-owned Codex entries do not block the independent machine subplan.
- Conclusion: Pass.
- Limit: The real command was dry run only. Apply and repair used isolated homes.
- Next action: Resume W19 R2 from its preserved candidate. Do not apply real setup as part of this correction.

### Repeated HX-3 review - Safe setup retry

- Evidence: The replacement installed test proves dry run, apply, no-change repeat, simulated missing-block repair, and receipt-bound removal with exact byte restoration.
- Observation: A valid repeated-array configuration can be reviewed and retried without losing user content.
- Conclusion: Pass.
- Limit: Private real configuration values were not copied or recorded.
- Next action: Keep the 21-element sanitized fixture in the exact installed gate.

## Optional Owner Handoff

After the remaining package gates pass, the owner can try these normal steps:

1. Run `make-docs setup system --codex-method mcp --claude-code-method mcp`.
2. In a project with no Store access, ask an agent to do one Store-free operation and one Store-backed operation.
3. Add project access. Confirm that the agent retries only the Store-backed operation.

Notice whether setup gives one clear action and whether the active task continues. Feedback is welcome. It is not a P1 gate.

## Close Decision

W19 R8 P1 is reclosed after Stage 5.

All W19 R8 acceptance cases pass. The bounded gate exception records the separate failed checks, their risk, their owner, and their route. No W19 R8 claim depends on a false pass.

The first package is replaced. The replacement package passes Codex MCP planning for the real W19 R2 configuration shape. The Performance Evidence work remains separate under W19 R2 and its own backlog. Commit, push, publish, release, and real-project repair remain separate actions.
