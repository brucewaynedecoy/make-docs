# Performance Evidence Lifecycle Cases

This file is test data. It models records only. It does not authorize an execution or set a product target.

## Candidate Decisions And Target Classes

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical record | Authority limit |
| --- | --- | --- | --- | --- | --- |
| `C-HARD` | `update-existing` | `required-now` | `hard-product-requirement` | `PERF-001` in the owning PRD | Product authority for its stated supported scope only |
| `C-GUARD` | `create` | `required-now` | `engineering-guardrail` | `PERF-002` in the approved work phase | Non-product authority |
| `C-CHAR` | `create` | `characterize-now` | `characterization-baseline` | `PERF-003` in the approved characterization record | Observed distribution only; not a threshold |
| `C-EXPERIMENT` | `create` | `characterize-now` | `experiment-or-stretch` | `PERF-004` in the approved experiment record | Non-product authority |
| `C-DEFER` | `link-only` | `defer-required` | `deferred-required-outcome` | `O-014`; no executable profile | Obligation authority only |
| `C-UNSUPPORTED` | `none` | `reject-unsupported` | `unsupported-assumption` | `none`; no executable profile | Stops before target or execution fields |

## Canonical Profile Bindings

| Profile | Version | Source digest | Target class | Canonical owner | Supported scope | Lineage |
| --- | --- | --- | --- | --- | --- | --- |
| `PERF-001` | `v1` | `digest-hard-v1` | `hard-product-requirement` | Owning PRD requirement | Named product surface and configuration only | Predecessor `none`; successor `none` |
| `PERF-002` | `v1` | `digest-guard-v1` | `engineering-guardrail` | Approved work phase | Named engineering environment only | Predecessor `none`; successor `none` |
| `PERF-003` | `v1` | `digest-char-v1` | `characterization-baseline` | Approved characterization record | Named workload and environment only | Promotion source `none`; successor `none` |
| `PERF-004` | `v1` | `digest-experiment-v1` | `experiment-or-stretch` | Approved experiment record | Named experiment boundary only | Predecessor `none`; successor `none` |
| `PERF-005` | `v1` | `digest-waiver-v1` | `hard-product-requirement` | Owning PRD requirement | Named product surface and release boundary only | Predecessor `none`; successor `none` |

## Characterization Promotion Case

`PERF-003` remains an observed distribution and not a threshold. Promotion is invalid until the owner records all of these items.

| Promotion field | Fixture value |
| --- | --- |
| Source | `PERF-003 v1 digest-char-v1` and its raw and analyzed evidence |
| Comparability | Approved equivalence rule for the proposed workload and environment |
| Normal variance | Recorded distribution and expected variation |
| Measurement resolution | Instrument resolution can distinguish the proposed boundary |
| Protected-outcome rationale | Named human, product, safety, cost, or resource outcome |
| Trade-offs | Explicit effects on every non-sacrificable constraint |
| Owner approval | Canonical target owner approval |
| Superseding lineage | New profile version or ID links to and supersedes `PERF-003` without two live authorities |

Promotion to `hard-product-requirement` also needs current maintenance of the owning PRD.

## Finite Execution Packet

| Field | Fixture value |
| --- | --- |
| Profile binding | `PERF-001`, `v1`, `digest-hard-v1` |
| Build and dependencies | Stable build and dependency identifiers from the authorizing work record |
| Configuration | Named configuration identity and digest |
| Environment | Qualified environment class and exclusions |
| Workload and fixture | Named workload, scale, operation mix, and fixture identity |
| Instrument and measurement | Instrument version, boundary, state, warmup, observation, statistic, uncertainty, variance, outlier, and comparison rules from the profile |
| Correctness precondition | Automated correctness proof and measurement-seam check must pass before execution |
| Non-sacrificable constraints | Correctness, durability, safety, security, privacy, accessibility, portability, cost, and maintainability |
| Finite budget | Authorizing budget event with finite run, correction, review, time, compute, and external-resource limits |
| Fingerprint | Exact profile, build, dependency, configuration, environment, workload, fixture, instrument, and analysis identities |
| Reuse rule | Matching fingerprint reuses the current applicable result |
| Rerun rule | Material change reruns affected checks only within the remaining budget |
| Stop rule | Stop at exhaustion, failed precondition, invalid comparability, safety limit, or diminishing return |
| Evidence destinations | Raw evidence, analyzed evidence, result, finding, waiver, and stable-reference destinations |

## Normalized Results

