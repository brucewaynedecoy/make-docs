---
title: "50 Proportionate Testing and Human-Centered Validation"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md"
---

# 50 Proportionate Testing and Human-Centered Validation

## Purpose

Make Docs must select and administer the least costly testing that can change the current decision. Testing must match product maturity, risk, reversibility, and claimed scope. Human testing must be brief, goal-led, non-redundant, and respectful of the person's time and knowledge.

The product-wide standard is:

> Choose the least costly test that can change the current decision. Match testing to product maturity, risk, and reversibility. Make human testing brief, goal-led, non-redundant, and respectful of the person's time and knowledge. A test becomes a gate only when accepted authority says its failure blocks the current outcome.

This PRD owns the shared testing model. Specialized owners can add detail. They cannot weaken its proportionality, effort-budget, stop-rule, human-experience, evidence-reuse, or gate rules.

## Scope

This capability applies when Make Docs selects, plans, explains, executes, reviews, closes, reuses, or defers testing work.

It owns:

- exactly four core testing types;
- the common current-decision process;
- affected-first automated-testing levels;
- maturity-qualified selection;
- human testing experience requirements;
- explicit gate effects and defaults;
- finite effort budgets and stop conditions;
- small evidence records and reuse;
- rerun triggers;
- lifecycle handoff semantics; and
- boundaries with specialist testing and review owners.

It does not replace detailed Performance Testing authority in [PRD 48](48-performance-evidence-governance.md), detailed Unassisted Goal Testing authority in [PRD 46](46-naive-end-user-acceptance-testing.md), the built-result Human Experience Standard in [PRD 49](49-human-experience-standard-and-intent.md), or specialist security, privacy, accessibility, architecture, visual, static-adapter, release, and support-claim authorities.

## Terms

- **Automated Implementation Testing:** Agent-run or automated proof that changed behavior satisfies focused assertions and has not caused a relevant regression.
- **Performance Testing:** Agent-coordinated evidence that answers an accepted performance decision for the current product maturity, risk, and support scope.
- **Guided Progress Review:** A short prepared path that lets the owner, maintainer, or developer experience and understand meaningful progress with agent guidance.
- **Unassisted Goal Test:** A qualified human attempt to understand and complete a meaningful goal from allowed public or starting information without private coaching.
- **Human Experience Review:** Required agent review work that checks evidence and the built result against accepted experience promises. It is not a fifth core testing type.
- **Experience handoff:** Short completion communication that lets a person try a completed direct human-facing result and provide optional feedback. It is not a test or gate.
- **Human acceptance gate:** An explicit requirement for a named human response that uses an existing gate effect and blocks only its named scope.
- **Gate effect:** The exact way a test result can affect current work or a claim.
- **Not needed now:** A valid decision that evidence cannot change a current product, implementation, release, or human decision.

## Component and Capability Map

| Component | Capability | Primary authority |
| --- | --- | --- |
| Common testing standard | Select, size, explain, stop, reuse, and gate testing work | This PRD |
| Automated Implementation Testing | Apply affected-first proof at focused, expanded, or release-grade level | This PRD and the owning implementation requirement |
| Performance Testing | Qualify and execute performance evidence | [PRD 48](48-performance-evidence-governance.md) |
| Guided Progress Review | Prepare a short owner-facing progress experience | This PRD |
| Unassisted Goal Testing | Qualify humans, prevent coaching, run public goals, and record findings | [PRD 46](46-naive-end-user-acceptance-testing.md) |
| Human Experience Review | Interpret evidence against accepted experience promises | [PRD 49](49-human-experience-standard-and-intent.md) |
| Lifecycle routing | Select candidates, preserve decisions, and consume gates | [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) |
| Deferred testing outcomes | Preserve only accepted future outcomes that remain owed | [PRD 45](45-deferred-obligation-governance.md) |
| Installed harness and support | Prove each declared static adapter method works through the installed product | [PRD 10](10-packaging-validation-and-release-reference.md), [PRD 16](16-package-runtime-and-deployment-boundaries.md), and [PRD 28](28-shared-agentics-installation-and-harness-exposure.md) |

## Requirements

### R-TEST-01 Exact Core Taxonomy

Make Docs must use exactly four core testing types:

1. Automated Implementation Testing;
2. Performance Testing;
3. Guided Progress Review; and
4. Unassisted Goal Testing.

