---
title: Conformance Lab Scenario and Result Contracts
path: maintainer/conformance
status: draft
persona: developer
order: 60
tags:
  - maintainer
  - conformance
  - support-claims
applies-to:
  - docs
  - validation
related:
  - ../../../prd/20-revise-agent-harness-model-conformance-lab.md
  - ../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-contract.md
  - ../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-harness-adapter-and-support-claim-gating.md
  - ../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-schema.md
  - ../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-adapters-and-support-claims.md
  - ./release-packaging-validation-and-release-reference.md
---

# Conformance Lab Scenario and Result Contracts

## Overview

The conformance lab is maintainer-only evidence infrastructure. It helps maintainers test make-docs behavior across agent harnesses and harness-selected models before making support claims. It does not replace package validation, and it is not installed into consumer projects by default.

Use this guide when defining reviewed scenario specs, compact result records, raw artifact storage, and redacted evidence promotion. Keep the lab outside shipped templates and packages unless a later accepted design explicitly promotes a reviewed subset.

## Project Orientation

| Surface | Purpose | Source-control rule |
| --- | --- | --- |
| Scenario specs | Define the behavior to exercise, the safety mode, and the expected evidence. | May be committed only when compact and reviewed. |
| Result records | Capture the exact scenario/harness/model/provider/runtime tuple and reviewed verdict. | May be committed only when compact and reviewed. |
| Raw artifacts | Hold transcripts, provider logs, temporary workspaces, raw diffs, and run scratch data. | Generated local state under `.make-docs/conformance/<run-id>/` or `.make-docs/runs/conformance/<run-id>/`; not committed by default. |
| Redacted evidence bundles | Preserve the minimum evidence needed for disputed or stronger support claims. | Opt-in only after review and redaction. |

Do not add lab assets to `packages/docs/template/`, copied `packages/cli/template/`, package allowlists, Rust package surfaces, or provider-backed system asset delivery as part of routine lab work.

## Scenario Specs

Every scenario spec must be small enough to review and stable enough to rerun. Use YAML or JSON, but preserve the same field names.

```yaml
schemaVersion: "conformance.scenario.v1"
scenarioId: "docs-assets-install-dry-run"
scenarioVersion: "1.0.0"
title: "Docs assets install dry run"
sourceRequirements:
  - "docs/prd/20-revise-agent-harness-model-conformance-lab.md"
safetyMode: "dry-run"
requiresNetwork: false
requiresCredentials: false
destructive: false
prerequisites:
  - "Node.js is installed."
steps:
  - kind: "command"
    run: "npm run validate:defaults -w packages/cli"
expectedEvidence:
  - "Command exits 0."
  - "No raw provider transcript is required."
artifactPolicy: "local-generated"
supportClaimScope: "scenario-harness-model-provider-runtime"
```

Required fields:

| Field | Requirement |
| --- | --- |
| `schemaVersion` | Use `conformance.scenario.v1` until a later accepted change revises the schema. |
| `scenarioId` | Stable lowercase kebab-case id. |
| `scenarioVersion` | Version for meaningful scenario changes. |
| `title` | Human-readable title. |
| `sourceRequirements` | PRD, plan, work, or guide paths that justify the scenario. |
| `safetyMode` | One of the approved safety modes below. |
| `requiresNetwork` | Boolean. `true` means a run can be blocked when network is unavailable. |
| `requiresCredentials` | Boolean. `true` means a run can be blocked when credentials are unavailable. |
| `destructive` | Boolean. Destructive scenarios must target temp fixtures only. |
| `steps` | Ordered commands or human/harness actions. |
| `expectedEvidence` | Observable evidence required for a verdict. |
| `artifactPolicy` | Usually `local-generated`; use `redacted-review-bundle` only after review. |
| `supportClaimScope` | Must stay scoped to the scenario/harness/model/provider/runtime tuple. |

## Safety Modes

Use exactly one safety mode:

| Safety mode | Use for |
| --- | --- |
| `read-only` | Inspection-only scenarios that should not write files. |
| `dry-run` | CLI or harness flows that preview writes without applying them. |
| `temp-fixture-apply` | Writes into a disposable fixture workspace. |
| `destructive-temp-fixture-apply` | Destructive behavior in a disposable fixture workspace only. |
| `external-provider-run` | Runs requiring network access, provider accounts, or harness model routing. |

