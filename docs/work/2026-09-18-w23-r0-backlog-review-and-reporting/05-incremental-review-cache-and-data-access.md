---
title: "Phase 5: Incremental Review Cache and Data Access"
kind: "work"
status: "draft"
coordinate: "W23 R0 P5"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 5: Incremental Review Cache and Data Access

## Purpose

Reduce repeated agent review for unchanged work records while preserving current-source checks, full Store-free behavior, and one-file report portability.

## Overview

This phase adds an optional, rebuildable per-record review cache in the Global Store. Every report still starts with a current deterministic snapshot. Only exact per-record matches can be reused. All portfolio conclusions rebuild from the current full snapshot. The self-contained report also gains an accessible data view and a user-started JSON download of its embedded normalized model.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct. Repeat reviews avoid unnecessary waiting without hiding current project changes or making the Store mandatory.
- Intended human outcome: A maintainer can repeat a large backlog review with less repeated agent work, understand when reuse was unavailable, and inspect or save the normalized report data from the same report.
- Human-facing surface or indirect effect: Skill review flow, natural fallback explanation, saved HTML data view, and user-started JSON download.
- Implementation work: Global Store cache integration, exact invalidation, stateless fallback, raw-data controls, package updates, bounded characterization, and review.
- Evidence source or testing type selected under current authority: Automated cache and Store tests, Performance Testing characterization, Guided Progress Review, and Human Experience Review.
- Executor: Cache, Skill, report, and validation agents within the accepted phase scope.
- Accepted obligation or deferral route: None.

