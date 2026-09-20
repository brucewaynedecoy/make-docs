---
title: "Performance Testing Guardrails"
kind: "design"
status: "draft"
follow_on:
  route: "change-plan"
  next_prompt: ".make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "The design establishes a new product capability while requiring coordinated maintenance of existing lifecycle, template, state, compatibility, CLI, conformance, UAT, and support-claim authorities."
  coordinate_handoff: "unresolved; planner must resolve before writing."
source:
  type: "manual-request"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "source-to-design-straddle"
  reason: "The owner supplied a bounded proposal and required a design-stage sibling to the current v2 recovery design, so no separate repository source artifact was needed before design."
---

# Performance Testing Guardrails

## Purpose

This design defines a general Make Docs capability for qualifying, calibrating, executing, and closing performance evidence without allowing invented, disproportionate, exotic, fragile, or maturity-inappropriate proof targets to become product authority. It protects implementers from endless optimization and rerun loops while preserving the ability to enforce a genuinely necessary performance requirement.

The governing invariant is: a performance target becomes blocking product authority only when its user or business need, product maturity, source evidence, representative measurement protocol, accepted trade-offs, finite proof budget, stop conditions, and owner approval are explicit. Otherwise the target remains characterization, an engineering guardrail, an experiment, a deferred obligation, or an unsupported assumption that must be revised or removed. Measurable does not mean justified.

This is a design-only authority candidate. It does not create or edit a PRD, plan, work backlog, contract, template, prompt, router, history record, package asset, dogfood projection, manifest, Global Store schema, validator, code path, test, support claim, or release artifact, and it authorizes no implementation or operational action.

## Context

### Authority and lifecycle position

Repository documents remain canonical. The read-only Bear note `Performance Testing Guardrails` (`199A6BEF-E91B-4930-9C89-9AE4E69854F4`) is proposal input only. The sibling [Make Docs v2 Product Boundary and Missing Migration Recovery](2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) design supplies Stage 1 context for proportional proof, finite stop conditions, TypeScript operation ownership, progressive disclosure, migration safety, and repository-versus-machine-state boundaries; it is not PRD authority for this capability and acceptance of either design does not accept the other.

The normal lifecycle is design -> plan -> PRD -> work -> implementation. This request straddles proposal input directly into design because the owner supplied the problem and required scope. The design stops here. A change plan, PRD maintenance, backlog, shipped resources, and implementation remain later and separately authorized stages.

### Current gap

Current lifecycle and testing authorities correctly separate automated validation, owner or architecture review, naive end-user UAT, knowledgeable visual or manual interaction, accessibility testing, visual-regression automation, conformance evidence, and support claims. They do not yet own one coherent contract for deciding whether performance evidence is needed, whether a numeric target is justified, how a representative performance profile is bounded, or when an implementation agent must stop trying.

This gap creates two opposite risks. An agent can invent a precise-looking threshold because a requirement is expected to be testable, or a real user-critical performance need can remain vague and unenforceable. Once an unsupported threshold enters a PRD or work acceptance bullet, repeated measurements and optimizations can become an unbounded loop even when the environment is noisy, the target lacks a baseline, the product is still a proof of concept, or the requested result conflicts with correctness, portability, cost, accessibility, or maintainability.

### Capability boundary

Performance evidence includes latency, throughput, resource consumption, capacity, startup or interaction responsiveness, bundle or artifact size when it materially affects execution, and regression comparisons. The capability applies to GUI, CLI, API, SDK, service, device, batch, background, and headless product surfaces.

The capability does not make performance proof universally required. It does not define one benchmark suite, one statistical recipe, one host, one platform matrix, or universal latency, throughput, variance, sample-count, regression, duration, or resource thresholds. It does not replace functional correctness, safety, security, durability, accessibility, usability, conformance, or support-claim authority.

## Decision

### 1. Establish a coherent Performance Evidence Governance capability

This is a genuinely new coherent product capability and should receive one new active product PRD, provisionally titled `Performance Evidence Governance`, after an authorized change plan confirms that no current owner already supplies the complete subject. The PRD number and work coordinate must be resolved from current repository authority during planning; this design does not reserve either.

[PRD 14](../prd/14-lifecycle-workflow-and-coverage-passes.md) owns lifecycle and coverage-pass mechanics, not the substantive performance qualification and evidence contract. Updating PRD 14 alone would mix a reusable coverage spine with a specialist proof domain. The new PRD should own applicability qualification, maturity and proportionality rules, target classes, profile and result contracts, finite budgets and stop rules, performance outcomes, rejection and escalation, compatibility, and automation limits.

Existing PRDs remain consumers and owners of their boundaries rather than being absorbed into the new capability:

