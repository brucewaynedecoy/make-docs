---
title: "W25 R0 Live Backlog Review Evidence"
kind: "reference"
status: "active"
coordinate: "W25 R0"
---

# W25 R0 Live Backlog Review Evidence

## Current Findings

P1 is closed for source contracts. The user authorized closeout and a local commit on 2026-09-30. At the pre-commit checkpoint, its 41 new contract tests and 76 existing backlog tests passed. Type checks and all 53 repository default checks passed. Final code review found no material gap. The agent wording review supports consent and fallback within P1 scope. The owner's optional wording feedback was “Clear; no change”.

P1 is source-level contract evidence. P2 is now complete as a bounded source and real-host proof. Claude Desktop `2.16120.0` displayed the versioned test resource through stdio. One page tool action and one fixed message reached their observed results. The missing-bridge fallback was clear. Temporary host setup was restored. The result does not establish installed Skill parity, a production live Backlog Review, broad host support, or task creation. The owner's optional P2 review was not supplied and does not block completion.

The user separately authorized P3 implementation on 2026-09-30. Its tested source checkpoint uses the same branch after P2 commit `0c112e57`. The user then authorized P3 closeout and a local commit on that date. P3 is closed for shared source integration. These records belong to the P3 phase closeout commit. All 147 affected tests, 53 default checks, and the type check pass. Final mixed, small, limited, and large output comparisons preserve report meaning and accepted layout. Required agent review finds no material gap within the local browser limit. The owner's optional feedback was “Clear; no change” on an earlier generated sample. No production live widget or new browser review is claimed.

The user separately authorized P4 implementation on 2026-10-04 after accepted W24 authority was merged at `26bdf1ce`. Its tested source checkpoint uses the current branch, based on `bdd21481`. The user then authorized P4 closeout and a local commit on 2026-10-04, including staging the reviewed P4 file set. P4 is closed for source tool/resource integration and useful no-UI output. These records belong to the phase closeout commit. Tasks t1-t6 and A25-A32 pass. The selected evidence covers 541 unique cases across bounded runs, type and build checks, asset drift checks, and independent output review. Required agent Human Experience Review found no material gap within that scope. Full product widget and host behavior remain P5-P7 work. P5 is next eligible and needs separate implementation authority.

The user separately authorized P5 preflight fixes and implementation on 2026-10-04. Its tested pre-commit checkpoint is based on P4 commit `19c19f42d90d836ed7c1a5e23f7abf1230bee1c2` on the same branch. On 2026-10-06, the owner approved the live footer remedy and five labels, then separately asked to close P5 and commit it. P5 is closed within source and finite browser scope. t1-t6/A33-A40, the repaired 73-record changed result, required agent review, and 405 unique selected cases across finite runs support the closeout. These records belong to the P5 phase closeout commit. Root owns staging and the local commit. P6/P7, installation, Store/host changes, branch changes, push, publication, and release remain outside this authority.

## P1 Tested State

- Date: 2026-09-30.
- Revision: explicit pre-commit checkpoint. Tests ran against the uncommitted working tree on `w25-r0-p1-live-delivery-contract`, based on `0ed2501d`. This identifies the tested source before the authorized local commit.
- Environment: local Make Docs maintainer checkout. The tests used the workspace npm runner, Vitest, and TypeScript. Document checks used the available `make-docs` CLI.
- Result: pure schema and helper definitions in [live-contracts.ts](../../../packages/cli/src/operations/work/backlog/live-contracts.ts), with source Skill references and PRD 51 updates.
- Reviewer: Codex contract agent for code checks; Codex source-guide agent for documents and Human Experience Review.
- Identity limit: no new package build, release, or installed-output identity was established. The checks cover the edited source tree.
- Authority: [P1 work record](01-authority-and-live-delivery-contract.md), [P1 plan](../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/01-authority-and-live-delivery-contract.md), and [PRD 51](../../prd/51-backlog-review-and-reporting.md).

## P1 Checks

| Check | Command | Observed result |
| --- | --- | --- |
| New live contracts | `npm test -w packages/cli -- --run tests/backlog-live-contract.test.ts` | Final affected rerun: 41 tests passed in one file. Duration: 1.99 s. This run supports the current source. |
| Existing contracts, Skill, and cache | `npm test -w packages/cli -- --run tests/backlog-contract.test.ts tests/backlog-review-skill.test.ts tests/backlog-cache.test.ts` | 76 tests passed in three files. Contract: 55. Skill: 14. Cache: 7. Duration: 2.77 s. |
| Final source-guide check | `npm test -w packages/cli -- --run tests/backlog-review-skill.test.ts` | 14 tests passed in one file after the final delivery-reference edit. Duration: 1.13 s. This rerun does not add to the 76 unique existing tests. |
| Type checks | `./node_modules/.bin/tsc --noEmit -p packages/cli/tsconfig.json` | Exit 0. No diagnostics. |
| Repository defaults | `npm run validate:defaults` | Final rerun passed all 53 tests in three files. Consistency: 38. Template links: 12. Package safety: 3. Duration: 1.70 s. |
| PRD authority | `make-docs run prd authority validate --target-root .` | Passed. 35 PRDs, 586 Markdown files, and 1,103 links scanned. No diagnostics. |
| Selected path hygiene | Exact command below. | Final closeout check passed for 11 selected files. No findings or writes. |
| New section links | `jdocmunch.get_broken_links` after a current incremental index | No broken link in the changed P1 work, evidence, history, PRD 51, source references, or new D-044 section. The scan covered 1,790 indexed documents and 24,728 sections. |
| Diff whitespace | `git diff --check` | Exit 0 at closeout. |

The new suite is [backlog-live-contract.test.ts](../../../packages/cli/tests/backlog-live-contract.test.ts). The existing suites are [backlog-contract.test.ts](../../../packages/cli/tests/backlog-contract.test.ts), [backlog-review-skill.test.ts](../../../packages/cli/tests/backlog-review-skill.test.ts), and [backlog-cache.test.ts](../../../packages/cli/tests/backlog-cache.test.ts).

Run the final path check from the project root:

```sh
make-docs project path-hygiene validate --target-root . \
  --path docs/prd/03-open-questions-and-risk-register.md \
  --path docs/prd/51-backlog-review-and-reporting.md \
  --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md \
  --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/01-authority-and-live-delivery-contract.md \
  --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md \
  --path packages/skills/backlog-review/references \
  --format text
```

The content path checker rejects an explicit archive-history path with `Invalid content path`. It exited 2 when that history file was added to the selection. The final passing command excludes it. The agent checked the history record's paths and links through the current document index. Its links resolve and its source uses relative repository paths. The link scan's conclusion is limited to the new and edited P1 sections. Older retired-PRD links in unchanged risk-register sections were not repaired by P1.

The first `validate:defaults` run passed 52 checks and failed one consistency check. D-044 quoted a retired resource-path form in the active risk register. The source-guide agent removed those literals. The note links the unchanged local router for exact old text. No test exemption or installed change was used. The final rerun passed all 53 checks.

## P1 Acceptance Cases

These findings use the final contract fixtures, code review, and current source guidance. All eight cases pass within P1 scope. No live-runtime claim is made.

| Case | Claim and observed evidence | Supported conclusion and limit |
| --- | --- | --- |
| A1 | The delivery contract selects live when all three required capabilities are true. Missing separate-task support remains optional. | Fixture-level selection is supported. A real host capability exchange belongs to P2. |
| A2 | Explicit static intent selects the static route. Source instructions keep path and replacement consent with the existing renderer. | The contract creates no file. The existing static renderer remains the file surface. Live integration must preserve the guard. |
| A3 | Missing required capability selects chat fallback. The source review method explains how to complete the chat review and offer static output. | Fallback selection and its required meaning are covered. No running host fallback was tested. |
| A4 | Each request returns one delivery route. Static intent has explicit priority. | The contract does not select both modes. Runtime wiring remains later work. |
| A5 | Wave actions carry project, snapshot, model, session, path, and sourced coordinate. They resolve against the reviewed model and current facts. | Exact-reference rules are covered by the new suite. The active agent and host are not invoked by P1. |
| A6 | Stale identities, missing records, coordinate conflicts, and ambiguous references fail before an action. Guidance names refresh and a new current reference as recovery. | Rejection and recovery meaning are supported at contract level. No host side effect was tested. |
| A7 | Strict action schemas reject unknown action and instruction fields. Source text remains display data. | The new contract and existing Skill suites support the trust boundary. Future UI code must keep safe rendering. |
| A8 | The source-guide agent inspected delivery, action, refresh, cache, natural-limit text, and the unchanged Skill entry point. The contract agent completed code review. The owner gave optional feedback on three limit scenarios. | Both agent reviews and the limited owner feedback support P1 wording. The Skill still defaults to chat until later live integration. No running host or UI is proved. |

Refresh fixtures also cover unchanged generation timestamps, changed source facts, exact added, changed, and removed paths, source failure, and the prior model's review state. They reject a tampered change list. They reject `store-not-configured`, `store-unavailable`, `store-unsafe`, and `store-denied` as source-failure reasons. V1 report and cache regression tests still pass. These checks support compatibility and Store-free contracts. They do not prove later live cache integration.

## P1 Agent Human Experience Review

Authority: [PRD 49](../../prd/49-human-experience-standard-and-intent.md), [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md), and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md). Reviewer: Codex source-guide agent. Review date: 2026-09-30.

The actual surface reviewed is the edited source guidance. The agent read the delivery, action, identity, refresh, cache, and error sections. It also read the unchanged [Skill entry point](../../../packages/skills/backlog-review/SKILL.md). It compared these with the accepted design promises and available fixture results. It did not inspect a running live widget. The reference marks live selection as a contract for later integration. The current chat flow and explicit-static behavior remain valid until that integration exists.

