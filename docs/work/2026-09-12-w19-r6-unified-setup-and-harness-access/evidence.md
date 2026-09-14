# W19 R6 Unified Setup and Harness Access Evidence

## Current Result

P2 is superseded. Its production code and automated checks followed obsolete Playbooks conformance authority. They do not define the current acceptance target.

The P2 results still give useful evidence about setup, config preservation, Store-free reads, MCP caller identity, native writes, and cleanup. P3 must classify each changed block as `keep`, `rework`, or `remove`.

The exact runtime fact gap is no longer a requested product gap. It came from the invalid tuple gate. P3 replaces that gate with static Codex and Claude Code adapters.

W19 R6 remains incomplete. P3 implementation and Human Experience Review have not started. D-033 stays open.

## P3 Authority Correction

- The current product needs built-in adapters for known installed harnesses.
- It does not need dynamic capability discovery or result promotion.
- PRDs 20, 43, and 44 came from the removed Playbooks system.
- P2 made those PRDs production setup authority.
- The tuple, registry, scenario, provider, model, runtime, and harness-result assertions came from that authority.
- Those assertions were valid tests of P2. They were not valid requirements for the current product.
- P3 must remove the invalid authority before it changes production code or acceptance tests.
- The [P3 design](../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md), [plan](../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/03-static-harness-adapters-and-conformance-retirement.md), and [work phase](03-static-harness-adapters-and-conformance-retirement.md) define the correction.

## Production Implementation

This section records P2 implementation evidence. It is not the current product contract.

| Area | Current evidence | Result |
| --- | --- | --- |
| Support authority | `conformance/tuple-registry.json` is the sole version 2 source. The package build copies and validates only this file. | Passed. |
| Exact identity | Active tuples contain `scenario`, `harness`, `connectionMethod`, `surface`, `scope`, `modelOrProvider`, and `runtime`. Empty and wildcard values are rejected. | Passed. |
| Support decision | Setup requires an admitted method, exact tuple, qualifying result, exact product behavior, exact harness facts, and surfaced caveats. | Passed. |
| Test-only paths | In-memory support injection and `reviewedAdapterPlansForTests` are removed. Tests use the validated registry loader. | Passed. |
| Unified setup | Interactive, machine-only, dry-run, non-interactive, JSON, and MCP-safe projections use one setup service. | Passed. |
| Project intent | The YAML document writer changes only reviewed `harnessIntegrations` values. It preserves comments, order, quoting, unknown keys, and unrelated values. | Passed. |
| Native safety | MCP keeps caller identity. Rule routes need a harness-proved launch fact. Store-free reads do not open a Store session. | Passed in automated checks. Exact Codex harness proof is open. |
| Lab path | Maintainer bootstrap accepts one exact tuple, a packed product, and a disposable root. It uses production planners, writers, verifiers, operations, and cleanup. | Passed. |

Under P2 authority, normal setup correctly rejected support resolution when it lacked an exact harness version, model or provider, or runtime. P3 now treats that behavior as obsolete. P3 must remove the gate instead of adding more fact discovery.

## Packed Candidate Identity

| Fact | Value |
| --- | --- |
| Make Docs version | `2.0.0-rc` |
| Distribution | packed npm tarball in a disposable directory |
| Measured executable and behavior digest | `8a033ad9fb5e0267d734e825fdd2d08065cb960cee4f03098cc4fcba32a1a6e6` |
| Initial empty registry digest | `ebdb02cb3a17fe5f064d8cc02a0cef62819c500a463e41620baabdced54ff1f8` |
| Final promoted registry digest | `2d59d2bdc41131ab94bd9cfe3f3aba687a997dfb125eda16fb4e76a09199f39e` |
| Final tarball digest | `7d4751437047ce8cf4777b6a2f1323f162f8beadf001ed1117d5935e1b43a917` |

The final rebuild kept the executable behavior digest unchanged. It changed the packaged registry digest to the exact repo-root digest. This proves that registry promotion does not change measured product behavior.

## Real-Harness Results