| Existing authority | Consumer responsibility after authorized maintenance |
| --- | --- |
| [06 Template Contracts and Generated Assets](../prd/06-template-contracts-and-generated-assets.md) | Upstream-first delivery of the contract, profile template, prompt or reference, and small routers. |
| [10 Packaging, Validation, and Release Reference](../prd/10-packaging-validation-and-release-reference.md) | Package and dogfood proof for shipped governance resources without treating performance results as publication authority. |
| [14 Lifecycle Workflow and Coverage Passes](../prd/14-lifecycle-workflow-and-coverage-passes.md) | Add the non-persona performance-evidence surface to lifecycle, coverage, closeout, and phase-gate routing. |
| [18 Compatibility Classification and Migration Safety](../prd/18-compatibility-classification-and-migration-safety.md) | Conservative adoption and protection of modified or ambiguous project content. |
| [20 Agent Harness Conformance and Support Claims](../prd/20-agent-harness-conformance-and-support-claims.md) | Prevent performance evidence from promoting or broadening a public support claim without its own exact conformance authority. |
| [38 Global Store and Project State](../prd/38-global-store-and-project-state.md) | Optional operational capture of performance runs and evidence references while repository knowledge remains canonical. |
| [39 CLI Command Model and Operation Registry](../prd/39-cli-command-model-and-operation-registry.md) | Future deterministic validator admission and CLI/MCP parity if that later implementation is accepted. |
| [43 Conformance Scenario Model and Execution Kits](../prd/43-conformance-scenario-model-and-execution-kits.md) and [44 Conformance Lab Sessions and Evidence](../prd/44-conformance-lab-sessions-and-evidence.md) | Preserve the independent conformance scenario, instrument, result, and lab evidence bar. |
| [45 Deferred Obligation Governance](../prd/45-deferred-obligation-governance.md) | Route accepted future performance outcomes that are valid but not appropriate for the current scope or maturity. |
| [46 Naive End-User Acceptance Testing](../prd/46-naive-end-user-acceptance-testing.md) | Preserve testing-mode separation and route user-observed slowness without claiming benchmark certification. |

### 2. Qualify whether performance evidence is needed

Every proposed performance candidate receives one applicability disposition before any target or benchmark becomes authoritative:

| Applicability disposition | Meaning |
| --- | --- |
| `required-now` | A supported user or business outcome, feasibility cliff, safety or resource boundary, external mandate, dependency budget, or material regression risk requires evidence in the current scope. |
| `characterize-now` | Current behavior must be measured to establish feasibility, variance, or a baseline, but no pass/fail target is yet justified. |
| `defer-required` | The outcome is accepted as required but a later maturity, scale, environment, or coordinate is the correct activation point; route it through `O-###` authority. |
| `not-needed` | Performance evidence would not change a current product, architecture, risk, or delivery decision; record the reason and do not create a benchmark. |
| `reject-unsupported` | The candidate comes from intuition, copied benchmarks, arbitrary round numbers, absolute language, or an unowned implementation preference and lacks a defensible source. |

Qualification records the protected user or business outcome, cost of failure, affected support scope, maturity, risk and reversibility, source authority or evidence, existing baseline availability, decision the evidence will inform, durable owner, and intended lifecycle coordinate. A `not-needed` decision is first-class and must not be treated as missing rigor.

Performance evidence is normally needed only when it can change an explicit decision. “Fast,” “instant,” “real-time,” “zero regression,” “at scale,” “production-grade,” or a naked number does not qualify itself.

### 3. Calibrate by product maturity and proportionality

Maturity changes the default burden of proof without creating a universal exemption:

| Maturity | Default posture | Hard-target exception |
| --- | --- | --- |
| Proof of concept | Characterize only the smallest feasibility path; prefer descriptive evidence. | A genuine feasibility cliff, safety limit, external contract, or outcome central to the proof. |
| MVP | Use bounded baselines and engineering guardrails for critical paths; avoid broad optimization. | A target tied to a core supported user outcome or a fixed platform, cost, or dependency budget. |
| Beta or prerelease | Use representative workloads for claimed scopes and validate material regressions with stated uncertainty. | Owner-approved product outcomes whose environment and workload are sufficiently stable. |
| Production | Use maintained profiles, expiry and reevaluation, risk-based coverage, and explicit escalation. | Evidence-backed product requirements or external obligations with named owners and accepted trade-offs. |

The profile author must explain why the requested proof is proportional to blast radius, reversibility, user harm, data or financial exposure, support scope, novelty, cross-platform variance, and the cost of a false pass or false fail. A later maturity may justify stronger evidence, but maturity alone never creates a threshold. An early product may still need a hard safety boundary, and a mature product may still need only characterization for a new experimental path.

### 4. Classify targets and prefer baselines over arbitrary thresholds