Never run destructive scenarios against a maintainer working tree. If required credentials, network access, provider accounts, model routing, or harnesses are unavailable, record a `blocked` result instead of inventing evidence.

## Harness Adapter Protocol

The first executable lab coverage is limited to the current make-docs harness ids in `packages/cli/src/types.ts`:

| Adapter id | Current product harness | Instruction file | Status |
| --- | --- | --- | --- |
| `codex` | Codex | `AGENTS.md` | Current executable lab target |
| `claude-code` | Claude Code | `CLAUDE.md` | Current executable lab target |

Adapter ids must stay separate from model names and providers. A Codex run with one OpenAI-routed model, a Claude Code run with one Anthropic-routed model, and a future provider-routed open-weight model are three different support-claim tuples.

Future adapter targets are reserved but not current shipped harnesses:

| Future target | Current status | Required before support wording |
| --- | --- | --- |
| OpenCode | Future lab adapter target | Accepted implementation plus reviewed scenario results |
| Goose | Future lab adapter target | Accepted implementation plus reviewed scenario results |
| Pi | Future lab adapter target | Accepted implementation plus reviewed scenario results |
| Future agentic IDEs | Future lab adapter targets | Accepted implementation plus reviewed scenario results |

Do not describe a future target as supported because the scenario protocol can name it. Until an adapter exists and a reviewed result records the exact scenario/harness/model/provider/runtime tuple, runs for that target are `blocked` or unattempted.

## Result Records

Result records must be compact and tuple-specific. A result for one tuple is not evidence for a different harness, model, provider, runtime, scenario, or scenario version.

```yaml
schemaVersion: "conformance.result.v1"
resultId: "2026-06-25-docs-assets-install-dry-run-codex-gpt5-cli"
scenarioId: "docs-assets-install-dry-run"
scenarioVersion: "1.0.0"
runDate: "2026-06-25"
makeDocsVersion: "1.0.0-rc.1"
harness: "codex"
modelName: "gpt-5"
providerOrRoutingLayer: "openai"
modelVersion: "unknown"
runtimeDistribution: "npm-cli"
runtimeVersion: "node>=18"
producedFiles: []
relevantDiffs: []
exitStatus: 0
transcriptLogPointer: ".make-docs/conformance/<run-id>/transcript.log"
verdict: "pass"
reason: "The scenario evidence matched the expected result."
caveats: []
reviewerStatus: "reviewed"
supportClaimUse: "nominal-tuple"
```

Required fields:

| Field | Requirement |
| --- | --- |
| `schemaVersion` | Use `conformance.result.v1` until a later accepted change revises the schema. |
| `resultId` | Stable id that includes date, scenario, harness, model, and runtime where practical. |
| `scenarioId` and `scenarioVersion` | Must match the scenario spec. |
| `runDate` | Date of the run. |
| `makeDocsVersion` | Package or repository version under test. |
| `harness` | The agent harness actually used. |
| `modelName` | The selected model name or `unknown` when unavailable. |
| `providerOrRoutingLayer` | Provider or routing layer when known. |
| `modelVersion` | Immutable model identifier when available, otherwise `unknown`. |
| `runtimeDistribution` | Example: `npm-cli`, `local-source`, `mcp`, or `plugin`. |
| `runtimeVersion` | Runtime version, package version, or other reviewed identity. |
| `producedFiles` | Compact list of reviewed output paths. |
| `relevantDiffs` | Compact list or pointer to reviewed diffs. |
| `exitStatus` | Process exit status when a command was run. |
| `transcriptLogPointer` | Local pointer or redacted bundle pointer; do not inline raw transcripts. |
| `verdict` | One of the verdicts below. |
| `reason` | Short explanation for the verdict. |
| `caveats` | Specific limitations that change how evidence may be used. |
| `reviewerStatus` | One of `unreviewed`, `reviewed`, `needs-follow-up`, or `rejected`. |
| `supportClaimUse` | One of `none`, `nominal-tuple`, or `stronger-claim-candidate`. |

