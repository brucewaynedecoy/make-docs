---
title: "48 Performance Evidence Governance"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md"
---

# 48 Performance Evidence Governance

## Purpose

Performance Evidence Governance defines how Make Docs decides whether performance evidence is needed, calibrates proof to product maturity and risk, assigns target authority, executes bounded evidence work, and records conclusions without manufacturing precision or allowing repeated checks to become an unbounded optimization loop.

The governing invariant is that a performance target becomes blocking product authority only when an active owning PRD states the protected product outcome and carries an explicitly owner-approved hard requirement. Every other performance profile is characterization, an engineering guardrail, an experiment, or deferred work with narrower non-product authority. Measurability alone never justifies a threshold.

## Scope

This capability applies to latency, throughput, resource consumption, capacity, startup or interaction responsiveness, artifact size when it materially affects execution, and regression comparisons across GUI, CLI, API, SDK, service, device, batch, background, and headless product surfaces.

It owns applicability qualification, maturity proportionality, target classes, canonical `PERF-###` profile identity, measurement comparability, finite evidence budgets, stop rules, outcomes, findings, waivers, expiry, requalification, traceability, compatibility, and automation limits.

It does not make performance proof mandatory for every change; define a product target, qualified host, workload, environment matrix, sample approach, statistic, variance limit, evidence budget, or expiry interval for every product; create a benchmark runner; or replace the separate correctness, durability, safety, security, privacy, accessibility, portability, cost, maintainability, conformance, naive-UAT, release, or support-claim authorities.

## Component and Capability Map

| Component | Capability | Canonical authority |
| --- | --- | --- |
| Qualification | Decide whether evidence can change a current product, architecture, risk, or delivery decision | Qualification record governed by this PRD |
| Target authority | Distinguish blocking product outcomes from bounded engineering, characterization, experiment, deferred, and unsupported candidates | Active owning PRD for hard product requirements; approved plan or work authority for non-product executable profiles; [PRD 45](45-deferred-obligation-governance.md) for deferred outcomes |
| Performance Evidence Profile | Preserve one stable, versioned scenario and measurement contract for each executable candidate | One canonical `PERF-###` record at the location determined by target class |
| Execution packet | Bind a profile to an exact build, environment, workload, instrument, finite budget, stops, and evidence destinations | Approved plan or work phase; never a second target authority |
| Results and findings | Record comparable observations, uncertainty, normalized outcomes, defects, and escalation choices | Repository records linked to the canonical profile and owning requirement |
| Operational projection | Support resumability, raw-observation references, fingerprints, and budget ledgers without relocating product meaning | Optional rebuildable projection under [PRD 38](38-global-store-and-project-state.md) |
| Lifecycle consumption | Route candidates, evidence, findings, waivers, and obligations through coverage and phase gates | [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) |
| Deterministic validation | Report structural and traceability facts without making product judgments | Documentation-first contract now; any validator operation requires a separate future owner gate |

## Requirements

### R-PERF-APPLY Applicability Qualification

- R-PERF-APPLY-1 (MUST): every performance candidate receives exactly one applicability disposition before a target, benchmark, or blocking acceptance criterion is adopted: `required-now`, `characterize-now`, `defer-required`, `not-needed`, or `reject-unsupported`.
- R-PERF-APPLY-2 (MUST): `required-now` means current evidence is necessary for an accepted user or business outcome, feasibility cliff, safety or resource boundary, external mandate, dependency budget, or material regression decision. `characterize-now` means current behavior and uncertainty must be measured before a pass/fail target can be justified. `defer-required` means an accepted later outcome is routed through a stable `O-###` record. `not-needed` means evidence would not change a current decision and records why. `reject-unsupported` removes or revises a candidate based only on intuition, copied benchmarks, arbitrary round numbers, absolute language, or an unowned implementation preference.
- R-PERF-APPLY-3 (MUST): qualification records the protected outcome, failure cost, affected support scope, product maturity, risk and reversibility, source authority or evidence, baseline availability, decision the evidence will inform, durable owner, and intended lifecycle coordinate. Words such as fast, instant, real-time, zero regression, at scale, or production-grade do not qualify themselves.
- R-PERF-APPLY-4 (MUST): `not-needed` is a valid evidence-governance conclusion, not missing rigor. Once required evidence has activated, a `blocked` run cannot be relabeled `not-needed` merely because execution was difficult.

### R-PERF-MATURITY Maturity and Proportionality