Specialist reviews remain separate when their own authority applies. The existence of a testing type does not make it required for every change or phase.

### R-TEST-02 Current-Decision Selection

Before testing expands beyond routine focused automated work, the agent must answer:

1. What current decision can the evidence change?
2. What failure matters at the current maturity?
3. Which testing type can reveal that failure?
4. What is the smallest representative scope?
5. Who is qualified to execute it?
6. Does accepted authority make the result a gate?
7. What effort budget and stop condition apply?
8. What change, failure signal, expiry, or new decision would justify a rerun?

If evidence cannot change a current decision, the type records `not-needed-now`. An agent must not invent testing to make every type appear active.

### R-TEST-03 Common Testing Decision Record

The first release uses a compact body record with:

- `Testing type`;
- `Decision informed`;
- `Reason now`;
- `Product maturity`;
- `Scope`;
- `Executor`;
- `Gate effect`;
- `Effort budget`;
- `Stop condition`;
- `Evidence retained`; and
- `Rerun trigger`.

The first release must not require these fields in frontmatter.

### R-TEST-04 Automated Testing Levels

Automated Implementation Testing uses three levels:

- `focused`: changed behavior and its closest material regression boundary;
- `expanded`: broader subsystem, compatibility, or integration proof justified by blast radius or failure cost; and
- `release-grade`: full supported matrices, broad regression, and release evidence required by explicit product or release authority.

Agents can choose `focused` without interruption. `expanded` requires a short reason. `release-grade` requires accepted product or release authority.

### R-TEST-05 Affected-First and Finite Stop

Automated testing must proceed affected-first:

1. test the changed behavior;
2. test the nearest meaningful integration boundary;
3. run the smallest relevant regression set; and
4. expand only after a failure signal, cross-cutting change, explicit support claim, or accepted risk.

Passing affected proof and the justified regression boundary is sufficient unless implementation or failure evidence changes. An agent must not repeat unchanged broad suites for reassurance. Test quantity is not a quality measure.

### R-TEST-06 Maturity Before Sophistication

Testing burden must match maturity, risk, reversibility, failure cost, and claimed scope.

An early or unstable product should not receive production-grade proof when the path will materially change, failure would not alter current direction, or correctness and human-path work are the actual blockers. An MVP can still require sophisticated proof for a real feasibility cliff, safety or resource boundary, material human wait, external mandate, dependency budget, or central accepted outcome.

Performance Testing must consume [PRD 48](48-performance-evidence-governance.md). No numeric target becomes blocking authority unless the current owning PRD states the protected outcome and the owner accepts the hard requirement.

### R-TEST-07 Guided Progress Review

Guided Progress Review exists so the owner, maintainer, or developer can experience and understand meaningful progress.

The agent should suggest it after a meaningful user-visible increment. The person can decline without a failed gate, deferred obligation, or incomplete phase.

The agent must prepare a safe starting state, one small realistic goal, public product paths, normally one to five steps, the result worth noticing, separate optional troubleshooting, and cleanup when needed. It must not ask the person to repeat automated assertions or certify completeness.

Valid results are `experienced`, `feedback-recorded`, `declined`, `blocked-by-environment`, and `not-applicable`. Every result is advisory or informational.

### R-TEST-08 Unassisted Goal Testing Boundary

Unassisted Goal Testing activates only when an unassisted attempt can reveal a material current human-experience uncertainty that other evidence cannot answer well enough, or when explicit product or release authority requires it.

It does not activate merely because a user-observable slice exists. It does not run once per phase as ceremony. It is diagnostic and advisory by default.

[PRD 46](46-naive-end-user-acceptance-testing.md) owns qualified-human, public-path, anti-coaching, scenario, result, finding, evidence, and compatibility rules.

### R-TEST-09 Human Experience Review Lens

Human Experience Review is an agent-owned lens over suitable evidence and the built result. It can guide Guided Progress Review, Unassisted Goal Testing, expert review, indirect technical evidence, or remediation.

It is not a fifth core testing type. It must not require a duplicate test run when existing suitable evidence answers the accepted experience question.

The agent records the review and its evidence limits. Completed direct human-facing work normally includes a short optional experience handoff. The handoff is not a testing decision, recorded result, or sign-off request. If an activity is intended to answer a current decision, select the applicable testing type.

### R-TEST-10 Human Testing Experience

Every request to a person must explain:

