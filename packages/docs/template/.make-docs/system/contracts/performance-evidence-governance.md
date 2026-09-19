# Performance Evidence Governance Contract

## Purpose

Use this contract to decide when performance evidence is needed and what that evidence can prove.

This is the sole reusable policy source for Make Docs performance evidence. The prompt orders the coverage work. The reference explains the policy. The template supplies the record shape. Those resources must not create a second policy source.

This contract applies to latency, throughput, resource use, capacity, startup or interaction response, and artifact size when size changes execution. It applies across GUI, CLI, API, SDK, service, device, batch, background, and headless surfaces.

The initial delivery is documentation-first. The admitted validation twin adds one read-only structural validator and one canonical agent review method. It does not create a benchmark runner, daemon, retry service, or hidden state change.

## Resource Composition

| Role | Stable URI |
| --- | --- |
| Governing contract | `make-docs://system/contract/performance-evidence-governance.md` |
| Coverage prompt | `make-docs://system/prompt/performance-coverage.prompt.md` |
| Workflow reference | `make-docs://system/reference/performance-evidence.md` |
| Progressive profile template | `make-docs://system/template/performance-evidence-profile.md` |

The installed provider supplies these resources by default. A project can use a valid local projection. The project does not need a local copy.

## Start With Applicability

Inventory each current candidate before you define a target or start a measurement.

Record one base coverage action for each candidate:

- `create`;
- `update-existing`;
- `link-only`; or
- `none`.

Record one performance applicability disposition for each candidate:

| Disposition | Use |
| --- | --- |
| `required-now` | Current evidence is necessary for an accepted product outcome, feasibility limit, safety or resource boundary, external mandate, dependency budget, or material regression decision. |
| `characterize-now` | A current decision needs a baseline, and the path is stable enough for the measurement to have meaning. |
| `defer-required` | An accepted later outcome remains owed through one stable `O-###` record. |
| `not-needed` | Performance evidence cannot change a current decision. |
| `reject-unsupported` | The candidate rests on intuition, copied numbers, arbitrary round values, absolute language, or an unowned implementation preference. |

The qualification record must name the candidate, protected outcome, decision informed, failure cost, risk, reversibility, supported scope, product maturity, source authority or evidence, baseline availability, owner, lifecycle coordinate, and reason.

Words such as fast, instant, real-time, zero regression, at scale, and production-grade do not qualify a candidate by themselves.

Only `required-now` and `characterize-now` can proceed to an executable profile. `Defer-required` stops at the linked `O-###`. `Not-needed` and `reject-unsupported` stop with their recorded reason.

Do not relabel a blocked active run as `not-needed` because execution is difficult.

## Keep Proof Proportionate

Set the proof burden from the current decision. Consider product maturity, blast radius, reversibility, user harm, data or financial exposure, support scope, novelty, platform variance, false-pass cost, false-fail cost, and evidence cost.

For proof-of-concept work, prefer the smallest useful feasibility characterization. For MVP work, prefer bounded baselines and engineering guardrails for critical paths. For beta or prerelease work, prefer representative workloads and stated uncertainty for claimed scopes. For production work, use maintained profiles, risk-based coverage, expiry, and reevaluation.

These are default postures. They are not exemptions. They do not create a target. A genuine feasibility, safety, contract, or central product outcome can require a hard boundary at any maturity level.

## Assign One Target Class And Owner

Every applicable candidate has one target class.

| Target class | Meaning | Canonical owner | Executable now |
| --- | --- | --- | --- |
| `hard-product-requirement` | An approved blocking product target for an exact protected outcome and scope | The active PRD that owns the outcome | Yes, with `required-now` |
| `engineering-guardrail` | A bounded engineering limit that does not define product support | The accepted plan or work phase that owns its finite budget | Yes, with `required-now` |
| `characterization-baseline` | An observed distribution with stated uncertainty, not a pass/fail gate | The accepted plan, work, engineering, or characterization record that owns the inquiry | Yes, with `characterize-now` |
| `experiment-or-stretch` | A bounded inquiry or stretch aim with no product authority | The accepted plan, work, engineering, or experiment record that owns the inquiry | Yes, when current applicability permits it |
| `deferred-required-outcome` | An accepted later outcome | One `O-###` record | No |
| `unsupported-assumption` | A candidate without adequate authority or evidence | The record that rejects or revises it | No |

A hard product target exists only when the active owning PRD states the protected outcome and contains the explicit owner-approved requirement. It can block only its accepted scope. It is the only target class that has product authority.

Plan and work profiles are non-product authority. They cannot create a support claim or silently change a PRD. An execution packet can bind operational detail. It cannot define or change a product target.