- R-PERF-MATURITY-1 (MUST): proof burden is proportional to maturity, blast radius, reversibility, user harm, data or financial exposure, claimed support scope, novelty, cross-platform variance, false-pass cost, false-fail cost, and evidence cost.
- R-PERF-MATURITY-2 (MUST): proof-of-concept work defaults to the smallest feasibility characterization; MVP work uses bounded baselines and engineering guardrails for critical paths; beta or prerelease work uses representative workloads and explicit uncertainty for claimed scopes; production work uses maintained profiles, risk-based coverage, expiry, and reevaluation. These are default postures, not exemptions or automatic thresholds.
- R-PERF-MATURITY-3 (MUST): an early product may require a hard boundary for a genuine feasibility, safety, external-contract, or central product outcome, while a mature product may require only characterization for an experimental path. Maturity alone never creates or removes a target.

### R-PERF-AUTH Target Classes and Canonical Ownership

- R-PERF-AUTH-1 (MUST): every applicable candidate has exactly one target class: `hard-product-requirement`, `engineering-guardrail`, `characterization-baseline`, `experiment-or-stretch`, `deferred-required-outcome`, or `unsupported-assumption`.
- R-PERF-AUTH-2 (MUST): a hard product target exists only as an explicitly owner-approved current requirement in the active PRD that owns the protected product outcome. Its canonical profile is PRD-owned, may block only its exact accepted scope, and is the only target class that constitutes product authority.
- R-PERF-AUTH-3 (MUST): engineering-guardrail profiles live only in the approved plan or work phase that owns their finite budget. Characterization and experiment profiles live only in the approved plan, work, engineering, characterization, or experiment record that owns the bounded inquiry. All such plan/work engineering, characterization, and experiment profiles are explicitly non-product authority, cannot establish or change a support claim, and cannot silently redefine an owning PRD.
- R-PERF-AUTH-4 (MUST): a characterization baseline is an observed distribution with stated uncertainty, never a pass/fail gate. Characterization precedes threshold promotion: observed behavior does not become a hard target or engineering guardrail until its source, comparability, ordinary variance, measurement resolution, protected-outcome rationale, trade-offs, and owner approval are established in the canonical target authority.
- R-PERF-AUTH-5 (MUST): `deferred-required-outcome` remains a linked `O-###` record until activation and receives no executable profile merely because it is deferred. An `unsupported-assumption` receives no executable profile.
- R-PERF-AUTH-6 (MUST): each target has one canonical authority determined by class. PRDs, plans, work, results, obligations, and history link to that authority and never copy it into a competing live target. An execution packet may bind operational details but cannot copy or redefine the product target.
- R-PERF-AUTH-7 (MUST): promotion of an engineering guardrail, characterization baseline, or experiment to product authority requires explicit owner approval and authoritative PRD maintenance. One new or meaningfully revised PRD-owned profile records the promoted source and supersedes the non-product profile; both records preserve explicit promotion and superseding lineage without retaining duplicate current authority.

### R-PERF-PROFILE Identity, Versioning, and Lineage

- R-PERF-PROFILE-1 (MUST): every `required-now` or `characterize-now` candidate that proceeds to execution uses exactly one repository-canonical `PERF-###` profile. IDs are project-wide, append-only, never reused, and never renumbered when ownership, status, or target class changes.
- R-PERF-PROFILE-2 (MUST): the same protected outcome and workload retain their profile ID and increment `profile_version` for a meaningful target, authority, supported-scope, environment, workload, measurement, statistical, or outcome-rule change. A materially different protected outcome or workload receives a new ID.
- R-PERF-PROFILE-3 (MUST): results bind to the exact profile ID, version, and source digest. Retirement, promotion, replacement, or material reclassification records explicit predecessor, successor, promotion source, and superseding rationale so later evidence cannot be mistaken for current authority.

### R-PERF-MEASURE Measurement and Comparability

