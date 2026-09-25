---
title: "Phase 7: Parity Performance and Acceptance"
kind: "work"
status: "draft"
coordinate: "W25 R0 P7"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 7: Parity Performance and Acceptance

## Purpose

Prove one assembled package candidate across source, package, installed, live, static, fallback, and human review paths.

## Overview

P7 is the final W25 acceptance phase. It runs complete parity, safety, accessibility, Store-state, and `PERF-002` evidence.

## Human Experience Outcome

- Impact and promise: Direct. The shipped Skill gives a clear live default, an explicit static choice, useful recovery, and trustworthy actions.
- Intended outcome: A maintainer can use the live page, request a static report, refresh, ask for wave review, and ask for a separate task without hidden work.
- Surface: Installed Skill, MCP App, static report, chat fallback, report controls, and agent responses.
- Evidence: Full automated proof, Guided Progress Review, `PERF-002`, and Human Experience Review.
- Executor: Validation agent and owner-guided reviewer after separate phase authority.
- Deferral: None.

## Current Testing Decisions

| Testing type | Decision | Reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Full source, package, installed, route, profile, Store, and renderer coverage is required. |
| Performance Testing | `characterize-now` | `PERF-002` records bounded live open and refresh behavior without a hard target. |
| Guided Progress Review | Required | The owner must review the real installed flows. |
| Unassisted Goal Testing | `not-needed-now` | W25 does not claim a new unassisted discovery outcome. |