| Promise | Observation | Conclusion | Limit and next useful action |
| --- | --- | --- | --- |
| One clear default | [Review method](../../../packages/skills/backlog-review/references/review-method.md#select-one-delivery-route) gives an ordered choice and names the three required capabilities. It states that route selection is not display success. | `satisfied` for the P1 delivery definition. | P2 must prove the actual host path. |
| Direct control of saved files | The delivery guidance requires an explicit request. The [HTML reference](../../../packages/skills/backlog-review/references/html-report.md) retains output-path and replacement consent. A failed live open creates no file. | `satisfied` for consent wording and contract selection. | Later delivery wiring must preserve the same guard. |
| Safe chat fallback | The limit examples explain the effect, known data, and optional static request. They keep source failure separate from UI failure. | `satisfied` for fallback meaning. | Later host tests must exercise failed live delivery. |
| Exact, controlled agent requests | [Report model guidance](../../../packages/skills/backlog-review/references/report-model.md#fixed-live-actions) lists fixed fields. It rejects text-derived instructions and failed references. Task creation stays with the active agent and host. | `satisfied` for P1 action rules. | Later phases must verify a real user action and the reported host result. |
| Clear refresh state | The refresh table separates `current`, `needs-review`, and `last-known`. A changed result keeps the prior review with a visible limit. A source failure gives a retry route. | `satisfied` for P1 refresh meaning. | P6 must prove visible refresh and review behavior. |
| Store-free current review | [Cache guidance](../../../packages/skills/backlog-review/references/cache.md) says reuse is optional. It preserves the existing cache rules and current snapshot after Store failure. | `satisfied` for the documented boundary. | Later live integration must keep cache failure separate from source failure. |
| Honest phase state | Guidance says the pure definitions exist and live integration remains planned. No section claims that P1 mounted an app or created a task. | `satisfied` for source-level completion language. | Keep future completion claims within host and package evidence. |

No broad human-outcome or live-behavior acceptance is inferred. The owner supplied feedback on three wording scenarios only. No material wording gap remains in the agent review. Final contract review supports the P1 correctness claim.

## P1 Testing Decisions

Automated Implementation Testing informs the P1 correctness and compatibility claim. The product is at contract-definition maturity. The scope is the new suite, the three affected backlog suites, type checks, and document checks. Codex runs the checks. The gate effect is `blocking-claim-only`. The budget is one focused pass, then only affected reruns after a failure or material edit. Stop when those checks pass and review finds no material gap. Retain results in this report. A material contract or source-guide change triggers an affected rerun.

Performance Testing is `not-needed-now`. P1 does not run the live path or establish a speed claim. No performance profile or run is created.

Guided Progress Review is advisory. The decision was whether the consent and fallback wording needed a small correction. The surface was three wording scenarios before a live app exists. The owner was the optional executor. The budget was one short reading exercise. The result is `feedback-recorded`: “Clear; no change”. This supports the reviewed wording only. No further wording run is needed. A material wording change can trigger another optional review. It does not block P1 or create an obligation.

Unassisted Goal Testing is `not-needed-now`. P1 does not claim independent use or discoverability. No scenario or deferred obligation is created. Human Experience Review remains required agent work, separate from the four testing types.

## P1 Optional Experience Handoff

The small goal is to understand when a review can create a file or ask for a separate task.

1. Read [Select one delivery route](../../../packages/skills/backlog-review/references/review-method.md#select-one-delivery-route). Notice that missing live support does not create a saved file.
2. Read [Explain errors and limits](../../../packages/skills/backlog-review/references/review-method.md#explain-errors-and-limits). Notice that each limit gives an effect and a next action.
3. Read [Keep agent requests controlled](../../../packages/skills/backlog-review/references/review-method.md#keep-agent-requests-controlled). Notice that task creation needs a direct request and a real host result.

Feedback is optional. No response was required for P1 closure. No cleanup or setup was needed. On 2026-09-30, the owner answered “Clear; no change” for these offered scenarios: live failure completes review in chat; a saved report requires a direct request; an unsupported task host states that no task was created. Record this as `feedback-recorded`, with advisory effect. It is wording evidence, not live host or UI proof. No decline is inferred.

## P1 Coverage Decisions

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Source Skill delivery, identity, action, refresh, and limit guidance | `update-existing` | The existing source references own these rules. Installed Skill copies are outside P1. |
| Source Skill entry point | `none` | Its chat review and explicit-static path are current. The updated reference clearly marks live selection as a contract for later integration. No runtime rewrite is part of P1. |
| Maintainer and user guides | `none` | P1 adds definitions and source Skill guidance. It adds no new runnable public flow that needs a separate audience guide. |
| System assets and local setup | `none` | P1 adds no system resource or installation change. Preserve the upstream-first boundary. |
| PRD 51 | `update-existing` | It owns current delivery and live contracts. Current rules are inline. Prior contract detail is non-normative history. |
| PRD index | `none` | PRD 51 remains the current capability owner. Its existing row and navigation remain accurate. |
| Risk register | `update-existing` | D-044 records the local nested history-router mismatch. It does not claim a package failure or reopen prior proof. |
| Central evidence | `create` | The backlog retains acceptance and agent review findings. This report explains their meaning and limits. |
| Phase history | `create` | The [P1 history record](../../../.make-docs/archive/history/2026-09-30-w25-r0-p1-live-delivery-contract.md) gives one concise project breadcrumb. |

## P1 Follow-Up Limits

[D-044](../../prd/03-open-questions-and-risk-register.md#d-044-local-history-router-gives-retired-paths) records a local nested history router that still gives retired paths. P1 uses the current history contract. Ownership and source checks must precede a separately authorized repair. The installed router is unchanged.

At the implementation checkpoint, no staging, commit, push, installation, publication, or release had been performed. On 2026-09-30, the user authorized P1 closeout, staging of the reviewed P1 file set, and a local commit. All six P1 tasks and A1-A8 have evidence. P1 is closed for source contracts. P2 and later phases, push, installation, publication, and release remain outside that authority. This record does not claim that the local commit has already been created.

## P2 Current Evidence

P2 is closed as a bounded source and real-host proof. The user authorized P2 implementation and the temporary host test on 2026-09-30. The user then authorized P2 closeout and commit. Tests ran on the P2 source checkpoint on `w25-r0-p1-live-delivery-contract`, based on P1 commit `2a8fc509`. This change set retains that source and the closeout records. No installed package identity or production live delivery is claimed.

Claude Desktop `2.16120.0` displayed `ui://make-docs/host-proof/v1.html` through the local stdio fixture in the [synthetic proof chat](https://claude.ai/chat/fda7239e-e302-48d9-b005-3d06a38f8932). The [fixture launcher](../../../packages/cli/tests/fixtures/mcp-app-proof-stdio.ts) was also verified from outside the project folder. The test used only synthetic data. It did not read project or Store data.

The initial `tools/call` request was ID 3 at `2026-09-30T15:50:03.060Z`. The host then made `resources/read` request ID 4 at `15:50:03.732Z`. One press of the read button made `tools/call` request ID 5 at `15:50:37.278Z`. The page retained the valid bounded result. The observed capability facts were `protocolVersion: 2026-01-26`, `appResource: true`, `toolCalls: true`, `agentMessages: true`, and `separateTasks: unknown`. The required capabilities were available. Optional task support was not established.

The proof tool was `make_docs_mcp_app_proof` with `{}` input. The controlled message was: “W25 R0 P2 proof: confirm this fixed message reached the active conversation. No task is requested.” One press of the fixed-message button returned host acceptance and placed that exact text in the composer with a host caution cue. The host-proof agent then used the already-approved Send action. Message 3 of 4 contains the exact text. Message 4 confirms receipt in that conversation and reports no task, tool use, or file write. A successful `ui/message` result proves host acceptance of the draft here. Visible chat receipt after Send supports actual delivery.

The hostile sample displayed literal image markup, an instruction to ignore prior rules and start a task, and `${process.env.HOME}`. No active image or instruction execution was observed. The [host capture](evidence/a9/claude-host-proof.png) shows the literal sample and the fixed message with its receipt. The source-guide agent inspected the capture before retaining it. It contains only the synthetic test; the unrelated sidebar is hidden.

The same proof HTML was served on loopback for a browser absence check. This was a page check, not an HTTP MCP adapter. Without a parent bridge, it showed: “This page has no MCP Apps host bridge. Continue the review in chat. No task was created.” It showed unknown capabilities, disabled actions, no tool result, and no message sent. The [fallback capture](evidence/a14/chat-fallback.jpg) is readable at a normal 1,280-pixel viewport. The Claude widget had a fixed 200-pixel height and inner scrolling. P5 must adapt the product layout to host space.

Cleanup is complete. The host-proof agent quit Claude fully, removed the exact temporary entry, and restored the original settings bytes. Before and after relaunch, the prior server configuration matched the original and the proof entry was absent. The proof log records intentional shutdown at `2026-09-30T16:00:49.786Z`, with client and server transport closure. The loopback server was stopped and the fallback tab was closed. The retained synthetic chat and captures are evidence; the temporary connection is not active.

## P2 Checks

| Check | Exact command or evidence | Observed result and limit |
| --- | --- | --- |
| MCP App and shared regressions | `npm exec --workspace packages/cli -- vitest run tests/mcp-app-contract.test.ts tests/mcp.test.ts tests/p3-operation-surfaces.test.ts tests/p8-runtime-retirement.test.ts` | 66 tests passed: 27 new contract cases, 6 MCP cases, 8 operation-surface cases, and 25 runtime-retirement cases. This covers source and protocol behavior. |
| Type checks | `npm exec --workspace packages/cli -- tsc --noEmit` | Passed. |
| Repository defaults | `npm run validate:defaults --workspace packages/cli` | 53 tests passed. |
| Source Backlog guidance | `npm exec --workspace packages/cli -- vitest run tests/backlog-review-skill.test.ts` | Final affected rerun after the host-limit wording: 14 tests passed in one file. Duration: 5.87 s. |
| Package boundary | Host-proof agent's package dry-run | 139 package paths. Test and proof assets were excluded. No install was tested. |
| Real host | [Host capture](evidence/a9/claude-host-proof.png), synthetic chat, and request observations above | Resource, one page tool action, and the fixed message were observed in one selected host. |
| Missing bridge | [Fallback capture](evidence/a14/chat-fallback.jpg) from the same HTML | Clear chat fallback, unknown capabilities, and disabled actions. No HTTP MCP support claim. |
| Cleanup | Host-proof agent's settings comparison and shutdown log | Temporary connection removed. Prior setup restored. Test server and fallback tab closed. |
| PRD authority | `make-docs run prd authority validate --target-root .` | Passed: 35 PRDs, 586 Markdown files, and 1,103 links scanned. No diagnostics. This default scan does not replace the explicit evidence and history checks. |
| Selected content paths | Exact command below | Five Markdown files passed with zero findings or writes. The explicit archive-history selection is rejected by this checker. |
| Current document links | `jdocmunch.get_broken_links` after the final incremental index | 1,792 documents and 24,748 sections scanned. Zero broken links in all six changed Markdown files, including history and both capture targets. The conclusion is limited to those files. |
| Diff whitespace | `git diff --check` | Exit 0 at final closeout. |

Code and live observations were made by the Codex host-proof agent. The Codex source-guide agent inspected the retained captures and their wording. The [new contract suite](../../../packages/cli/tests/mcp-app-contract.test.ts) covers strict resource and bridge rules, typed missing-capability and unsupported-transport results, capability facts without host-name selection, and the unchanged P1 route choice.

## P2 Acceptance Cases

All eight cases pass within the bounded fixture scope. The result applies to the selected source, Claude version, stdio path, and captured fallback. It establishes no production Backlog Review, broad host support, or W24 profile acceptance.

| Case | Observation | Supported conclusion and limit |
| --- | --- | --- |
| A9 | Claude displayed the versioned resource after `resources/read` ID 4. The capture shows the app in its tool result. | One compatible host can display this resource through stdio. Production delivery remains later work. |
| A10 | The initial result and the read-button result were valid. One button press produced `tools/call` ID 5. The widget retained and displayed the bounded result. | The page tool path works for this fixture. No project read was tested. |
| A11 | `ui/message` created a host-accepted draft. The approved Send action placed the fixed text in message 3. Message 4 confirms receipt. | The fixed message reached the active conversation after host Send. Host acceptance alone is not a delivery receipt. |
| A12 | Hostile markup and instructions remained visible text. The outgoing message stayed fixed. No active image or instruction execution was observed. | The fixture keeps this hostile sample inert. Production rendering must preserve the same boundary. |
| A13 | The suite selects from capability facts and checks P1 route parity. The host supplied three required true facts and unknown optional task support. | Selection uses capability facts. A host product name is not a selection rule. |
| A14 | The actual no-bridge page gave chat fallback and disabled actions. Strict fixtures cover missing support and unsupported transport results. | Absent support has a typed result and a useful visible fallback. Streamable HTTP was not proved or needed. |
| A15 | The existing SDK registry, core, and native handlers remain in use. The default factory has no proof tool or UI extension. The generic validated static-resource seam is shared. The proof registration remains in test fixtures and is excluded from the 139-path package dry-run. | No parallel registry, permission model, or business-logic path was introduced. Test-only proof surfaces are not shipped. |
| A16 | The required host run and the agent review below inspect open, action, message control, safe data, and fallback. | Required evidence supports this maintainer proof. Optional owner feedback is advisory and was not supplied. |

## P2 Document Checks

The source-guide agent read the current P2 work and plan, PRD 50 review rules, lifecycle build guidance, execution workflow, coverage contract, source Backlog guidance, and the maintainer MCP guide before editing. The agent preserved t1-t6 and A9-A16. All six tasks now have evidence.

The selected content path check passed for the five changed Markdown files. The final link check also passed for this phase's history and new capture links. The agent checked the history's required headings, tables, coordinate, and relative paths against the current history contract. These checks establish document hygiene, not package or host behavior. Run the selected path check from the project root:

```sh
make-docs project path-hygiene validate --target-root . \
  --path docs/assets/maintainer/cli-mcp-operation-parity-and-permissions.md \
  --path packages/skills/backlog-review/references/review-method.md \
  --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md \
  --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/02-host-and-transport-proof.md \
  --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md \
  --format text
```

Adding `--path .make-docs/archive/history/2026-09-30-w25-r0-p2-host-and-transport-proof.md` before `--format text` in that command exited 2 with `Invalid content path`. The content path checker does not accept an explicit archive-history path. The agent used the current document index to check the new history record's relative links. This follows the known [D-044 limit](../../prd/03-open-questions-and-risk-register.md#d-044-local-history-router-gives-retired-paths). Installed routers remain unchanged.

## P2 Agent Human Experience Review

Reviewer: Codex source-guide agent, with live observations from the Codex host-proof agent. Date: 2026-09-30. Surface: the actual Claude resource and chat capture, no-bridge capture, source guidance, protocol results, and cleanup findings. The source-guide agent inspected both unedited captures. [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md) keeps owner feedback advisory. The [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md) requires this agent review.

| Promise | Observation | Conclusion | Limit and next useful action |
| --- | --- | --- | --- |
| Visible open state | The resource is visible inside Claude's tool result. The host read the versioned resource. | `satisfied` for one bounded real-host open. | The proof is a maintainer surface. P3-P5 must connect production report delivery and layout. |
| Controlled tool action | One read-button press caused the observed read-only call. The valid synthetic result remained in the page. | `satisfied` for the bounded tool path. | P4 must provide the accepted production operations. |
| Exact message and direct control | The capture shows the exact sent message and receipt. The live run first produced a host draft, then used the approved Send action. | `satisfied` for this fixed message flow. | P6 must retain host control and wait for a real receipt before claiming delivery. |
| Inert project-like text | The capture shows markup, hostile instructions, and a variable expression as literal text. The message did not copy them. | `satisfied` for the synthetic trust check. | Later report rendering must keep project text as data. |
| Useful unavailable state | The fallback capture states the effect and next action. It shows disabled actions, no result, and no message. | `satisfied` for missing-bridge fallback. | Later live integration must complete the current chat review and preserve explicit consent for a saved report. |
| Readable result within host limits | The normal browser capture is readable. Claude uses a 200-pixel inner viewport with scrolling. | `satisfied` for the technical proof; product layout evidence remains limited. | P5 must adapt layout and controls to the available host space. This proof does not accept the product UI. |
| Honest scope and review control | Guidance states the tested host limit, future integration, and draft/Send distinction. Owner review remains advisory. | `satisfied` for completion and consent wording. | Keep later support claims within actual evidence. No owner response gate is added. |

No material gap remains for the bounded P2 claim. This review does not infer the owner's experience or independent-use success. The known layout limit is owned by planned P5 work.

## P2 Testing Decisions

Automated Implementation Testing and the required real-host proof inform the P2 source correctness and selected-host claim. Product maturity is a maintainer proof before production integration. Scope is one resource, safe data, one page tool call, one fixed message, missing bridge, capability facts, and stdio. The host-proof agent is the executor. Gate effect is `blocking-claim-only`. The finite budget was the focused suite, affected shared checks, one resource open, one read-button action, one fixed-message action with approved host Send, and one fallback check. Stop after passing evidence and setup restoration. Retain the results here. A material change or failed check triggers an affected rerun.

Performance Testing is `not-needed-now`. No product speed claim is made. No profile or run is created.

Guided Progress Review is advisory. The decision is whether the open, message, and fallback words need a small change. The executor is the optional owner. The surface is the retained proof and its limit wording. The budget is one short three-step review. The owner was offered the review and had more than 60 seconds to reply. Result: `not supplied; advisory; does not block completion`. No decline is inferred. A material wording change can trigger another optional review. No response obligation is created.

Unassisted Goal Testing is `not-needed-now`. This maintainer proof does not establish independent use or discoverability. No scenario or deferred obligation is created. Required agent Human Experience Review remains separate.

## P2 Optional Experience Handoff

The small goal is to understand what the host proved and when a message is sent.

1. Open the [host capture](evidence/a9/claude-host-proof.png). Find the literal hostile text, fixed user message, and receipt.
2. Read the A11 finding. Notice that host acceptance first created a draft. The approved Send action and visible receipt established delivery.
3. Open the [fallback capture](evidence/a14/chat-fallback.jpg). Notice the chat recovery, disabled actions, and no-task statement.

Feedback is optional and does not block P2. This review uses retained evidence and needs no setup. No owner response was supplied at closeout.

## P2 Coverage Decisions

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Source Backlog reference | `update-existing` | It owns delivery limits and now records the bounded host proof and message-control effect. Installed Skill copies remain outside P2. |
| Maintainer MCP guide | `update-existing` | It owns transport and server boundaries. It now links the observed proof and keeps production support separate. |
| User guide and source Skill entry point | `none` | The production live flow is still planned. The current chat and explicit-static flow remains accurate. |
| System assets and local setup | `none` | No system asset or durable project setup change is part of P2. The temporary host connection was restored. |
| PRD authority | `link-only` | PRD 51 already owns the product rules. P2 implements the bounded proof and links current PRD 50 review authority. No new product requirement is needed. |
| Work and central evidence | `update-existing` | The phase and index retain stable IDs, observed acceptance, checks, limits, and next authority. This report already exists. |
| Phase history | `create` | The [P2 history](../../../.make-docs/archive/history/2026-09-30-w25-r0-p2-host-and-transport-proof.md) records one completed architecture checkpoint. |
| Acceptance captures | `create` | The two unedited captures support the actual host and missing-bridge findings. They are stored under their stable A9 and A14 case paths. |

## P2 Follow-Up Limits

P2 is complete for this unshipped fixture, one Claude version, stdio, and the missing-bridge page check. Streamable HTTP and broad host support are unproved. Production live tools, report delivery, widget layout, refresh, installed Skill parity, and task creation remain P3-P6 or later work. No W24 profile acceptance is inferred. P3 needs separate implementation authority.

The source remains uncommitted at this checkpoint. P2 implementation does not authorize staging, commit, push, installation, publication, or release. The temporary connection and test server are closed. Prior host settings are restored. The synthetic chat and two captures remain as review evidence.

## P3 Tested State

P3 is closed for the shared source model and renderer boundaries. The user authorized implementation on 2026-09-30. Tests ran on the prior uncommitted source checkpoint on `w25-r0-p1-live-delivery-contract`, based on `0c112e57fb0c197105c4eabe9d60395f772ab198`. The user then authorized P3 closeout and a local commit on that date. These records belong to the P3 phase closeout commit. The new authority includes staging the reviewed P3 file set. Installation, push, publication, release, and P4 implementation remain outside that authority.

The first-step records keep `BacklogReportV1` unchanged. Live identity stays in the separate P1 `BacklogLiveEnvelopeV1`. A24 keeps its ID and requires agent Human Experience Review. Guided owner review is advisory. The test scope uses the PRD 50 common decision record and a finite affected-first pass.

The shared entry points are `createBacklogPresentation(report)`, `renderBacklogStaticHtml(report, template)`, `renderBacklogChatSummary(report)`, and `createBacklogLivePayload(report, sessionId)`. Presentation returns the validated report, shared display data, and concise model data. The live payload returns narration in `content`, concise `structuredContent`, and `_meta.backlog` with schema version, data boundary, envelope, display data, and fixed actions. The live builder performs no file or host operation.

The coordinator checked the source identities after the full test pass. They identify the prior tested implementation checkpoint before the closeout prose edits. The generated portable contract row now records the later whitespace rebuild. That rebuild passed the bounded 30-case rerun recorded below.

| Tested source | SHA-256 |
| --- | --- |
| [Shared presentation](../../../packages/cli/src/operations/work/backlog/presentation.ts) | `fc9750ca302cb059ee0ccf16825acd0de0f0ebfa147968ef243098064996130a` |
| [Generated portable contract](../../../packages/skills/backlog-review/scripts/report-contract.mjs) | `b8a45557bbbed21ef8085fd082b4e2757f1da3d31dc497b2e31a27f2d0937d8e` |
| [Static render script](../../../packages/skills/backlog-review/scripts/render-report.mjs) | `580291199e34b4d6748d1a1b77027a53b73798b7a4b5fa37cc2d51b50b5bc6bd` |
| [HTML template](../../../packages/skills/backlog-review/assets/backlog-review-report.html) | `118b2611be0e2b39f6c0d6c69f4282fde8e0144dfb7af39511db70fb3e7c54e2` |
| [New tests](../../../packages/cli/tests/backlog-presentation.test.ts) | `9af20e553da10ef0f8d526c78b2a3781ad5e993752314109b3674d35350a07b2` |
| [Golden fixtures](../../../packages/cli/tests/fixtures/backlog-presentation.ts) | `ad457a91c99bc30f9d3bd5ce4accdc9c64f562589b16fa5383fa17519b325a8b` |

The payload boundary follows the current [OpenAI MCP server result guidance](https://developers.openai.com/apps-sdk/build/mcp-server), read by the coordinator on 2026-09-30. `structuredContent` gives concise model-visible data. `content` carries narration. `_meta` carries full client data outside the model's normal result view. That placement supplies no secure storage or action authority. The retained examples are synthetic. P3 adds no production live widget or host scaffold.

## P3 Checks

| Check | Result | Scope |
| --- | --- | --- |
| New shared-model suite | 30 passed | Strict validation, portable runtime, exact static/live/chat/Data meaning, summary bounds, literal text, phase mapping, and actual `renderWave` behavior with a DOM stub. |
| Final affected regression pass | 147 passed in five files | The 30 new cases plus 117 existing contract, live contract, Skill, and cache cases. |
| Repository defaults | 53 passed | Template consistency, template links, and package safety. |
| Type check | Passed | CLI source types. |
| Independent output comparison | Passed within the stated limit | Final mixed, small, limited, and large outputs match their complete live report and display payloads. Accepted layout and CSS stay unchanged. |
| Portable Skill boundary | Passed | Generated module works without installed CLI, Store, local `node_modules`, or network access. The final whitespace rebuild is 478,122 bytes. |
| Bounded whitespace rebuild | 30 passed | Deterministic drift and portable/full-source parity pass after the generator fix. Mixed static HTML and validation error messages equal the old staged runtime's results. |

The final code commands were:

```sh
npm exec --workspace packages/cli -- vitest run tests/backlog-presentation.test.ts tests/backlog-contract.test.ts tests/backlog-live-contract.test.ts tests/backlog-review-skill.test.ts tests/backlog-cache.test.ts
npm run validate:defaults --workspace packages/cli
npm exec --workspace packages/cli -- tsc --noEmit
git diff --check
```

The first focused run had 12 passes and 9 failures from a key-order-sensitive comparison and two test setup errors. An interim repaired run passed 21 cases. Later code review added actual phase-rendering coverage. The final affected run passes all 147 cases. Two new README links were changed to the existing durable source URL form after the Skill test found them. CLI validation errors remain concise after the generated validator replaced the partial validator. These affected failures received focused fixes and reruns.

Template insertion now checks the original slots and replaces them in one callback pass. Literal dollar replacement tokens and marker-looking project values round-trip exactly. Phase display uses the record and phase index. It preserves the original title whitespace rule. The old and new serializers already agreed on special-character escaping; [the retained comparison](evidence/p3/serializer-parity.json) confirms this. No Unicode escape defect or repair is claimed.

The first full staged check found four trailing-whitespace lines in the generated module's bundled Zod template strings. The earlier unstaged `git diff --check` did not include that untracked file. The code agent made a narrow generator fix and rebuilt the module. No TypeScript or test source changed. The exact rerun command was:

```sh
npm exec --workspace packages/cli -- vitest run tests/backlog-presentation.test.ts
```

All 30 cases passed, including deterministic drift and portable/full-source parity. The code agent found no remaining trailing-whitespace lines. Its direct old staged-runtime/new-runtime comparison kept mixed static HTML and validation error messages unchanged. `git diff --check` and a HEAD diff check for both changed files passed. The prior 147-case regression pass, 53 default checks, type check, and independent output review remain valid. These are 30 rerun cases, not 30 new cases. The coordinator owns restaging and the final staged check before commit.

## P3 Output Review

The code agent built the synthetic mixed baseline from `mixedPortfolioFixture.report` with generation time `2042-06-15T12:00:00.000Z`. The coordinator compared that baseline with the final output. [The baseline](evidence/p3/mixed-before.html) is 68,886 bytes. [The final mixed output](evidence/p3/mixed-after.html) is 68,798 bytes. It retains Aurora Notes, all seven records, two Attention findings, and one Next item. Parsed embedded V1 equals [the original report JSON](evidence/p3/mixed-report.json).

| Identity | SHA-256 |
| --- | --- |
| Mixed report JSON | `63648b38cb2e0f44260dce41e4f52b3865d9c7d9e79914adc362f7a1e880f7a5` |
| Baseline and final style block | `d3c00b34acd6291e6a8691058334ea6e65bc6e8d5c068cc0d6bd8686551b83db` |
| Baseline markup after removing script tags | `67f144851cfd6e0feedba8a460edcb0ff91cb5a95173742a684511bd85719589` |
| Final mixed HTML | `e8af7560bf74d860b3cb5a2a0cbc6cee2bb8e1832a8645f05f38ee5dcb327334` |

Final CSS is byte-identical to the baseline. Markup with scripts removed is equal after blank-line removal for the added inert data slot. The final file has one executable script and two inert scripts. It has no remote `src` or `href` assets. [The full live payload](evidence/p3/mixed-live-payload.json) has the same report and display values. [The output comparison](evidence/p3/output-parity.json) retains the coordinator's exact findings.

| Case | Tallies: found / in scope / historical / archived | Observed result |
| --- | --- | --- |
| [Mixed](evidence/p3/mixed-after.html) | 7 / 5 / 1 / 1 | All six live statuses and archived evidence remain. |
| [Small](evidence/p3/small/after.html) | 1 / 1 / 0 / 0 | The 55,224-byte file keeps Orbit Notes, full W1 R1 P1 phase details, claim classes, high confidence, rationale, and limits. |
| [Limited](evidence/p3/limited/after.html) | 2 / 1 / 0 / 1 | `BACKLOG-VAL-003` and `BACKLOG-VAL-004` remain explicit. |
| [Large](evidence/p3/large/after.html) | 140 / 100 / 20 / 20 | The concise summary states that 15 current items, 35 Attention findings, and 15 Next items were omitted. Full client data retains all 140 records. |

The coordinator compared each final HTML report and display block with its full live payload. All values are exact. The concise project name is bounded to 600 characters and has `projectNameTruncated`. The summary excludes a duplicate unbounded name. These bounds do not reduce the complete report.

The 15 retained synthetic files were copied from `/private/tmp/w25-p3-review-FzoJPJ` to `evidence/p3/`. They contain mixed before and after HTML, source report, full live payload, two parity records, and the small, limited, and large HTML/report/live payload sets. No screenshot is included.

The native browser tool rejected the local baseline file URL. No other route was used to bypass that limit. This review is generated-output inspection and tested script behavior. It is not a new browser, screenshot, or live widget review. The agent also read the accepted [W23 P4 review](../2026-09-18-w23-r0-backlog-review-and-reporting/evidence.md#p4-single-file-interactive-report) and [W23 P6 review](../2026-09-18-w23-r0-backlog-review-and-reporting/evidence.md#p6-report-item-traceability-and-navigation). Those records retain prior visual and owner findings. No retained W23 screenshot was found or inspected. W23 P4 also records its local-file browser limit.

## P3 Acceptance Cases

| ID | Result | Evidence and limit |
| --- | --- | --- |
| A17 | Passed | All four presentation boundaries validate the unchanged complete V1. The portable static module uses the same generated strict contracts. Golden payloads retain exact report and display values. |
| A18 | Passed | Claim classes remain distinct. Existing cache contracts stay separate and unchanged. V1 has no cache fields; strict validation rejects an injected cache key. Display data has no local filter, search, sort, theme, tab, or disclosure authority. |
| A19 | Passed | Report schema stays at V1. The P1 envelope is separate. Existing V1 and live contract cases pass. No breaking report change or migration is needed. |
| A20 | Passed | The source guide and `dataBoundary` state that full client metadata is not secure storage. Retained examples contain synthetic project data. |
| A21 | Passed | Mixed, small, limited, and large parity keeps titles, tallies, findings, order, statuses, reasons, phase tracks, details, rationale, and limits. Record-plus-phase mapping prevents shared path text from choosing another record's phase. |
| A22 | Passed within source scope | Static output stays one offline file. Inert data, literal text tests, lazy Data, and user-started download remain. Portable Skill tests pass without Store or installed CLI. No new browser claim is made. |
| A23 | Passed | The live builder returns data only. The code tests cover the pure payload boundary. No static report is written during live construction. |
| A24 | Passed within the review limit | Required agent review finds no material meaning or static-layout regression. Actual generated outputs, unchanged markup/styles, accepted W23 review, and affected tests support that claim. Optional owner feedback supports the earlier sample's words and controls only. |

## P3 Agent Human Experience Review

Reviewer: Codex source-guide agent. Independent generated-output reviewer: Codex coordinator. Date: 2026-09-30. Inputs are current authority and source guides, final code results, retained built outputs, parity findings, and accepted W23 P4/P6 review records.

| Promise | Observation | Conclusion | Limit and next useful action |
| --- | --- | --- | --- |
| Each mode keeps the same project state. | Four synthetic cases have exact complete report and display values across static and full live payloads. Chat uses the shared summary. | Sufficient for P3 source meaning parity. | P4-P5 must connect the payload to a real production tool and widget. |
| Users can choose the first work item and read its details. | The accepted Attention-before-Next markup and CSS remain. Titles, reasons, phase details, confidence, and limits stay present. Actual phase rendering has a tested record-plus-index lookup. | No material source or layout regression found. | Local-file browser access was blocked. P5 and P7 must supply live interaction and installed review. |
| Short summaries state their limits. | Large output reports omitted counts and retains all 140 records in full client data. Long project names have an explicit truncation flag. | The summary supports orientation without a false completeness claim. | Read full client or Data content for details omitted from the summary. |
| Project text stays data. | Dollar tokens, marker-looking text, and hostile values round-trip as inert data. Full client metadata is described as readable by the host and client. | The reviewed source keeps trust and display boundaries clear. | Production actions must keep the P1 resolver and recheck current identity in P6. Metadata supplies no permission. |
| Saved files and tasks stay under user control. | Static creation remains an explicit Skill request. The live builder has no file or host operation. The source entry point still completes the current review in chat. | Consent and delivery wording match the implemented boundary. | Live default selection remains a contract for later integration. A host message or task needs its own observed result. |

The agent review is required work. It uses observations and bounded conclusions. It does not treat test quantity or owner feedback as a substitute for the review.

## P3 Optional Owner Review

The coordinator offered the synthetic sample at `/private/tmp/w25-p3-review-FzoJPJ/after.html`. The small goal was to choose the first wave through Attention and Next, then open its details. The steps were to open the sample, use Attention or Next, and read the selected wave's detail. The question was whether the words and controls made that choice clear. The owner answered “Clear; no change”.

Record `feedback-recorded` with an advisory effect. No change resulted. This review used the earlier 68,950-byte sample at that path. The final sample is 68,798 bytes after shared helper and phase-lookup changes. The final markup, styles, and words remain equal within the output comparison above. Do not treat the response as owner review of the final exact bytes. It supports only the offered words and controls. It does not certify code, parity, a new browser run, production live delivery, or all acceptance. No owner response gate was added.

## P3 Testing Decisions

Automated Implementation Testing is required with gate effect `blocking-claim-only`. The finite pass starts with the changed shared boundary, then the nearest contracts and smallest affected Skill/cache regressions. Failed cases and material fixes received affected reruns. The final 147 cases and source type/default checks pass. Stop after these pass and independent output review finds no material gap.

Guided Progress Review is advisory. One small three-step goal was offered after a real static sample existed. Actual feedback is retained above. No reply was required. Human Experience Review is separate required agent work and has its own findings above.

Performance Testing and Unassisted Goal Testing remain `not-needed-now`. Their scope and budget are zero runs. No profile, scenario, or deferred obligation is created. Recheck only if current authority adds a speed or independent-use claim, or a new material finding needs one.

## P3 Coverage Decisions

| Candidate | Verdict | Result |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | Upstream README and report-model, HTML-report, and review-method references explain shared validation, payload meaning, user control, and planned live integration. Source `SKILL.md` remains accurate and unchanged. |
| History coverage | `create` | One [P3 history record](../../../.make-docs/archive/history/2026-09-30-w25-r0-p3-shared-model-and-dual-renderer.md) records the supported checkpoint. |
| PRD reconciliation | `link-only` | Current PRD 51 already owns unchanged V1, the separate envelope, model parity, and honest metadata limits. The work, plan, and design now agree. |
| Maintainer and user guide coverage | `update-existing` | Existing upstream Skill sources own this route. Installed copies and project setup remain outside this phase. |

## P3 Document Checks

| Check | Result |
| --- | --- |
| PRD authority | Passed: 35 PRDs, 586 Markdown source files, 1,103 links, zero diagnostics. |
| Selected path hygiene | Passed: nine normal Markdown paths, zero findings, zero writes. |
| Current indexed links | 1,808 documents and 26,136 sections scanned. Zero broken links in the ten changed Markdown files or 15 retained result files. The 525 unrelated existing broken links are outside P3. |
| Phase history content path check | Exit 2: the validator rejects the archive path as `Invalid content path`. The current history contract owns that path. Indexed history links resolve. No router rewrite or test exemption is added. |
| Diff hygiene | `git diff --check` passed with no output. |

The exact normal-path command is:

```sh
make-docs project path-hygiene validate --target-root . --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/03-shared-model-and-dual-renderer.md --path docs/plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/03-shared-model-and-dual-renderer.md --path docs/designs/2026-09-24-live-backlog-review-mcp-app.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --path packages/skills/backlog-review/README.md --path packages/skills/backlog-review/references/report-model.md --path packages/skills/backlog-review/references/html-report.md --path packages/skills/backlog-review/references/review-method.md --format text
make-docs run prd authority validate --target-root .
make-docs project path-hygiene validate --target-root . --path .make-docs/archive/history/2026-09-30-w25-r0-p3-shared-model-and-dual-renderer.md --format text
git diff --check
```

The link check used `jdocmunch.index_local` with the repository root, name `make-docs-w23-r0-p6-20260922`, `include_dot_dirs: [".make-docs"]`, and `incremental: true`. It then used `jdocmunch.get_broken_links` on `local/make-docs-w23-r0-p6-20260922`. Results were filtered by exact source paths for the nine normal Markdown files, new P3 history, and retained result folder.

Closeout prose checks on 2026-09-30 passed for the five changed records. The four normal Markdown paths had zero findings or writes. The refreshed index scanned 1,808 documents and 26,136 sections. It found zero broken links in the five closeout records, including history. `git diff --check` passed. The earlier archive-path rejection remains a recorded validator limit and was not rerun. These prose edits reused all 200 passing automated cases and the type check. No code, test, or retained result changed during that prose pass.

The closeout path command was:

```sh
make-docs project path-hygiene validate --target-root . --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/03-shared-model-and-dual-renderer.md --path docs/plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/03-shared-model-and-dual-renderer.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --format text
git diff --check
```

The closeout link check used the same `jdocmunch.index_local` and `jdocmunch.get_broken_links` arguments above. Its exact source filter was the four paths in this command plus `.make-docs/archive/history/2026-09-30-w25-r0-p3-shared-model-and-dual-renderer.md`.

After the generated-module correction, the affected evidence path check passed with zero findings or writes. Fresh indexed links had zero broken links in the evidence and P3 history. `git diff --check` passed. The index still scanned 1,808 documents and 26,136 sections. The exact affected-path command was:

```sh
make-docs project path-hygiene validate --target-root . --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --format text
git diff --check
```

The scoped link filter was `docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md` and `.make-docs/archive/history/2026-09-30-w25-r0-p3-shared-model-and-dual-renderer.md`. The coordinator will restage the owned changes and run `git diff --cached --check` before commit.

## P3 Follow-Up Limits

P3 is closed for shared source integration under the user's 2026-09-30 closeout and local commit authority. Production live tools, widget layout and controls, refresh, host task requests, installed parity, payload performance, and broader host support remain P4-P7 work. P4 still needs separate owner authority and accepted W24 MCP profile authority. This phase makes no new W24 acceptance claim.

The source Skill keeps its current chat review and explicit-static path. Its references label the live route contract and payload as source definitions for later connection. Earlier P3 implementation authority did not include staging or commit. The new closeout authority includes staging the reviewed P3 file set and creating a local commit. Branch changes, installation, push, publication, release, and later-phase work remain outside that authority.

The user prefers computer use or the built-in browser for future local-file reviews. This preference does not change the past browser restriction or create a new response or review gate. No browser workaround or new browser review was performed at closeout.

## 2026-10-04: W24 Merge Handoff

The user authorized the local W24 merge and this docs handoff. W25 R0 P1-P3 are closed. W24 R0 P1-P4 are closed. The earlier sections remain the history of those W25 phases. This dated section records the current branch state.

The branch is `w25-r0-p1-live-delivery-contract`. Merge commit `26bdf1cea838b4e339abd967abe8f7e42e9bf97c` has parents `1ef2f1fe15b78b42f9277c20030af7711ce72dcb` (W25 P1-P3) and `b4c253c101bc353a1671cf70d10a282daf88a276` (local main and closed W24). Local main remains at `b4c253c1`. No push was made. The [W24 evidence](../2026-09-24-w24-r0-mcp-tool-profiles/evidence.md) and [P4 closeout history](../../../.make-docs/archive/history/2026-10-03-w24-r0-p4-mcp-tool-profiles.md) retain the accepted profile scope and limits.

The merged [server](../../../packages/cli/src/mcp/server.ts) preserves profile checks and filtering for tool lists, tool calls, native resource lists, and native resource reads. `runMcpServer` forwards the profile option to the factory. App proof resources remain opt-in. A nonempty proof resource list can start only with the default profile or explicit `all`. Each narrower profile is refused before proof bytes are read. An empty list keeps normal profile filtering and adds no UI capability. Write gates and access checks stay unchanged. The production backlog UI resource and live-review operations remain unregistered.

The merge added 13 cases in the [MCP App contract tests](../../../packages/cli/tests/mcp-app-contract.test.ts). The retained focused run passed 201 tests across 10 files. The TypeScript check and CLI build passed. The source review passed with no open defect. It checked W24 profile paths, W25 proof resource opt-in, default no-app behavior, the all-only guard, option forwarding, access rules, reserved production UI scope, and the shared maintainer guide. This merge adds no domain rule that needs a new deterministic or agentic twin.

The checks were run during the merge. This docs handoff reused them and did not repeat tests or the build. The logs are temporary files under `/tmp/make-docs-w25-w24-merge-tests.rwRfkB`. They are not durable project artifacts. Their recorded SHA-256 values are:

| Log | SHA-256 | Result |
| --- | --- | --- |
| `focused-tests.txt` | `ae0a8fc245816184df0150bf2003fcfb21ffc7bc3ccfb834444bdd66668af749` | 201 tests passed in 10 files. |
| `typecheck.txt` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | Passed with no output. |
| `build.txt` | `ab75aace1c59ad50e0997c359a7e08f66d2392da95b7236fe6fa282a4b7877ca` | CLI build passed. |

The merge commit keeps the source and test changes. The temporary logs support this local check record. They do not provide installed-host, release, HTTP, live Store-write, or broad host-support proof. The W24 PERF-003 results remain a historical local baseline. The merge and docs handoff do not qualify that baseline for current use or create a new performance budget.

Next is [W25 R0 P4 preflight](04-backlog-profile-tools-and-ui-resource.md) against the integrated candidate at `26bdf1ce`. The P1-P3 and accepted W24 dependencies are met. P4 remains not started and needs separate implementation authority. Its first-step record work should bind this candidate, point the evidence handoff to the existing central report, and add the required Human Experience Review record. These are phase record updates. They require no new product decision or human response gate. This handoff does not implement P4 or register the production UI.


## P4 Implementation State

The user authorized P4 implementation on 2026-10-04. The source-guide agent verified branch `w25-r0-p1-live-delivery-contract`, HEAD `bdd21481497cd78d53baa445dff8c8bbc21c7211`, and a clean working tree before its first edits. Accepted W24 authority was merged at `26bdf1ce`, from W24 completion `b4c253c1`. The dated merge handoff above remains historical evidence.

The initial P4 work, plan, and index updates preserve t1-t6 and A25-A32. They bind the accepted W24 dependency and the user's implementation authority. P4's current claim is shared tool/resource integration, read-only access, exact profile membership, and useful output without UI. Product widget controls, host display, refresh review flow, installed acceptance, and broader host support remain later work.

The records use the PRD 50 common decision fields. Automated Implementation Testing is required with a finite affected-first pass and gate effect `blocking-claim-only`. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`, each with a zero-run budget. Required Human Experience Review is separate agent work. It records observations, conclusions, limits, reviewer, and next actions from actual results. No owner response gate or new obligation is created.

The initial PRD authority command `make-docs run prd authority validate --target-root .` passed: 35 PRDs, 586 Markdown source files, 1,103 links, and zero diagnostics. `git diff --check` passed after the first-step edits. These record-only checks did not establish P4 implementation acceptance. The implementation evidence below supplies the later proof.

At the implementation checkpoint, the final source and tests were frozen and uncommitted. Tasks t1-t6 and A25-A32 had evidence below. That authority did not permit phase closeout, history creation, or a local commit. The user later authorized those steps on 2026-10-04. P4 is closed. These records belong to the P4 phase closeout commit. The tested checkpoint remains the earlier source state based on `bdd21481`.

The earlier implementation authority did not permit staging or commit. The closeout instruction now authorizes staging the reviewed P4 file set and a local commit. It does not authorize a new host review, Store write, installation, push, publication, release, branch change, or P5 work.

## P4 Implementation Evidence

### Scope and result boundary

P4 uses the unchanged V1 report and separate P1 live envelope. Open takes only `{report: BacklogReportV1}`. Refresh takes only `{envelope: BacklogLiveEnvelopeV1}`. Both inputs reject unknown fields. Their schemas live in `packages/cli/src/operations/work/backlog/review-contracts.ts`. Shared handlers live in `review-operation.ts`.

Open creates a fresh opaque session and uses the P3 payload. Its useful narration and concise `structuredContent` orient the active agent. Complete client data stays in `_meta.backlog`. The MCP adapter validates the registered result schema and preserves that boundary. Client metadata is readable by the host and client. It is not secret storage.

Refresh reads current source facts first. When the current snapshot is available, it invokes the existing exact cache lookup once with the same execution context. Optional outer Store admission is valid only for read-only Store-read operations. Required admission stays the default. The nested lookup retains its current-caller and Store gate and opens its own Store session. Optional admission grants no Store permission.

The refresh client data preserves the prior envelope, current snapshot or null, exact P1 refresh result, and the existing cache result or typed limit. Model-visible data gives bounded prior orientation, source and review state, change counts, record counts, and cache counts or a clear limit. Refresh writes no cache entry or new agent conclusion.

The tools use the paired versioned resource URI and strict result schema in the existing registry. The resource uses `text/html;profile=mcp-app`. Tool metadata links `_meta.ui.resourceUri`. This follows the [MCP Apps resource and tool pattern](https://modelcontextprotocol.io/extensions/apps/overview), checked by the coordinator on 2026-10-04. It adds no new access system or profile selector.

The P4 shell accepts one text block of at most 20,000 characters. It uses safe text rendering and a bridge handshake. It has no product tool, message, or task controls. Its CSP domain lists are empty. Missing bridge support or oversized text gives chat fallback. Oversized text preserves the last displayed text with a limit. The shell does not establish a current rendered product review.

### Independent no-UI output review

The coordinator used Node `v24.19.0` and the project's `node_modules/.bin/tsx` to call open twice with `smallPresentationReport`. The output named Current, Attention, and Next. It kept inference and recommendation classes, high confidence, rationale, and source or owner limits. The two session IDs differed. Model identity stayed stable.

The coordinator then called refresh on the fixture's known absent source root. Its text said: “Refresh unavailable (source-unavailable). The prior report is last known. Check source access, then refresh again.” It stated that cache was not attempted and no new conclusions were created. Prior-envelope equality was exact. The injected Store call count was zero.

This review supports useful no-UI report delivery and an honest unavailable-source limit. Its source case is synthetic absence. It does not prove successful current-source reading, a rendered widget, a host interaction, or P5-P6 behavior. Focused operation tests supply the other source and cache cases.

### Independent built stdio review

The coordinator launched `node packages/cli/dist/index.js mcp --profile backlog` through the SDK's `StdioClientTransport` under Node `v24.19.0`. The probe exited zero.

The built server exposed exactly five `backlog` tools: snapshot, cache lookup, cache write, live open, and live refresh. It exposed exactly one UI resource. The open definition linked `ui://make-docs/backlog-review/v1.html`. Resource read returned the MCP App MIME type, 2,741 HTML bytes, and four empty CSP domain lists.

The open wire result retained Current, Attention, Next, rationale, and limits. Its concise `structuredContent` contained neither the full report nor `_meta`. Refresh on the absent synthetic source returned `source-unavailable` and `last-known`, with cache not attempted and no new conclusions. Prior-envelope equality was exact.

This supports built stdio registration, resource delivery, and useful output without UI. It is not a rendered real-host view. The probe changed no configuration, Store, installed resource, task, or host state. The accepted P2 proof remains the separate bounded real-host evidence.

### P4 acceptance

| ID | Evidence and result | Limit |
| --- | --- | --- |
| A25 | Pass. Strict open input validates the complete V1 report. The P3 payload gives useful narration, concise model data, and complete client data. Direct and built stdio output preserve Current, Attention, Next, rationale, and limits. | No rendered host claim. |
| A26 | Pass. Refresh runs the existing current snapshot first. On success, it invokes the exact existing cache lookup once with the same context. Tests cover unchanged, changed, source failures, and optional cache limits. Prior review data stays intact. No new conclusions or cache writes occur. | A new agent review flow remains P6. |
| A27 | Pass. Open declares Store-none. Refresh declares read-only Store-read with optional outer admission. The nested lookup keeps the accepted current-caller and Store gate. A real caller-denial test preserves available source facts. | Optional admission grants no Store permission. |
| A28 | Pass. Registry projections and MCP use the shared handlers. P1 identity/comparison, P3 presentation, and existing snapshot/cache logic remain their owners. CLI, core, and MCP checks find no duplicate backlog logic. | No new independent runtime route. |
| A29 | Pass. Registry derivation exposes `make_docs_backlog_review_open` and `make_docs_backlog_review_refresh`. The built stdio probe sees both names and the linked resource metadata. | Tool exposure does not prove display. |
| A30 | Pass. Resource read returns the versioned URI, MCP App MIME type, 2,741 HTML bytes, and four empty CSP domain lists. Tests cover safe text, missing bridge, oversized text, and generated-asset parity. | The shell has no product action controls. |
| A31 | Pass. Profile and registry tests prove explicit assignment, the exact `all` union, unchanged access facts, and cloned UI metadata. Built `backlog` discovery sees five tools and one UI resource. | No permission, host, or installed support is inferred. |
| A32 | Pass. Existing snapshot and cache operations retain their source, identity, lookup, and write logic. Refresh calls them through the shared operation context. No cache schema or storage rule changed. | The snapshot owner adds only typed source-cause preservation. |

All six tasks have evidence through these eight cases. Required agent review follows below. P4 is closed under the user's 2026-10-04 closeout and local commit authority. These records belong to that phase closeout commit.

### Automated implementation checks

The code agent ran the changed behavior first and expanded to the shared registry, access, profile, resource, and source-loading boundaries after real failures. Final selected evidence covers 541 unique cases: 34 new focused cases, 454 affected cases, and 53 default checks. This is evidence across bounded runs and repairs. It is not one passing full-suite run.

| Check | Final result |
| --- | --- |
| `npm test -w packages/cli -- tests/backlog-review-operations.test.ts` | 34 passed. Includes strict inputs/results, fresh sessions, exact cache invocation, source causes, optional cache limits, and real caller denial. |
| Affected suite commands below | 454 unique cases passed across valid runs and the affected repair. |
| `npm run validate:defaults -w packages/cli` | 53 passed: consistency 38, template links 12, package safety 3. |
| `npx tsc --noEmit -p packages/cli/tsconfig.json` | Passed. |
| `npm run build -w packages/cli` | Passed. |
| `node packages/cli/scripts/build-mcp-app-assets.mjs --check` | Passed. Generated text matches canonical HTML bytes. |
| `node packages/cli/scripts/build-backlog-presentation.mjs --check` | Passed. The accepted P3 portable runtime is unchanged. |
| `git diff --check` | Passed for tracked changes. |
| `git diff --no-index --check /dev/null <new-source-path>` | All seven new source files had no whitespace output. Exit one means a new-file difference in this mode. It was not a whitespace finding. |

The first 26-suite affected command was:

```text
npm test -w packages/cli -- tests/backlog-contract.test.ts tests/backlog-live-contract.test.ts tests/backlog-presentation.test.ts tests/backlog-review-skill.test.ts tests/backlog-cache.test.ts tests/backlog-snapshot.test.ts tests/mcp-app-contract.test.ts tests/mcp-profiles.test.ts tests/mcp-profile-discovery.test.ts tests/mcp-resource-profiles.test.ts tests/resource-mcp-profiles.test.ts tests/mcp-derivation.test.ts tests/mcp-profile-cli.test.ts tests/mcp.test.ts tests/registry-contract.test.ts tests/registry-work-ops.test.ts tests/p3-operation-surfaces.test.ts tests/run-cli.test.ts tests/run-cli-experience.test.ts tests/operation-domains.test.ts tests/operation-dependency-direction.test.ts tests/w19-r6-access-config.test.ts tests/w19-r6-harness-system-operations.test.ts tests/w19-r8-store-access-remediation.test.ts tests/store-lifecycle.test.ts tests/p6-global-store-lifecycle.test.ts
```

It returned 302 passed, five failed, and five collection failures. The run exposed a barrel/registry import cycle, raw HTML loading through the source stdio fixture, and catalog fixture changes. The code agent deferred the dispatcher import until refresh runs. It generated a TypeScript text asset from canonical HTML and added a byte-parity drift check. The resource needs no runtime file read.

Independent review also found three gaps. The snapshot owner now preserves a narrow typed source cause instead of losing denied or unsafe reasons in a generic validation error. Cache-result parsing now stays inside the optional-cache catch. Derived UI metadata is cloned. Focused checks cover these repairs.

The final 23-suite command was:

```text
npm test -w packages/cli -- tests/backlog-contract.test.ts tests/backlog-live-contract.test.ts tests/backlog-presentation.test.ts tests/backlog-review-skill.test.ts tests/backlog-cache.test.ts tests/mcp-app-contract.test.ts tests/mcp-profiles.test.ts tests/mcp-profile-discovery.test.ts tests/mcp-resource-profiles.test.ts tests/resource-mcp-profiles.test.ts tests/mcp-derivation.test.ts tests/mcp.test.ts tests/registry-contract.test.ts tests/registry-work-ops.test.ts tests/p3-operation-surfaces.test.ts tests/run-cli.test.ts tests/run-cli-experience.test.ts tests/operation-domains.test.ts tests/operation-dependency-direction.test.ts tests/w19-r6-access-config.test.ts tests/w19-r6-harness-system-operations.test.ts tests/w19-r8-store-access-remediation.test.ts tests/p6-global-store-lifecycle.test.ts
```

It returned 396 passed and two failed out of 398. The remaining failures were test fixtures. The domain fixture lacked the required UI URI/result-schema pair. The Skill test treated a valid URL fragment as part of the file path. The code agent corrected only those two test files. The final affected repair command passed all 18 cases:

```text
npm test -w packages/cli -- tests/operation-domains.test.ts tests/backlog-review-skill.test.ts
```

The other 380 passing cases in that final batch stayed valid at unchanged source bytes. Earlier passing `backlog-snapshot` 16, `mcp-profile-cli` 27, and `store-lifecycle` 13 cases supplied the remaining 56. Their owners and assertions had no later change. No broad reassurance rerun was needed after the final focused and affected repair passed.

The seven new files checked for whitespace were the asset generator, canonical HTML, generated TypeScript asset, default app-resource registration, review contracts, review handlers, and focused test. Their exact paths are:

```text
packages/cli/scripts/build-mcp-app-assets.mjs
packages/cli/src/mcp/assets/backlog-review-v1.html
packages/cli/src/mcp/assets/backlog-review-v1.ts
packages/cli/src/mcp/default-app-resources.ts
packages/cli/src/operations/work/backlog/review-contracts.ts
packages/cli/src/operations/work/backlog/review-operation.ts
packages/cli/tests/backlog-review-operations.test.ts
```

### Tested source identities

The tested checkpoint was the uncommitted P4 source on branch `w25-r0-p1-live-delivery-contract`, based on HEAD `bdd21481497cd78d53baa445dff8c8bbc21c7211`. Code and tests remain frozen after the final checks. The coordinator verified the built entry, HTML, generated text asset, and retained P3 identity. This is the explicit pre-commit checkpoint. It is not the identity of the later closeout commit.

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `packages/cli/src/operations/work/backlog/review-contracts.ts` | 9,113 | `4b61c8a07b6333c1c64ed6b0eb805ce23c2bcc81dba2bef16e8e62e4e82c3b66` |
| `packages/cli/src/operations/work/backlog/review-operation.ts` | 4,296 | `6dcb4cf9fc480c19881aecdcd11a0532abedb2d67189f83afa8d4dad50bc0c6c` |
| `packages/cli/tests/backlog-review-operations.test.ts` | 24,707 | `30f5416d84808a3d980aae49fcb2a661eec29ac6471682a89547cbb8c9cf0322` |
| `packages/cli/src/mcp/assets/backlog-review-v1.html` | 2,741 | `67fc86968c92e97316b78153e778856a16f0feb979988e4e6d75c678abf3b6df` |
| `packages/cli/src/mcp/assets/backlog-review-v1.ts` | 2,950 | `8f0fcb7bb8095e39abdc158f65874368f730800da60f4eaa526877ecdf6e3b21` |
| `packages/cli/scripts/build-mcp-app-assets.mjs` | 681 | `290e866bb306dff4597d0cfac96cc060d6238f4c604cd0432df73ab2056ad087` |
| `packages/cli/dist/server-BG3TXQHU.js` | 24,487 | `04cb4b8d591faff02fe5ba18db270b86fb082924475d8285a203500e92841df9` |
| `packages/cli/dist/index.js` | 211,248 | `9f15bb73486a225c96ea234ca2787b82397e5c1377e7d8662c466e8c40bdb6cc` |

Built output is ignored and not staged. The accepted P3 portable `report-contract.mjs` remains `b8a45557bbbed21ef8085fd082b4e2757f1da3d31dc497b2e31a27f2d0937d8e`. No installed copy or package publication was changed.

### Required agent Human Experience Review

Reviewers: the coordinator for code, direct result, and built stdio observations; the source-guide agent for the guide, consent, error, authority, and phase-limit wording. This is required agent review. It is separate from the four testing types. No owner response or new obligation is required.

| Promise | Observation | Conclusion | Limit and next useful action |
| --- | --- | --- | --- |
| A useful review remains available without a widget. | Direct and built open text retains Current, Attention, Next, rationale, claim classes, confidence, and limits. Concise model data excludes the full client report. | P4 supports an agent's current chat explanation without UI. | No lived-human ease or rendered host claim. P5 must prove product controls in the widget. |
| Refresh keeps facts and conclusions distinct. | Focused source/cache cases preserve the prior model and exact P1 refresh states. Unavailable-source text says last known, no new conclusions, and a source retry step. | P4 gives an honest fact-refresh result. It does not invent a new review. | Actual output probe covers absent synthetic source. P6 must connect fresh agent review and controlled messages. |
| Optional reuse does not block current facts or grant permission. | Current source work runs before one nested exact cache lookup. Tests preserve current facts on typed Store limits and invalid cache output. Real caller denial remains enforced. | Optional cache loss affects reuse only. Store authority is unchanged. | No production Store setup or write occurred. Repair Store access only when reuse is useful. |
| Failure does not imply hidden file or task work. | Source guidance says chat fallback, direct saved-file requests, no created task, and no implicit host changes. The shell has no product tool/message/task controls. | Consent and fallback wording matches the implemented source scope. | No separate task or saved report was created. A direct user request remains necessary for either. |
| Exposed tools and resource do not imply a displayed app. | Built stdio discovers the exact tools and resource. The shell shows bounded text and bridge state with safe fallback. Guides mark product controls and host proof as later work. | Source delivery is clear and bounded. | No new browser or real-host review occurred. Keep the accepted P2 proof separate. Use P5-P7 for full product and installed evidence. |

The review found no material gap within P4's source tool/resource and useful no-UI promises. It does not establish independent use, discoverability, broad host support, or a completed live product. Performance Testing, Guided Progress Review, and Unassisted Goal Testing remain `not-needed-now` under the common decision record.

### P4 coverage and remaining authority

Upstream Skill and reference edits explain the two tools, complete client data, optional cache limits, the bounded shell, direct file/task control, and future product work. Chat and explicit static review remain usable without the CLI or Store. Installed Skill and system copies remain unchanged.

PRD 25 now records optional outer Store admission with required admission as the default. PRD 39 records its strict descriptor bounds and paired UI URI/result schema. Their dated requirement histories link P4 and PRD 51. PRD 51 remains the product owner with no requirement change. No new PRD or parallel registry was added.

P4 is closed. The user authorized closeout and a local commit on 2026-10-04, including staging the reviewed P4 file set. The [phase history](../../../.make-docs/archive/history/2026-10-04-w25-r0-p4-backlog-profile-tools-and-ui-resource.md) records that scope. These records belong to the closeout commit. Push, publication, installation, release, Store writes, host changes, branch changes, and P5 work remain outside current authority. P5 is next eligible and needs separate implementation authority.

### P4 final document checks

The final PRD authority command `make-docs run prd authority validate --target-root .` passed. It checked 35 PRDs, 586 source Markdown bodies, and 1,105 links with zero diagnostics.

The selected path command passed for six normal project documents, with zero findings and zero writes:

```text
make-docs project path-hygiene validate --target-root . --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/04-backlog-profile-tools-and-ui-resource.md --path docs/plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/04-backlog-profile-tools-and-ui-resource.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --path docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md --path docs/prd/39-cli-command-model-and-operation-registry.md --format text
```

The source-guide agent refreshed only the 11 changed Markdown paths with jdocmunch. It retrieved 34 relevant sections with `verify: true`. Each section had current source and content hashes. The scoped link result had zero broken links from those 11 files. This is a changed-file result, not a global link-clean claim.

`git diff --check` passed after the implementation documentation edits. The coordinator also verified all seven new source files without whitespace findings. At that pre-commit checkpoint, branch and HEAD remained the tested base and the staging area was empty. No history, browser capture, installed update, commit, or P5 work was added during implementation. The closeout adds one required history under the new user authority. Its document checks follow below.

### P4 closeout document checks

The user authorized closeout and a local commit on 2026-10-04. The coordinator verified that frozen source, test, generated asset, built entry, and P3 portable hashes still match implementation evidence. Closeout reuses the 541 unique passing selected cases. No code test was rerun. Only the four working closeout records and one new history record changed in this pass.

`make-docs run prd authority validate --target-root .` passed: 35 PRDs, 586 source Markdown bodies, 1,105 links, and zero diagnostics.

The normal-path check passed for four files, with zero findings and zero writes:

```text
make-docs project path-hygiene validate --target-root . --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/04-backlog-profile-tools-and-ui-resource.md --path docs/plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/04-backlog-profile-tools-and-ui-resource.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --format text
```

The canonical history check returned exit two:

```text
make-docs project path-hygiene validate --target-root . --path .make-docs/archive/history/2026-10-04-w25-r0-p4-backlog-profile-tools-and-ui-resource.md --format text
Path check error: Invalid content path: .make-docs/archive/history/2026-10-04-w25-r0-p4-backlog-profile-tools-and-ui-resource.md
```

The public validator did not inspect that archive file. The valid routed history contract requires this canonical path. The record stays there. Manual contract and path review, current jdoc sections, scoped links, and the whitespace check support the history. No router or path-rule repair was made.

The source-guide agent refreshed the five closeout paths and verified their current sections. All 12 Markdown files in the phase commit scope have zero scoped broken links. The history has the required headings, frontmatter, relative links, and a first Changes paragraph for the feature commit body.

`git diff --check` passed. The new history check `git diff --no-index --check /dev/null .make-docs/archive/history/2026-10-04-w25-r0-p4-backlog-profile-tools-and-ui-resource.md` had no whitespace output. Its exit one is the normal new-file difference in that mode.

These records close P4 under the current local commit authority. They contain no future commit SHA. No source, guide, PRD, installed resource, Store, host setting, branch, or P5 change was made during closeout.

## P5 Implementation Checkpoint

The user authorized P5 preflight fixes and implementation on 2026-10-04. Work started on `w25-r0-p1-live-delivery-contract` at clean base `19c19f42d90d836ed7c1a5e23f7abf1230bee1c2`. P1-P4 are closed. This is the historical implementation-only checkpoint. Closeout, history, staging, and commit were outside that initial authority. The later 2026-10-06 closeout instruction below authorizes the reviewed local commit. Installation, push, host changes, Store writes, and P6 work remain outside it.

P5 renders the full validated P3/P4 client report in the registered resource. The V1 report, P1 identity/action contracts, operation/profile/access rules, and accepted static template are unchanged. The accepted static template is 48,526 bytes, SHA-256 `118b2611be0e2b39f6c0d6c69f4282fde8e0144dfb7af39511db70fb3e7c54e2`. Its reused CSS is byte-equal, SHA-256 `d3c00b34acd6291e6a8691058334ea6e65bc6e8d5c068cc0d6bd8686551b83db`. Exact CSS/body parity checks and the retained [P3 output review](#p3-output-review) bind the accepted presentation.

Local controls change only display state. They make no `tools/call` request and send no agent `ui/message`. Display-size notifications are allowed. Validated inbound data drives ready, refreshing, changed, and last-known feedback. Fixed review/task feedback is a pure display seam for P6. P5 starts no refresh call, review message, task, or saved file.

The browser matrix, bounded size repair/retest, and agent review below supported the 2026-10-04 technical checkpoint. They do not claim a rendered production host or installed acceptance. The later [owner status UI finding](#p5-owner-status-ui-finding--2026-10-06) was resolved by the approved footer remedy and final source proof. The separate 2026-10-06 instruction now closes P5 and authorizes its local commit.

### P5 Code Checks

At the 2026-10-04 checkpoint, the code agent used Node `v24.19.0`. Focused widget checks passed 35 cases. Ten affected suites passed 304 cases. Source-guide defaults passed 53 cases: 38 consistency, 12 template links, and three package safety. These were separate runs: 392 unique selected cases. The focused suite checked strict payload and identity validation, exact accepted presentation reuse, local-state behavior, safe text, lazy full-report Data/download, inbound feedback, invalid input, missing browser support, size changes, and zero tool/message initiation. The later footer correction has final evidence below.

```text
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm test --workspace @brucewaynedecoy/make-docs -- tests/backlog-widget.test.ts
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm test --workspace @brucewaynedecoy/make-docs -- tests/backlog-contract.test.ts tests/backlog-live-contract.test.ts tests/backlog-presentation.test.ts tests/backlog-review-operations.test.ts tests/backlog-review-skill.test.ts tests/backlog-cache.test.ts tests/mcp-app-contract.test.ts tests/mcp-profiles.test.ts tests/resource-mcp-profiles.test.ts tests/mcp-resource-profiles.test.ts
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" node node_modules/typescript/bin/tsc --noEmit -p packages/cli/tsconfig.json
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm run build --workspace @brucewaynedecoy/make-docs
"$HOME/.nvm/versions/node/v24.19.0/bin/node" packages/cli/scripts/build-mcp-app-assets.mjs --check
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm test --workspace @brucewaynedecoy/make-docs -- tests/backlog-review-operations.test.ts
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm run validate:defaults --workspace @brucewaynedecoy/make-docs
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm test --workspace @brucewaynedecoy/make-docs -- tests/backlog-review-skill.test.ts
git diff --check
```

Type checks, build, deterministic asset drift, and whitespace checks pass. The failed-result repair affected only the widget and generated assets. Its focused suite, type check, build, and drift check ran again. Browser review then found that Data-to-Work could retain a large host viewport. The size repair measures content without a viewport-height floor. The final 35-case widget suite, nearest 34-case review-operation suite, type check, build, and drift check pass after that repair. The earlier 304 cases remain valid for unchanged boundaries. The final-guide 14-case Skill pass is an affected repeat within those 304 cases. It is not added to the unique count. No broad reassurance run was made.

Source review found that an initial invalid payload claimed a prior valid report remained visible when none existed. The repair distinguishes empty fallback from a retained prior report. Initial bad data, unavailable native crypto, and failed tool results now have bounded focused tests. Invalid incoming data leaves an existing valid report and its local selection intact. These are resolved source findings, with no added P6 workflow.

| 2026-10-04 source or asset | Bytes | SHA-256 |
| --- | ---: | --- |
| [Widget HTML](../../../packages/cli/src/mcp/assets/backlog-review-v1.html) | 429,014 | `e0ad954b6ff12e1ebb40c991be0454f4a0e9f973e704172215d3ab64a9304e26` |
| [Generated TS asset](../../../packages/cli/src/mcp/assets/backlog-review-v1.ts) | 459,478 | `d7439960f0f7d92b277f65f49d36a619854aedc25f274fb78d0ff27d992879c7` |
| [Widget test](../../../packages/cli/tests/backlog-widget.test.ts) | 18,824 | `f55417b21abbe3c4e185b80f6b5b8d92cb851088ffb673ec5669e8987031dd35` |
| [Asset generator](../../../packages/cli/scripts/build-mcp-app-assets.mjs) | 6,162 | `c884d2dedec75355d46e1c19d00f14e372db24043fd4511bcff4b5f44a888690` |
| [Generated static renderer](../../../packages/cli/src/mcp/widget/static-renderer.js) | 50,382 | `e7114a01f8f27b94ec6e0ccb02d26a30d0b3b7acc1c6325cf657bfce990a9d6e` |
| [Widget entry](../../../packages/cli/src/mcp/widget/entry.ts) | 6,832 | `2b7cc9763f7181ce557607fa7c069a6b6c38eb79e090488aa76d57c4b8008a03` |
| Built `dist/server-EEMYSL6J.js` | 465,241 | `5b9182a36e51a011bada386235dea75bb6869178683ed4cc9f76f5d00dd7d883` |

Build output is ignored. Its hash identifies the local proof artifact. It is not a retained release or installation claim. The browser size check binds these final bytes.

### P5 Built Stdio and Coordinator Review

The coordinator launched the built CLI through the SDK `Client` and `StdioClientTransport`, with `mcp --profile backlog`. The result exposed five backlog tools and one UI resource alongside eight native resources. The UI URI is `ui://make-docs/backlog-review/v1.html`. Before the size-only repair, resource read returned MIME `text/html;profile=mcp-app`, 428,980 bytes, and SHA-256 `357b3f66389a2c173c2027a30435fdebebf7bf6a0e9ba3dbc711f1d9b1f1173a`. Bytes matched the canonical asset. All four CSP domain lists were empty. Synthetic open returned all seven P3 report records in client metadata and a concise model summary without a snapshot leak. The first probe wrongly assumed that total resource count was one. UI filtering corrected that probe assumption. No source fix was needed.

The final byte/MIME/hash recheck after the size repair used `process.execPath` with `dist/index.js mcp --profile backlog` from `packages/cli`, read the fixed UI URI, compared it with the canonical HTML, and closed the client. It passed with MIME `text/html;profile=mcp-app`, 429,014 bytes, and SHA-256 `e0ad954b6ff12e1ebb40c991be0454f4a0e9f973e704172215d3ab64a9304e26`. This supersedes the earlier resource bytes and hash only. It changed no external host setting, Store entry, or installation. Built stdio proves resource delivery, not visible production host display.

In the synthetic browser harness, the coordinator observed readable dark and light narrow views. Attention preceded Next. Work and Data stayed under Backlog. A Next action selected W2 R3, showed one of seven records, and focused its disclosure. Enter opened Facts, Inference, and Recommended action. The audit stayed at zero tool calls and agent messages. Changed, unavailable, and malformed inbound results kept the selected expanded prior report visible and gave a next action in chat or source access. Theme changes kept the same zero-call/message audit. The coordinator also inspected the final wide, phase/detail, print, and clean narrow captures described below.

### P5 Optional Guided Review

On 2026-10-04, the coordinator offered one advisory goal at `http://127.0.0.1:43125/`: use Attention and Next to choose a wave, then open its details. The path had three steps. The owner answered “Clear; no change.” Record `feedback-recorded`, with no resulting change at that time. This supports only the choose-wave/details path. It did not approve the status notice's UI, content, or placement. It adds no final-byte, production-host, independent-use, or installed claim. No general response gate or deferred obligation was created. The later owner finding follows below.

## P5 Browser and Acceptance Evidence

The browser agent exercised the source widget in a local synthetic Chromium iframe. The retained [browser result](evidence/p5/browser-results.json) has 20 resumed checks, all passed, bound to the pre-size-repair HTML hash `357b3f66389a2c173c2027a30435fdebebf7bf6a0e9ba3dbc711f1d9b1f1173a`. An earlier local-control pass covered search, clear, keyboard filter/sort, keyboard Data, exact JSON, user-started print/download, and zero network/tool/message effects. It passed before a harness-only selector failure. Those controls were not repeated for reassurance.

The final six captures replace the initial misnamed dark and outer-audit-overflow captures. The coordinator inspected the corrected wide dark, narrow light/dark, six-phase details, and print views. Wide light had also passed. These are synthetic view observations. The size-only repair changed no accepted CSS, body, words, or local control behavior, so this visual proof remains applicable.

| View | Retained capture | Size |
| --- | --- | --- |
| Wide light | [Capture](evidence/p5/wide-light.png) | 1280 × 1763 |
| Wide dark | [Capture](evidence/p5/wide-dark.png) | 1280 × 1763 |
| Narrow light | [Capture](evidence/p5/narrow-light.png) | 390 × 3417 |
| Narrow dark | [Capture](evidence/p5/narrow-dark.png) | 390 × 3417 |
| Phase and detail | [Capture](evidence/p5/phase-details.png) | 1280 × 1394 |
| Print | [Capture](evidence/p5/print.png) | 1280 × 1384 |

All four screen views have no horizontal overflow. Headings, rules, tallies, spacing, and content remain readable. Attention precedes Next. Work and Data stay under Backlog. The six phase meanings match the fixed legend. Wave detail keeps Facts, Inference, and Recommended action distinct. Keyboard disclosure has a visible two-pixel outline. Reduced motion removes transitions and smooth scroll. Print shows Work, hides Data and display controls, and keeps Attention → Next → Backlog order. Host failure keeps the reviewed report. Hostile project text stays literal. The resumed audit recorded zero tool calls and agent messages. Saved JSON equals the complete normalized seven-record V1 report.

The earlier P3 saved-file browser policy restriction remains historical. P5 did not rehost that saved file. It tested the live source resource through a synthetic harness. The browser tool delay and wrong harness selectors were tool or harness limits. They were not product defects. Source report identities and contract meaning stayed unchanged.

The affected-only [size retest](evidence/p5/size-results.json) uses final HTML hash `e0ad954b6ff12e1ebb40c991be0454f4a0e9f973e704172215d3ab64a9304e26`. A one-record phase fixture grows to Data height 1422, then shrinks to Work height 1123. Report bottom, content edge, and reported frame height agree. The footer is inside the frame. Tool and agent-message counts stay zero. The coordinator inspected the [final Work capture](evidence/p5/after-size-repair.png): order, visible focus, and content remain intact, with no large blank tail. The viewport-floor bug is resolved. No unchanged browser matrix was repeated.

The final browser command was `node docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence/p5/size-checks.mjs w25p5views <temporary-directory>`. The browser agent closed its sessions, stopped loopback port 43125, confirmed the port was unavailable, and removed its unique temporary directory. No browser run output remains in the checkout. The 12 retained files are three scripts, two JSON packets, and seven PNGs. The three scripts pass `node --check`. No production host, installed setup, Store, branch, staging, or commit state changed.

### P5 Task and Acceptance Results

| Item | Result and evidence |
| --- | --- |
| t1 / A33 | Shared-model rendering keeps Attention before Next and Work/Data under Backlog. Earlier body/CSS parity binds the baseline. The approved live-only footer is the deliberate later difference. Final affected browser order and report context agree. |
| t2 / A34-A35 | Accepted colors, status reasons, six phase meanings, detail classes, type, rules, and spacing remain distinct. The coordinator passed wide/narrow/light/dark/print review. |
| t3 / A36 | Pass within final source/browser scope. Owner-approved live footer placement/labels, retained reports, no-model chat recovery, failed/missing bridge, and valid large changed state have affected proof. Static footer and masthead link remain. P5 executes no P6 action. |
| t4 / A37 | Local-control tests, the earlier browser control pass, and coordinator interaction produce zero `tools/call` and agent `ui/message` requests. Display-size notifications carry layout only. |
| t5 / A38 | Data is lazy. User-started JSON contains the complete validated model, independent of local filters. Browser download equality and focused checks pass. |
| t6 / A39 | Accepted control names and keyboard paths remain intact. Bounded browser keyboard use, visible focus, reduced motion, safe hostile text, and focused checks pass. |
| A40 | Pass within source and finite browser scope. The owner-approved footer remedy and larger-input adapter repair have final actual-source proof. Required agent review finds no material visible/control defect in that scope. The unattributed inspection log stays an explicit limit. |

### P5 Required Human Experience Review

Reviewers on 2026-10-04: widget code agent, browser proof agent, and coordinator. The coordinator inspected the actual synthetic view and the corrected retained captures. The source-guide agent records those observations against the accepted promises. This is the earlier bounded agent review. The later owner finding does not erase those observations but reopens the status/notice UI and whole-surface completion claim.

| Promise | Observation and conclusion | Limit and next useful action |
| --- | --- | --- |
| Familiar report meaning | Exact accepted presentation reuse and actual views preserve order, status/phase meaning, claims, and detail. No material presentation loss was found. | This proves the source view. Use P7 for installed acceptance. |
| User control | Local controls change the view only. The audit has zero agent/tool requests. Source paths remain available for chat recovery. | P5 has no agent action workflow. Use the active chat; P6 will connect calls/messages/tasks under its own authority. |
| Honest feedback | Ready, changed, unavailable, and invalid results explain the state and preserve a valid prior report. Empty fallback does not invent one. | Old conclusions remain limited after changed or unavailable facts. Retry source access or request review in chat. |
| Deliberate Data and export | Startup does not format full JSON. Data and download expose the full report only after a user action. | Client metadata is readable, not secret storage. Do not put secrets there. |
| Readable access | Names, keyboard use, visible focus, reduced motion, narrow/wide themes, and print pass the bounded review. | This is not broad assistive-technology or real-host proof. P7 can test the accepted installed candidate. |
| Layout follows local content | The Data-to-Work height finding received a narrow repair and an exact-byte browser shrink retest. | Display-size messages prove synthetic host adaptation only. A production host still needs its own observed proof. |

The 2026-10-04 required agent review is retained for its exact observed source behavior. The 2026-10-06 footer review below resolves the later scoped finding. The owner's earlier “Clear; no change” supports the choose-wave/details path only; footer placement/words received separate “Yes, approved” feedback. Current A40 passes within the finite source/browser proof and inspection limit. No new general response gate, unassisted-use claim, speed claim, or obligation follows.

### P5 Testing and Coverage Limits

The four common decisions remain in the [P5 work record](05-live-widget-and-local-interaction.md#current-testing-decisions). Automated checks are required with a finite affected-first budget. Actual failures and material changes received only affected reruns. The earlier Guided Progress Review is advisory and has bounded feedback above. The later owner approval covers only the named footer placement/words. Performance Testing and Unassisted Goal Testing are `not-needed-now`, with zero runs. Required agent Human Experience Review remains separate. Its earlier technical observations are reused, and the final footer review resolves the scoped finding within its evidence limits.

Guide coverage is `update-existing`: five upstream Markdown guides state the full local widget, safe client data, local controls, source-path recovery, and feedback limits. Chat/static remain usable without CLI or Store. Saved-file and separate-task consent is unchanged. Installed Skill copies and accepted static source were not edited. PRD reconciliation is `link-only`; no accepted product rule changed. The user's 2026-10-06 closeout instruction authorizes history coverage `create`: one [P5 record](../../../.make-docs/archive/history/2026-10-06-w25-r0-p5-live-widget-and-local-interaction.md) records this session. No prior P5 history existed.

P5 is closed on 2026-10-06 within source and finite browser scope. The footer and larger-input adapter findings are resolved by affected proof. t1-t6 and A33-A40 have bounded evidence. The user authorized the reviewed local commit. P6 refresh calls, controlled review messages, task actions, and P7 acceptance remain pending separate authority. No production host, installed acceptance, Store write, host setting, publication, or release claim is made.

## P5 Owner Status UI Finding — 2026-10-06

The owner said “Overall I think it passes.” The owner found the rest of the report fine. At the initial review, the multiple statuses above the masthead were unaccepted. Their UI, content, and placement had not been reviewed with the owner. This opened a material finding in the status/notice block. The coordinator's source/PRD review found that its location is a P5 implementation choice, not a mandated product location.

Current conclusion: resolved within the final source and finite browser proof below. t3 and A40 are complete within that scope. Existing tests, synthetic browser proof, source hashes, agent observations, and other completed tasks remain valid within their earlier scope. The earlier “Clear; no change” concerned only choosing a wave and opening details. Footer approval was separate and explicit.

The owner's next direction was: “Status message should be in the footer. Remove the ‘Open the project’ link from the footer and show a permanent ‘Status: <status>’.” On 2026-10-06, the owner answered “Yes, approved” to the preview placement and exact five labels below. The approved change removes above-masthead notices and replaces only the live footer's `Open the project` link with permanent plain `Status: <status>`. The static report footer and masthead link stay unchanged. The rest of the owner's report feedback remains valid.

The approved [footer preview](http://127.0.0.1:52444/?state=current) used the retained 2026-10-04 report with 73 records and simulated statuses. It was not a fresh 2026-10-06 review. Preview files stay outside the repository. Its source-before/source-after check preceded implementation and changed no actual P5 source. It establishes the approved placement and words, not actual-source completion.

| Simulated state | Owner-approved status words |
| --- | --- |
| Normal | `Ready` |
| Checking | `Checking source facts` |
| Changed | `Needs review` |
| Source failure | `Last reviewed report — source unavailable` |
| Bad update | `Last reviewed report — update failed` |

Scoped preview QA passes for light, dark, narrow, and paired views at the same viewport. One Next-to-W25 keyboard detail path works. A temporary DOM readiness guard repaired preview startup. Fresh console error logs are empty after that repair. An old observer log had no source URL or stack and establishes no actual P5 source finding.

At the preview checkpoint, canonical HTML was unchanged at SHA-256 `e0ad954b6ff12e1ebb40c991be0454f4a0e9f973e704172215d3ab64a9304e26`. Widget entry was unchanged at SHA-256 `2b7cc9763f7181ce557607fa7c069a6b6c38eb79e090488aa76d57c4b8008a03`. These are historical preview-base hashes. Actual-source remediation needs its own final identities and affected proof.

Rare-state scope stays bounded. Before any valid report is loaded, show `Status: Report unavailable` plus the existing empty copy `No report is loaded. Ask for a backlog review in chat.` Invalid data or unavailable browser crypto keeps that empty state. With a loaded model, invalid/cancelled/failed updates or missing/failed bridge keep the report and show the approved update-failed label; local controls stay usable. Source-refresh failure alone uses source unavailable. `Ready` means a valid report is displayed. Checking follows strict matching refresh input only. Longer recovery meaning stays in guidance and the empty state. The footer remains status text.

The approved bounded source remediation and affected browser states pass. The user then separately authorized P5 closeout and a local commit on 2026-10-06. No general owner response gate is added. P6/P7 remain outside that authority.

The initial 2026-10-06 finding update changed project records only. This approval pass updates those records and upstream guidance. The code agent owns the bounded source remediation. Installed resources, PRDs, Store/host state, branches, history, staging, commit, and P6 remain outside this pass. Reuse unaffected earlier P5 proof and count each test once.

During actual-source review, a valid 73-record changed refresh was rejected. The browser crypto adapter allowed only 32 missing hashes. Smaller fixtures passed, but they did not prove this larger input. The code agent replaced that bound with strict batch-native SHA validation under unchanged authoritative hash/schema rules. A greater-than-32-record regression covers unchanged/changed refresh and rejected-to-valid recovery. The final 73-record changed browser result passes. This finding is resolved. Intermediate HTML hash `345e98fb764e671bdbfc6ced0645d015ad459ac1ccc272b28c6f5be3b08641b2` remains historical evidence, not the final source identity.

The coordinator's smaller-fixture checking, unavailable, and invalid states retained the prior report and made zero tool calls or agent messages. Those observations remain valid within that input scope. The adapter-only repair changes no entry, label, CSS, or local control behavior. The final larger-input result resolves the source validation finding without a new product choice, performance claim, or Unassisted Goal Testing gate.

### Final Actual-Source Footer Proof — 2026-10-06

The [saved browser review](evidence/p5/footer-browser-review.md) passes. The coordinator inspected the actual canonical resource, not a preview overlay. The paired 742 × 1314 dark views match the approved top and footer placement. The report masthead link, title, lead, tallies, Attention, Next, phase/claim meaning, and local controls remain. Only the live footer link is replaced. Static template and static renderer remain unchanged.

Final [resource proof](evidence/p5/footer-resource-proof-final.json) records exact built stdio/source parity: 427,214 bytes, SHA-256 `134ffdc7635434bf1cbdbf3a908166036d68654a321c0e6d12fc34e1f9c7869a`, MIME `text/html;profile=mcp-app`, the fixed UI URI, CSP, and UI metadata. The SDK stdio child closed before the local browser parent started. This is source/stdio/synthetic-browser evidence, not production-host or installed proof.

The final [73-record changed view](evidence/p5/footer-source-large-changed-final.jpg) shows `Needs review`, retains all 73 records, nine in scope, and the reviewed W25 details. Its DOM proof matches the final source hash. All four counters are zero: tool calls, agent messages, prints, and downloads. The final [normal view](evidence/p5/footer-source-ready-final.jpg) shows `Ready`. Fresh error logs are empty before and after dark theme and footer actions.

The smaller checking/source-failure/bad-update cases retain the report and exact approved labels. Checking follows validated matching refresh input. Settled missing and rejected bridges retain valid data and the update-failed footer, including after a later valid result. The separate no-model view shows `Report unavailable` and the existing chat next action. The 390 × 844 failed-bridge capture keeps its long status readable. Data-to-Work size changes retain the footer inside the frame. Keyboard disclosure opens Facts, Inference, and Recommended action. The saved review retains the exact observations and capture links. Earlier unchanged display, Data/download, and print proof is reused.

Required agent conclusion: the approved footer placement/words and preserved report/control boundary are satisfied within the finite reviewed scope. t3 and A40 are resolved. The owner's explicit approval covers the footer choice; it is not a production-host, fresh-review, or lived-use claim.

One changed-tab observer log has no source URL or stack. The canonical widget and parent contain no MutationObserver, and no material visible/control fault accompanied it. Attribution is unsupported. This record does not claim an empty changed-tab error log or invent a source repair. The fresh normal tab logs are empty. An attributable stack or visible fault would trigger a check of that exact case.

### Footer Correction Code Checks

Current unique selected cases total 405: revised widget48, prior affected304, and prior defaults53. The final affected run passes 159 cases in five suites: live-contract41, presentation30, review-operations34, Skill14, and MCP-app40. All 159 overlap the prior304. The revised48 replace the earlier35/47; repeated runs are not added. The final Skill14 ran after the two-guide freeze. Defaults53 are reused because template, registry/manifest/default list, dependency, and package allowlist inputs did not change.

Final focused/affected commands pass under Node `v24.19.0`. Type checks, build, generated drift, and whitespace checks also pass:

```text
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm test --workspace @brucewaynedecoy/make-docs -- tests/backlog-widget.test.ts
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm test --workspace @brucewaynedecoy/make-docs -- tests/backlog-live-contract.test.ts tests/backlog-presentation.test.ts tests/backlog-review-operations.test.ts tests/backlog-review-skill.test.ts tests/mcp-app-contract.test.ts
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" node node_modules/typescript/bin/tsc --noEmit -p packages/cli/tsconfig.json
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm run build --workspace @brucewaynedecoy/make-docs
"$HOME/.nvm/versions/node/v24.19.0/bin/node" packages/cli/scripts/build-mcp-app-assets.mjs --check
git diff --check
```

The actual-resource probe used Node24 with `--import ./node_modules/tsx/dist/loader.mjs <temporary-source-root>/actual-source-harness.mjs`. The local path spelling is sanitized. The retained final resource proof contains the result. No 8 MB report or temporary preview asset is copied into the checkout.

| Final source or asset | Bytes | SHA-256 |
| --- | ---: | --- |
| [HTML](../../../packages/cli/src/mcp/assets/backlog-review-v1.html) | 427,214 | `134ffdc7635434bf1cbdbf3a908166036d68654a321c0e6d12fc34e1f9c7869a` |
| [Generated TS](../../../packages/cli/src/mcp/assets/backlog-review-v1.ts) | 457,642 | `8ff548ca3c955813b75724b811aee4b6853ebba504411661cdbd4e7c07c72048` |
| [Browser crypto](../../../packages/cli/src/mcp/widget/browser-crypto.ts) | 2,228 | `270f55112aec7b1945a48370e84b928ee79de85412252deedaaee6bd7d42b05b` |
| [Entry](../../../packages/cli/src/mcp/widget/entry.ts) | 5,893 | `adb4c10fb7d15992ae958cbf80cb859b3526b5befd43ec99d9174ecfd78eb03d` |
| [State](../../../packages/cli/src/mcp/widget/state.ts) | 4,129 | `8fde96688706afde848a4e7ce1c7ec2d888257528899a74968d35a92d9268b36` |
| [Generator](../../../packages/cli/scripts/build-mcp-app-assets.mjs) | 5,511 | `b7351653f2d7d678c9cdb75b0b0c8d55cf9b6adaf8d402bb82e9d1bb24bd267b` |
| [Widget tests](../../../packages/cli/tests/backlog-widget.test.ts) | 25,165 | `1e70e96be6799481c855a626c9ee566e8a64e73fdbdd777d63b2bf9454435dfb` |
| Built `dist/server-3DTZJ3VE.js` | 463,444 | `06a631d05c159cf13101bb3327b0fb2f5db0a4c0c3349170534c0b05cf4cf0f0` |

The static renderer remains `e7114a01f8f27b94ec6e0ccb02d26a30d0b3b7acc1c6325cf657bfce990a9d6e`. The static template remains `118b2611be0e2b39f6c0d6c69f4282fde8e0144dfb7af39511db70fb3e7c54e2`. Shared backlog contracts and upstream template source have no diff. The approved live-only footer is the deliberate presentation difference.

At the final implementation checkpoint, branch `w25-r0-p1-live-delivery-contract`, HEAD `19c19f42d90d836ed7c1a5e23f7abf1230bee1c2`, and empty staging were unchanged. No history or commit was created during that implementation pass. The user's later closeout instruction authorizes both. The source hashes and test results remain the tested pre-commit evidence.

### Footer Correction Document Checks

Seven changed Markdown paths cover the four project records, two source guides, and saved browser review. Current jdoc source/content hashes and scoped links are checked. The content path command is:

```text
node packages/cli/dist/index.js project path-hygiene validate --target-root . --scope content --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/05-live-widget-and-local-interaction.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md --path docs/plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/05-live-widget-and-local-interaction.md --path packages/skills/backlog-review/README.md --path packages/skills/backlog-review/references/review-method.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence/p5/footer-browser-review.md --format json
```

### P5 Final Document Checks

The built read-only command passed:

```text
node packages/cli/dist/index.js run prd authority validate --target-root .
```

It checked 35 PRDs, 586 source Markdown bodies, and 1,105 links with zero diagnostics. No PRD change was needed.

The changed-path content check passed for nine Markdown files with zero findings, zero I/O errors, and zero writes:

```text
node packages/cli/dist/index.js project path-hygiene validate --target-root . --scope content --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/05-live-widget-and-local-interaction.md --path docs/plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/05-live-widget-and-local-interaction.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --path packages/skills/backlog-review/SKILL.md --path packages/skills/backlog-review/README.md --path packages/skills/backlog-review/references/review-method.md --path packages/skills/backlog-review/references/report-model.md --path packages/skills/backlog-review/references/html-report.md --format json
```

An earlier pass found eight private home-path spellings in the test-command block. The evidence now uses the equivalent `$HOME` spelling. Exact operation arguments, Node version, results, and source hashes are retained. The corrected pass is clean. A path-hygiene MCP call had stalled earlier; it was not repeated. The built CLI completed the bounded check. This was a tool limit, not a product defect.

The source-guide agent refreshed only the nine changed Markdown paths with jdocmunch. Current task, acceptance, coverage, state, and source-guide sections have verified content and source hashes. Scoped links from those nine files have zero broken targets, including the retained evidence links. This is not a global link-clean claim.

`git diff --check` passes for tracked edits. The coordinator's new-file check first found three whitespace-only lines in the untracked generated renderer. The generator repair removed ten spaces from those blank lines. Accepted static source and canonical HTML/TS bytes are unchanged. Generated drift, a direct trailing-space scan, and two affected tests pass:

```text
"$HOME/.nvm/versions/node/v24.19.0/bin/node" packages/cli/scripts/build-mcp-app-assets.mjs --check
PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" npm test --workspace @brucewaynedecoy/make-docs -- tests/backlog-widget.test.ts -t 'accepted layout and generated bytes'
```

That narrow test run passed two cases and skipped 33. The two cases are already within the 35 widget cases. The 392 unique count stays unchanged. The earlier browser and built-resource proof stays valid because its HTML bytes did not change. The coordinator repeated `git diff --no-index --check /dev/null <path>` for all 12 untracked text files. All had no whitespace output. Exit one in that mode is the normal new-file difference. Tracked `git diff --check` also passes.

At final review, branch `w25-r0-p1-live-delivery-contract`, HEAD `19c19f42d90d836ed7c1a5e23f7abf1230bee1c2`, and the empty staging area are unchanged. No P5 history, installation, Store operation, host configuration, staging, or commit was made in this implementation turn.

## P5 Closeout — 2026-10-06

The user explicitly asked to close W25 R0 P5 and then commit it. P5 is closed within the source and finite browser scope already proved. Tasks t1-t6 and A33-A40 remain complete. The owner-approved live footer and repaired large-input validator are preserved. Current final resource is 427,214 bytes, SHA-256 `134ffdc7635434bf1cbdbf3a908166036d68654a321c0e6d12fc34e1f9c7869a`. The tested pre-commit checkpoint remains based on `19c19f42d90d836ed7c1a5e23f7abf1230bee1c2`. These records belong to the P5 phase closeout commit.

Closeout reuses 405 unique selected cases across finite runs. The final48 and overlapping159, type/build/drift, exact stdio proof, and saved browser review already pass. Source bytes did not change during closeout. No code test or browser review is repeated. The required agent review and scoped owner approval remain valid. The unattributed changed-tab observer log remains a limit; fresh normal logs are empty.

Coverage updates the existing records and central evidence, retains upstream guide coverage, links current PRD 51, and creates one [canonical history](../../../.make-docs/archive/history/2026-10-06-w25-r0-p5-live-widget-and-local-interaction.md). Performance and Unassisted Goal Testing remain `not-needed-now`; no scenario or obligation is created. P6/P7 remain pending. P6 is next eligible and needs separate implementation authority.

The current history contract and parent archive router govern the canonical path. The nested history router still names an old location. It was not changed. The earlier same-named `docs/history.md` and `docs/.references/commit-message-convention.md` remain absent after scoped refresh and retry. Valid local history and commit contracts supplied the closeout authority.

Root owns staging the exact reviewed file set and executing the local commit. No future commit SHA is placed in its own records. This authoring pass changes only the four closeout records and this one history. It changes no source, guide, PRD, installed resource, Store, host setting, or branch. Push, installation, publication, release, and P6/P7 implementation remain outside authority.

### P5 Closeout Document Checks

`node packages/cli/dist/index.js run prd authority validate --target-root .` passes: 35 PRDs, 586 source Markdown bodies, 1,105 links, and zero diagnostics.

The normal-path check passes for four closeout documents, with zero findings, I/O errors, or writes:

```text
node packages/cli/dist/index.js project path-hygiene validate --target-root . --scope content --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/05-live-widget-and-local-interaction.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md --path docs/plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/05-live-widget-and-local-interaction.md --format json
```

The public canonical-history check reports the known legacy limit:

```text
node packages/cli/dist/index.js project path-hygiene validate --target-root . --scope content --path .make-docs/archive/history/2026-10-06-w25-r0-p5-live-widget-and-local-interaction.md --format text
Path check error: Invalid content path: .make-docs/archive/history/2026-10-06-w25-r0-p5-live-widget-and-local-interaction.md
```

That command exits two before inspecting the history. The current history contract and parent archive router require the canonical path. The new record stays there. Current jdoc structure/content, relative links, and whitespace checks support that record separately. No installed router or public path-rule repair is made.

`git diff --check` passes. `git diff --no-index --check /dev/null .make-docs/archive/history/2026-10-06-w25-r0-p5-live-widget-and-local-interaction.md` has no whitespace output. Its exit one is the normal new-file difference. The scoped phase Markdown link result and current section hashes are checked before staging. The commit message uses the exact history Changes first paragraph. No source test is repeated.