## Verdicts and Support Claims

Use exactly one verdict:

| Verdict | Meaning | Support-claim rule |
| --- | --- | --- |
| `pass` | Expected evidence was produced without material caveats. | May support nominal wording for the exact tuple when reviewed. |
| `pass-with-caveats` | Expected evidence was produced with meaningful limitations. | May support only caveated tuple-specific wording when reviewed. |
| `inconsistent` | Runs or evidence conflict. | Does not support public claims. |
| `unsupported` | The scenario cannot work for the tuple under test. | Does not support public claims. |
| `blocked` | Required access, harness, network, credentials, model routing, or safe setup was unavailable. | Does not support public claims and must use `supportClaimUse: none`. |

One passing run is only the minimum threshold for nominal support wording for the exact tuple it records. Repeated reviewed runs are required before stronger commendations. A green package validation run is not a public harness/model support claim without conformance evidence.

Support-claim wording must follow this gate:

| Claim type | Minimum evidence |
| --- | --- |
| No public claim | No reviewed `pass` or `pass-with-caveats` result exists for the tuple. |
| Nominal tuple support | At least one reviewed `pass` result exists for the exact scenario/harness/model/provider/runtime tuple. |
| Caveated tuple support | A reviewed `pass-with-caveats` result exists and the caveats are repeated in public wording. |
| Stronger wording | Repeated reviewed runs exist, the result record uses `supportClaimUse: stronger-claim-candidate`, and any promoted evidence bundle is redacted and linked. |

Do not collapse tuple evidence into blanket wording. A pass for one scenario in Codex does not prove all Codex behavior, a pass for one Claude Code model does not prove every Claude Code model route, and package validation alone does not prove agent-harness support.

## Raw Artifact Storage

Raw artifacts default to generated local state:

- `.make-docs/conformance/<run-id>/`
- `.make-docs/runs/conformance/<run-id>/`

These locations are for raw transcripts, provider logs, temporary workspaces, raw stdout/stderr captures, and scratch diffs. `.make-docs/conformance/` is ignored in this repository, and `.make-docs/runs/` is already ignored.

Do not commit credentials, unredacted provider logs, full private transcripts, temporary workspaces, or raw local scratch output. If evidence must become durable, create a compact reviewed result record and promote only redacted, minimal supporting material.

## Redaction and Promotion

Use redaction and promotion only when the evidence is needed for a disputed result, a stronger support claim, or a cross-harness comparison. The reviewer must confirm that the bundle contains only the evidence needed to justify the claim.

Promotion checklist:

1. Confirm the scenario and result record are complete.
2. Remove credentials, local usernames, private paths, personal data, unrelated prompt content, and raw provider noise.
3. Replace full transcripts with short excerpts or structured summaries.
4. Link the promoted evidence to the exact result tuple.
5. Keep `supportClaimUse` as `none` unless the result is reviewed and the verdict allows support wording.

## Validation

When changing this guide or adding scenario/result records, run:

- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- A changed-file Markdown link check for touched docs

When a scenario executes package or CLI behavior, run the normal package validation for that behavior too. The conformance lab may call package validation commands as scenario steps, but it does not replace those commands.

Validation commands can appear in scenario `steps`, for example:

```yaml
steps:
  - kind: "command"
    run: "npm test -w packages/cli"
  - kind: "command"
    run: "npm run validate:defaults -w packages/cli"
```

Those commands remain package validation evidence. They become conformance evidence only after the result record also captures the harness, model, provider or routing layer, runtime distribution, scenario id/version, reviewer status, verdict, reason, and caveats.

## Related Resources

- [20 Revise Agent Harness Model Conformance Lab](../../../prd/20-revise-agent-harness-model-conformance-lab.md)
- [Scenario and Result Contract Plan](../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-contract.md)
- [Harness Adapter and Support Claim Gating Plan](../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-harness-adapter-and-support-claim-gating.md)
- [Scenario and Result Schema Work Phase](../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-schema.md)
- [Adapters and Support Claims Work Phase](../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-adapters-and-support-claims.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)
