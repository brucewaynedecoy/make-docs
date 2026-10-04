---
title: "Phase 4: Compatibility And Evidence"
kind: "work"
status: "complete"
coordinate: "W24 R0 P4"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---
# Phase 4: Compatibility And Evidence

## Purpose

Prove profile completeness, old-connection compatibility, access invariance, and actual discovery effects.

## Overview

P1-P4 and the local W24 phase package are complete. The owner authorized P4 implementation, closeout, and commit on 2026-10-03. All eight P4 tasks are complete. Stage 1 contract and access proof, the same-build performance pass, and agent review support this local closeout. The [P4 plan](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-validation.md) defines the compatibility baseline and the one canonical performance profile. Compare each narrow profile against its explicit assignments. Keep app-specific review and publication outside this phase.

The historical source is `793868a9468ff0bd5471261503b24b303cb1b4f5`. The current runtime source is P3 commit `cced2bcbb71a4380e1dfbc10b7e2ef549dc271a2`. Retained [P1 descriptors](evidence/p1/baseline-tool-contracts.json) and [P3 final local protocol proof](evidence/a9/stdio-results-final.json) have different scopes. P4 reconstructed the historical native-resource wire baseline in an isolated temporary export as the [compatibility plan](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-validation.md#compatibility-checks) states. Reuse [P3 allowed-read parity](evidence/a7/allowed-read-and-cli-parity-final.json) and [source/build identity](evidence/p3/source-identity-final.json) when their fingerprint still applies.

Separate historical old-launch compatibility from the same-build narrow/`all` characterization. Local SDK proof does not prove a fresh package installation, a current host upgrade, or model-visible tokens. Stdio is selected. HTTP remains not-needed on current evidence. No host configuration or installation action is part of this local packet.

## Human Experience Outcome

A person can choose a group from help, retain an existing full connection, and understand a rejected profile or resource. Evidence is the actual CLI, MCP, and host result. The agent records an observation, conclusion, limit, and next action for each promise.

## Current Testing Decisions

These are the current decisions. Their execution budgets start only after separate P4 implementation authority. The maturity for each decision is a maintainer development build with bounded local proof.

### Automated Implementation Testing

- Testing type: Automated Implementation Testing; needed.
- Decision informed: Whether profile selection preserves catalog, shared contract, dispatch, admission, access, resource, and old-launch behavior.
- Reason now: P4 must combine the completed P1-P3 proof and fill the historical wire gap before capability closeout.
- Product maturity: Maintainer development build; no wider installed-host acceptance.
- Scope: Exact assignment/union and shared-handler invariants; allowed resource bytes/provenance; hidden calls/reads; invalid profile; canonical CLI/core tools; representative Store-free read and write-class calls with and without `allowWrite`; historical no-profile stdio launch versus the current default; current default versus explicit `all`.
- Executor: Assigned implementation/test agent, using existing tests and local SDK probes.
- Gate effect: Required contract and access evidence blocks only its affected P4 claim. A Store denial stops that probe; preserve its typed error and continue independent Store-free checks.
- Effort budget: One focused pass and one affected-only correction/rerun; 60 minutes of investigation. Reuse unchanged P1-P3 evidence. No exhaustive host or platform matrix.
- Stop condition: Stop when required checks pass, a missing prerequisite blocks its comparison, a reproducible defect needs work outside P4, or the budget ends. Report affected scope and the owner decision needed. Do not renew the budget.
- Evidence retained: Attempt-numbered command logs, source/dependency/build/fixture identities, raw list/read/access/error captures, assertion summary, and reused-evidence links under `evidence/p4/` during P4. Earlier evidence stays intact.
- Rerun trigger: A material runtime, descriptor, schema, catalog, access-policy, fixture, build, or probe change; a failed assertion; or an explicit wider support claim. Rerun affected checks only within remaining authority and budget.

### Performance Testing

- Testing type: Performance Testing; `characterize-now`.
- Decision informed: The observed tool definition size and startup/discovery cost for each profile under one local stdio workload.
- Reason now: The two accepted design candidates need a bounded baseline. No hard token or latency target exists.
- Product maturity: Maintainer development build; bounded local characterization.
- Scope: Both design candidates bind to canonical [PERF-003 v1](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-validation.md#perf-003-profile-context-and-stdio-discovery). Six same-build profiles; counts, UTF-8 tool-definition bytes, cold process startup, and warm lists. Actual model-visible tokens are conditional on an already available authorized host diagnostic. Record unavailable evidence without a token claim.
- Executor: Assigned implementation/test agent using a frozen local SDK harness and analysis script.
- Gate effect: Values are informational. A valid packet, honest result disposition, protected constraints, and supported claim limits are required at phase closeout. Missing or non-comparable local evidence is not a pass. Conditional host-token evidence does not block the local inquiry.
- Effort budget: Exactly the prepared `W24-R0-P4-PERF-003-B1` limits in the canonical profile. This work packet adds no budget.
- Stop condition: Use the profile's pass, failure, blocked/revise, diminishing-return, timeout, and budget-exhaustion rules. Do not optimize toward a favorable value or repeat an unchanged result.
- Evidence retained: Exact profile version/digest; activation fingerprint; immutable raw samples, errors, exclusions, analysis, and budget ledger under `evidence/p4/` during P4. No result exists in this preparation.
- Rerun trigger: Only the profile's material-change rule within the remaining budget. Expiry requires separate requalification authority and a new finite budget.

### Guided Progress Review

- Testing type: Guided Progress Review; needed.
- Decision informed: Whether the real help, published configuration example, list output, and errors provide clear profile choices and recovery.
- Reason now: Those direct surfaces carry the accepted profile and full-connection promises.
- Product maturity: Maintainer development build; agent inspection of real outputs.
- Scope: Real CLI help; old single-server argument shape; one narrow configuration example; exact profile lists; invalid-profile error; hidden tool/resource error and recovery. Inspect any already available host evidence with its exact historic or current scope. Do not change a host or infer installation success from an example.
- Executor: Assigned review agent. A maintainer may give optional feedback.
- Gate effect: A material gap blocks the affected claim until fixed or explicitly bounded. No human response is required.
- Effort budget: One review pass and one affected-only review after a correction; 30 minutes. Reuse the implementation captures.
- Stop condition: Stop when each current review question has an observation and limit, or the budget ends. Route a material unresolved gap to its owner. Do not hide a test inside optional feedback.
- Evidence retained: Real help/configuration/list/error captures, reviewer, question, observation, conclusion, limit, and next action under P4 evidence.
- Rerun trigger: Changed help, configuration guidance, profile contents, public error/recovery behavior, or concrete later feedback that invalidates a reviewed claim.

### Unassisted Goal Testing

- Testing type: Unassisted Goal Testing; `not-needed-now`.
- Decision informed: Whether a person can select a profile without private coaching.
- Reason now: The current preparation and local contract questions can be answered by published help, configuration examples, direct review, and bounded protocol proof. No material current unassisted uncertainty or explicit human gate is established.
- Product maturity: Maintainer development build; no activated user-run scenario.
- Scope: Current profile-choice question only. No scenario, tester enrollment, or later obligation is created.
- Executor: No run executor is assigned. The review agent records this decision.
- Gate effect: No gate. This decision does not prove lived human ease or unassisted success.
- Effort budget: 0 test runs, 0 tester sessions, and 0 external spend.
- Stop condition: Record `not-needed-now` and stop.
- Evidence retained: This decision and the linked help, configuration, error, and Guided Progress Review evidence that answers the current questions.
- Rerun trigger: Real feedback shows profile selection remains unclear after direct review, or explicit accepted authority requires an unassisted attempt. Reassess before any run; define separate qualified executor, scope, and finite budget then.

## Human Experience Review

The [retained Guided and Human Experience Review](evidence/p4/review/guided-and-human-review-attempt-1.json) is complete for seven accepted promises. It binds real unchanged P3 help, task/configuration guidance, invalid and hidden errors, current P4 lists, old-launch proof, and direct access tests. Conclusions are `satisfied` within the recorded local limits. Human Experience Review remains separate from the four testing types. No lived-human reaction, unassisted success, installed-host result, production Store write, or W25 app availability is claimed. Optional feedback is not a response gate or obligation.

## Performance Execution Packet

This is a link-only operational binding to [PERF-003 v1](../../plans/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-validation.md#perf-003-profile-context-and-stdio-discovery). The plan is the sole profile authority. The two design candidates, `W24-CONTEXT` and `W24-DISCOVERY`, use this one workload and profile. No profile fields or target are redefined here.

- Packet ID: `W24-R0-P4-PERF-003-PACKET-1`.
- State: Closed under the owner's 2026-10-03 P4 closeout request. Current-use proof expired at this closeout and remains a historical baseline under `evidence/p4/performance/`. Closeout grants no new run, correction, review, or qualification budget.
- Exact binding: `PERF-003`, version `1`, the verified Source Digest in the plan. Retain that binding in every run record.
- Activation record: Before any measured spawn, retain the authorizing user/phase scope; exact profile digest; source/build and dependency identities; fixture, configuration, environment, instrument, and analysis fingerprints; correctness/seam check; planned order; and comparability reason. Stop on a required mismatch or missing prerequisite.
- Execution rules: The canonical profile owns workload, measurement boundaries, warmups, repetitions, order, analysis, exclusions, finite budget, reuse, affected-only rerun, stop, outcome, and expiry rules.
- Final consumption: The [final ledger](evidence/p4/performance/attempt-02-ledger-final.json) records 1 pass, 1 correction, 2 reviews, 30 launches, 360 list calls, 528.716 seconds from original activation to final disposition, 0 spend, and 0 paid requests. No pass, correction, or review remains. Spare compute does not authorize a rerun.
- Retention: Create immutable attempt-numbered run manifests, raw JSON, analysis, result/finding records when needed, and ledger under `evidence/p4/` during P4. Add links from the central evidence at execution; do not create empty result files now.
- Result rule: Bind each result to exact profile version/digest and actual fingerprint. Retain values, distribution, uncertainty, exclusions, budget used/left, controlled outcome, findings, reviewer disposition, supported limit, and expiry. Record unavailable model-token evidence as unavailable; do not claim tokens from byte counts.
- Finding rule: Record identity, observed and expected protected behavior, target class, severity, reproducibility, attempts, affected scope, source/evidence, owner, disposition, expiry, and later work/result links. A task checkmark does not close a finding.
- Waiver rule: Only repository-owner approval can accept a bounded exact miss. Keep requirement/profile, affected scope, reason/risk, protected constraint state, owner/approver, expiry, and reevaluation route. No waiver exists now.

## Source PRD Docs

- [PRD 25: TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39: CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Stage 1 - Contract And Access Proof

### Tasks

- [x] t1: Prove tool and resource assignment completeness and exact `all` union with the current inventory.
- [x] t2: Prove shared names, schemas, descriptions, access facts, handlers, resource bytes, and provenance agree across profiles.
- [x] t3: Run representative Store-free and write-class operations through each relevant profile and compare allowed and denied outcomes.
- [x] t4: Reconstruct the fixed pre-W24 no-profile stdio launch in an isolated temporary export and compare it with the P3 no-profile default under the declared compatibility fixture. Separately prove current no-profile equals explicit `all`. Retain old-launch, local-build, and host limits.

### Acceptance criteria

- No ready tool or native resource lacks a valid profile.
- Historical no-profile and current no-profile launches have compatible full tool/resource contracts within the named source/build/fixture scope. Differences are explained with exact evidence. Current no-profile equals explicit `all`.
- Profile selection never changes authorization, write access, or operation behavior.
- Unsupported profile, hidden tool, and out-of-profile resource failures are clear and bounded.

### Dependencies

- [P2](02-filtered-tool-discovery.md) and [P3](03-resources-and-transports.md).

### Closeout Notes

Stage 1 is complete within its local scope. The [contract summary](evidence/p4/contracts/stage-1-summary-attempt-1.json) records 8 variants, 43 tools, 62 native resources, and 289 native reads. The [raw comparison qualification](evidence/p4/contracts/raw-comparison-qualification.json) records exact historical/default and current/default/all wire equality with zero normalization. Physical launch paths differ only in their run manifests. The [runtime identity](evidence/p4/contracts/runtime-identity-attempt-1.json) binds source, lock, dependencies, build, provider, and fixture.

The corrected [focused test pass](evidence/p4/contracts/focused-attempt-2.txt) passed all 9 tests. It proves representative Store-free reads, the shared real write handler and dry-run gate, and typed Store admission within assigned profiles and `all`. The [first test result](evidence/p4/contracts/focused-attempt-1-summary.json) preserves its three fixture mistakes. The one test correction is spent.

The supplementary [wire script failure](evidence/p4/contracts/wire-script-attempt-1-failure.json) remains exit 1. Its incomplete backlog cache-write input was rejected by the SDK before the operation callback. This proves input rejection only. It is not an operation access verdict. The original eight-variant script was not rerun. Under new owner authority, the [complete-input SDK probe](evidence/p4/contracts/wire-write-attempt-2-summary.json) made two launches and six calls in backlog and all. Omitted/false allowWrite reached the write gate. True reached typed store-not-configured for work.backlog-cache.write. Both profiles returned the same results. No input rejection or product defect appeared. Its [authority and full input](evidence/p4/contracts/wire-write-attempt-2-authority.json) and [storage-path qualification](evidence/p4/contracts/wire-write-attempt-2-qualification.json) stay separate from the exhausted earlier budgets and historical raw comparison. No complete allowed Store write or installed-host acceptance is inferred.

## Stage 2 - Context, Latency, And Experience

### Tasks

- [x] t5: Activate and freeze the prepared PERF-003 v1 packet after separate P4 implementation authority. Validate its digest, actual fingerprint, correctness/seam, comparability, and remaining finite budget before measurements.
- [x] t6: Execute the authorized same-build stdio packet for `all` and each narrow profile. Retain counts, definition bytes, cold startup, warm list times, raw observations, analysis, and budget. Record actual model-visible tokens only from valid available host evidence; otherwise record unavailable evidence and its excluded claim.
- [x] t7: Review the real help, configuration examples, profile lists, and errors against each Human Experience promise.
- [x] t8: Run PRD authority and documentation checks and record supported conclusions and limits.

### Acceptance criteria

- Measurements bind the exact canonical PERF-003 version/digest, actual fingerprint, comparability, ledger, outcome, and expiry. No unrun, missing, invalid, expired, or non-comparable required evidence is a pass.
- Local SDK counts and definition bytes are not model-visible token or installed-host proof. Conditional token evidence may remain unavailable with an explicit limit. HTTP remains not-needed.
- The agent review records observation, conclusion, limit, and next action per promise.
- PRD authority validation and link checks pass for the final package.
- Closeout does not claim the separate Backlog Review app is complete.

### Dependencies

- Stage 1 and a fixed measurement environment.

### Closeout Notes

The [final performance result](evidence/p4/performance/attempt-02-result-final.json) is pass within local characterization scope. The [central P4 evidence](evidence.md#w24-r0-p4-compatibility-and-evidence) records exact values, distributions, unavailable tokens, the first zero-spawn revise finding and sole correction, budget, supported limits, and expiry. The [second review](evidence/p4/review/performance-review-cycle-2.json) independently checked counts, byte/hash arithmetic, timing summaries, order, fingerprints, cleanup, and budget. No new product target or support claim is accepted.

The [PRD result](evidence/p4/review/prd-authority-attempt-1.json) passed. The [performance structural disposition](evidence/p4/review/performance-structure-disposition.json) records valid PERF-003 and no W24 errors while retaining the 17 existing W23 errors and advisory warnings. The [final document checks](evidence/p4/review/doc-checks-final.json) reuse unchanged checks and verify the affected links. The [path check](evidence/p4/review/path-hygiene-attempt-2.json) passed for the four edited project docs. The earlier [missing-result link check](evidence/p4/review/doc-checks-attempt-1.json) and [protected archive-path rejection](evidence/p4/review/path-hygiene-attempt-1.json) remain visible. The history file uses the local-link and placeholder check.

All eight implementation tasks are complete. P4 and the local W24 phase package closed under the owner's 2026-10-03 authorization. The [closeout checks](evidence/p4/review/closeout-checks.json) bind unchanged runtime proof and current document checks. PERF-003 current-use proof expired at this closeout and remains a historical baseline. W25 UI, installed-host acceptance, release, HTTP, model tokens, and fully allowed Store-write proof remain separate.
