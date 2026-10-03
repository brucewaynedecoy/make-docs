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

Current status: P1, P2, and P3 are complete. P4 has not started. W24 remains in progress. Each earlier phase section retains the state at its own closeout.

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

## W24 R0 P3: Resources And Transports

P3 is complete as of 2026-10-03. The baseline is `5e3cdd6142bd99cc585c3a3e18c5991c853e8044` on `w24-r0-mcp-tool-profiles`. The selected checks and agent review passed. The user authorized the P3 local commit on 2026-10-03. No commit hash is claimed before the commit exists.

Authority: [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [P3 work](03-resources-and-transports.md), and the [P3 plan](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/03-resources-and-transports.md). P1 and P2 evidence above remains unchanged.

### P3 Candidate And Scope

Stdio is selected. No supported-host need for HTTP is confirmed. P3 adds no HTTP adapter, listener, host setting, public endpoint, or app page. The W25 fixture proof remains bounded context at its named commit; it does not accept the new filtered-resource candidate.

The one root test run checked the candidate before the help-only correction. Its [source/build identity](evidence/p3/source-identity.json) and first A6–A10 captures remain as that earlier proof. Agent review found that help named tools but omitted native resources. Only three help strings in `packages/cli/src/cli.ts` changed after the full run. The final focused help check, build, and stdio replay passed. Use the captures with `-final` in their names for the final candidate. The [final source/build identity](evidence/p3/source-identity-final.json) records 19 changed source, test, catalog, schema, contract, and guide files plus 20 built JavaScript files. All these hashes stayed fixed during the final replay.

Shared P3 logs and source/build identity use `evidence/p3/`. New acceptance captures use `evidence/a6/` through `evidence/a10/`. No P1 or P2 capture is replaced.

### P3 Acceptance Evidence

| Case | Observable Claim | Current Evidence And Limit |
| --- | --- | --- |
| A6 | Explicit URI/profile metadata covers the complete system-provider inventory. Unknown, empty, duplicate, missing, and extra assignments fail. `all` is the exact union. | Passed. [Final metadata capture](evidence/a6/catalog-metadata-final.json) records 62 unique current URIs, explicit valid assignments, exact CLI inventory coverage, and the five-profile union. The [root test log](evidence/p3/full-tests.txt) includes the 33 resource metadata tests. |
| A7 | Allowed native reads retain bytes, media type, and provenance across profiles. CLI inventory/results and the existing core resource tools stay unchanged. | Passed. [Final allowed-read and CLI/core parity](evidence/a7/allowed-read-and-cli-parity-final.json) records 227 native reads: 62 `all` baseline reads and 165 cross-profile comparisons. [Canonical CLI list](evidence/a7/cli-resource-list-final.json) retains all 62 entries. Core resource tool reads can still read a URI hidden from the core native list. |
| A8 | Hidden native reads fail before resource resolution and return no bytes. The error names the profile and a list-based recovery path. | Passed. [Final denial capture](evidence/a8/native-denied-reads-final.json) records 19 hidden, unknown, or reserved UI reads with MCP code `-32602`, `resource-not-found`, the URI/profile, and recovery through `resources/list`. No read returned resource bytes. The [root log](evidence/p3/full-tests.txt) includes the 33 native boundary tests. |
| A9 | Default and all six named stdio profiles have exact resource lists. Default equals `all`; P2 tool counts remain unchanged. The reserved app UI remains absent from live lists and reads. | Passed. [Final built stdio capture](evidence/a9/stdio-results-final.json) and [summary](evidence/p3/stdio-proof-results-final.json) prove exact lists and shared tool contracts. Native counts are core 7, setup 7, workflow 48, quality 33, backlog 8, all/default 62. Tool counts remain 8, 15, 14, 9, 3, all/default 43. The historical W25 proof does not prove this candidate. |
| A10 | Real resource results, guide wording, errors, and help receive agent review. Source and dogfood contract bytes match. | Passed within local scope. [Agent review and guide hashes](evidence/a10/agent-review-final.json), [final help](evidence/a10/cli-help-final.txt), and [invalid profile](evidence/a10/cli-invalid-profile-final.json) agree with the final candidate. [Source/dogfood parity](evidence/a10/source-dogfood-parity.json) proves exact catalog, schema, and contract bytes. The [earlier contract check](evidence/a10/contract-parity.json) is historical; [final contract check](evidence/a10/contract-parity-final.json) names the corrected guard. |

### P3 Validation Results

| Check | Actual Result | Retained Evidence And Limit |
| --- | --- | --- |
| TypeScript | Passed, exit 0. | [Type check log](evidence/p3/typescript.txt). This preceded the three static help-string changes. |
| Initial CLI build | Passed, exit 0. | [Build log](evidence/p3/build.txt). This build supplied the pre-help proof. |
| Shipped defaults | Passed, 3 files and 53 tests. | [Defaults log](evidence/p3/defaults.txt), including consistency, template links, and package safety. Source resource bytes did not change after this check. |
| One root test run | Passed, exit 0. 19 smoke tests and 1648 CLI tests passed; 5 existing CLI tests were skipped. 98 CLI files passed and 1 was skipped. CLI duration was 325.27 seconds. | [Complete root log](evidence/p3/full-tests.txt) and [check results](evidence/p3/validation-results.json). This run preceded the help-only correction. It is not a claim that the root suite ran twice. |
| Final help/profile check and rebuild | Passed, 27 tests; build exit 0. | [Final help tests](evidence/p3/help-tests-final.txt), [final build](evidence/p3/build-final.txt), and [results](evidence/p3/help-validation-final.json). These cover the final help strings. |
| Final built stdio replay | Passed, seven launches, 227 native reads, 165 cross-profile comparisons, and 19 denied reads. | [Final summary](evidence/p3/stdio-proof-results-final.json), A6–A10 captures, and [replay script](evidence/p3/stdio-proof.mjs). This is local build proof. No host setup or HTTP listener was used. |
| Current PRD authority | Passed, 35 PRDs, 586 Markdown sources, and 1103 links; no diagnostics. | [Final authority result](evidence/p3/prd-authority-final.json). No PRD requirement changed. |

### P3 Testing Decisions

Maturity: local implementation candidate for the existing CLI. Executor: Codex Desktop unless a worker's retained result names another executor. Claims remain within source and local build scope.

- Automated Implementation Testing: required and passed. Decision informed: whether metadata, native filtering, preserved resource contracts, and stdio behavior work together. Reason now: catalog and adapter rules changed. Scope: A6 through A9, provider validation, source tests, CLI/core parity, default replay, and unready UI absence. Gate effect: an unresolved failure keeps the affected P3 claim open. Effort budget: worker-owned focused checks, one coordinated type check, one initial CLI build and defaults check, one root test run, and one initial replay with seven stdio launches. Agent review found the help gap. Its three-string fix triggered only the affected 27 help tests, a final build, and a final seven-launch replay. Stop condition: stop broad checks on a failure and report the affected check before repeating it. Evidence retained: the validation table, case captures, shared logs, and source/build hashes. Rerun trigger: a relevant source, catalog, schema, resource byte, dependency, or build change. Current result: all selected checks passed within the recorded pre-help and final-candidate limits.
- Performance Testing: `not-needed-now` for P3. Decision informed: no performance decision is part of this phase. Reason now: list counts and byte equality prove correctness, not latency or model context savings. Scope and executor: no measurement run. Gate effect: none for P3. Effort budget: zero benchmarks. Stop condition: do not start performance work here. Evidence retained: the [P4 boundary](04-compatibility-and-evidence.md). Rerun trigger: P4 authorization or a new performance claim. Base maintenance action: `none` for P3 measurement assets. Performance applicability: `not-needed` at P3. No P3 measurement profile or execution packet is created.
- Guided Progress Review: completed. Decision informed: whether resource group meanings, denial recovery, guide instructions, and help agree. Reason now: native exposure changes what the host can show and open. Scope: actual lists, allowed reads, denied-read errors, both updated guides, and built help. Executor: Codex Desktop as agent reviewer. Gate effect: a material mismatch keeps the affected claim open; no human-response gate applies. Effort budget: one review cycle, plus a focused repeat for the help gap it found. Stop condition: retain a material gap and stop an unqualified completion claim. Evidence retained: A8 through A10 and the review below. Rerun trigger: assignment meanings, denial wording, help, launch grammar, or guide instructions change. Current result: final lists, errors, help, and guide instructions agree. No lived-human reaction is claimed.
- Unassisted Goal Testing: `not-needed-now`. Decision informed: no unresolved unassisted setup question blocks this bounded adapter change. Reason now: source checks, wire comparisons, and agent review can answer the accepted resource questions. Scope and executor: no scenario, human executor, or unassisted attempt is selected. Gate effect: none. Effort budget: zero runs. Stop condition: do not create a scenario only to fill this record. Evidence retained: the acceptance results and review when available. Rerun trigger: a material host setup/discoverability finding or explicit current authority. No obligation or scenario ID is created.

### P3 Human Experience Review

Reviewer: Codex Desktop. Impact: direct. The review used actual final native lists, allowed reads, denied-read errors, both guide updates, and built help. The [retained review](evidence/a10/agent-review-final.json) records inputs and final guide hashes. This review is separate from the four testing decisions. No owner-response gate applies.

| Promise | Observed Result | Conclusion, Limit, And Next Action |
| --- | --- | --- |
| A profile shows resources for its task. | Exact URI lists match the explicit catalog. Core and setup each expose 7 entries; 6 are shared. Workflow exposes planning and execution resources; quality exposes validation resources; backlog exposes work and review resources. | `satisfied` for the assigned local lists. URI names identify each resource type and name. P4 owns wider host integration and compatibility review. |
| An allowed read preserves content and source data. | The 62 `all` reads form the baseline. All 165 cross-profile reads match its bytes, media type, and provenance. CLI/core tool comparisons also match. | `satisfied` for the local candidate. No claim is made about a person's lived ease or trust. Rerun if bytes or source resolution change. |
| A denied read gives a clear next step without content. | All 19 denied reads identify the URI and profile and advise a URI from `resources/list`. No resource bytes are returned. | `satisfied` for the denial rule and recovery path. SDK error text includes protocol prefixes; the reason and recovery remain clear. Rerun if error conversion changes. |
| Launch and help explain the selected scope. | The first help described tools only. The final help names native resources and states that lists/reads use the profile. The 27 focused tests and final built capture passed. | The earlier `material gap` is resolved. `satisfied` for the final local help/guide agreement. No installed-host setup was tested. |
| The app page remains with its app owner. | The reserved UI URI is absent from all live lists and all reads fail. Both guides state that the app page is unavailable until its package lands. | `satisfied` for the P3 reservation boundary. W25 owns page registration, rendering, and its app acceptance. The future page outcome is not a current P3 completion claim. |
| Context savings remain bounded by host behavior. | Both guides say the host must connect profiles as needed or defer definitions. `defaultExposure` is advice and cannot force deferred loading. | `satisfied` for the stated limit. No model context or performance saving was measured. P4 owns that evidence. |

### P3 Documentation And Twin Coverage

| Candidate | Verdict | Reason And Current State |
| --- | --- | --- |
| User guide, Persona `user` | Update-existing. | The CLI lifecycle guide owns task selection and launch guidance. It explains native resource filtering, denial, unchanged common resource tools, reserved app availability, stdio, and host context limits. Actual results agree. |
| Maintainer guide, Persona `maintainer` | Update-existing. | The CLI/MCP parity guide owns adapter contracts. It explains explicit catalog metadata, strict checks at native list/read boundaries, CLI-only fixture compatibility, preserved bytes/provenance and access, host context limits, and the future app boundary. |
| System-resource contract | Update-existing. | Native MCP metadata and validation rules were added upstream. Exact dogfood catalog, schema, and contract copies match. Defaults and runtime checks passed. No new reference or prompt was added. |
| Resource reference, prompt, or new workflow | None. | The existing contract owns the reusable rule. There is no resource-specific reference to update, and no new agent workflow is needed. |
| Deterministic/agentic twin review | Update-existing. | The resource contract carries authoring and manual-check rules that match deterministic metadata validation. Native transport filtering stays deterministic adapter work. No second algorithm, workflow, or permission system is added. |
| Current PRD authority | None. | P3 implements the accepted profile and preserved-resource requirements. No new product rule or app availability claim is introduced. |
| P3 work and central evidence | Update-existing. | Record complete P3 tasks, conditional HTTP not-needed dispositions, actual results, and their limits. Keep W24 in progress. |
| Acceptance captures and shared proof logs | Create. | Retain only observed results. A6–A10 hold case captures. `evidence/p3/` holds full logs, check results, tested identity, and the reusable stdio script. Earlier pre-help captures remain with their stated scope. |
| P3 closeout history | Create. | One [phase history record](../../../.make-docs/archive/history/2026-10-03-w24-r0-p3-mcp-tool-profiles.md) records the change and evidence limits. No earlier history record is rewritten. |
| Work index and plan handoff | Update-existing. | P1–P3 are complete. P4 preflight and implementation need separate authority. W24 stays incomplete. |

### P3 Closeout And Limits

Implementation, selected validation, coverage, and agent review are complete. The root suite preceded the three help-string corrections. Focused help tests, the final build, the final stdio replay, and agent review cover those corrections. The final source/build hashes still match. This closeout changed only phase records and history. No runtime test was repeated for these document changes.

The user authorized the P3 local commit on 2026-10-03. P3 is complete. HTTP tasks are disposed as not-needed because no supported-host need is confirmed. Stdio is the completed transport claim. This record claims no commit hash, push, release, fresh installed-host acceptance, or app completion. P4 preflight is next under separate authority. P4 implementation also needs separate authority. W24 remains incomplete.

Closeout document checks are retained in the [scoped check record](evidence/p3/doc-checks-closeout.json) and [PRD authority result](evidence/p3/prd-authority-closeout.json). The earlier implementation captures remain unchanged.

Optional experience handoff: inspect the final native URI lists in A9 and run `node packages/cli/dist/index.js mcp --help` for the tested launch guidance. No response is required.