- Base action: `create`.
- Performance applicability: `characterize-now`.
- Canonical profile: [PERF-002](#perf-002-live-backlog-review-open-and-refresh) in this phase.
- Finite budget: [PERF-002](#perf-002-live-backlog-review-open-and-refresh) permits one cold open, one unchanged refresh, one refresh after one record changes, and at most one correction cycle.
- Evidence handoff: future central evidence report.
- Gate effect: Speed is informational. Correctness, safety, accessibility, route consent, and parity are blocking.

## PERF-002 Live Backlog Review Open and Refresh

### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `PERF-002` |
| Profile Version | `1` |
| Source Digest | `sha256:5281853654b41d1fa83f07fc2b538ee60e81527be4aabc19c86f95ad863ca08e` over this profile body with the Source Digest row excluded. |
| Title | Live Backlog Review open and refresh |
| Protected Outcome | A maintainer can open and refresh the live review without weakening current facts, safe fallback, or interface control. |
| Source Requirements | PRD 51 `R-BACKLOG-APP-1` through `R-BACKLOG-APP-13`, `R-BACKLOG-SKILL-24` through `R-BACKLOG-SKILL-28`, and `R-BACKLOG-HX-12` through `R-BACKLOG-HX-15`. |
| Canonical Owner | [P7 work record](07-parity-performance-and-acceptance.md) |
| Product Maturity | Pre-release implementation. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Risk And Failure Cost | Medium. Stale facts, hidden writes, unsafe prompts, or inaccessible controls are unacceptable. Slow but correct fallback remains usable. |
| Owner | W25 R0 product owner. |
| Approver | W25 R0 product owner for any later target, waiver, retirement, or supersession. |

### Supported Scope

| Field | Value |
| --- | --- |
| Surface | Installed `backlog-review` Skill live MCP App open and refresh flow. |
| Platform Or Runtime | The local macOS, Node.js, Make Docs, MCP server, and compatible-host environment used for the P7 candidate. Record exact versions in the result. |
| Deployment Or Device Class | One local developer workstation and one compatible local MCP Apps host. |
| Scale | The accepted 70-record Backlog Review fixture. |
| Account And Network State | Local project and Store operations. No external network dependency is allowed for the report UI. |
| Resource Envelope | One Make Docs MCP server, one active agent conversation, one local widget, and the existing optional Global Store. |
| Exclusions | Other projects, hosted reports, simultaneous users, model-provider load outside the recorded run, and any speed or scale support claim. |

### Baseline And Target

| Field | Value |
| --- | --- |
| Comparable Baseline | None. `PERF-001` measured static report review and is context, not a comparable live-app target. |
| Target | none |
| Unit | elapsed seconds, resource bytes, report-model bytes, cache counts, and changed-record counts |
| Direction | Observe cold open, unchanged refresh, and one refresh after one record changes. No pass threshold. |
| Tolerance | none |
| Target Source | none |
| Target Approval | none |

### Environment And Workload

| Field | Value |
| --- | --- |
| Product Build | Exact Git revision and dirty-file allowlist recorded before the run. |
| Dependency State | Exact package lock digest, Node.js version, Make Docs version, MCP transport, host version, snapshot schema version, report-model version, rule catalog version, and Skill version. |
| Configuration | Installed `backlog` MCP profile, default live delivery, accepted cache settings, and no external UI network access. |
| Qualified Environment | Same host, checkout, power state, transport, Skill, model configuration, and Store state for comparable observations. |
| Dataset Or Fixture | The accepted frozen 70-record fixture with a recorded digest and one declared record that can change. |
| Workload | One cold live open, one exact unchanged refresh, and one refresh after one controlled record change. |
| Scale | 70 records. |
| Concurrency | One report flow and one active conversation at a time. |
| Operation Mix | Current snapshot, exact cache lookup, report-model assembly, UI resource open, unchanged refresh, changed-record handoff, validated cache write, and replacement open. |
| Workload Exclusions | Static report generation, package publication, unrelated tests, human think time, task implementation, and unrelated repository work. |

### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | Cold open starts before snapshot collection and ends after the host renders the validated live model. Each refresh starts on user activation and ends after the unchanged state or changed-record result renders. |
| Instrument And Version | Monotonic wall clock plus recorded payload byte counts and operation receipts from the P7 harness. Record harness and runtime versions. |
| Cold Or Warm State | First observation has no reusable widget session. Second uses the open session with no source change. Third uses the same qualified state after one declared record change. |
| Warmup Rule | No unrecorded warmup. The first observation is the declared cold path. |
| Repetitions Or Observation Window | One cold open, one unchanged refresh, and one changed-record refresh. |
| Statistic | Report each elapsed value, payload size, cache count, and changed-record count. Do not infer a stable percentile or mean from three observations. |
| Variance Reporting | State that host, agent, model, Store, and run-to-run variance are not estimated by this bounded profile. |
| Uncertainty Reporting | Record host, transport, model, repository, Store, resource-cache, and instrument limits that affect comparison. |
| Outlier Treatment | Exclude nothing. Mark an interrupted or materially changed observation non-comparable. |
| Comparison Method | Compare only observations with the same recorded fingerprint, except for the declared one-record change and declared cold or warm state. |
| Raw Evidence Retention | Store bounded timing, byte, count, and parity evidence in the central repository evidence report. Do not store prompts, conversation bodies, or repository bodies. |
| Observer Effects | Local timing and byte instrumentation add small overhead. Agent, model, host, and Store variance remain visible. |

### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | Every open and refresh starts from the current snapshot. Live, static, and chat meaning remain equal. Changed records cannot reuse a nonmatching fragment. |
| Durability | Widget, resource, or cache loss produces a new current review without loss of repository authority. |
| Safety | Unsafe, denied, unavailable, corrupt, or newer Store states do not cause an unsafe read or write. |
| Security | Project text stays inert. Messages use fixed actions and exact references. The resource uses a narrow content policy. |
| Privacy | Results and cache contain no secrets, prompts, conversation bodies, repository bodies, raw logs, or absolute local paths. |
| Accessibility | Refresh, report controls, state feedback, and fallback have accessible names, keyboard paths, visible focus, and accurate state. |
| Portability | Static output remains one offline file after an explicit request. Live failure preserves chat fallback. |
| Cost | No added paid external resource or required network service. |
| Maintainability | One registry, server factory, access model, report model, and cache write operation own their concerns. |
| Fixture And Measurement Seam | The harness validates record count, fixture digest, controlled change, payload counts, cache counts, parity, and measurement boundaries before use. |

### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | This W25 R0 P7 work record. |
| Budget Event ID | `W25-R0-P7-PERF-002-V1` |
| Characterization Pass Limit | 3 observations: cold open, unchanged refresh, and one-record change. |
| Materially Distinct Correction Attempt Limit | 1 attempt. |
| Review Cycle Limit | 1 cycle. |
| Elapsed Investigation Time Limit | 2 hours. |
| Compute Limit | 1 local host, 1 server, 1 widget, and 1 review process at a time. |
| External Resource Spend Limit | $0 added external resource spend. |
| Unchanged Fingerprint Action | Reuse the current result. Do not rerun without separate authority. |
| Material Change Action | Rerun only affected observations within the remaining budget. |
| Diminishing Return Rule | Stop when the allowed correction does not change validity, comparability, correctness, payload counts, or the implementation decision. |
| Budget Exhaustion Disposition | Record `blocked` or `revise` and return the decision to the owner. |

### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | All three comparable observations and required counts are recorded, all non-sacrificable constraints pass, and no speed target is claimed. |
| `fail` | Comparable evidence shows a reproducible correctness, privacy, security, safety, accessibility, consent, or portability break. A slow result alone cannot fail because no numeric target exists. |
| `revise` | The fixture, fingerprint, host, transport, boundary, instrument, or comparison cannot answer the characterization question. |
| `blocked` | A required compatible host, fixture, transport, Store state, model, instrument, or authority precondition is missing. |
| `waived` | The owner accepts one named bounded risk with expiry. A waiver is not a pass. |

| Field | Value |
| --- | --- |
| Severity Treatment | Correctness, privacy, security, safety, accessibility, consent, or authority breaks are `major` unless evidence supports `critical`; measurement-only gaps are `moderate` or `minor`. |
| Reproducibility Treatment | Record `reproduced`, `not-reproduced`, `intermittent`, or `not-attempted` with attempt links. |
| Finding Route | This P7 record, PRD 51 for product meaning, and PRD 39 or W24 R0 for profile or transport changes. |
| Escalation Route | W25 R0 product owner. |

### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | Host, transport, profile, resource URI, widget bundle, operation contract, snapshot schema, report schema, cache identity, rule catalog, Skill version, workload, model, Store service, instrument, or comparison method changes. |
| Time Or Release Boundary | W25 R0 closeout. |
| Current-Use Invalidation Rule | Any material trigger makes the result historical and non-current. |
| Next Review Condition | A later product target, regression decision, supported-host change, or material live-review design change. |
| Requalification Authority | Separate owner or phase authority. |
| Requalification Budget | A new finite budget is required. |
| Unchanged-Fingerprint Qualification Limit | 1 bounded execution. |

### Lineage And Traceability

| Field | Value |
| --- | --- |
| Predecessor | `PERF-001` as non-comparable static-review context. |
| Successor | none |
| Promotion Source | W23 R0 `PERF-001`; context only, not a target. |
| Promotion Approval | none |
| Supersession Reason | none |
| Plan And Work Links | [P7 plan](../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/07-parity-performance-and-acceptance.md) and this work record. |
| Result Links | none; not run |
| Finding Links | none |
| Obligation Links | none |
| History Links | none |
| Support Links | none |

### Evidence Fingerprint

- Profile ID, version, and digest: `PERF-002` version `1`, bound to the Source Digest in this profile.
- Product build and relevant code state: pre-run state is not-comparable because W25 implementation has not started. Record the exact Git revision and dirty-file allowlist before execution.
- Dependency and configuration state: pre-run state is not-comparable. Record the package lock digest, runtime, Make Docs, transport, host, profile, snapshot, report-model, rule-catalog, Skill, and Store configuration before execution.
- Workload and fixture or dataset: the authorized workload is the accepted 70-record fixture. Bind its digest and the controlled record change before execution.
- Instrument version: the authorized instrument is the P7 monotonic wall-clock and byte-count harness. Record its version before execution.
- Analysis method: report each of the 3 elapsed observations, payload sizes, cache counts, changed-record counts, and parity results. Do not calculate or claim a stable percentile or mean.
- Comparability result and reasons: `not-comparable` before execution because no bound build, environment, fixture digest, host result, or measurement exists.

## Source PRD Docs

- [PRD 51](../../prd/51-backlog-review-and-reporting.md)
- [PRD 08](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 38](../../prd/38-global-store-and-project-state.md)
- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 48](../../prd/48-performance-evidence-governance.md)
- [PRD 49](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: final acceptance must prove dynamic default and explicit static behavior in the installed package`

## Stage 1 - Automated and installed proof

### Tasks

- [ ] t1: Run full source, package, installed, profile, operation, resource, route, renderer, and Store-state tests.
- [ ] t2: Prove live, explicit static, and chat fallback from the installed Skill.
- [ ] t3: Prove safe content, access, no hidden writes, and complete package assets.

### Acceptance criteria

- A51: One package candidate passes source and installed-output parity.
- A52: Compatible hosts choose live by default and unsupported hosts complete the chat fallback.
- A53: Static output is created only after an explicit request.
- A54: Live and static results preserve the same facts, inferences, recommendations, statuses, reasons, and limits.
- A55: Store states and cache-write failure preserve a complete current review.

## Stage 2 - Performance and human review

### Tasks

- [ ] t4: Run the finite `PERF-002` observations and record limits.
- [ ] t5: Review wide, narrow, light, dark, print, keyboard, focus, and reduced-motion behavior.
- [ ] t6: Review refresh, changed-state, wave-review, task-request, and fallback experiences.

### Acceptance criteria

- A56: `PERF-002` records all required observations, environment, limits, and uncertainty within budget.
- A57: No result creates an unapproved speed or scale claim.
- A58: Accessibility checks pass for the live and static paths.
- A59: Guided Progress Review confirms clear consent, action feedback, failure recovery, and report parity.
- A60: Human Experience Review finds no material gap in clarity, control, traceability, safety, or recovery.

## Coverage Pass

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Guide and resource coverage | `update-existing` | Closeout must update supported host, route, and limit guidance. |
| History coverage | `create-on-closeout` | P7 closes the W25 package. |
| PRD reconciliation | `verify-current` | PRD 51 must match the accepted installed behavior. |
