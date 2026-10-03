---
title: "W24 R0 P4 Compatibility And Validation"
kind: "plan"
status: "draft"
coordinate: "W24 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-09-24-mcp-tool-profiles.md"
---
# Phase 4: Compatibility And Validation

## Purpose

Prove that grouping changes discovery without changing operation behavior or the current full connection.

## Deterministic Checks

Build a fixture from the ready tool and native-resource inventories. Reject missing, empty, or unknown assignments. Compare the set for `all` to the exact union of the five named profiles. Compare repeated tool contracts by name, schema, description, access facts, and handler identity. Compare allowed resource bytes and provenance across profiles. Reject out-of-profile reads and calls. Keep the current operation-registry parity check in place.

Run representative Store-free reads and write-class calls with and without `allowWrite`. The same operation must return the same result or typed access error independent of profile. Do not turn a Store denial into an apparent profile authorization success or a global task stop.

## Compatibility Checks

Keep two comparisons separate. The pre-W24 source is `793868a9468ff0bd5471261503b24b303cb1b4f5`. The completed P3 source is `cced2bcbb71a4380e1dfbc10b7e2ef549dc271a2`. Preparation changes documents only. A later runtime change must name a new candidate and requalify affected evidence.

The [P1 tool descriptor baseline](../../work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p1/baseline-tool-contracts.json) was captured from the clean pre-W24 source. It proves descriptor identity. It is not a retained pre-W24 native-resource wire capture. The [P3 final stdio capture](../../work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/a9/stdio-results-final.json), [read and CLI parity](../../work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/a7/allowed-read-and-cli-parity-final.json), and [source/build identity](../../work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p3/source-identity-final.json) prove current local default/`all` and cross-profile behavior. Reuse those results after checking their exact fingerprint.

P4 must fill the historical wire gap. Export the fixed pre-W24 commit with `git archive` into a new isolated temporary directory. Keep the active checkout and branch in place. Build only that export. Record its source, lockfile, dependency tree, build hashes, launch arguments, SDK version, resource provider, and fixture. Use a copy of the existing dependency tree only when the lockfile and runtime agree. If they do not agree, stop this comparison and report the missing dependency prerequisite. Do not install, change host settings, or copy generated files back into the active checkout under this packet.

Launch both builds through the same local SDK client with the old argument shape: `make-docs mcp`, with no profile option. Compare full tool names, schemas, descriptions, access facts, resource list fields, allowed resource bytes, and provenance. Use an isolated read-only fixture with identical system-resource bytes and configuration for both builds. Record every difference and its source. This source-to-source comparison can prove old-launch compatibility within that fixture. It does not prove a fresh package installation or a host upgrade.

Separately, compare the same P3 build with no profile option, explicit `all`, and each narrow profile. Only these same-build results inform profile context and discovery cost. Historical build changes cannot count as a profile-only performance effect. Check real CLI help, accepted values, one invalid value, hidden calls, and hidden reads. Stdio is the selected transport. HTTP remains `not-needed` on current evidence. Do not add an HTTP listener or host setup for P4.

## Characterization Packet