Each target has one live canonical authority. Canonical means the one source allowed to define its current meaning. Other records link to it. They do not copy it into another live target.

Characterization must come before threshold promotion. An observed baseline does not become a hard target or engineering guardrail by itself. Promotion requires the source, comparability, normal variance, measurement resolution, protected-outcome reason, trade-offs, and owner approval. Promotion to product authority also requires current PRD maintenance. The promoted profile must link to the source profile and supersede it without leaving two live authorities.

## Preserve Profile Identity And Lineage

Each executable candidate uses one repository-canonical `PERF-###` profile. IDs are project-wide and append-only. Do not reuse or renumber them.

Keep the same ID when the protected outcome and workload stay the same. Increment `profile_version` when the target, authority, scope, environment, workload, measurement method, analysis, or outcome rules change in a meaningful way. Use a new ID for a materially different protected outcome or workload.

Bind each result to the exact profile ID, version, and source digest. Record predecessor, successor, promotion source, replacement, retirement, and superseding reason when they apply.

## Predeclare Measurement And Comparability

Before a blocking execution, the profile must state:

- the product build and relevant dependency and configuration state;
- the instrument version and measurement boundary;
- the qualified environment or environment class;
- the workload, scale, fixture or dataset, concurrency, and operation mix;
- the cold or warm state and warmup rule;
- the repetitions or observation window;
- the statistic, variance, and uncertainty treatment;
- the outlier rule;
- the comparison method;
- the raw-evidence retention rule; and
- any material observer effect.

Choose these items for the protected decision and instrument. Make Docs supplies no shared sample count, warmup, statistic, interval, variance limit, outlier rule, workload, environment, framework, or recipe.

Compare results only when their evidence fingerprints match or the profile states and supports an explicit equivalence rule. Do not silently compare material differences in host, operating system, architecture, virtualization, dependency state, power or thermal state, data, scale, configuration, or instrument.

Keep uncertainty, environment variance, instrument limits, exclusions, and excluded observations visible. Apply only the predeclared outlier rule. If variance or measurement resolution cannot support the decision margin, use `revise` or `blocked`.

## Protect Non-Sacrificable Constraints

Correctness, durability, safety, security, privacy, accessibility, portability, cost, and maintainability are preconditions. A faster result cannot pass when it breaks one of these constraints.

Validate the fixture and measurement seam before optimization work begins.

## Bound The Work

Each execution phase must declare finite limits for:

- characterization passes;
- materially distinct correction attempts;
- review cycles;
- elapsed investigation time;
- compute; and
- external resource spend.

An unspecified or self-renewing budget is invalid.

The evidence fingerprint binds the profile version and digest, build, relevant code and dependency state, configuration, environment, workload, fixture or dataset, instrument version, and analysis method. It also records the comparability result and reasons. A fingerprint supports a reuse decision. It does not authorize an execution.

When the fingerprint is unchanged, reuse the prior applicable result. A desire for another outcome is not a material change. The single requalification case below is the only exception.

After a material change, rerun only the affected checks. Reuse all unaffected valid evidence. Spend only the remaining authorized budget.

Stop at budget exhaustion or diminishing return. Diminishing return exists when distinct attempts do not change the verdict, an improvement is below the declared resolution or tolerance, or the next attempt costs more than the remaining budget. Use `blocked`, `revise`, a scoped `fail`, or an owner decision. Do not grow the budget without new authority.

Evidence must cover the smallest representative scope that supports the decision. Do not require an exhaustive matrix or proof outside claimed configurations.

The budget ledger must name the authorizing plan or work scope, budget event, declared limits, each distinct attempt, affected checks, time, compute, spend, review cycles, remaining budget, reused evidence, stop reason, and escalation. It cannot renew itself.

## Record Outcomes, Findings, And Waivers

Each executed profile version has one outcome:

| Outcome | Meaning |
| --- | --- |
| `pass` | The exact profile version and supported scope meet the rule, with required evidence and all non-sacrificable constraints intact. |
| `fail` | Comparable and reproducible evidence shows a valid target miss or constraint break. |
| `revise` | The target, profile, protocol, comparison rule, uncertainty treatment, or protected outcome is not fit for the decision. |
| `blocked` | A required environment, dependency, instrument, access, budget, or other precondition is missing. It proves neither pass nor fail. |
| `waived` | The owner accepts a stated risk for a bounded scope and time. It is not a pass. |

Use one severity for each result or finding: `critical`, `major`, `moderate`, or `minor`. Use one reproducibility state: `reproduced`, `not-reproduced`, `intermittent`, or `not-attempted`.