Every applicable candidate receives one target class:

| Target class | Authority and gate meaning |
| --- | --- |
| `hard-product-requirement` | Failure makes the claimed product outcome unacceptable. It lives in an owning PRD, requires explicit owner approval, and may block acceptance for its exact scope. |
| `engineering-guardrail` | A bounded plan or work budget protects an accepted outcome. It may stop or escalate the approved phase, but it cannot silently become or change product authority. |
| `characterization-baseline` | Describes current behavior and uncertainty. It informs later decisions and is never itself a pass/fail gate. |
| `experiment-or-stretch` | Explores feasibility or improvement within a bounded spike. It is nonblocking and cannot be reported as a supported result. |
| `deferred-required-outcome` | A valid future product outcome routed through an `O-###` record with trigger, owner, coordinate, and exit criteria. |
| `unsupported-assumption` | An invented, copied, fragile, or unjustified expectation that must be removed or revised before execution. |

A baseline is an observed distribution for a declared profile, not a product requirement. Relative regression limits are acceptable only when baseline comparability, ordinary variance, measurement resolution, environmental headroom, and the user-impact rationale are explicit. Absolute thresholds require a product, customer, regulatory, cost, dependency, or owner-approved source. A baseline must never be converted automatically into a threshold, and a faster observed result must never replace the accepted baseline automatically.

### 5. Use versioned, bounded Performance Evidence Profiles

Every `required-now` or `characterize-now` candidate that proceeds to execution uses exactly one repository-canonical `PERF-###` Performance Evidence Profile. Its canonical location and authority follow its target class:

- A `hard-product-requirement` profile lives in the owning active PRD and may become blocking product authority only with explicit owner approval.
- An `engineering-guardrail` profile lives in the approved plan or work phase that owns its bounded budget, links to the protected PRD outcome, and may stop or escalate only that phase. It is not product authority, support-claim authority, or a second PRD target.
- A `characterization-baseline` or `experiment-or-stretch` profile lives in bounded plan, work, or spike evidence and is nonblocking.
- A `deferred-required-outcome` remains an `O-###` record until its trigger and does not receive an executable profile; an `unsupported-assumption` receives no executable profile.

If an engineering guardrail is promoted to product authority, the owner must explicitly approve the PRD change and one PRD-owned profile must supersede the plan/work profile while recording its lineage; the two locations must not duplicate authority. The new capability PRD owns the shared schema, while each profile's target class determines its canonical owner and location. IDs are append-only and project-wide. The same protected outcome and workload retain the ID and increment `profile_version` for a material target, scope, environment, workload, statistical, authority, or outcome-rule change. PRDs, plans, work, and history link to the canonical profile as applicable and never become a second target authority.

Each profile records:

| Field | Requirement |
| --- | --- |
| `profile_id` / `profile_version` | Stable `PERF-###` identity and monotonic meaningful-change version. |
| `title` / `protected_outcome` | Product-language name and the user or business result being protected. |
| `source_requirements` | Relative links to owning PRD requirements, external mandates represented in repository authority, and relevant decisions. |
| `maturity` / `applicability` / `target_class` | Current maturity and the accepted qualification dispositions above. |
| `risk_and_failure_cost` | User impact, severity basis, reversibility, and consequence of false pass or false fail. |
| `supported_scope` | Product surface, platform or runtime, deployment or device class, scale, account/network state, and resource envelope being claimed. |
| `baseline` / `target` | Evidence-backed baseline reference and target or explicit `none`; target unit, direction, tolerance, and source are mandatory when present. |
| `environment` / `workload` | Qualified host or class, software/build identity, configuration, dataset and setup, concurrency, operation mix, scale, and exclusions. |
| `measurement_protocol` | Boundary, instrument, clock, cold/warm state, warmup, sample and repetition approach, statistic, variance and outlier treatment, comparison method, and raw-evidence requirements. |
| `non_sacrificable_constraints` | Correctness, durability, safety, security, privacy, accessibility, portability, cost, and maintainability conditions that a metric cannot trade away silently. |
| `evidence_budget` / `stop_rules` | Finite phase-specific run, correction, review, time, and compute limits plus unchanged-check and diminishing-return stops. |
| `outcome_rules` | Exact conditions for `pass`, `fail`, `revise`, `blocked`, and `waived`, including severity and reproducibility treatment. |
| `owner` / `approver` | Durable product owner and the role authorized to accept, revise, waive, retire, or supersede the target. |
| `expiry_and_reevaluation` | Evidence expiry, material-change triggers, and next review condition. |
| `traceability` | Plan, work, result, finding, obligation, history, and support-claim links or explicit `none`. |

### 6. Make measurement comparable without pretending statistics remove judgment