- R-PERF-MEASURE-1 (MUST): the measurement protocol is predeclared before a blocking execution. It identifies the build and relevant dependency/configuration state, instrument version and boundary, qualified environment or environment class, workload and scale, fixture or dataset, concurrency and operation mix, cold or warm state, warmup rule, repetitions or observation window, statistic, variance and uncertainty reporting, outlier treatment, comparison method, raw-evidence retention, and material observer effects.
- R-PERF-MEASURE-2 (MUST): results are comparable only when their evidence fingerprints match or the profile defines and justifies an explicit equivalence rule. Material differences in host, operating system, architecture, virtualization, dependency state, power or thermal posture, dataset, scale, configuration, or instrument cannot be silently compared.
- R-PERF-MEASURE-3 (MUST): sample approach, warmup, statistic, interval, variance tolerance, outlier policy, workload, and environment are chosen for the protected decision and instrument. No shared Make Docs default supplies those product decisions.
- R-PERF-MEASURE-4 (MUST): uncertainty, environmental variance, instrument limits, exclusions, and every observation excluded under the predeclared outlier rule remain visible. Outliers are never removed after observing results merely to change a verdict. When variance or measurement resolution cannot support the decision margin, the outcome is `revise` or `blocked`, not a favorable inference.
- R-PERF-MEASURE-5 (MUST): correctness, durability, safety, security, privacy, accessibility, portability, cost, and maintainability are non-sacrificable preconditions. A result that is faster only by violating one of them cannot pass. Measurement fixtures and the measurement seam are validated before product optimization begins.

### R-PERF-BUDGET Finite Work, Reuse, and Stop Rules

- R-PERF-BUDGET-1 (MUST): every execution phase declares in advance finite limits for characterization passes, materially distinct correction attempts, review cycles, elapsed investigation time, compute, and external-resource spend. An unspecified, automatically replenishing, or unbounded budget is invalid.
- R-PERF-BUDGET-2 (MUST): materially unchanged profile, build, dependencies, configuration, environment, workload, fixture, instrument, and analysis produce the same fingerprint for rerun governance. Outside the single requalification exception in R-PERF-EXPIRY, an unchanged fingerprint reuses the prior applicable result or escalates the unresolved decision; desire for a different outcome is not a material change.
- R-PERF-BUDGET-3 (MUST): after a material change, rerun only affected checks and spend only the remaining authorized budget. Unaffected valid results are reused rather than repeated.
- R-PERF-BUDGET-4 (MUST): evidence work stops at budget exhaustion or diminishing return. Diminishing return includes materially distinct attempts that do not change the verdict, improvement below declared measurement resolution or tolerance, or a next attempt whose authorized cost exceeds the remaining budget. The disposition becomes `blocked`, `revise`, a scoped `fail`, or an owner decision; the budget never grows silently.
- R-PERF-BUDGET-5 (MUST NOT): no phase requires theoretical completeness, an exhaustive matrix, or proof outside claimed configurations. Evidence covers the smallest representative scope that can support the stated decision.

### R-PERF-OUTCOME Outcomes, Findings, Waivers, and Escalation

- R-PERF-OUTCOME-1 (MUST): each executed profile version records exactly one normalized performance outcome: `pass`, `fail`, `revise`, `blocked`, or `waived`.
- R-PERF-OUTCOME-2 (MUST): `pass` applies only to the exact profile version and supported scope with required evidence and all non-sacrificable preconditions satisfied. `fail` requires comparable, reproducible evidence of a valid target miss or constraint violation. `revise` returns an unfit target, profile, protocol, comparability rule, uncertainty treatment, or protected outcome to its owner. `blocked` records a missing environment, dependency, instrument, access, budget, or other precondition and proves neither pass nor fail. `waived` records bounded owner acceptance of a stated risk and is never a pass.
- R-PERF-OUTCOME-3 (MUST): results and findings record severity as `critical`, `major`, `moderate`, or `minor` from the protected outcome and failure cost, plus reproducibility as `reproduced`, `not-reproduced`, `intermittent`, or `not-attempted` with attempt and environment references. Severity orders response but never changes target authority.
- R-PERF-OUTCOME-4 (MUST): findings preserve the observed behavior, expected protected outcome, target class, severity, reproducibility, exact affected support scope, evidence, source requirement, owner, disposition, expiry, remediation work, and later result. Task completion alone does not close a finding.
- R-PERF-OUTCOME-5 (MUST): a waiver names the exact requirement/profile, miss, affected scope, rationale, risk acceptance, non-sacrificable constraints, owner and approver, expiry or release boundary, reevaluation or remediation trigger, and linked `O-###` when future work remains owed. It cannot be indefinite, self-approved by an implementation agent, renewed without material review, or used to promote a support claim.
- R-PERF-OUTCOME-6 (MUST): an escalation package states the profile and evidence, current outcome, severity and reproducibility, budget consumed, unchanged-check status, any real decision deadline, and owner choices. Changes to the target, protocol, supported scope, architecture, resources, target class, waiver, deferral, or removal of an unsupported assumption require the owning authority; an implementation agent may report options but cannot select an authority-changing disposition.