A performance result must record its identity, exact profile binding, build, fingerprint, environment, workload, raw and analyzed evidence, observed distribution, uncertainty, exclusions, budget ledger, outcome, findings, owner or reviewer disposition, scope limit, expiry, and later-result link.

A finding must record its identity, observed behavior, expected protected outcome, target class, severity, reproducibility and attempts, affected scope, source requirement, evidence, owner, disposition, expiry, remediation work, and later result. Completing a task does not close a finding by itself.

A waiver must name the exact requirement and profile, miss, affected scope, reason, accepted risk, non-sacrificable constraint status, owner, approver, expiry or release boundary, reevaluation or remediation trigger, and linked `O-###` when work remains owed. A waiver cannot be indefinite or self-approved by an implementation agent. It cannot promote a support claim. Renewal needs material review.

An escalation must state the profile, evidence, current outcome, severity, reproducibility, budget used, unchanged-check state, real decision deadline when one exists, and owner choices. The implementation agent can report options. It cannot select a change to authority.

## Expire And Requalify Evidence

Evidence expires when a declared change or boundary makes it no longer current. Triggers can include the profile, build, environment, workload, scope, dependency, instrument, analysis method, time boundary, or release boundary.

Expired evidence remains history. It cannot support a current pass. Expiry does not authorize execution, renew a budget, or imply pass or fail.

Each requalification needs separate owner or phase authorization and a new finite budget. If the fingerprint is unchanged, that authorization permits exactly one bounded qualification execution. After that execution, reuse the result until a valid later trigger and another explicit authorization.

If a material change occurs during requalification, rerun only affected checks within the remaining requalification budget.

## Keep Proof Modes Separate

Performance Testing does not replace Automated Implementation Testing, Guided Progress Review, Unassisted Goal Testing, agent Human Experience Review, owner or architecture review, accessibility testing, visual regression, static-adapter proof, direct installed-product proof, release validation, or support-claim promotion.

Another proof type can report perceived slowness or share a physical run. It certifies no performance profile unless the performance authority, required fields, comparison rules, and outcome stay explicit. A performance result does not certify another proof type or gate.

## Keep Repository And Operational State Separate

The repository is canonical for qualification, target class, `PERF-###` identity and schema, source requirements, protected outcome, scope, target and waiver meaning, owner, approver, expiry rules, findings that change product meaning, obligations, and history.

Project State or the Global Store can project run IDs, fingerprints, raw-evidence references, timestamps, attempt and budget ledgers, review state, and large-evidence references. This state is operational only. It must be privacy-bounded and rebuildable from repository authority and retained evidence.

A Store row or receipt proves only the operational write. It does not create or change product meaning. Missing operational evidence makes a required result unverified. It does not erase or reinterpret the repository profile.

## Adopt Without Retroactive Claims

Do not retroactively fail completed phases. At the first qualifying design, plan, PRD maintenance, work generation, or phase close, inventory active thresholds, regression claims, resource budgets, absolute performance language, benchmark assets, and current evidence.

Keep an existing hard target only when its source, owner, protected outcome, profile, and comparability can be calibrated. Otherwise, the owner must reclassify, defer, narrow, or remove it through current authority.

Existing scripts and results remain assets only for what they prove. Adoption does not delete, move, rename, rerun, certify, tighten, promote, or broaden them. Do not infer a pass from old green output or fabricate missing evidence.

## Validation Methods

Use one or both methods. Keep their evidence separate.

### Deterministic method

When the Make Docs CLI is available, run:

```text
make-docs run performance evidence validate --target-root <project>
```

The operation reads Markdown repository authority under `docs/` and `.make-docs/archive/history/`. It inventories candidate language and validates the catalog-marked structural facts. It runs no benchmark and writes no project, Store, or host file.

The result status is `passed`, `failed`, `blocked`, or `refused`. Only `passed` earns `validator-passed`. A failed, blocked, or refused result has no favorable proof state. A fingerprint classification is only `unchanged`, `materially-changed`, or `not-comparable`, with its recorded reason. It never authorizes an execution or retry.

### Agent method

Use this method when the CLI is absent or unavailable, or when a catalog rule requires judgment.

1. Read repository authority from `docs/` and `.make-docs/archive/history/`. Do not use hidden state as authority.
2. State whether the deterministic operation ran. If it did not run, say so. Do not infer a validator pass.
3. Inventory numeric units, rates, percentiles, percentages, resource quantities, relative comparisons, and absolute performance language. Do not decide applicability from the inventory alone.
4. Review every applicable `PERF-###` profile and linked result, finding, waiver, obligation, and evidence record against the rule catalog below.
5. For each reviewed rule, record the rule ID, exact evidence, observation, conclusion, limit, and next action.
6. Apply judgment only to catalog rules marked `agent-only` or `partial`. Report a missing owner choice as a product question. Do not answer it on the owner's behalf.
7. Preserve missing, invalid, expired, non-comparable, adjacent-mode, and unsupported evidence without favorable inference.
8. A complete agent review can earn `agent-reviewed`. It cannot earn `validator-passed`. Use `combined` only when a separate passed deterministic result and a separate completed agent review both exist.

