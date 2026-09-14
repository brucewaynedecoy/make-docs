# W19 R6 Unified Setup and Harness Access Evidence

## Current Result

P1 produced a foundation code candidate. Independent code review found no blocking defect inside the reviewed candidate scope. Later product review found that the production feature path is incomplete. P1 is not accepted feature delivery.

Automated proof supports several components. It does not prove a selectable production method, a complete setup flow, real-harness conformance, or lived Human Experience Review.

## 2026-09-14 Gap Assessment

| Gap | Current evidence | Effect |
| --- | --- | --- |
| Central support data is absent | `conformance/tuple-registry.json` has an empty `tuples` array. | No exact method can become supported. |
| Production setup does not load central evidence | The adapter support path accepts in-memory evidence, but the normal CLI supplies none. | Every method remains unavailable. |
| Support is test-only | `reviewedAdapterPlansForTests` is rejected outside `NODE_ENV=test`. | P1 apply and recovery proof does not exercise the production route. |
| Tuple authority conflicts | PRD 20 requires seven parts. `packages/cli/src/conformance/tuple.ts` still uses the retired eight-part package tuple. PRDs 43 and 44 stated six parts before P2 reconciliation. | Setup evidence cannot have one exact identity. |
| Project intent has no production writer | The config loader reads `harnessIntegrations`. Tests write it directly. | Project setup cannot save the reviewed choice. |
| Rule caller identity is incomplete | MCP entries carry `MAKE_DOCS_HARNESS_CALLER_IDENTITY`. Rule entries do not provide an equivalent proved path. | The operation policy cannot prove the reviewed rule method. |
| Claude Code sandbox proof is absent | Native permission-file fixtures do not prove the separate Claude Code sandbox file-access boundary. | A rules method could still fail on the Store or require unsafe broad access. |
| Installed acceptance is absent | No real Codex or Claude Code result and no installed Human Experience Review exist. | W19 R6 cannot close or release. |

These gaps are tracked by [D-033](../../prd/03-open-questions-and-risk-register.md#d-033-w19-r6-setup-support-is-not-connected-to-the-production-conformance-path) and [Phase 2](02-corrective-production-path-and-acceptance.md).

## Candidate Checks

| Check | Result |
| --- | --- |
| `cd packages/cli && ../../node_modules/.bin/vitest run tests/w19-r6-access-config.test.ts tests/w19-r6-harness-adapters.test.ts tests/w19-r6-harness-system-operations.test.ts tests/w19-r6-setup.test.ts tests/cli.test.ts tests/operation-domains.test.ts tests/mcp-derivation.test.ts tests/p6-global-store-lifecycle.test.ts tests/p3-operation-surfaces.test.ts tests/registry-contract.test.ts tests/wizard.test.ts` | 11 files and 230 tests passed in 22.39 seconds. |
| `npm test -w packages/cli` | 87 files and 1,362 tests passed. |
| `npm run build -w packages/cli` | Passed. |
| `npm run test:smoke-harness` | Passed with 13 tests. |
| `npm run smoke:pack:local` | Passed with isolated temporary homes. |
| `node packages/cli/dist/index.js run prd authority validate --target-root .` | Passed with 39 PRDs, 541 Markdown records, 199 structured records, 1,050 links, and no diagnostics. |
| `git diff --check` | Passed. |
| `tsc --noEmit` | Stopped only at the known committed baseline error in `packages/cli/src/store/installation-state.ts:484`. That file has no W19 R6 diff. |

The pack smoke used temporary user homes. No user home config write occurred.

## Documentation Pass Checks

The targeted content check used `node packages/cli/dist/index.js project path-hygiene validate --target-root .` with the eight changed W19 R6 plan, work, evidence, and guide files. It passed with eight files checked, no findings, and no file changes.

After the guide changes, `node packages/cli/dist/index.js run prd authority validate --target-root .` passed with 39 PRDs, 544 Markdown records, 199 structured records, 1,052 links, and no diagnostics.

`git diff --check` passed after the documentation changes.

## Evidence Limits

- No real Codex or Claude Code conformance run occurred.
- No harness method has exact real-harness support evidence.
- Restricted-task Store-free and Store-backed proof remains open.
- Installed terminal review remains open.
- Human Experience Review remains open. An agent cannot certify lived ease or confidence.

## Guide Coverage

- User guidance: [Setting Up Projects and Harness Access](../../assets/user/cli-setting-up-projects-and-harness-access.md).
- Maintainer guidance: [Maintaining Setup and Harness Access](../../assets/maintainer/cli-maintaining-setup-and-harness-access.md).

## Phase State

P1 is an incomplete acceptance attempt and foundation code candidate. P2 is authorized and not started. W19 R6 remains incomplete and unreleasable.

P2 must add links for every production test, exact real-harness result, and Human Experience observation in its promise trace. A passing unit or integration test cannot replace a missing production or real-harness result.