### R-PERF-EXPIRY Expiry and Requalification

- R-PERF-EXPIRY-1 (MUST): evidence expires when the profile, build, environment, workload, support scope, dependency, instrument, analysis method, profile-specific time boundary, or release trigger says it is no longer current. Expired evidence remains history but cannot support a current pass.
- R-PERF-EXPIRY-2 (MUST): expiry invalidates current-use status only. It does not authorize execution, replenish a previous budget, imply failure or success, or permit repeated attempts.
- R-PERF-EXPIRY-3 (MUST): each requalification is separately authorized by the owner or phase authority and carries a new finite budget. A newly budgeted requalification event permits exactly one bounded qualification execution when the evidence fingerprint is unchanged; after that execution, materially unchanged repeats are prohibited and the current result is reused until another valid trigger and another explicit authorization.
- R-PERF-EXPIRY-4 (MUST): material changes during an authorized requalification rerun only affected checks within that event's remaining budget and preserve unchanged valid evidence.

### R-PERF-STATE Repository Authority and Operational Projection

- R-PERF-STATE-1 (MUST): repository knowledge is canonical for qualification dispositions, target class, `PERF-###` identity and schema, source requirements, protected outcome, supported scope, target and waiver meaning, owner and approver, expiry rules, findings and dispositions that change product meaning, obligations, and history.
- R-PERF-STATE-2 (MAY): Project State or the Global Store may project operational progress, run identities, fingerprints, raw-observation references, timestamps, attempt and budget ledgers, review state, and large-evidence references. The projection is non-authoritative, privacy-bounded, and rebuildable from repository authority plus preserved evidence.
- R-PERF-STATE-3 (MUST): the documentation-first capability requires no new table, evidence kind, daemon, background retry, or hidden mutation. When no projection is available, execution uses an explicit machine-local or deliberately exported evidence location and records a sanitized stable reference.
- R-PERF-STATE-4 (MUST): a Store row or receipt proves only operational recording. Missing operational evidence makes a required result unverified but does not erase or reinterpret the repository profile.

### R-PERF-MODES Proof-Mode and Claim Separation

- R-PERF-MODES-1 (MUST): performance, functional correctness, owner or architecture review, naive end-user UAT, knowledgeable visual/manual interaction, accessibility testing, visual-regression automation, conformance, release validation, and support-claim promotion retain independent applicability, evidence, outcomes, and gates.
- R-PERF-MODES-2 (MUST): naive UAT may report perceived slowness, and conformance or package validation may reuse an instrumented physical execution, but no adjacent mode certifies a performance profile unless the performance authority, fields, comparability contract, and outcome remain explicit. A performance result never silently satisfies another mode.
- R-PERF-MODES-3 (MUST): performance `pass`, characterization, `blocked`, or `waived` outcomes do not establish conformance, release readiness, or public support. Public support remains limited to the exact evidence-backed tuple governed by [PRD 20](20-agent-harness-conformance-and-support-claims.md).

### R-PERF-COMPAT Conservative Adoption

- R-PERF-COMPAT-1 (MUST): existing projects and completed phases are not retroactively failed. At the first qualifying design, plan, PRD maintenance, work generation, or phase close after adoption, inventory active numeric thresholds, relative regression claims, resource budgets, absolute performance language, benchmark assets, and current evidence, then classify what each item actually proves.
- R-PERF-COMPAT-2 (MUST): retain an existing hard target only when its source, owner, protected outcome, profile, and comparability can be calibrated. Otherwise the owner explicitly reclassifies, defers, narrows, or removes it through current authority while preserving material former product contracts in non-normative Requirement History.
- R-PERF-COMPAT-3 (MUST): existing scripts and results remain assets according to their proven ownership. Adoption does not delete, move, rename, rerun, certify, tighten, promote, or broaden them; infer a pass from old green output; fabricate missing evidence; or rewrite archives.
- R-PERF-COMPAT-4 (MUST): modified managed resources and ambiguous project content follow [PRD 18](18-compatibility-classification-and-migration-safety.md) conflict-stop and explicit-disposition rules.

### R-PERF-AUTOMATION Documentation First and Deterministic Limits