The measurement protocol must be declared before a blocking run. At minimum it identifies the exact build or digest, relevant code and dependency state, runtime and compiler configuration, instrumentation version, host or qualified host class, operating system, architecture, power and thermal posture when material, isolation or co-tenancy, dataset or fixture digest, workload and scale, concurrency, setup, cold or warm state, warmup rule, repetitions or observation window, statistic, variance reporting, outlier treatment, and raw evidence references.

Sample size, warmup, percentile, confidence interval, variance tolerance, and outlier policy are chosen for the decision and instrument; none receives a universal Make Docs number. Small or noisy samples may support characterization when uncertainty is stated. They do not support false precision or a hard pass. Outliers are never removed after seeing the result unless the predeclared rule applies and the excluded evidence remains visible.

Comparisons require the same evidence fingerprint or an explicitly qualified equivalence rule. Results from materially different hosts, virtualized environments, dependency versions, power states, datasets, scale, or instrument versions are not silently compared. When environmental variance is larger than the decision margin, the outcome is `revise` or `blocked`; the implementer does not continue optimizing until noise happens to produce a pass.

Functional correctness and non-sacrificable constraints are preconditions. A fast incorrect result is not a performance pass. Measurement code and fixtures are validated before product optimization begins, and benchmark overhead or observer effects are recorded when material.

### 7. Bound evidence work and stop repeated loops

Every plan and work phase that executes a profile declares a finite evidence budget before execution. The budget states the maximum characterization passes, materially distinct correction attempts, review cycles, elapsed investigation window, and compute or external-resource spend that the phase may consume. Counts differ by phase and risk, but unspecified or unbounded budgets are invalid.

The unchanged-check rule is absolute for repeats: do not repeat a performance check when profile version, product build, relevant code and dependencies, configuration, environment, workload, fixture, instrument, and analysis method are materially unchanged. The only unchanged-fingerprint execution allowed is the first bounded qualification execution in an explicitly authorized, newly budgeted expiry- or release-triggered requalification event under Decision 8. Otherwise reuse the prior result or escalate the unresolved decision. A desire for a different outcome is not a material change.

After a material change, rerun only affected checks and only within the remaining budget. The diminishing-return rule stops further optimization when successive materially distinct attempts do not change the profile verdict, when observed improvement is below the profile's measurement resolution or accepted tolerance, or when the next attempt would spend more than the remaining approved budget. Budget exhaustion or diminishing return yields `blocked`, `revise`, a scoped `fail`, or an owner decision; it never silently increases the budget.

No phase may require theoretical completeness, an exhaustive environment matrix, or proof across unclaimed configurations. Proof scope is the smallest set that can support the stated decision and no broader.

### 8. Normalize outcomes, findings, waivers, and expiry

Each executed profile version produces one normalized outcome:

| Outcome | Meaning |
| --- | --- |
| `pass` | The qualified evidence meets the accepted target or characterization completion rule for the exact profile version and support scope, with required correctness and evidence present. |
| `fail` | Comparable, reproducible evidence misses a valid accepted target or violates a non-sacrificable constraint. |
| `revise` | The target, profile, protocol, comparability, variance, or protected outcome is not fit for a valid pass/fail decision and must return to the owning authority. |
| `blocked` | Environment, dependency, instrumentation, budget, access, or other precondition prevented valid evidence. It proves neither pass nor fail and cannot be converted into `not-needed` after activation. |
| `waived` | The authorized owner accepts a stated, bounded risk for an exact scope and expiry. A waiver is not a pass, does not change the target, and cannot promote a support claim. |

Every result records severity (`critical`, `major`, `moderate`, or `minor`) based on the protected outcome and failure cost; reproducibility (`reproduced`, `not-reproduced`, `intermittent`, or `not-attempted`) with attempt and environment references; exact profile and build identity; observed distribution and uncertainty; evidence refs; budget consumed and remaining; findings; owner; reviewer; decision; expiry; and rerun or escalation disposition. Severity orders response but does not override target authority.

Evidence expires on a material profile, build, environment, workload, support-scope, dependency, instrument, or analysis change and on any profile-specific time or release trigger. There is no universal age limit. Expired evidence remains history and cannot support a current pass until requalified.

Expiry or a release trigger invalidates current-use status but does not authorize execution, replenish an earlier budget, or permit unlimited reruns. Requalification requires explicit owner or phase authorization for a separate, newly budgeted qualification event. That event permits one bounded qualification execution to establish current evidence even when the unchanged-check fingerprint is unchanged; after that execution, the unchanged-check prevents materially unchanged repeats and the current result is reused until a later valid trigger and another explicitly authorized, newly budgeted event.