| Result | Profile binding | Fingerprint state | Outcome | Scope and next action |
| --- | --- | --- | --- | --- |
| `RESULT-PASS` | `PERF-001 v1 digest-hard-v1` | Comparable | `pass` | Valid only for the recorded supported scope and expiry |
| `RESULT-FAIL` | `PERF-002 v1 digest-guard-v1` | Comparable and reproduced | `fail` | Keep the finding open until its own disposition closes it |
| `RESULT-REVISE` | `PERF-003 v1 digest-char-v1` | Resolution cannot support the decision | `revise` | Return the protocol and uncertainty rule to the owner |
| `RESULT-BLOCKED` | `PERF-004 v1 digest-experiment-v1` | Required instrument unavailable | `blocked` | Proves neither pass nor fail |
| `RESULT-WAIVED` | `PERF-005 v1 digest-waiver-v1` | Comparable miss with accepted bounded risk | `waived` | Not a pass; use the waiver scope and expiry |

## Complete Result Record

| Result field | Fixture value |
| --- | --- |
| Identity | `RESULT-PASS` |
| Exact profile binding | `PERF-001 v1 digest-hard-v1` |
| Build | Stable build and dependency identifiers |
| Fingerprint | Exact comparable execution-packet fingerprint |
| Environment | Qualified environment identity and exclusions |
| Workload | Named workload, scale, operation mix, and fixture |
| Raw evidence | Stable raw evidence reference |
| Analyzed evidence | Stable analysis and comparison reference |
| Observed distribution | Recorded samples, statistic, and normal variance |
| Uncertainty | Declared uncertainty and measurement resolution |
| Exclusions | Declared excluded environments and unsupported scope |
| Budget ledger | Runs, corrections, reviews, time, compute, and external spend used and remaining |
| Outcome | `pass` |
| Findings | `none` |
| Owner or reviewer disposition | Accepted for the exact profile and scope |
| Scope limit | Named product surface and configuration only |
| Expiry | Date, release boundary, or invalidation trigger from the profile |
| Later-result link | `none` until a later result supersedes it |

## Finding And Waiver Records

`FINDING-001` records the observed behavior, protected outcome, target class, `major` severity, `reproduced` status, attempts, affected scope, source requirement, evidence, owner, open disposition, expiry, remediation work, and later-result link. Task completion does not close it.

`WAIVER-001` binds `PERF-005 v1 digest-waiver-v1`, the exact miss, affected scope, rationale, accepted risk, intact non-sacrificable constraints, owner, approver, release-bounded expiry, reevaluation trigger, linked `O-021`, and terminal or renewal disposition. It cannot promote a support claim.

## Gate And Reuse Cases

| Case | Evidence state | Gate result |
| --- | --- | --- |
| Current comparable pass | Exact current profile, valid fingerprint, supported scope, no disqualifying finding | Passing for the exact scoped claim |
| Expired result | Expiry or release trigger invalidated current use | Non-passing; history only |
| Non-comparable result | Fingerprint mismatch without an approved equivalence rule | Non-passing; `revise` or `blocked` |
| Missing or invalid result | Required fields or evidence are absent or invalid | Non-passing and unverified |
| Adjacent-mode evidence | Automated test, Guided Progress Review, Unassisted Goal Test, Human Experience Review, installed-product proof, release proof, or support record only | Non-passing for Performance Testing |
| Unchanged reuse | Fingerprint matches the current applicable result | Reuse the result; do not execute again |
| Affected-only rerun | A material change affects named checks | Rerun those checks only and reuse the rest |
| Budget exhausted | No authorized budget remains or diminishing return applies | Stop with `blocked`, `revise`, scoped `fail`, or owner decision |
| First requalification execution | Owner or phase authority created a new finite budget after a valid trigger | One bounded unchanged-fingerprint qualification execution is allowed |
| Repeated requalification execution | The same requalification event already used its one execution | Prohibited until another valid trigger and explicit authorization |

## Traceability And State

Active traceability is `qualification -> PERF-### -> plan budget -> work packet -> result -> finding -> PRD or O-### disposition -> phase gate -> history`.

Each record links forward to its next record and back to its source. A reviewer can trace from qualification to history or from a gate back to the qualification.

Repository records own qualification, profile meaning, target authority, supported scope, findings, waivers, obligations, and history. Project State or Global Store data can project operational progress, fingerprints, raw-evidence references, timestamps, budget ledgers, and evidence references. A Store receipt proves recording only. It cannot change authority, renew a budget, or create an outcome.

## Adoption And Compatibility Case

At the first qualifying design, plan, PRD maintenance, work generation, or phase close after adoption, inventory current thresholds, regression claims, resource budgets, absolute performance language, benchmark assets, and evidence. Do not retroactively fail a completed phase. Do not rerun, certify, move, delete, rename, tighten, promote, or broaden an existing asset by inference. Route an ambiguous or modified managed resource through the PRD 18 conflict stop. The owner must explicitly keep, reclassify, defer, narrow, or remove the candidate.

## Proof-Mode Separation

Performance Testing remains separate from Automated Implementation Testing, Guided Progress Review, Unassisted Goal Testing, Human Experience Review, accessibility or architecture review, static-adapter proof, direct installed-product proof, release validation, and support-claim promotion. One physical run can contribute evidence to more than one mode only when every authority, field set, conclusion, outcome, and gate effect remains explicit.