| Harness path | Result | Support status | Evidence and next action |
| --- | --- | --- | --- |
| Claude Code MCP | Pass | `conformance-validated` | [Result](../../../conformance/results/claude-code/2026-09-14-mcp-store-operations-001.json). Caller identity, rejected write, allowed write, Store read, cleanup, and user-content preservation passed. |
| Claude Code direct CLI | Pass | `conformance-validated` | [Result](../../../conformance/results/claude-code/2026-09-14-direct-resource-read-001.json). Resource list and read passed. The absent Store path stayed absent. |
| Claude Code permission rules | Unsupported | `provisional` | [Result](../../../conformance/results/claude-code/2026-09-14-permission-rule-store-operations-001.json). The exact allow rule matched. A command outside the rule was blocked. Narrow Store access and a trusted launch identity did not pass. Keep this method unavailable under A35. Use Claude Code MCP. |
| Codex MCP | Blocked | `provisional` | [Result](../../../conformance/results/codex/2026-09-14-mcp-store-operations-001.json). Log in only inside a disposable Codex home, then repeat the run. |
| Codex command rules | Blocked | `provisional` | [Result](../../../conformance/results/codex/2026-09-14-bounded-rule-store-operations-001.json). Log in only inside a disposable Codex home, then prove allowed and denied commands plus the native launch fact. |
| Codex direct CLI | Blocked | `provisional` | [Result](../../../conformance/results/codex/2026-09-14-direct-resource-read-001.json). Log in only inside a disposable Codex home, then repeat the Store-free read run. |

All completed Claude Code sessions used Claude Code `2.1.258`, model `claude-sonnet-5`, and runtime `node-v24.19.0-darwin-arm64`. The Codex attempts used Codex CLI `0.154.0` and an explicit `openai:gpt-5.6-terra` tuple. The disposable Codex login check returned `Not logged in`.

Raw transcripts stayed in disposable session directories. Compact result records keep digest references. Cleanup removed the managed native entries and kept seeded user content.

## A35 Decision

A35 is the specific exception to the general missing-method close rule. Claude Code permission rules can remain unavailable when narrow sandbox Store access cannot pass. The recorded result meets that exception. Claude Code MCP remains the proved safe path.

This exception does not waive Codex MCP or Codex command-rule proof. Those paths still block P2 closeout.

## Final Automated Checks

| Check | Result |
| --- | --- |
| `npm test -w packages/cli -- --reporter=dot` | 88 files and 1,305 tests passed. |
| `npm run build -w packages/cli` | Passed. |
| `./node_modules/.bin/tsc -p packages/cli/tsconfig.json --noEmit` | Passed. |
| Focused support-lab and adapter checks | 25 tests passed. |
| `npm run test:smoke-harness` | 13 tests passed. |
| `npm run smoke:pack:local` | Passed from the promoted packed package in disposable homes. |
| `npm run validate:defaults` | 51 template and link checks passed. |
| `node packages/cli/dist/index.js run prd authority validate --target-root .` | Passed with 39 PRD files, 551 Markdown files, 206 structured files, 1,068 links, and no diagnostics. |
| `node packages/cli/dist/index.js project path-hygiene validate --target-root .` | The repository-wide check found 3,025 existing findings in 771 files. A filter over the changed W19 R6 plan, work, guide, registry, and result paths found no P2 finding. The check changed no file. |
| `git diff --check` | Passed. |

The full suite includes the W19 R3 shared Store gate, contention, pending-operation, receipt, checkout-writer, and recovery checks. It also covers the setup method flags, exact screen order, explicit `none`, dry-run and JSON parity, config preservation, repeat states, and Store-free reads with absent or unsafe Store state.

## Open Acceptance Work

- Get separate authority to implement P3.
- Retire PRDs 20, 43, and 44 from the active set. Move each valid current rule to one current owner.
- Classify the P2 diff by changed block before code cleanup.
- Replace tuple-gated setup support with static Codex and Claude Code adapters.
- Remove only conformance code and assets that have no current owner.
- Prove Codex MCP, Codex narrow rules, Claude Code MCP, and direct resource reads in disposable homes.
- Keep Claude Code permission rules unavailable if narrow Store access cannot pass.
- Complete the installed setup matrix and six-promise Human Experience Review.
- Re-run all P3 hard close checks.

## Human Experience Review

Status: `not-started`.

P2 did not receive Human Experience acceptance. P3 defines six current promises. Each promise must receive `satisfied`, `material gap`, or `insufficient evidence`. A material gap or insufficient evidence keeps P3 open.

## Phase State

P1 remains an incomplete acceptance attempt and foundation code candidate. P2 is superseded because it used invalid retained Playbooks authority. The P3 authority package is ready. P3 implementation is not authorized and has not started. W19 R6 remains incomplete and unreleasable. D-033 remains open.

No files were staged or committed. No package was installed into the real user home. Nothing was published or released.