A waiver requires the owning PRD requirement or profile, exact miss and affected scope, reason, risk acceptance, non-sacrificable constraints, owner and approver, expiration or release boundary, remediation or reevaluation trigger, and an `O-###` link when required future work remains owed. Waivers cannot be indefinite, self-approved by the implementation agent, renewed without material review, or counted as successful evidence.

### 9. Reject unsupported targets and escalate authority changes

A hard target or blocking work criterion is rejected before execution when it lacks a protected outcome, source, maturity rationale, representative environment and workload, measurement protocol, uncertainty treatment, accepted trade-offs, finite budget, owner, approval, expiry, or outcome rules. Copied industry benchmarks, agent intuition, round-number “best practices,” competitor observations without applicability evidence, and stricter implementation criteria than the owning PRD are unsupported.

Implementation agents must not invent, strengthen, weaken, average away, or silently retire a target. They must not narrow the tested environment, discard inconvenient samples, trade correctness or another non-sacrificable constraint, or rerun unchanged checks to manufacture a pass.

When a target is unsupported, infeasible within budget, or invalidated by evidence, the escalation package states the profile and evidence, current outcome, severity and reproducibility, budget consumed, unchanged-check status, decision deadline if real, and concrete owner choices: retain the target and fund a new bounded phase; revise the target or protocol; narrow or change the supported scope or environment; change architecture or allowed resources; convert the target to characterization or an engineering guardrail; defer the required outcome through `O-###`; waive the exact risk temporarily; or remove the unsupported assumption. Only the owning product authority may select a choice that changes product requirements.

### 10. Keep performance evidence separate from adjacent proof modes

Performance is one non-persona testing and evidence mode. Its applicability, profile, result, and gate remain separate from:

- functional automation, which proves coded correctness and may be a prerequisite but does not justify a performance target;
- owner or architecture review, which accepts boundaries and trade-offs but does not substitute for an executed measurement;
- naive end-user UAT, which may report perceived slowness or a failed user goal but does not certify a benchmark threshold;
- knowledgeable visual or manual interaction, which may reveal responsiveness problems but does not establish repeatable quantitative evidence;
- accessibility testing, which owns access needs and may establish its own timing-related requirement without being collapsed into general latency proof;
- visual-regression automation, which compares rendering and does not prove interaction or compute performance;
- conformance scenarios and lab evidence, which prove exact harness or packaging tuples and do not become a general benchmark lab;
- load, stress, endurance, soak, scalability, and capacity testing, which are specialized methods selected only when an accepted profile and product risk require their distinct workload and failure model; and
- support-claim promotion, which remains governed by exact conformance and claim authority and cannot be inferred from a performance pass, waiver, or characterization result.

One physical run may contribute evidence to more than one mode only when each mode's authority, required fields, and verdict remain explicit. One mode's success never silently satisfies another.

### 11. Define scenario, execution, evidence, and traceability artifacts

The canonical `PERF-###` profile is the performance scenario authority. A plan may define a bounded execution strategy, and a work phase may render an execution packet containing the profile reference, exact build, environment acquisition, fixture preparation, commands or instruments, evidence budget, safety and cleanup, and stop/escalation instructions. Neither may copy or redefine the product target.

Operational run records use unique run identities and bind to the exact `profile_id`, `profile_version`, source digest, work coordinate, product build, environment fingerprint, workload and fixture digests, instrument version, raw observations, analysis output, budget ledger, outcome, findings, reviewer disposition, and evidence refs. A result is comparable only when the profile's comparison contract says so.

Findings record observed behavior, expected protected outcome, target class, severity, reproducibility, affected scope, evidence, source requirement, owner, disposition, expiry, remediation work, and later rerun. A completed task does not close a finding. A result or finding that changes the accepted product outcome routes through PRD maintenance; a valid later requirement routes through `O-###`; material lifecycle closure receives one idempotent history breadcrumb.

Traceability is bidirectional while authority is active: qualification -> `PERF-###` profile -> plan budget -> work execution packet -> run result -> finding -> PRD or `O-###` disposition -> phase gate -> history. Missing operational evidence makes a required proof unverified, but it does not erase the repository profile or change its meaning.

### 12. Integrate through the lifecycle and progressive disclosure

Design qualifies the protected outcome and major trade-offs without inventing the eventual number. An authorized change plan inventories existing targets, identifies owner PRDs, defines delivery phases, assigns finite evidence budgets, and distinguishes documentation delivery from future automation. PRD maintenance creates the new capability PRD, adds or repairs only the `hard-product-requirement` profiles that belong to subsystem PRDs, preserves material former targets in non-normative Requirement History, and creates a new subsystem PRD only when another genuinely ownerless product subject exists. Approved plan, work, and spike phases own the other executable profile classes under Decision 5.

