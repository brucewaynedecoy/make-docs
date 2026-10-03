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