- R-PERF-AUTOMATION-1 (MUST): first delivery is documentation-first: one governing contract, progressive profile template, performance coverage starter, lifecycle and phase-gate references, plan/work linkage, and concise routers delivered through the current resource model. It does not require or imply a benchmark platform.
- R-PERF-AUTOMATION-2 (MAY): only after a separate explicit owner gate may a deterministic TypeScript validator inventory candidate language and verify structural facts such as profile identity, fields, links, owner/location by class, approval, expiry, budget, stop rules, traceability, evidence references, stricter work criteria, and declared fingerprint equality.
- R-PERF-AUTOMATION-3 (MUST NOT): automation decides applicability, maturity, target value, statistical treatment, representative environment, comparability, user impact, severity, acceptable trade-offs, waiver approval, obligation fulfillment, supported scope, requirement changes, or support-claim promotion. It reports missing, contradictory, or unsupported declarations and never authorizes execution or retries.
- R-PERF-AUTOMATION-4 (MUST): [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md) and [PRD 39](39-cli-command-model-and-operation-registry.md) are not current validator-operation authority. They may be maintained only after the separate gate admits an operation, exact modules and fixtures, read-only failure behavior, and CLI/MCP projection from one shared result schema.

## Contracts and Data

### Qualification Record

| Field | Requirement |
| --- | --- |
| `candidate_id` / `title` | Stable local candidate identity and product-language name |
| `protected_outcome` / `decision_informed` | User or business outcome and exact decision the evidence can change |
| `failure_cost` / `risk_and_reversibility` | Consequence, severity basis, blast radius, reversibility, and false-pass/false-fail cost |
| `supported_scope` / `maturity` | Exact claimed surface and current maturity posture |
| `source_authority` / `source_evidence` | Relative links to accepted requirements, external mandates represented in repository authority, and relevant evidence |
| `baseline_availability` | Comparable baseline reference or explicit `none` |
| `applicability` / `target_class` | One accepted disposition and, when applicable, one class from this PRD |
| `owner` / `lifecycle_coordinate` | Durable decision owner and current or intended activation point |
| `reason` | Decision-relevant justification, including why `not-needed` or `reject-unsupported` applies |

### Performance Evidence Profile

| Field | Requirement |
| --- | --- |
| `profile_id` / `profile_version` / `source_digest` | Stable `PERF-###` identity, monotonic meaningful-change version, and exact content binding |
| `title` / `protected_outcome` | Product-language name and outcome protected |
| `source_requirements` / `canonical_owner` | Relative owning-authority links and the one location determined by target class |
| `maturity` / `applicability` / `target_class` | Accepted calibration and authority classification |
| `risk_and_failure_cost` | User impact, severity basis, reversibility, and false-pass/false-fail consequence |
| `supported_scope` | Surface, platform/runtime, deployment/device class, scale, account/network state, and resource envelope claimed |
| `baseline` / `target` | Comparable evidence reference and evidence-backed target or explicit `none`; when present, unit, direction, tolerance, source, and approval are required |
| `environment` / `workload` | Qualified environment, software/build identity, configuration, dataset/setup, concurrency, operation mix, scale, and exclusions |
| `measurement_protocol` | Boundary, instrument, state, warmup, observation approach, statistic, uncertainty, variance, outlier, comparison, and raw-evidence rules |
| `non_sacrificable_constraints` | Correctness, durability, safety, security, privacy, accessibility, portability, cost, and maintainability conditions |
| `evidence_budget` / `stop_rules` | Finite run, correction, review, time, compute, and external-resource limits plus unchanged-check and diminishing-return rules |
| `outcome_rules` | Exact `pass`, `fail`, `revise`, `blocked`, and `waived` conditions with severity and reproducibility treatment |
| `owner` / `approver` | Durable authority roles for acceptance, change, waiver, retirement, or supersession |
| `expiry_and_reevaluation` | Material-change, time/release, invalidation, requalification, and next-review conditions |
| `lineage` / `traceability` | Predecessor, successor, promotion/supersession rationale, and plan/work/result/finding/obligation/history/support links or explicit `none` |

### Results, Findings, and Waivers

| Record | Required fields |
| --- | --- |
| Performance result | Unique result identity; exact profile ID/version/digest; build; evidence fingerprint; environment and workload; raw and analyzed evidence references; observed distribution; uncertainty and exclusions; budget ledger; normalized outcome; findings; owner/reviewer disposition; supported-scope limit; expiry; later-result link |
| Finding | Stable finding identity; observed behavior; expected protected outcome; target class; severity; reproducibility and attempts; affected support scope; source requirement; evidence; owner; disposition; expiry; remediation work; rerun/result links |
| Waiver | Owning requirement and profile; exact miss; affected scope; rationale and accepted risk; non-sacrificable constraint status; owner and approver; expiry/release boundary; remediation or reevaluation trigger; linked `O-###` when owed; renewal or terminal disposition |