The agent method is read-only. It does not repair files, run a benchmark, select a target, approve a waiver, close a finding or obligation, renew a budget, authorize a run or retry, promote supported scope, or substitute for another testing or proof mode.

### Stable rule catalog

| Rule | Class | Deterministic support | Agent review | Diagnostic | Parity or one-sided reason |
| --- | --- | --- | --- | --- | --- |
| `PERF-RULE-001` | fact | full | Confirm safe, readable repository authority roots. | `PERF-VAL-001` | Both methods stop on unreadable, unsafe, or escaping authority. |
| `PERF-RULE-002` | fact | full | Inventory candidate language without deciding applicability. | `PERF-VAL-002` | Both methods preserve the same candidate classes. |
| `PERF-RULE-003` | fact | full | Confirm one append-only `PERF-###` identity, version, and digest. | `PERF-VAL-003` | Both methods inspect the same profile binding. |
| `PERF-RULE-004` | fact | full | Confirm required profile structure and resolved values. | `PERF-VAL-004` | Both methods use the canonical profile shape. |
| `PERF-RULE-005` | fact | full | Confirm the target class and canonical owner location. | `PERF-VAL-005` | Both methods use the target-class owner map. |
| `PERF-RULE-006` | fact | full | Confirm the durable approver and required target approval. | `PERF-VAL-006` | Both methods require recorded approval evidence. |
| `PERF-RULE-007` | fact | full | Confirm expiry triggers and one bounded unchanged-fingerprint requalification. | `PERF-VAL-007` | Both methods preserve expiry and separate requalification authority. |
| `PERF-RULE-008` | fact | full | Confirm every evidence limit is finite and cannot renew itself. | `PERF-VAL-008` | Both methods reject unspecified, unlimited, and self-renewing budgets. |
| `PERF-RULE-009` | fact | full | Confirm diminishing-return and budget-exhaustion stops. | `PERF-VAL-009` | Both methods preserve finite stop behavior. |
| `PERF-RULE-010` | fact | full | Confirm only `pass`, `fail`, `revise`, `blocked`, and `waived`. | `PERF-VAL-010` | Both methods keep outcome and proof state separate. |
| `PERF-RULE-011` | fact | full | Confirm authority, plan, work, result, finding, waiver, and obligation lineage. | `PERF-VAL-011` | Both methods keep repository records authoritative. |
| `PERF-RULE-012` | fact | full | Confirm evidence links are present, readable, and repository-bounded. | `PERF-VAL-012` | Both methods preserve missing or unsafe evidence as a failure state. |
| `PERF-RULE-013` | fact | full | Report the declared fingerprint class and reason only. | `PERF-VAL-013` | Neither method turns fingerprint equality into run authority. |
| `PERF-RULE-014` | fact | partial | Decide whether a flagged numeric work criterion is stricter than linked authority. | `PERF-VAL-014` | The validator flags missing traceability. The agent supplies the decision-specific comparison. |
| `PERF-RULE-015` | decision | agent-only | Review applicability and maturity against the current product decision. | `PERF-AGENT-015` | Applicability and maturity depend on current risk, value, and product direction. |
| `PERF-RULE-016` | decision | agent-only | Review whether the declared environment and comparison support the current decision. | `PERF-AGENT-016` | Representative conditions and material equivalence require decision-specific judgment. |
| `PERF-RULE-017` | decision | agent-only | Review impact, severity, accepted risk, waiver authority, and supported scope. | `PERF-AGENT-017` | These items are owner decisions and cannot be derived from structure. |
| `PERF-RULE-018` | fact | full | Confirm honest proof state and all method limits. | `PERF-VAL-018` | Each method reports only its own evidence path and never certifies the other. |

Any catalog change must review its mapped deterministic rule, agent instruction, diagnostic, fixtures, and tests. An agent-only or otherwise one-sided rule must retain its explicit reason.

## Automation Limit

The deterministic operation may check structure, links, identity, owner location, approval, expiry, budget, stop rules, traceability, evidence references, controlled vocabulary, and declared fingerprint equality.

Neither method may decide applicability, maturity, target value, analysis method, representative environment, comparability, user impact, severity, trade-offs, waiver approval, obligation fulfillment, supported scope, requirement changes, or support-claim promotion. Neither method may authorize executions or retries.