- why the activity is useful now;
- the goal;
- expected time and effort;
- what the agent prepared;
- what to notice without coaching toward a verdict;
- whether the result is advisory or blocking;
- how to stop, recover, or clean up; and
- how feedback will be used.

Instructions must use the public product path, start from the person's goal, stay brief by default, avoid internal IDs and raw payloads unless needed, avoid retesting automated assertions, separate optional detail, explain errors in human terms, and preserve the person's control to decline or stop.

A technically correct test with needlessly difficult instructions is a poor Make Docs result.

An optional experience handoff is lighter than a testing request. It normally gives one to three normal-use steps, states what to notice, and invites optional feedback. It does not require a prepared test environment, a verdict, or a response. Silence, refusal, or no feedback does not block work or create an obligation.

### R-TEST-11 Explicit Gate Effects

Every testing decision records exactly one gate effect:

- `blocking-current-work`;
- `blocking-claim-only`;
- `advisory`;
- `informational`; or
- `not-applicable`.

Default rules are:

- Automated Implementation Testing can block the correctness claim it covers.
- Performance Testing blocks only an accepted hard outcome or bounded support claim.
- Guided Progress Review is always advisory or informational.
- Unassisted Goal Testing is advisory by default and blocks only through explicit current product or release authority.
- Human acceptance blocks only when the user, an accepted design or PRD, release authority, or safety authority explicitly names the scope, human reviewer, surface, acceptance question, and gate effect.

A failed, skipped, declined, or blocked non-blocking activity must not silently become a phase gate.

### R-TEST-12 Evidence Economy and Reuse

Make Docs must retain enough evidence to support the decision. It must not require a large artifact set for every test.

Normal evidence is:

- automated: suite or command identity, scope, outcome, and material failure;
- performance: the applicable `PERF-###` profile and result contract;
- guided progress: goal, short path, feedback, and resulting action; and
- unassisted goal: goal, allowed context, executor qualification, observations, result, and material finding.

Raw logs, recordings, screenshots, environment captures, and full transcripts are retained only when needed for reproduction, specialist evidence, support claims, or accepted authority.

Unchanged evidence must be reused while its scope, implementation, environment, and expiry remain valid. A new phase number alone is not a rerun trigger.

### R-TEST-13 Deferred Testing Boundary

A missing test creates a durable obligation only when an accepted future outcome is still owed and the record has an owner, trigger, target, exit criteria, and reason.

`not-needed-now`, `declined`, `not-applicable`, an unanswered optional experience handoff, or “test later” without accepted future authority must not create an `O-###` obligation.

### R-TEST-14 Failure-Revealing Installed-Harness Proof

Direct installed-harness proof must reveal both insufficient testing and excessive, early, duplicate, unauthorized, or needlessly difficult testing.

The proof set must include focused automated checks, justified expansion, rejected unsupported release-grade work, maturity-qualified performance selection, a non-gate Guided Progress Review, an anti-coached Unassisted Goal Test, valid `not-needed-now`, Human Experience evidence reuse, false-obligation prevention, and rejection of blocking verdicts without authority. Each declared static adapter method also needs one direct exercise through the installed package in a disposable harness home.

At least one realistic installed-product exercise must show that testing is shorter, easier to understand, and more meaningful for the owner than the prior technical walkthrough pattern.

## Contracts and Data

The common testing decision is body authority:

```markdown
### Testing Decision

Testing type: ...
Decision informed: ...
Reason now: ...
Product maturity: ...
Scope: ...
Executor: ...
Gate effect: ...
Effort budget: ...
Stop condition: ...
Evidence retained: ...
Rerun trigger: ...
```

Specialized records can add fields. They must preserve the shared meaning.

## Integrations

- [PRD 06](06-template-contracts-and-generated-assets.md) owns upstream contracts, references, templates, prompts, package projection, and dogfood parity.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) owns lifecycle routing and phase-close consumption.
- [PRD 15](15-agent-instruction-ownership-and-managed-blocks.md) owns concise managed-router discovery.
- [PRD 28](28-shared-agentics-installation-and-harness-exposure.md) owns the declared static adapters and harness methods that use this model.
- [PRD 23](23-generated-document-metadata-and-lifecycle-handoffs.md) owns the body-record and handoff boundary.
- [PRDs 10](10-packaging-validation-and-release-reference.md) and [16](16-package-runtime-and-deployment-boundaries.md) own package and release proof. This PRD owns the proportionate direct test set and the installed-product evidence bar.
- [PRD 45](45-deferred-obligation-governance.md) owns accepted future testing obligations.
- [PRD 46](46-naive-end-user-acceptance-testing.md) owns Unassisted Goal Testing details.
- [PRD 47](47-persona-model.md) owns intended-audience selection, not tester qualification by itself.
- [PRD 48](48-performance-evidence-governance.md) owns Performance Testing details.
- [PRD 49](49-human-experience-standard-and-intent.md) owns the built-result standard and Human Experience Review lens.