Work generation links every quantitative performance acceptance criterion to an approved profile and includes the execution packet, budget, unchanged-check fingerprint, stop rules, and escalation owner. Implementation includes applicable functional validation, validates the measurement seam, runs only the bounded packet, and reports the normalized outcome without changing target authority.

The coverage-pass band gains a non-persona performance-evidence surface. It enumerates new or changed quantitative thresholds, absolute performance language, performance-sensitive product claims, implementation criteria stricter than source authority, expired evidence, changed environments or workloads, unresolved findings, waivers, and repeated checks. Every candidate receives both a base coverage action (`create`, `update-existing`, `link-only`, or `none`) and a performance disposition from this design; `none` includes a reason.

The phase gate consumes applicable profile outcomes, evidence validity, remaining critical or major findings, waiver scope and expiry, deferred obligations, budget exhaustion, and unchanged-check compliance. `pass` applies only to the exact profile and scope. `revise`, `blocked`, expired, or unrun required evidence leaves performance acceptance unsatisfied. `waived` permits only the explicitly accepted bounded continuation and remains visible as risk, not success.

Routers remain small. They point to one governing performance-evidence contract and load the coverage prompt or profile template only when a performance candidate is present. The detailed contract is not duplicated into every `AGENTS.md`, `CLAUDE.md`, plan template, PRD template, or work template. Templates ask whether performance evidence is applicable before exposing the detailed profile fields, so progressive disclosure does not pressure authors to fabricate numbers.

Shipped resources are documentation-first and upstream-first in `packages/docs/template/`, then deliberately dogfooded and package-validated under their owning PRDs. The sibling v2 recovery design may change the eventual physical resource paths and prompt classification. An authorized plan must resolve that accepted target and must not create duplicate current-path and target-path authorities. This design owns logical behavior, not a competing migration layout.

### 13. Preserve repository authority and optional execution-state capture

Versioned repository knowledge includes qualification dispositions, target class, `PERF-###` identity and schema content, source requirements, protected outcome, supported scope, owner and approver, target and waiver authority, expiry rules, findings and dispositions that change product meaning, `O-###` routing, and history breadcrumbs.

Operational evidence includes run progress, environment fingerprints, sample observations, raw output, timestamps, attempt and budget ledgers, local review progress, and large evidence references. The machine-level Global Store and unified Project State may capture those records when available, but this capability does not require a new table, schema, evidence kind, daemon, background retry, or hidden automatic mutation in its documentation-first delivery.

Global Store or Project State is optional for execution capture, not authoritative for target meaning. Without it, a run may use another explicit machine-local or deliberately exported evidence location and record a sanitized reference. Required evidence must still be present, reviewable, and bound to the profile before a pass can be claimed. A Store receipt proves only that evidence state was recorded; it does not prove the measured outcome or phase gate.

### 14. Apply proportionally across platforms and headless surfaces

Performance qualification applies to headless cores, CLIs, APIs, background jobs, SDKs, and non-visual workflows as well as interactive products. A headless phase may require characterization when it owns a feasibility, resource, or dependency boundary even when naive UAT is validly `none`. Conversely, headless implementation alone does not create a performance requirement.

Evidence supports only the recorded platform, architecture, runtime, host or host class, deployment topology, dataset, scale, and configuration. Cross-platform coverage uses the smallest representative matrix justified by materially different code paths and claimed support, not every possible environment. A qualified CI, bare-metal, virtualized, containerized, cloud, or local host is acceptable when its relevance and limits are explicit. Host-sensitive results do not become portable product claims.

Non-interactive and automated execution must preserve the same profile, budget, stop, outcome, and evidence contracts. It must fail closed on missing prerequisites and must never loop until a favorable sample appears.

### 15. Adopt conservatively and preserve backward compatibility

Existing projects and completed phases are not retroactively failed. At the first qualifying design, change plan, PRD maintenance, work generation, or phase close after adoption, inventory active PRDs and work for numeric thresholds, relative regression claims, resource budgets, and absolute performance language. Classify what each target actually proves rather than grandfathering its label.

Retain a prior hard target only when its source and profile can be calibrated. Otherwise convert it through owner-approved authority to an engineering guardrail, characterization baseline, experiment, deferred obligation, or removed unsupported assumption. Preserve material prior product contracts in Requirement History and preserve historical plans, work, results, and breadcrumbs without rewriting them as current proof.

Existing benchmark scripts and result files remain evidence or implementation assets according to their actual ownership; the documentation-first capability does not delete, move, rename, rerun, or certify them. Modified managed resources and ambiguous project content follow conflict-stop and explicit-disposition rules. Migration must not automatically tighten a target, promote an observed baseline, fabricate missing runs, infer a pass from old green output, or broaden evidence to new platforms.