This phase follows [PRD 51](../../prd/51-backlog-review-and-reporting.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Exact cache identity, hit, miss, invalidation, pruning, corrupt entry, Store-state fallback, report-data parity, safety, and package checks. |
| Performance Testing | `characterize-now` | A bounded comparison can show what exact reuse changes. No latency target or product speed promise exists. |
| Guided Progress Review | Required | Owner review can change the raw-data controls and fallback explanation before P6. |
| Unassisted Goal Testing | `not-needed-now` | The current work is a maintainer-led optimization and inspection feature. No separate discoverability gate exists. |

- Base maintenance action: `create`
- Performance applicability: `characterize-now`
- Canonical `PERF-###` profile link: [PERF-001](#perf-001-repeated-backlog-report-review)
- Finite evidence budget and stop-rule reference: `PERF-001` Evidence Budget And Stop Rules
- Execution packet: Stage 3 tasks t12-t14 after cache correctness and fixture validation pass
- Outcome and evidence handoff: central [evidence report](evidence.md) after a result exists
- Gate disposition and supported-scope limit: informational characterization for the named local workload; correctness and safety gates remain separate and blocking

## P5 Preflight Decision Record

Recorded on 2026-09-21. This preflight records accepted authority. It does not start P5 implementation.

| Item | Decision |
| --- | --- |
| Repository baseline | Branch `make-docs-v2`; HEAD `a976404da0f8912d9bb43f7c0de4b75197189032`; 97 GB free. The worktree contains the expected uncommitted P4 correction and W23 authority-reconciliation changes. Preserve that allowlist. |
| Public operations | Add `work.backlog-cache.lookup` and `work.backlog-cache.write`. Both become active only when P5 implementation and validation land. |
| Canonical CLI paths | `make-docs run work backlog-cache lookup` and `make-docs run work backlog-cache write`. |
| MCP paths | Derive both tools from the shared operation registry. Add no MCP-only cache logic. |
| Lookup access | Store read, project read, host configuration none, and mutation class read. |
| Write access | Store write, project read, host configuration none, and mutation class write. |
| Shared core | One internal backlog-cache service owns checkout binding, exact keys, validation, bulk lookup, bounded writes, pruning, and diagnostics. CLI and MCP remain adapters. |
| Routing order | Run the Store-free current snapshot first. Then use the compatible cache MCP tool, or the cache CLI command when MCP is unavailable. Use the full stateless review when neither cache surface is available. |
| Store check | The shared Store session gate checks configuration, reachability, safety, and policy as part of the cache operation. Do not add a separate Store-status probe. |
| Cache check | In the same admitted lookup session, validate the cache service and schema, resolve the current checkout binding, and perform one bulk exact-key lookup. Distinguish service availability from record hits, misses, and rejected entries. |
| Schema behavior | Add the cache table through the existing Store migration path. Lookup does not create or migrate a Store. An unusable cache schema routes to safe stateless review. |
| Write behavior | Fresh review remains valid when cache writing is denied or fails. The failure affects only later reuse. Explain it naturally only when it matters to the request. |
| Agentic fallback | The documented fallback performs the full stateless review. It does not imitate Global Store cache access or create a project-local cache. |
| Portfolio rule | Rebuild all tallies, attention findings, recommendation order, and other cross-record conclusions from the current full snapshot after combining exact hits with fresh per-record review. |

Preflight result: no unresolved product choice blocks P5. P4 task t15 and its explicit owner acceptance gate still block P5 implementation. A separate owner instruction must start P5 implementation after P4 closes.

## Performance Applicability

| Field | Value |
| --- | --- |
| Candidate ID | `W23-R0-P5-REPEAT-REVIEW` |
| Title | Repeated backlog-report review |
| Testing Type | Performance Testing |
| Base Maintenance Action | `create` |
| Protected Outcome | A maintainer does not wait for unchanged records to receive the same agent review again. |
| Decision Informed | Whether the exact per-record cache meaningfully changes repeat-review work while preserving correctness and fallback behavior. |
| Failure Cost | A false favorable result can ship stale conclusions. A false unfavorable result can reject useful optional reuse. Both are reversible before P6. |
| Risk And Reversibility | Medium correctness and privacy risk. Cache rows are rebuildable and removable. Repository authority is unchanged. |
| Supported Scope | One local Make Docs checkout, the W23 R0 review flow, and the named 70-record workload or a recorded comparable fixture. |
| Product Maturity | Pre-release implementation. |
| Source Authority | [PRD 51](../../prd/51-backlog-review-and-reporting.md) and [PRD 38](../../prd/38-global-store-and-project-state.md). |
| Source Evidence | [P4 measurements](evidence.md#p4-single-file-interactive-report). |
| Baseline Availability | The first report took about 13 minutes. The deterministic snapshot took 1.191 seconds. Rendering took 0.080 seconds. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Owner | W23 R0 P5 work record. |
| Lifecycle Coordinate | W23 R0 P5, after cache correctness passes and before P6. |
| Gate Effect | Informational for speed. Invalid or non-comparable evidence cannot block correctness proof or create a speed claim. |
| Reason | The accepted cache decision needs one bounded, comparable observation. No approved numeric target exists. |
| Next Record | `PERF-001` |

### PERF-001 Repeated Backlog Report Review

#### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `PERF-001` |
| Profile Version | `1` |
| Source Digest | `sha256:5303b73db447269f95fc73aa0c45fd9780608d14c6ad0f70c8b7bb9766b4ee8e` over this profile body with the Source Digest row excluded. |
| Title | Repeated backlog-report review |
| Protected Outcome | Reduce repeated agent review for unchanged records without weakening current-source review. |
| Source Requirements | PRD 51 `R-BACKLOG-SKILL-15` through `R-BACKLOG-SKILL-20`; PRD 38 `R-MIN-1` and `R-MIN-2`. |
| Canonical Owner | [P5 work record](05-incremental-review-cache-and-data-access.md) |
| Product Maturity | Pre-release implementation. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Risk And Failure Cost | Medium. Stale reuse or private-data retention is unacceptable. Slow but correct fallback remains usable. |
| Owner | W23 R0 product owner. |
| Approver | W23 R0 product owner for any later target, waiver, retirement, or supersession. |

#### Supported Scope

| Field | Value |
| --- | --- |
| Surface | `backlog-review` Skill report-model assembly. |
| Platform Or Runtime | The local macOS and Node.js environment used for the P5 candidate. Record exact versions in the result. |
| Deployment Or Device Class | One local developer workstation. |
| Scale | 70 discovered work records, or one recorded comparable fixture with the same record count and review shape. |
| Account And Network State | Local operation. No network dependency is allowed. |
| Resource Envelope | One process and the existing local Global Store. |
| Exclusions | Model-provider load outside the recorded run, other projects, hosted reports, and any speed support claim. |

#### Baseline And Target

| Field | Value |
| --- | --- |
| Comparable Baseline | P4 measurements in `evidence.md`: about 13 minutes end to end, 1.191-second snapshot, and 0.080-second render. |
| Target | none |
| Unit | elapsed seconds plus reviewed, reused, missed, and invalidated record counts |
| Direction | Observe whether repeat work decreases. No pass threshold. |
| Tolerance | none |
| Target Source | none |
| Target Approval | none |

#### Environment And Workload

| Field | Value |
| --- | --- |
| Product Build | Exact Git revision and dirty-file allowlist recorded before the run. |
| Dependency State | Exact package lock digest, Node.js version, snapshot schema version, rule catalog version, and Skill version. |
| Configuration | Default local report flow with cache enabled, then the stated Store-free control. |
| Qualified Environment | Same host, checkout, power state, and model configuration for comparable observations. |
| Dataset Or Fixture | The named W23 R0 70-record repository state or one frozen comparable fixture recorded before the run. |
| Workload | One full stateless review, one exact repeat review, and one review after one controlled record change. |
| Scale | 70 records. |
| Concurrency | One review at a time. |
| Operation Mix | Current snapshot, per-record review assembly, portfolio rebuild, and HTML render. |
| Workload Exclusions | Package publication, unrelated tests, user think time, and unrelated repository work. |

#### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | Start before the current snapshot. End after validated report-model assembly and HTML render. |
| Instrument And Version | Monotonic wall clock from the P5 harness. Record harness and runtime versions. |
| Cold Or Warm State | First observation has no reusable cache entry. Second is an exact warm repeat. Third changes one record before the run. |
| Warmup Rule | No unrecorded warmup. The first observation is the declared cold path. |
| Repetitions Or Observation Window | One cold observation, one exact warm observation, and one one-record-change observation. |
| Statistic | Report each elapsed value and each cache count. Do not infer a stable percentile or mean from three observations. |
| Variance Reporting | State that run-to-run and model-provider variance is not estimated by this bounded profile. |
| Uncertainty Reporting | Record model, host, repository, Store, and instrument limits that affect comparison. |
| Outlier Treatment | Exclude nothing. Mark an interrupted or materially changed run non-comparable. |
| Comparison Method | Compare only observations with the same recorded fingerprint, except for the declared one-record change. |
| Raw Evidence Retention | Store bounded timing and count evidence in the central repository evidence report. Do not store prompts or repository bodies. |
| Observer Effects | Timing instrumentation is local and expected to be negligible. Agent and model service variance remains visible. |

#### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | Current snapshot runs every time. Exact unchanged results match full review meaning. Changed records miss or invalidate. Portfolio values rebuild. |
| Durability | Cache loss or pruning causes a full stateless review with no loss of repository authority. |
| Safety | Unsafe, denied, unavailable, corrupt, or newer Store states do not cause an unsafe read or write. |
| Security | Existing Store path, lock, migration, and access rules apply. |
| Privacy | Cache stores no repository bodies, prompts, secrets, raw logs, or absolute paths. |
| Accessibility | Data view and download control have accessible names, keyboard paths, visible focus, and accurate state. |
| Portability | The report remains one offline HTML file. Store-free review remains complete. |
| Cost | No external paid resource or network dependency is added. |
| Maintainability | Cache identity and diagnostics use one tested contract. No duplicate project-local cache exists. |
| Fixture And Measurement Seam | The harness validates record count, controlled change, cache counts, report parity, and measurement boundaries before use. |

#### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | This W23 R0 P5 work record. |
| Budget Event ID | `W23-R0-P5-PERF-001-V1` |
| Characterization Pass Limit | 3 observations: cold, exact repeat, and one-record change. |
| Materially Distinct Correction Attempt Limit | 2 attempts. |
| Review Cycle Limit | 2 cycles. |
| Elapsed Investigation Time Limit | 2 hours. |
| Compute Limit | 1 local host and 1 review process at a time. |
| External Resource Spend Limit | $0 added external resource spend. |
| Unchanged Fingerprint Action | Reuse the current result. Do not rerun without separate authority. |
| Material Change Action | Rerun only affected observations within the remaining budget. |
| Diminishing Return Rule | Stop when a distinct correction does not change comparability, cache counts, correctness, or the implementation decision. |
| Budget Exhaustion Disposition | Record `blocked` or `revise` and return the decision to the owner. |

#### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | All three comparable observations and cache counts are recorded, all non-sacrificable constraints pass, and no speed target is claimed. |
| `fail` | Comparable evidence shows a reproducible correctness, privacy, safety, or portability break. A slow result alone cannot fail because no numeric target exists. |
| `revise` | The workload, fingerprint, boundary, instrument, or comparison cannot answer the characterization question. |
| `blocked` | A required Store, model, fixture, host, instrument, or authority precondition is missing. |
| `waived` | The owner accepts one named bounded risk with expiry. A waiver is not a pass. |

| Field | Value |
| --- | --- |
| Severity Treatment | Correctness, privacy, safety, or authority breaks are `major` unless evidence supports `critical`; measurement-only gaps are `moderate` or `minor`. |
| Reproducibility Treatment | Record `reproduced`, `not-reproduced`, `intermittent`, or `not-attempted` with attempt links. |
| Finding Route | This P5 record, PRD 51 for product meaning, and PRD 38 for Store-boundary changes. |
| Escalation Route | W23 R0 product owner. |

#### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | Cache identity, schema, snapshot schema, rule catalog, Skill version, workload, model, Store service, instrument, or comparison method changes. |
| Time Or Release Boundary | W23 R0 P6 closeout. |
| Current-Use Invalidation Rule | Any material trigger makes the result historical and non-current. |
| Next Review Condition | A later product target, regression decision, or material cache design change. |
| Requalification Authority | Separate owner or phase authority. |
| Requalification Budget | A new finite budget is required. |
| Unchanged-Fingerprint Qualification Limit | 1 bounded execution. |

#### Lineage And Traceability

| Field | Value |
| --- | --- |
| Predecessor | none |
| Successor | none |
| Promotion Source | P4 measurements in `evidence.md`; these are source evidence, not a target. |
| Promotion Approval | none |
| Supersession Reason | none |
| Plan And Work Links | [P5 plan](../../plans/2026-09-18-w23-r0-backlog-review-and-reporting/05-incremental-review-cache-and-data-access.md) and this work record. |
| Result Links | none; not run |
| Finding Links | none |
| Obligation Links | none |
| History Links | none |
| Support Links | none |

#### Evidence Fingerprint

- Profile ID, version, and digest: `PERF-001` version `1`, bound to the Source Digest in this profile.
- Product build and relevant code state: pre-run state is not-comparable because P5 implementation has not started. Record the exact Git revision and dirty-file allowlist before execution.
- Dependency and configuration state: pre-run state is not-comparable. Record the package lock digest, Node.js version, snapshot schema version, rule catalog version, Skill version, and cache configuration before execution.
- Workload and fixture or dataset: the authorized workload is the named 70-record W23 R0 state or one recorded comparable fixture. Bind its digest before execution.
- Instrument version: the authorized instrument is the P5 monotonic wall-clock harness. Record its version and runtime before execution.
- Analysis method: report each of the 3 elapsed observations and cache counts. Do not calculate or claim a stable percentile or mean.
- Comparability result and reasons: `not-comparable` before execution because no bound build, environment, workload digest, or result exists.

## Source PRD Docs

- [PRD 51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [PRD 38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 25 TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 49 Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: none`

## Stage 1 - Exact cache contract and Store integration

### Tasks

- [ ] t1: Define one cache value and exact key that match PRD 51 and the PRD 38 durable field register.
- [ ] t2: Add the accepted `work.backlog-cache.lookup` and `work.backlog-cache.write` operations through the shared registry. Use the shared Global Store path, session gate, lock, migration, and transaction boundaries.
- [ ] t3: Implement one internal cache service with bulk exact lookup, bounded write, invalidation, corrupt-entry rejection, pruning, and diagnostics. Keep CLI and MCP surfaces free of cache logic.
- [ ] t4: Keep the snapshot operation Store-free and run it before every cache lookup.
- [ ] t5: Keep cached values free of repository bodies, prompts, secrets, raw logs, and absolute paths.

### Acceptance criteria

- A37: Only an exact match on checkout identity, record path, deterministic record digest, snapshot schema version, rule catalog version, and Skill version can supply a cached per-record review fragment.
- A38: The cache is Global Store data classified as `Store-cached and rebuildable`. It creates no project-local operational file and can be deleted or rebuilt without losing authority or recovery state.
- A39: Every report starts with a current deterministic snapshot. A missing, stale, invalid, unreadable, or nonmatching cache entry causes fresh review for that record.
- A39a: Store-read access can reuse exact hits without a write grant. The shared Store gate returns the existing typed Store states before cache code runs, and the lookup result distinguishes cache-service availability from per-record results.
- A39b: A denied or failed cache write does not invalidate the current snapshot, fresh review, or report. The cache operations have matching registry-derived CLI and MCP surfaces and no parallel dispatcher.

### Dependencies

- P4 task t15 and its explicit owner acceptance gate complete.
- Current PRD 51 and PRD 38 authority accepted.
- Current PRD 39 cache-operation admission accepted.

## Stage 2 - Review assembly, fallback, and raw-data access

### Tasks

- [ ] t6: Reuse exact per-record review fragments while rebuilding tallies, attention findings, recommendation order, and every other cross-record conclusion from the current full snapshot.
- [ ] t7: Complete the full stateless review for `store-not-configured`, `store-unavailable`, `store-unsafe`, and `store-denied` states.
- [ ] t8: Explain material cache limits to the human in natural language without presenting cache mechanics as project status.
- [ ] t9: Add an accessible in-report view of the normalized embedded report model.
- [ ] t10: Add a user-started JSON download of the full normalized model. Keep filtered UI state out of the exported model.
- [ ] t11: Update Skill references, package declarations, and focused fixtures without changing the accepted report layout or owner-defined spacing.

### Acceptance criteria

- A40: One changed record causes fresh review only for that record when all other exact keys remain valid. Portfolio conclusions still reflect the current full snapshot.
- A41: Every Store refusal or failure completes the same full stateless review meaning. The human explanation states the effect and next action without blocking the report.
- A42: The report remains one offline HTML file. Its data view and JSON download expose the same full normalized model, keep project text inert, and are accessible by keyboard.

### Dependencies

- A37-A39 complete.

## Stage 3 - Validation, characterization, and review

### Tasks

- [ ] t12: Run focused and full automated checks for schema migration, exact reuse, invalidation, privacy, Store states, package output, data parity, and no project mutation.
- [ ] t13: Validate the `PERF-001` fixture and measurement seam. Run only its three authorized observations. Record the fingerprint, raw evidence, uncertainty, budget ledger, result, limits, and any findings in `evidence.md`.
- [ ] t14: Run Guided Progress Review and Human Experience Review of the data view, JSON download, reuse disclosure, and Store-free fallback explanation.

### Acceptance criteria

- A43: Tests prove exact hits, misses, invalidation, rejected corrupt entries, pruning, stateless fallback, privacy limits, and equivalent report meaning.
- A44: The `PERF-001` result states what changed for the named workload, what remains uncertain, and that no numeric product target or speed support claim exists.

### Dependencies

- A40-A42 complete.
- A validated `PERF-001` execution packet and unchanged pre-run fingerprint.

### Closeout Notes

- Four testing decisions: Automated required; Performance characterize-now; Guided required; Unassisted not-needed-now.
- Performance evidence: `PERF-001` must be completed within its finite budget before P5 closes.
- Human Experience Review: Required for the fallback explanation and raw-data controls.
- Optional experience handoff: Repeat one review, open the report data view, and optionally save the JSON data.
- Explicit human acceptance gate: none.
- Evidence report: Add the P5 result to the central report after evidence exists.
- Phase / capability status: P5 has not started. P6 remains the final package parity and acceptance phase.
- Preflight status: Complete on 2026-09-21. Implementation remains blocked by P4 owner acceptance and requires a separate owner instruction after P4 closes.