### Evidence Fingerprint and Budget Ledger

The evidence fingerprint binds the exact profile version and digest, product build, relevant code/dependency state, configuration, qualified environment, workload, fixture/dataset, instrument version, and analysis method. It records component digests or stable identifiers plus a comparability result and reasons; it is evidence for reuse decisions, never execution authorization.

The budget ledger records the authorizing plan/work scope, budget-event identity, requalification authorization when applicable, declared maxima, each materially distinct attempt, affected checks, time/compute/external spend, review cycles, remaining budget, unchanged reuse, stop reason, and escalation. The ledger cannot authorize its own replenishment.

### Expiry and Traceability

Expiry records current-use status, material-change triggers, time or release boundary when declared, invalidation reason, last valid result, owner, review decision, and any separately authorized requalification event. Traceability remains bidirectional while authority is active:

`qualification -> PERF-### profile -> plan budget -> work execution packet -> performance result -> finding -> PRD or O-### disposition -> phase gate -> history`

## Integrations

- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md) owns upstream-first authoring and delivery of the governing contract, prompt, reference, progressive profile template, and thin routers.
- [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md) owns package projection, selected dogfood parity, and installed-resource proof; package success and performance evidence do not substitute for one another.
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md) owns candidate enumeration, the base `create`/`update-existing`/`link-only`/`none` axis, performance coverage routing, phase gates, and closeout consumption.
- [18 Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md) owns conservative source classification, modified-content conflict stops, explicit dispositions, rollback, and non-retroactive adoption safety.
- [20 Agent Harness Conformance and Support Claims](20-agent-harness-conformance-and-support-claims.md) owns exact support tuples and public-claim promotion; performance evidence cannot broaden them.
- [21 Project Tool Directory and Resource Tiers](21-project-tool-directory-and-resource-tiers.md) owns peer contract/prompt/reference/template identity, optional local projection, installed-provider resolution, and current resource paths.
- [38 Global Store and Project State](38-global-store-and-project-state.md) owns optional operational run/evidence capture, typed receipts, privacy, and the repository-versus-machine-state boundary.
- [43 Conformance Scenario Model and Execution Kits](43-conformance-scenario-model-and-execution-kits.md) and [44 Conformance Lab Sessions and Evidence](44-conformance-lab-sessions-and-evidence.md) retain their independent conformance scenarios, deterministic evidence bar, lab sessions, and evidence homes; they do not become a benchmark lab.
- [45 Deferred Obligation Governance](45-deferred-obligation-governance.md) owns `O-###` identity and routing for `defer-required` outcomes and future remediation accepted through a waiver.
- [46 Naive End-User Acceptance Testing](46-naive-end-user-acceptance-testing.md) owns perceived-slowness findings, user-goal evidence, and naive-UAT gates without certifying a quantitative performance profile.
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md) and [39 CLI Command Model and Operation Registry](39-cli-command-model-and-operation-registry.md) are future integration candidates only after the separate validator admission gate; they are not current operation authority for this capability.

## Rebuild Notes

A clean-room rebuild must preserve applicability as a first-class decision, maturity proportionality, one canonical authority per target class, characterization before promotion, append-only `PERF-###` identity, meaningful version and superseding lineage, predeclared comparable measurement, visible uncertainty and outliers, non-sacrificable constraints, finite budgets, affected-only reruns, unchanged-result reuse, diminishing-return stops, normalized outcomes, bounded waivers, singular requalification, conservative adoption, proof-mode separation, and repository authority over optional operational projections.

Rebuilders must not infer product targets from observed baselines, copy plan/work guardrails into PRDs, let execution packets redefine targets, treat expired or missing evidence as success, allow a waiver to count as pass, broaden a result beyond its supported scope, equate performance with conformance/UAT/release/support proof, or add a validator that makes product judgments or runs benchmarks. Documentation resources remain upstream-authored through [PRD 06](06-template-contracts-and-generated-assets.md) and resolved through [PRD 21](21-project-tool-directory-and-resource-tiers.md).

## Source Anchors

- [Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 Performance Evidence Governance plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