The two design candidates bind to the one canonical [PERF-003 profile](#perf-003-profile-context-and-stdio-discovery) below. The [P4 work packet](../../work/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-evidence.md#performance-execution-packet) binds operational evidence to that profile. It does not define a second profile. This preparation records no measurement or run verdict. The budget starts only after separate P4 implementation authority.

### Performance Applicability

| Field | Tool definition context | Startup and discovery latency |
| --- | --- | --- |
| Candidate ID | `W24-CONTEXT` | `W24-DISCOVERY` |
| Testing Type | Performance Testing | Performance Testing |
| Base Maintenance Action | `update-existing` | `update-existing` |
| Protected Outcome | Select a smaller tool definition set for a narrow task. | Preserve ordinary local startup and discovery behavior. |
| Decision Informed | Which profile exposes less definition text in the measured mode. | Whether profile filtering adds visible local overhead. |
| Failure Cost | Misstated context savings can lead a maintainer to choose the wrong setup. | An unclear local delay can lead to a poor setup choice. |
| Risk And Reversibility | Small local scope. Configuration choices are reversible. A false pass overstates savings; a false fail hides useful grouping. | Small local scope. Configuration choices are reversible. A false pass hides delay; a false fail rejects useful grouping. |
| Supported Scope | One local stdio SDK client. Definition bytes are a context proxy. Actual model-visible tokens require a separate host observation. | One local stdio SDK client on the named machine, runtime, build, and fixture. |
| Product Maturity | Maintainer development build; bounded characterization. | Maintainer development build; bounded characterization. |
| Source Authority | [Design candidates](../../designs/2026-09-24-mcp-tool-profiles.md#performance-evidence-candidates), [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md). | [Design candidates](../../designs/2026-09-24-mcp-tool-profiles.md#performance-evidence-candidates), [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md). |
| Source Evidence | [P3 final lists](../../work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/a9/stdio-results-final.json). | [P3 final replay](../../work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p3/stdio-proof-results-final.json). |
| Baseline Availability | Current `all` lists exist. Comparable measured bytes and model-visible tokens have not been captured. | No timed profile baseline exists. Current `all` is the same-build comparator. |
| Applicability | `characterize-now` | `characterize-now` |
| Target Class | `characterization-baseline` | `characterization-baseline` |
| Owner | Make Docs maintainer; W24 R0 P4. | Make Docs maintainer; W24 R0 P4. |
| Lifecycle Coordinate | W24 R0 P4 after separate implementation authority. | W24 R0 P4 after separate implementation authority. |
| Gate Effect | Informational measurements. Honest evidence and claim limits are required for phase closeout. | Informational measurements. Honest evidence and claim limits are required for phase closeout. |
| Reason | The current lists are stable enough to characterize their size. Host token visibility may be unavailable. | A fixed local protocol can characterize startup and discovery without a product target. |
| Next Record | [PERF-003](#perf-003-profile-context-and-stdio-discovery). | [PERF-003](#perf-003-profile-context-and-stdio-discovery). |

### PERF-003 Profile Context And Stdio Discovery

#### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `PERF-003` |
| Profile Version | `1` |
| Source Digest | `sha256:596198aff5593560606677258b4754cd81aef440477d1d3a058f5828aecbe6eb` |
| Title | Profile context and stdio discovery |
| Protected Outcome | Show the definition size and local discovery cost of each task profile under one fixed workload. |
| Source Requirements | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [design candidates](../../designs/2026-09-24-mcp-tool-profiles.md#performance-evidence-candidates), [performance contract](../../../.make-docs/system/contracts/performance-evidence-governance.md). |
| Canonical Owner | `docs/plans/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-validation.md` |
| Product Maturity | Maintainer development build; bounded characterization. |
| Applicability | `characterize-now` |
| Target Class | `characterization-baseline` |
| Risk And Failure Cost | Reversible local profile choice. False context or timing claims can mislead maintainers. No wider support claim is permitted. |
| Owner | Make Docs maintainer. |
| Approver | Repository owner for profile changes, waiver, retirement, or scope promotion. |

The digest is SHA-256 of the UTF-8 profile section from its level-three heading through its last line. Normalize line endings to LF. Retain the final LF. Omit only the full `Source Digest` table row. A result binds this digest and version. Increment the version for a material method, scope, workload, authority, or rule change.

#### Supported Scope

| Field | Value |
| --- | --- |
| Surface | Local MCP `tools/list` and `resources/list` through stdio. |
| Platform Or Runtime | Node 24.19.0; darwin arm64; Darwin 27.0.0; Apple M4; 25769803776 memory bytes. |
| Deployment Or Device Class | The one local maintainer development machine. |
| Scale | Six profile variants, one active server and one client. |
| Account And Network State | No Store, network, paid inference, or account operation in the measurement workload. |
| Resource Envelope | Local machine and the finite evidence budget below. |
| Exclusions | HTTP, installed-host acceptance, package installation, model inference latency, app UI, and wider operating-system support. |

#### Baseline And Target

| Field | Value |
| --- | --- |
| Comparable Baseline | Same-build explicit `all` in the first authorized pass. Historical captures are correctness assets, not timing baselines. |
| Target | None. Characterize the observed values. |
| Unit | Unique entries; UTF-8 bytes; elapsed milliseconds. Model-visible tokens only from a named host diagnostic. |
| Direction | Report signed narrow-minus-`all` differences. No favorable direction is a pass condition. |
| Tolerance | None. No performance threshold is approved. |
| Target Source | None. |
| Target Approval | None. |

#### Environment And Workload

| Field | Value |
| --- | --- |
| Product Build | P3 source `cced2bcbb71a4380e1dfbc10b7e2ef549dc271a2`; verify runtime source and built JavaScript against [P3 identity](../../work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/p3/source-identity-final.json) before execution. Bind the full build digest in the run manifest. |
| Dependency State | Root lockfile SHA-256 `562a373c459023633d04e4fec62bf5b3c4d6e9a4e3e4d55aba6fe5130fdff784`. Record installed SDK, Zod, package, Node, and dependency-tree identities before execution. A mismatch stops binding. |
| Configuration | Same command, target root, read-only fixture, resource origin, environment variables, and access settings. Only the explicit profile value differs. |
| Qualified Environment | The machine and runtime above. Before the first spawn, record OS, hardware, power mode, load, process list summary, and fixture path with machine-local paths sanitized. Use the same recorded state for each variant. |
| Dataset Or Fixture | One isolated read-only fixture with the P3 system catalog and system-resource bytes. Hash its complete input manifest before execution. No user project or Store data. |
| Workload | Initialize one fresh server, read tools and native-resource lists, then close it. Validate list correctness before accepting samples. |
| Scale | Six explicit variants: `all`, `core`, `setup`, `workflow`, `quality`, `backlog`; five rounds. |
| Concurrency | One client and server at a time. |
| Operation Mix | One cold initialize boundary, one unmeasured tools list, one unmeasured resource list, then five alternating measured tools/resource list pairs per server. |
| Workload Exclusions | Tool calls, resource content reads, writes, Store checks, host rendering, and model inference. They belong to separate correctness or host proof. |

#### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | Cold: immediately before child spawn to completed MCP initialize/ready handshake. Include Node start and server initialization; exclude build and client import. Warm: immediately before a list request to receipt of its full parsed response. Exclude report formatting and content reads. |
| Instrument And Version | Local Node 24.19.0 SDK `Client` and `StdioClientTransport`; monotonic `performance.now()`. Hash the versioned harness and analysis script before the first measured launch. |
| Cold Or Warm State | Cold means a new process. Operating-system and file caches stay uncontrolled. These samples cannot prove fully cold-host performance. Warm means the same initialized process after the declared list warmups. |
| Warmup Rule | No discarded cold run. One unmeasured tools list and one unmeasured resource list per process. Retain warmup outcomes. |
| Repetitions Or Observation Window | Five rounds. Rotate the base order `all, core, setup, workflow, quality, backlog` left by the round index. Each round creates six fresh processes. Each process runs five measured alternating list pairs. |
| Statistic | Per profile: five cold values and 25 values for each warm list type. Report median, minimum, maximum, and each raw value. Use round-paired cold differences and round-median warm differences against `all`. No percentile tail claim. |
| Variance Reporting | Report the full observed range and round-to-round changes. Do not replace variance with a single average. |
| Uncertainty Reporting | Report timer resolution, small sample count, operating-system cache, background load, and protocol parsing cost. Do not claim population confidence or a causal model-context saving. If these limits prevent a useful comparison, use `revise` or `blocked`. |
| Outlier Treatment | Retain all valid observations. Exclude only a failed protocol call or an invalid fingerprint, with raw record and reason. A slow result is not an exclusion. Do not add samples to improve a result. |
| Comparison Method | Compare same-build variants only when all fingerprint fields agree except the profile. Stable serializer sorts object keys, preserves array order, and uses UTF-8 `JSON.stringify` bytes for the returned tool array. Counts use unique names and URIs. Model-visible tokens require the same named host, model, tokenizer/version, loading mode, and observation boundary; SDK bytes cannot substitute. |
| Raw Evidence Retention | During P4, retain immutable attempt-numbered JSON records, manifest, sample order, warmups, elapsed values, errors, exclusions, list arrays, serialized bytes/digests, analysis, and ledger under the W24 work package's `evidence/p4/`. Keep every attempt; do not overwrite P1-P3 evidence. Retain with repository history. |
| Observer Effects | Client parse and serialization cost is included in the stated boundary. Write raw captures after each timed boundary. Use the same client and serializer. Await each call before the next call; calls never overlap. Run no parallel test or build during the pass. |

#### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | P4 stage 1 exact union, contracts, admission, access, read bytes, and denial checks pass before measurements. Validate every measured list against that inventory. |
| Durability | Keep all attempt evidence and P1-P3 captures. No project or Store writes in this workload. |
| Safety | Terminate the bounded child process on protocol failure or timeout. Do not leave a listener or background task. |
| Security | Profile scope never grants access. Hidden tools and resources stay denied. |
| Privacy | Use fixture data only. Sanitize environment fields and paths. No secrets or user content in captures. |
| Accessibility | Review task names, help, and recovery text through the separate Guided Progress Review. Timing does not prove accessibility. |
| Portability | State the one machine/runtime limit. No cross-platform support claim. |
| Cost | No outside spend or paid inference. Local execution stays inside the finite budget. |
| Maintainability | Use the current catalog and handlers. Do not create a second implementation for speed. |
| Fixture And Measurement Seam | Before timing, confirm fixture hashes, SDK list equality, timer boundaries, raw retention, and child cleanup using unmeasured correctness evidence. A seam failure stops the pass. |

#### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | [W24 R0 P4 work](../../work/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-evidence.md). This is a prepared budget; separate P4 implementation authority must activate it. |
| Budget Event ID | `W24-R0-P4-PERF-003-B1` |
| Characterization Pass Limit | 1 complete pass. |
| Materially Distinct Correction Attempt Limit | 1 affected-only correction attempt for a real harness, fixture, or fingerprint defect. A disappointing value is not a defect. |
| Review Cycle Limit | 2 cycles. |
| Elapsed Investigation Time Limit | 90 minutes from packet activation, including setup, measurement, correction, analysis, and review. |
| Compute Limit | 60 fresh server launches and 720 list calls across the initial pass and correction. A pass has 30 launches and 360 list calls including warmups. |
| External Resource Spend Limit | 0 monetary spend and 0 paid model requests. |
| Unchanged Fingerprint Action | Reuse the applicable result. No unchanged rerun under this budget. |
| Material Change Action | Rerun only affected checks using the remaining correction, time, and compute budget. Keep unaffected valid evidence. |
| Diminishing Return Rule | Stop after the declared samples, when a distinct correction does not change the evidence disposition, when an apparent difference is below measured timer resolution, or when the next action exceeds remaining budget. |
| Budget Exhaustion Disposition | Record `blocked` for a missing prerequisite or `revise` for an unfit method. A proved constraint break is a scoped `fail`. Route any budget or authority change to the repository owner. No automatic extension. |

Use a 10-second timeout for each protocol request and a 30-second startup timeout. Stop the affected variant on timeout. Keep the error, spent budget, and unrun scope visible. Do not replace failed observations with favorable data. The timeout bounds the run; it is not a product latency target.

#### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | The authorized packet retains valid comparable local observations and all protected constraints. This means characterization is complete, not that a latency or token target was met. |
| `fail` | Reproducible comparable evidence proves a protected correctness, access, safety, or evidence-retention constraint break. No latency miss can be inferred without a target. |
| `revise` | The method, scope, comparison, or uncertainty is unfit for the current decision. |
| `blocked` | A required build, environment, dependency, instrument, permission, or budget prerequisite is missing. |
| `waived` | The repository owner records a bounded accepted risk and expiry for an exact miss. The agent cannot approve it. |

| Field | Value |
| --- | --- |
| Severity Treatment | Use `critical` for unsafe exposure or data loss; `major` for wrong contract or access; `moderate` for misleading required evidence; `minor` for a bounded report defect. |
| Reproducibility Treatment | Use `reproduced`, `not-reproduced`, `intermittent`, or `not-attempted`; retain attempt references. |
| Finding Route | W24 R0 P4 work and evidence; route a material requirement gap to its owning PRD through the normal maintenance process. |
| Escalation Route | Repository owner receives the exact profile, evidence, outcome, severity, attempts, budget used, remaining scope, and bounded choices. |

Actual model-visible tokens are conditional evidence. Read only diagnostics from an already available, authorized host with a known model/loading boundary. Do not configure a host or send a paid request under this packet. If no valid measure is available, record `unavailable`, the reason, and the excluded claim. This does not block the local size and timing inquiry. It permits no token-savings claim. HTTP remains `not-needed`, not an unrun supported configuration.

#### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | Profile meaning, runtime code, build, dependencies, fixture, configuration, machine, OS, power mode, host/model/loading boundary, instrument, or analysis change. |
| Time Or Release Boundary | W24 R0 P4 closeout. The result then remains historical baseline evidence; it cannot accept a later release. |
| Current-Use Invalidation Rule | A changed fingerprint invalidates only affected current-use claims. Retain old evidence as history. Missing or unrun evidence has no current pass. |
| Next Review Condition | A current decision needs changed or expired evidence. Review only that need. |
| Requalification Authority | Separate repository-owner or later phase authorization. Expiry alone grants no run authority. |
| Requalification Budget | A new finite budget must be declared and authorized before requalification. |
| Unchanged-Fingerprint Qualification Limit | Exactly one bounded execution. |

#### Lineage And Traceability

| Field | Value |
| --- | --- |
| Predecessor | None. PERF-001 and PERF-002 own other workloads. |
| Successor | None. |
| Promotion Source | None. |
| Promotion Approval | None. |
| Supersession Reason | None. |
| Plan And Work Links | [P4 plan](04-compatibility-and-validation.md), [P4 work](../../work/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-evidence.md). |
| Result Links | None. Preparation has no run result. |
| Finding Links | None. |
| Obligation Links | None. No later required host or token outcome is created. |
| History Links | [P3 history](../../../.make-docs/archive/history/2026-10-03-w24-r0-p3-mcp-tool-profiles.md). |
| Support Links | None. This profile creates no support claim. |

#### Evidence Fingerprint

- Profile ID, version, and digest: `PERF-003`, version `1`, Source Digest above.
- Product build and relevant code state: P3 source and verified source/build hash manifest from Environment And Workload.
- Dependency and configuration state: Exact lockfile, installed dependency tree, launch, fixture origin, and sanitized environment manifest.
- Qualified environment: The one named machine/runtime, with activation power and load record.
- Workload and fixture or dataset: Six profile variants and the hashed read-only fixture manifest.
- Instrument version: Frozen SDK, harness, serializer, timer, and analysis digests.
- Analysis method: Median and observed range with round-paired comparisons; no target or tail inference.
- Comparability result and reasons: `not-comparable` before execution because no timed run manifest or measured result exists. The activation record must classify the actual fingerprint and state its reason before comparison.

#### Budget Ledger

- Authorizing scope and budget event: Prepared W24 R0 P4 packet; `W24-R0-P4-PERF-003-B1`. Execution authority is not yet granted.
- Requalification authorization: None.
- Declared limits: The six finite limits in Evidence Budget And Stop Rules.
- Materially distinct attempts: 0.
- Affected checks: No execution checks started.
- Time, compute, and external spend: 0 execution time, 0 launches, 0 list calls, 0 external spend.
- Review cycles used: 0 execution review cycles. Preparation document checks do not consume a measurement pass.
- Remaining budget: The prepared limits remain inactive until P4 implementation is authorized.
- Unchanged evidence reused: P1 descriptor baseline and P3 correctness captures are linked above. No performance result exists to reuse.
- Stop reason and escalation: Await separate P4 implementation authority. No performance verdict is recorded.

## Human Experience Review

Inspect real CLI help, one current single-server configuration, one narrow configuration, the profile lists, and unknown or out-of-profile errors. For each accepted promise, record the observed result, conclusion, limit, and next action. A maintainer can confirm task-name clarity and recovery without reading internal IDs first. This is an agent review. Human feedback is optional.

## Testing Decisions

The [P4 work decisions](../../work/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-evidence.md#current-testing-decisions) are the one current record for all four testing types. Performance Testing consumes PERF-003. Human Experience Review remains a separate agent lens. Optional human feedback is not a gate.

## Completion Boundary

Run PRD authority validation and documentation link checks. Record exact commands, results, host limits, and any later obligation. Do not mark the app's separate review, publication, or task creation behavior complete from W24 evidence. Do not stage, commit, install, or change a host configuration as part of this planning package.
