---
title: "W24 R0 MCP Tool Profiles Evidence"
kind: "work"
status: "in-progress"
coordinate: "W24 R0"
source:
  type: "work"
  path: "00-index.md"
---

# W24 R0 MCP Tool Profiles Evidence

Current status: P1 and P2 are complete. P3 and P4 have not started. W24 remains in progress. Each phase section records its own checkpoint; the P1 entry below retains the state at P1 closeout.

## W24 R0 P1: Profile Metadata And Contracts

P1 is complete as of 2026-10-03. P2 has not started. The full profile connection feature remains incomplete.

Authority: [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [P1 work](01-profile-metadata-and-contracts.md), and the [reviewed assignment inventory](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/02-profile-inventory-and-discovery.md).

### Candidate And Environment

The P1 source candidate is based on `793868a9468ff0bd5471261503b24b303cb1b4f5` on `w24-r0-mcp-tool-profiles`. Checks used Node 24.19.0 on macOS arm64 and CLI package version 2.0.4. The package version is unchanged. This is source and local build evidence.

The [source identity](evidence/p1/source-identity.json) records hashes for all 16 changed code and test files. The [generated inventory](evidence/p1/profile-inventory.json) records all names, assignments, exposure advice, and operation access fields. The [baseline tool contracts](evidence/p1/baseline-tool-contracts.json) were captured from the clean base before implementation.

### Acceptance Evidence

| Claim | Evidence | Result |
| --- | --- | --- |
| Every ready tool has valid, nonempty typed metadata. | Registry and catalog startup checks; malformed metadata tests. | Pass. Missing, empty, unknown, duplicate, and invalid exposure values fail. |
| The reviewed assignments cover the complete ready inventory. | Generated inventory; exact per-profile membership tests. | Pass. Core 8, setup 15, workflow 14, quality 9, backlog 3. |
| `all` is the union without duplicates. | Union and name uniqueness tests. | Pass. All 43 tools occur once. `all` cannot be assigned as an intent profile. |
| Shared tools retain one contract. | Exact tool list; registry schema identity tests; baseline comparison. | Pass. Names, titles, descriptions, schemas, access, and readiness match the base. |
| Ready operation descriptors use canonical metadata. | Registry-to-descriptor equality tests; array copy checks. | Pass. No second assignment map or handler registry exists. |
| Profiles do not grant admission or access. | Readiness independence tests; access and dispatch regression tests. | Pass. Status and host access still determine readiness. |
| Later ready admissions must declare an assignment. | Mocked registry startup tests for absent, empty, and unknown metadata. | Pass. Registry initialization refuses invalid ready definitions. |

Core tools have eager exposure advice. Other tools have deferred advice. P1 leaves server registration and invocation behavior unchanged. It does not add profile selection or tool filtering.

### Validation Results

| Check | Result |
| --- | --- |
| `npm test -w packages/cli -- mcp-profiles.test.ts mcp.test.ts mcp-derivation.test.ts w19-r6-access-config.test.ts` | Pass: 44 tests across four files. Includes 17 new P1 tests. See [focused log](evidence/p1/focused-tests.txt). |
| `npm test` | Pass: 19 smoke-harness tests; 1,527 CLI tests across 94 passing files. One file with five installed-upgrade tests was skipped by its existing test gate. |
| `./node_modules/.bin/tsc --noEmit -p packages/cli/tsconfig.json` | Pass after correcting two test fixture types. |
| `npm run build -w packages/cli` | Pass. |
| Baseline contract comparison | Pass for all 43 descriptors after removing only the new `mcp` field. Schema comparison used Zod JSON Schema output with unrepresentable fields mapped to `any`. Registry input schema reference checks and existing invocation tests give separate coverage. |
| `git diff --check` | Pass. |
| PRD authority check | Pass: 35 PRDs, 586 Markdown files, 1,103 links, and no findings. |

The [validation summary](evidence/p1/validation-results.json) records these results. The full test run took 329.08 seconds. This duration is test execution evidence, not a product performance claim.

### Testing Decisions

| Type | Decision | Scope, Reason, And Gate |
| --- | --- | --- |
| Automated Implementation Testing | Required; pass. | Codex ran bounded inventory, validation, contract, access, and dispatch checks before P1 closeout. Budget: one focused pass, one full run, type check, build, and affected-only repair checks. Stop on unresolved failure. Rerun affected checks if registry metadata, descriptor projection, or access logic changes. |
| Performance Testing | Not needed now. | P1 adds metadata. It makes no latency or context claim. P4 owns the bounded measurement packet. Trigger: P4 or a new performance claim. |
| Guided Progress Review | Not needed now. | Profile selection has no host-facing result in P1. P2 will expose filtered discovery. Trigger: a reviewable host connection result. |
| Unassisted Goal Testing | Not needed now. | P1 proves internal contract and inventory facts. It does not claim host setup goal completion. Trigger: the later host setup and compatibility evidence gate. |

No testing obligation or scenario ID was created. Each later phase retains its own testing decisions.

### Human Experience Review

Reviewer: Codex Desktop. Scope: the indirect effect of profile assignments on future host tool discovery.

Codex inspected the generated inventory, descriptor projection, and current tool descriptions. All five intent groups match the reviewed purpose. Shared inspection tools keep the same name and input contract. Exposure advice does not hide tools or grant access. The server still registers all 43 ready tools. These observations support the P1 boundary.

This review does not prove host discoverability, setup clarity, latency, context savings, or Backlog Review app behavior. P2, P3, and P4 own those results. No human acceptance gate was added.

### Documentation Coverage

| Candidate | Verdict | Reason |
| --- | --- | --- |
| PRD 25 and PRD 39 | Link-only. | Current inline authority already defines profiles, metadata, and preserved admission rules. No new product rule is needed. |
| W24 plan | Link-only. | Its reviewed assignment inventory and phase order still apply. |
| Design | None. | The reviewed design still applies. P1 adds no new architecture decision. |
| W24 work index and P1 | Update-existing. | Record checked tasks, P1 completion, evidence, and the separate P2 authorization boundary. |
| Central evidence and raw P1 records | Create. | Preserve the inventory, source identity, baseline, checks, and limits. |
| History | Create. | Record this implementation checkpoint at the current date. |
| User and maintainer guides | None. | P1 adds no command, setup flow, or visible host option. Later phases own that documentation. |
| System resources and agentic twins | None. | P1 changes deterministic descriptor data. It adds no client workflow or template behavior. |

### Closeout And Limits

P1 passes its implementation gate. All three P1 tasks are checked. There are no unresolved P1 gaps. P2 requires separate authorization. W24 remains in progress.

The user authorized the local P1 commit on 2026-10-03. The closeout review confirmed that all 16 code and test files still match the tested file hashes. The existing test results remain valid. The source identity records the state before this commit. This report accompanies the local P1 commit.

The evidence covers the local source candidate and build. It does not qualify a release package, another platform, or an installed host profile. The Backlog Review MCP App tools are not part of this 43-tool inventory. Push, publication, and host configuration changes remain outside this checkpoint.

## W24 R0 P2: Filtered Tool Discovery

P2 is complete as of 2026-10-03. All four tasks and five acceptance cases passed. No code or guide gap remains within the reviewed P2 scope.

Authority: [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [P2 work](02-filtered-tool-discovery.md), and the [P2 plan](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/02-profile-inventory-and-discovery.md). The [coverage contract](../../../.make-docs/system/contracts/coverage-pass-contract.md) governs this report.

### P2 Candidate And Environment

The P2 source candidate is based on `75db93e49e8aa77b570ab25ac8133921b54d9376` on `w24-r0-mcp-tool-profiles`. Checks used Node 24.19.0 on macOS arm64 and CLI package version 2.0.4. The package version is unchanged. This is local source and build evidence.

The [source identity](evidence/a4/source-identity.json) records hashes for the four changed source files, two new test files, and 20 built JavaScript files. The closeout review confirmed that all six source and test files and all 20 built files still match those hashes. The identity describes the tested candidate before the local commit. It does not claim an installed or released build.

### P2 Acceptance Evidence

| Case | Claim And Check | Observation And Conclusion | Supporting Evidence |
| --- | --- | --- | --- |
| A1 | Each profile lists only assigned ready tools. Hidden names fail before arguments, access checks, or handlers run. | Pass. Source tests cover list and call boundaries. Seven built stdio launches returned default 43, core 8, setup 15, workflow 14, quality 9, backlog 3, and all 43 tools. The backlog server rejected the hidden operation-domains tool. | [Focused tests](evidence/a1/focused-tests.txt), [stdio results](evidence/a3/stdio-results.json). |
| A2 | An invalid profile fails before server startup and shows valid choices. | Pass. The built CLI exited with code 1, wrote no stdout, and named all six allowed choices in stderr. Tests also cover missing values, repeated choices, and unrelated flags. | [Invalid-profile result](evidence/a2/invalid-profile.json), [focused tests](evidence/a1/focused-tests.txt). |
| A3 | The existing `make-docs mcp` launch keeps the full tool catalog. | Pass. The old launch listed the same 43 wire descriptors as explicit `all`. Both returned the same operation-domains result. The five intent profiles form the exact 43-tool union. | [Built stdio replay](evidence/a3/stdio-results.json). |
| A4 | Selection preserves names, schemas, results, access checks, and write gates. | Pass. Shared wire descriptors match `all`. Source tests cover shared contracts, visible read results, target checks, denied writes, and existing operation dispatch. Hidden calls cannot reach those checks or handlers. | [Focused tests](evidence/a1/focused-tests.txt), [source identity](evidence/a4/source-identity.json), [stdio results](evidence/a3/stdio-results.json), [build log](evidence/a4/build.txt). |
| A5 | Help and one task-focused host example explain the choices, default, and old launch. | Pass within agent review. Built help names each group, describes its work, states the `all` default, and shows the backlog command. The JSON host example uses those exact arguments and states the command lookup and write-permission limits. | [Built help](evidence/a5/cli-help.txt), [user guide](../../assets/user/cli-lifecycle-managing-installations.md#choose-mcp-tools-for-a-task), [maintainer guide](../../assets/maintainer/cli-mcp-operation-parity-and-permissions.md#mcp-tool-profiles). |

Reviewer and executor: Codex Desktop. These cases prove the local tool-selection path. They do not prove native resource scoping, HTTP behavior, a named installed host, model context savings, or the separate Backlog Review app. P3 and P4 own the later W24 checks.

### P2 Validation Results

| Check | Result |
| --- | --- |
| Six focused test files | Pass: 92 tests. Includes 55 new P2 tests: 27 CLI cases and 28 discovery cases. See [focused log](evidence/a1/focused-tests.txt). |
| TypeScript `--noEmit` check | Pass. |
| CLI build | Pass. See [build log](evidence/a4/build.txt). |
| Actual built stdio launch and protocol checks | Pass for the default and all six named profiles. See [results](evidence/a3/stdio-results.json). |
| Source and test identity check | Pass for all six files against the retained hashes. |
| Full `npm test` run | Pass with exit code 0: 19 smoke-harness tests and 1,582 CLI tests. The CLI run had 96 passing files and one skipped file with five existing installed-upgrade tests. See [full log](evidence/a4/full-tests.txt). |
| PRD authority | Pass after final closeout edits: 35 PRDs, 586 Markdown sources, 1,103 links, and no findings. See [closeout authority result](evidence/a4/prd-authority-closeout.json). The [earlier authority result](evidence/a4/prd-authority.json) is retained. |
| Changed-document hygiene | Pass: all seven changed documents have resolving links and no unresolved placeholders. Six pass scoped CLI path checks. The archive history path is outside that CLI content scope, so its paths were checked separately. `git diff --check` also passes. |

The [validation summary](evidence/a4/validation-results.json) records the completed checks. The full CLI run took 396.70 seconds. This is test execution duration, not product performance evidence. The completed run replaces the interrupted attempt, which produced no final verdict and supports no pass claim.

### P2 Testing Decisions

The product is an existing CLI at version 2.0.4. P2 is a new task-selection path in the local source candidate. Each decision below applies to that maturity and scope.

- Automated Implementation Testing: required for the P2 gate; pass. Decision informed: whether selection can close without changing contracts or allowing hidden calls. Reason now: server and CLI boundaries changed. Scope: profile validation, listing, hidden calls, shared contracts, access, writes, default stdio, and regression checks. Executor: Codex Desktop. Effort budget: one focused six-file run, one completed full suite at closeout, one type check, one build, seven stdio launches, one invalid-profile launch, and one help capture. Stop condition: an unresolved failure keeps P2 open. Evidence retained: A1 through A5, the completed full log, and the validation summary. Rerun trigger: a change to a tested source file, CLI argument handling, shared descriptors, or operation access. Reuse applies only while the source hashes match. The interrupted earlier full run is not accepted evidence.
- Performance Testing: `not-needed-now` for P2. Decision informed: no context or latency decision is part of this phase. Reason now: counts prove selection correctness, not speed or token savings. Scope and executor: no P2 measurement run. Gate effect: none for P2. Effort budget: zero measurement runs. Stop condition: do not start a benchmark during this closeout. Evidence retained: the tool counts and the [P4 work boundary](04-compatibility-and-evidence.md). Rerun trigger: P4 authorization or a new performance claim. Base maintenance action: `none` for P2 measurement assets. Performance applicability: `not-needed` at P2. No P2 target class, profile, or execution packet is created. P4 owns the existing bounded characterization candidate.
- Guided Progress Review: required for help and the host example; pass. Decision informed: whether a reader receives task names, valid choices, the default, and a recovery path. Reason now: P2 exposes a command and configuration choice. Scope: built help, actual invalid-profile output, the user example, and the maintainer contract. Executor: Codex Desktop as agent reviewer. Gate effect: a material wording or example mismatch keeps the affected P2 claim open. Effort budget: one review cycle over these four surfaces. Stop condition: record and repair a material mismatch before closure. Evidence retained: A2, A5, and the Human Experience Review below. Rerun trigger: help, errors, CLI grammar, or example arguments change. This review does not claim lived human acceptance.
- Unassisted Goal Testing: `not-needed-now`. Decision informed: no unresolved unassisted setup question blocks this local selection change. Reason now: tests and direct inspection answer the accepted choice and recovery questions. Scope and executor: no unassisted attempt or qualified human executor was selected. Gate effect: none. Effort budget: zero runs. Stop condition: do not create a scenario only to fill the testing record. Evidence retained: A1 through A5 and the review below. Rerun trigger: a later installed-host setup claim, a material discoverability finding, or explicit authority. No scenario or deferred obligation ID was created.

### P2 Human Experience Review

Reviewer: Codex Desktop. Impact: direct. Scope: the actual built CLI help and error, tool lists, and the documented host launch example. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) owns this agent review. It is separate from the four testing decisions.

| Promise | Observation | Conclusion, Limit, And Next Action |
| --- | --- | --- |
| Choose tools by the work to do. | Help gives each task group a short meaning. The user guide maps tasks to groups and gives a backlog launch entry. Actual lists match the reviewed assignment counts. | Satisfied for local command and example clarity. No installed host was configured. No further P2 action is needed. Later host-specific feedback can reopen this claim. |
| Understand an invalid choice and recover. | Actual stderr names the rejected value and all six allowed values. The process exits before startup with empty stdout. Help presents the same choices. | Satisfied for the tested invalid-name path. Tests cover other malformed CLI choices. This does not prove a human's reaction to the wording. No further P2 action is needed. |
| Keep the existing full connection. | The old `make-docs mcp` command and explicit `all` give equal tool lists and a shared read result. Help and the user guide state the default. The guide keeps the old JSON args valid. | Satisfied for local stdio tool compatibility. Native resources and installed host behavior remain outside this P2 claim. P3 and P4 own that proof. |
| Keep control over access and writes. | The guide states that profiles do not grant Store, project, or host access. It names the existing write permission. Tests keep visible calls on the prior target and operation checks. | Satisfied for the selected local adapter paths. The review does not qualify every installed permission environment. P4 owns the full parity package. |
| Put backlog work in one clear group. | `backlog` lists the snapshot and two review-cache tools. The guide names that purpose and gives the matching launch arguments. | Satisfied for the current three-tool seam. The two future app tools and app UI are absent. The separate Backlog Review package owns them. |

The review supports observable wording, structure, and behavior. It does not claim lived human ease, confidence, or acceptance. No explicit human acceptance gate applies. Optional feedback does not block closeout.

Optional experience handoff: run `node packages/cli/dist/index.js mcp --help` from this repo to view the help from the tested build. Choose the group that matches the task. Use the backlog example when the host needs backlog tools. The old command still chooses the full catalog. Feedback on the task names or example is optional.

### P2 Documentation Coverage

| Candidate | Verdict | Reason |
| --- | --- | --- |
| User guide, Persona `user` | Update-existing. | The CLI lifecycle guide owns command and setup guidance. Add task meanings, one backlog JSON host example, the old launch, and access limits. |
| Maintainer guide, Persona `maintainer` | Update-existing. | The CLI/MCP parity guide owns adapter contracts. Add factory and helper profile arguments, filtering boundaries, and preserved access behavior. |
| PRD 25, PRD 39, index, and risk register | None. | P2 implements existing profile-selection, default, and parity authority. It creates no new product rule or unresolved risk. |
| Design | None. | The accepted profile design still applies. No new architecture decision was made. |
| Plan overview | Update-existing. | Advance both handoffs to P3 after the P2 gate. Keep the phase order and later proof boundaries. |
| Work index and P2 phase | Update-existing. | Record tasks, A1 through A5, testing and review evidence, P2 status, and the next authorization boundary. |
| Central evidence | Update-existing. | Add the P2 report and keep P1 evidence intact. |
| Supporting P2 captures | Create. | Keep tests, build and source identity, stdio results, invalid-profile output, and help under the stable case folders. |
| History | Create. | One P2 checkpoint records the source change, guide updates, validation, and limits. |
| System contracts, prompts, references, and templates | None. | P2 changes adapter selection. It adds no agent workflow or shipped system-resource behavior. |
| Deterministic and agentic twins | None. | Profile validation and filtering are deterministic adapter work. They do not add a parallel agent workflow or independent business rule. |
| Native resource scope, HTTP, context, and latency proof | None for P2. | P3 and P4 retain these tasks. Do not claim them from tool counts or local stdio checks. |

### P2 Closeout And Limits

All four P2 tasks are complete. The focused and full implementation checks, built stdio checks, guide review, and document checks passed. No open P2 gap remains. P2 passes its phase gate.

The user authorized P2 closeout and a local commit on 2026-10-03 if there are no remaining issues. This report accompanies that closeout. No push, release, publication, or host configuration change is claimed.

P1 remains complete. The full W24 capability remains in progress. P3 is next and needs separate implementation authorization. These records are review evidence, not installation or Store state.