### 16. Deliver documentation first and keep future validation deterministic

The first implementation should deliver the governing contract, a progressive profile template, a performance coverage starter, lifecycle and phase-gate references, plan and work linkage rules, and concise routers through the accepted upstream and dogfood flow. It should validate the documentation contract and representative fixtures without building a benchmark platform.

A later, separately authorized deterministic TypeScript validator may scan active PRDs, plans, and work for units, rates, percentiles, percentages, resource quantities, relative comparisons, and absolute performance language; inventory candidate targets; validate `PERF-###` identity, required fields, links, target class, approval, expiry, budget, stop rules, profile-to-work traceability, result references, and unsupported stricter work criteria; and detect an unchanged evidence fingerprint. CLI and MCP surfaces, if admitted, derive from the same operation core and result schema.

Automation must not decide whether evidence is needed, select a reasonable number, infer user impact, choose product maturity, declare two environments comparable, set sample size or statistical treatment, remove outliers, assign severity, accept trade-offs, approve or renew a waiver, narrow supported scope, change a requirement, fulfill an obligation, or promote a support claim. The validator detects missing or contradictory justification; it does not pretend to perform product or architecture judgment.

### 17. Define design acceptance and readiness for planning

This design is ready for owner acceptance when the owner confirms the new-capability PRD recommendation, applicability and target classes, maturity defaults, profile contract, measurement and comparability rules, finite budgets and stop conditions, outcome and waiver semantics, adjacent-mode separation, lifecycle and state boundaries, compatibility posture, and documentation-first automation limit.

Acceptance of this readiness list is design authority only. It does not authorize a change plan, PRD creation or editing, `O-###` creation, backlog generation, shipped resource authoring, dogfood projection, validator implementation, setup, staging, commit, integration, push, publication, release, deployment, benchmark execution, or support-claim promotion.

## Alternatives Considered

### Update PRD 14 without creating a new capability PRD

Rejected. PRD 14 owns the reusable lifecycle and coverage mechanics. Performance applicability, calibration, profiles, measurement, budgets, outcomes, waivers, and rejection rules form a coherent product subject that several existing PRDs consume and that would overload the coverage owner if embedded there.

### Govern all quantitative requirements in one universal contract

Deferred. Availability, durability, reliability, cost, capacity, and other quantitative domains may share principles, but each can have distinct evidence and authority semantics. This design solves performance evidence specifically and avoids claiming theoretical generality. A later design may extract a broader proof-target framework from demonstrated overlap.

### Require performance evidence and numeric targets in every PRD

Rejected. This would reward invented precision and burden PoCs, internal work, and low-risk changes with irrelevant proof. Applicability qualification and a valid `not-needed` outcome are mandatory parts of rigor.

### Use one universal benchmark host, sample count, variance limit, or regression percentage

Rejected. Such defaults are fragile across products, workloads, platforms, and maturities. Profiles must justify their own finite, decision-relevant protocol.

### Let implementation agents tune or revise targets autonomously

Rejected. Implementers can report evidence and alternatives, but only the owning product authority may change the protected outcome, support scope, target, waiver, or accepted trade-offs.

### Reuse conformance or naive-UAT evidence as performance certification

Rejected. Those modes answer different questions and have independent evidence bars. They may surface performance candidates, but they cannot certify a `PERF-###` target without the performance profile and measurement contract.

### Build the TypeScript validator and benchmark runner first

Rejected. Tooling before the governance contract would automate detection without establishing applicability or authority and could hard-code the same arbitrary assumptions this capability prevents. Documentation and representative fixtures come first; deterministic validation is a later, separate decision.

## Consequences

PRDs and work become less likely to contain naked performance thresholds. When a blocking target is justified, it becomes more reviewable because the protected outcome, profile, protocol, evidence, trade-offs, owner, expiry, and stop conditions are explicit.

Implementation agents gain a defined right and obligation to stop unchanged reruns, stop at diminishing returns or budget exhaustion, and escalate authority decisions instead of optimizing indefinitely. Owners receive concrete choices rather than a binary request to accept failure or demand more attempts.

Documentation grows by one coherent capability PRD and one progressively disclosed contract family, while several existing PRDs need surgical consumer updates. This is more initial coordination than adding a paragraph to the testing prompt, but it prevents duplicated and conflicting rules across lifecycle surfaces.

Performance results become intentionally narrower. A pass proves only an exact profile version and support scope; a waiver is visibly not a pass; expired, blocked, noisy, or noncomparable evidence cannot support current claims. Broader public claims may therefore take longer, but they become harder to overstate.

The documentation-first release can work without a new runtime schema or validator. Future tooling can validate structure and traceability while remaining unable to manufacture product judgment.

## Risks