## Rebuild Notes

The first release is documentation-first. It must ship through normal contracts, references, templates, prompts, and routers. It must not require a Skill, new runtime command, or frontmatter schema.

System resources are authored upstream under `packages/docs/template/` before dogfood projection. A future typed helper can assist with decisions and evidence after the body-record workflow proves stable. It must not make product judgments, invent gates, or activate testing merely because it can produce a record.

## Acceptance Scenarios

1. A small change uses focused automated proof and stops after the nearest material regression boundary passes.
2. A cross-cutting change uses expanded proof with a stated blast-radius reason.
3. Release-grade testing is rejected when no product or release authority requires it.
4. An unstable MVP rejects production-grade performance work that cannot change a current decision.
5. A real MVP feasibility cliff activates bounded performance evidence.
6. A Guided Progress Review gives the owner a short, recognizable product experience without sign-off.
7. An Unassisted Goal Test reveals a hidden mental-model failure without private coaching.
8. A user-visible change records `not-needed-now` when no material unassisted uncertainty exists.
9. Human Experience Review reuses suitable evidence instead of creating a duplicate activity.
10. Skipped non-blocking testing creates no failed phase or false obligation.
11. A blocking verdict is rejected because no current authority owns it.
12. Human testing instructions are technically correct but fail acceptance because they impose needless setup, internal IDs, or duplicate assertions.
13. Completed direct human-facing work closes after the agent review and gives the person a short optional experience handoff. No response is required.
14. Accepted authority explicitly names a human acceptance gate. The named response blocks only the stated scope and uses an existing gate effect.

## Non-Requirements

- No requirement to use all four testing types for each phase.
- No fixed global test count or time limit.
- No test-volume quality score.
- No automatic production-grade proof for an MVP.
- No hard gate from Guided Progress Review.
- No default hard gate from Unassisted Goal Testing.
- No Human Experience Review testing type.
- No default owner response, approval, or sign-off gate.
- No automatic obligation for `not-needed-now` or declined advisory work.
- No mandatory testing Skill.
- No new runtime command or frontmatter schema in the first release.
- No replacement for specialist security, privacy, accessibility, visual, architecture, static-adapter, release, or support-claim authority.

## Requirement History

### 2026-09-14 — W19 R6 P3

- Affected requirement or section: installed-harness testing and support evidence.
- Previous contract: Retired conformance scenarios, kits, lab sessions, and results owned the proof path for supported harness behavior.
- Replacement contract: Each declared static adapter method needs one direct exercise through the installed package in a disposable harness home. Test volume stays proportionate and Human Experience Review reuses suitable evidence.
- Rationale: Direct product proof must expose both missing support and needless test burden without restoring the retired conformance system.
- Source: [P3 design](../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md) and [P3 plan](../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/03-static-harness-adapters-and-conformance-retirement.md)

### 2026-09-15 — W20 R2

- Affected requirement or section: terms, `R-TEST-09`, `R-TEST-10`, `R-TEST-11`, `R-TEST-13`, acceptance scenarios, and non-requirements.
- Previous contract: Human Experience Review was not a fifth testing type, but normal completion still required an owner response to the agent-prepared review.
- Replacement contract: The agent owns the review. The optional experience handoff is completion communication, not a test or gate. A human response blocks only through explicit accepted authority and an existing gate effect.
- Rationale: Preserve proportionate human input without turning advisory feedback into a false phase gate or obligation.
- Source: [W20 R2 Human Experience Review and Feedback Boundary plan](../plans/2026-09-15-w20-r2-human-experience-review-and-feedback-boundary/00-overview.md)

## Source Anchors

- [Proportionate Testing and Human-Centered Validation design](../designs/2026-08-28-proportionate-testing-and-human-centered-validation.md)
- [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)
- [Performance Evidence Governance](48-performance-evidence-governance.md)
- [Unassisted Goal Testing](46-naive-end-user-acceptance-testing.md)