- Authors may overuse `not-needed` to avoid legitimate work. Mitigation: require the protected-decision rationale, risk evidence, owner, and lifecycle review, and allow later user findings or scope changes to reactivate qualification.
- Profiles may become bureaucratic or duplicate subsystem requirements. Mitigation: progressive disclosure, one shared schema, one canonical target-class location linked to the protected product outcome, and detail proportional to risk and target class.
- Statistical language may create false confidence. Mitigation: require instrument limits, variance and uncertainty reporting, predeclared analysis, comparability, and `revise` or `blocked` when the evidence cannot decide.
- Engineering guardrails may drift into de facto product requirements. Mitigation: label authority class, keep guardrails in plan/work, prohibit silent PRD promotion, and require owner review when a miss changes supported behavior.
- Waivers may become a permanent escape hatch. Mitigation: exact scope, owner approval, expiry, visible risk, reevaluation, and `O-###` routing when work remains owed; a waiver never counts as pass.
- Store loss or inaccessible raw evidence may leave repository claims unverifiable. Mitigation: repository authority preserves meaning, evidence references state retention and portability, and missing evidence returns the result to unverified rather than fabricating continuity.
- Cross-platform expectations may expand into an exhaustive matrix. Mitigation: bind evidence to claimed scopes and use only materially distinct representative paths justified by risk.
- The sibling v2 recovery design may change resource locations while this capability is being planned. Mitigation: treat logical resources as stable, resolve physical paths in the authorized plan, and never create competing current and target authorities.
- Existing naked thresholds may be numerous. Mitigation: reconcile prospectively at qualifying lifecycle events, prioritize blocking and user-visible targets, preserve history, and do not retroactively fail completed phases.

## Open Questions

No product-behavior question in this design needs to remain unresolved before owner acceptance. Two administrative resolutions belong to an authorized change-plan preflight:

1. What next available PRD number and W/R coordinate own the new `Performance Evidence Governance` capability? The planner must resolve both from current repository authority rather than reserving or guessing them here.
2. Which physical paths and resource identifiers should deliver the contract, profile template, and coverage starter after reconciling the acceptance state of the sibling v2 recovery design? The plan must select one accepted layout and must not ship duplicate authorities.

The exact number in an individual target, statistical treatment, sample approach, environment matrix, evidence budget, approver role, and expiry are profile-level product decisions, not open questions for this shared design.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Make Docs v2 Product Boundary and Missing Migration Recovery](2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md), [True Naive End-User Acceptance Testing](2026-07-27-true-naive-end-user-acceptance-testing.md), [Deferred Obligations and Anti-Orphan Governance](2026-07-27-deferred-obligations-and-anti-orphan-governance.md), [Coverage Pass Extensions and Adversarial Review](2026-06-20-coverage-pass-extensions-and-adversarial-review.md), [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md), and [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md)
- Reason: The sibling recovery design establishes only broad proportional-proof and finite-stop constraints while the earlier designs own adjacent testing, obligation, coverage, conformance, and migration boundaries. Performance qualification, calibrated profiles, measurement protocols, budgets, outcomes, waivers, and rejection rules are a distinct decision area that needs one related design without rewriting those authorities.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)
- Why: The accepted design would establish a new coherent capability PRD and surgically reconcile existing PRD consumers, lifecycle resources, templates, prompts, routers, compatibility guidance, state boundaries, and optional future TypeScript validation against the active product namespace.
- Coordinate Handoff: unresolved; planner must resolve before writing.
- Design Approval Gate: The owner accepts this document as design authority only by using the exact statement below. Review comments, draft-file acceptance, Orca task completion, approval of individual decisions, or acceptance of the sibling recovery design do not authorize planning.
- Exact Owner Design-Acceptance Statement: `I approve the Performance Testing Guardrails design as accepted design authority. This approval authorizes design acceptance only; it does not authorize change-plan creation or any later lifecycle stage.`
- Planning Authorization Gate: After design acceptance, the owner must separately authorize the change-plan stage. That authorization covers plan creation only and cannot be bundled into or inferred from design acceptance. It authorizes no PRD creation or editing, obligation registration, work generation, implementation, benchmark execution, template or dogfood mutation, manifest change, setup, staging, commit, integration, push, publication, release, deployment, or support-claim promotion.
- Exact Owner Planning-Authorization Statement: `I authorize creation of the Performance Testing Guardrails change plan from the accepted design. This authorization covers change-plan creation only and authorizes no later lifecycle stage.`
- Planning Preflight: Resolve the new PRD number and W/R coordinate; inventory active numeric and absolute performance targets without changing them; classify existing PRD consumers; reconcile the sibling recovery design's acceptance state and resource layout; and propose finite documentation and future-validator phases without executing evidence or promoting any claim.
