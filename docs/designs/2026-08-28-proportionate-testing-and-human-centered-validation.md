---
title: "Proportionate Testing and Human-Centered Validation"
kind: "design"
status: "draft"
follow_on:
  route: "change-plan"
  next_prompt: ".make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "The design changes the product-wide testing model, narrows existing Naive-UAT authority, preserves performance governance, adds guided progress review, and requires coordinated PRD and W20 R0 revision before implementation."
  coordinate_handoff: "unresolved; planner must assign a separate W/R coordinate, preserve its dependency with W20 R0, and revise W20 R0 only after the testing authority is reconciled."
source:
  type: "manual-request"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "source-to-design-straddle"
  reason: "The owner supplied the problem, four testing purposes, observed failure modes, desired human outcome, and required relationship to W20 R0 directly in the design discussion."
---

# Proportionate Testing and Human-Centered Validation

## Purpose

Define a coherent Make Docs testing model that uses the right kind and amount of testing for the current product decision.

The model must help agents prove what matters without turning testing into an uncontrolled source of cost, delay, ceremony, or frustration. It must also make human testing brief, purposeful, understandable, and rewarding.

The design establishes four built-in testing types:

1. automated implementation testing;
2. performance testing;
3. guided progress review; and
4. unassisted goal testing.

The design also separates two human-experience concerns:

- **Human experience in the system:** whether the built result helps a person understand and complete a real goal.
- **Human experience in testing:** whether the testing process itself respects the person's goal, time, knowledge, attention, and desire to experience meaningful progress.

These concerns support each other. They are not the same requirement.

This design is documentation-first. It stops before planning, PRD reconciliation, backlog revision, implementation, migration, staging, commit, publication, or release.

## Context

Make Docs has accumulated strong but separate testing concepts. It can describe automated validation, performance evidence, manual interaction, coverage passes, conformance, and naive UAT. The combined behavior does not yet express one clear testing doctrine.

The missing doctrine causes agents to confuse several questions:

- What current decision can this test change?
- Is the product mature enough for this proof?
- Which testing type can reveal the failure that matters?
- Who is the correct executor?
- How much evidence is enough?
- When must the agent stop?
- Does failure block the current work?
- What would be useful or enjoyable for the human owner to experience?

### Automated testing has weak proportionality

Agents can usually add and run automated tests during implementation without owner help. This is useful and should remain the default.

The failure occurs when an agent treats every possible assertion, environment, edge case, full-suite rerun, or production-grade concern as equally valuable. The work can expand far beyond the current change, current product maturity, or likely failure cost. Repeated tests can continue after the evidence is already sufficient.

The result is technically careful but economically and practically unsound. Time and money are spent on proof that cannot change the current decision.

### Performance testing is often applied before the product is ready

[Performance Testing Guardrails](2026-08-12-performance-testing-guardrails.md) and [PRD 48](../prd/48-performance-evidence-governance.md) already define useful ideas:

- applicability before targets;
- product maturity and risk;
- characterization before blocking thresholds;
- evidence-backed target authority;
- finite budgets and stop rules; and
- no target merely because something is measurable.

The remaining failure is consumption. Agents still propose sophisticated latency, memory, scale, environment, or response-time programs before a minimally viable product works well enough for those measurements to support a current decision.

An MVP, prototype, or early incomplete phase must not inherit production-grade proof merely because a future production system could need it.

### Guided manual testing has no clear first-class purpose

Agents often ask an owner or maintainer to repeat the same technical checks that automated tests already performed. Instructions can require long setup, raw commands, internal identifiers, private implementation knowledge, or an understanding of the exact assertions the agent used.

That misses the human purpose.

Guided manual testing should let the owner see meaningful progress first-hand. It should help the owner enjoy the result, recognize the product taking shape, and give useful feedback from direct experience. It is not a duplicate automated suite. It is not formal sign-off. It is not a hard gate.

The agent should prepare the environment, remove needless setup, provide a small goal-led walkthrough, state what is worth noticing, and clean up afterward when cleanup is needed.

### Naive UAT has become larger and more mandatory than intended

[True Naive End-User Acceptance Testing](2026-07-27-true-naive-end-user-acceptance-testing.md) established valuable controls:

- an uncoached attempt;
- a meaningful goal;
- installed or public product scope;
- public information only;
- tester and facilitator separation;
- useful findings; and
- no agent pretending to be the human tester.

The design and its later [PRD 46](../prd/46-naive-end-user-acceptance-testing.md) authority also made naive UAT a large reusable capability. It activates at the earliest safe user-observable boundary, carries scenario and evidence machinery, participates in phase gates, and can require durable deferral when it does not run.

That is not the intended default.

The original purpose was narrower. A human receives a few objectives that should be understandable from the product itself. The attempt reveals whether the agent landed the human experience or exposed a confusing mental model. The activity is a focused discoverability probe, not automatic formal acceptance.

The word `acceptance` has reinforced the wrong gate meaning. The word `naive` has also required repeated explanation. This design uses **Unassisted Goal Test** as the human-facing name.

### W20 R0 now carries the wrong testing boundary

[Human Experience Standard and Intent](2026-08-28-human-experience-standard-and-intent.md), [PRD 49](../prd/49-human-experience-standard-and-intent.md), and the [W20 R0 backlog](../work/2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md) correctly make human experience a product requirement.

They also consume the current testing model. That model treats Human Experience Review as a separate testing verdict and activates naive UAT broadly for direct human impact. W20 R0 therefore carries testing assumptions that this design changes.

W20 R0 must remain paused for implementation. Its design authority remains useful. Its PRD and backlog testing sections must be reconciled after this testing design receives an accepted plan and current PRD authority.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [True Naive End-User Acceptance Testing](2026-07-27-true-naive-end-user-acceptance-testing.md), [Performance Testing Guardrails](2026-08-12-performance-testing-guardrails.md), [Coverage Pass Extensions and Adversarial Review](2026-06-20-coverage-pass-extensions-and-adversarial-review.md), and [Human Experience Standard and Intent](2026-08-28-human-experience-standard-and-intent.md)
- Reason: This design creates one product-wide testing doctrine, preserves the useful parts of the performance design, materially narrows the prior naive-UAT design, adds a missing guided human mode, and corrects the testing assumptions consumed by the Human Experience work.

## Decision

### 1. Establish one product-wide testing standard

Make Docs will define one canonical testing standard for selecting, sizing, explaining, executing, and closing testing work.

The standard is:

> Choose the least costly test that can change the current decision. Match testing to product maturity, risk, and reversibility. Make human testing brief, goal-led, non-redundant, and respectful of the person's time and knowledge. A test becomes a gate only when accepted authority says its failure blocks the current outcome.

The standard owns shared testing semantics. Specialized owners can add detail. They cannot weaken the common proportionality, budget, stop, human-experience, or gate rules.

The first release must be available through normal Make Docs contracts, references, templates, prompts, and routers. It must not require a Skill. A later typed operation can assist with decisions and evidence, but no new runtime command is required to establish the product behavior.

### 2. Use exactly four core testing types

The core taxonomy is:

| Testing type | Primary question | Default executor | Default gate effect |
| --- | --- | --- | --- |
| Automated Implementation Testing | Does the changed behavior satisfy focused assertions, and did the change introduce a relevant regression? | Agent or automated system | Can block a correctness claim within accepted scope. |
| Performance Testing | Does current performance evidence answer an accepted decision for this product maturity, risk, and support scope? | Agent-coordinated tools, with owner negotiation when target authority is needed | Blocking only when accepted product authority defines a current hard requirement. |
| Guided Progress Review | Can the owner experience and understand meaningful progress through a short prepared path? | Owner, maintainer, or developer with agent guidance | Never a hard gate. Feedback can create later work. |
| Unassisted Goal Test | Can an intended person understand and attempt a meaningful goal without private coaching? | Qualified human using only allowed public or starting information | Advisory by default. Blocking only when explicit product or release authority says so. |

Accessibility, security, privacy, architecture, visual regression, conformance, and other specialist reviews remain available when their own authorities apply. They are not silently merged into one of the four core testing types.

### 3. Make test selection a current-decision process

Before testing expands beyond routine focused automated work, the agent must answer:

1. What current product, implementation, release, or human decision could this evidence change?
2. What failure matters at the current product maturity?
3. Which testing type can reveal that failure?
4. What is the smallest representative scope?
5. Who is qualified to execute it?
6. Does accepted authority make the result a gate?
7. What effort budget and stop condition apply?
8. What change, failure signal, expiry, or new decision would justify a rerun?

If the evidence cannot change a current decision, the default result is `not-needed-now`. The agent must not invent work to make every testing type appear active.

The decision can use a compact body record with these fields:

- `Testing type`
- `Decision informed`
- `Reason now`
- `Product maturity`
- `Scope`
- `Executor`
- `Gate effect`
- `Effort budget`
- `Stop condition`
- `Evidence retained`
- `Rerun trigger`

The first release does not require these fields in document frontmatter.

### 4. Bound automated implementation testing

Agents retain authority to create and run routine automated tests during implementation.

The default strategy is affected-first:

1. Test the changed behavior directly.
2. Test the nearest meaningful integration boundary.
3. Run the smallest relevant regression set.
4. Expand only when a failure signal, cross-cutting change, explicit support claim, or accepted risk justifies it.

Use three planning levels:

- **Focused:** changed behavior and its closest material regression boundary. This is the normal default.
- **Expanded:** broader subsystem, compatibility, or integration coverage justified by the change's blast radius or failure cost.
- **Release-grade:** full supported matrices, broad regression, and release evidence required by explicit release or product authority.

Agents can choose focused testing without interruption. Expanded testing must carry a short reason. Release-grade testing requires accepted release or product authority.

Automated work must have a finite stop rule. Passing affected tests plus the justified regression boundary is sufficient unless a new failure signal or changed implementation appears. An agent must not repeat unchanged broad suites for reassurance.

Test quantity is not a quality measure. A test must protect a real requirement, risk, compatibility boundary, or failure mode.

### 5. Enforce maturity before performance sophistication

The [Performance Testing Guardrails](2026-08-12-performance-testing-guardrails.md) remain authoritative design lineage. The new testing standard consumes and strengthens them.

Before performance work begins, the agent must decide whether the product is mature enough for the evidence to be useful.

Performance testing is `required-now` only when evidence protects a current accepted outcome, feasibility limit, safety or resource boundary, material regression decision, external mandate, or dependency budget.

Performance testing is `characterize-now` only when a current decision needs a baseline and the system behavior is stable enough for the measurement to mean something.

Performance work is `not-needed-now` when:

- the product or feature does not yet work as a coherent whole;
- the measured path is expected to change materially before the next decision;
- failure would not alter current implementation or product direction;
- the proposed target comes from intuition, a copied benchmark, or production expectations that do not apply to the current release; or
- simpler correctness or human-path work is the actual blocker.

An MVP can still need performance proof when it faces a real feasibility cliff or material human wait, cost, or resource risk. `MVP` is not an automatic exemption. It is a strong maturity signal that requires a current reason before sophisticated proof begins.

No numeric target becomes blocking authority unless the owning current PRD states the protected outcome and the owner accepts the hard requirement.

### 6. Add Guided Progress Review as a first-class type

Guided Progress Review exists for the owner, maintainer, or developer to experience meaningful progress.

Its goals are:

- show the most recognizable or satisfying result of the completed change;
- let the person use the product in the way the product is meant to be used;
- help the person understand what is now possible;
- make progress visible without requiring implementation knowledge; and
- invite natural feedback without turning the activity into sign-off.

The agent should suggest a Guided Progress Review after a meaningful user-visible increment. The person can decline without creating a failed gate, deferred obligation, or incomplete phase.

The agent owns preparation:

- establish or reset the test state when safe;
- choose a small realistic goal;
- provide no more setup than the person needs;
- use public product commands or interfaces instead of internal scripts when possible;
- provide a short sequence, normally one to five steps;
- say what result or change is worth noticing;
- avoid asking the person to repeat assertions already proved by automation;
- keep troubleshooting detail separate from the normal path; and
- provide cleanup or state-restoration steps when needed.

The review should create enjoyment, recognition, curiosity, or useful feedback. It must not manufacture praise or ask the person to certify that the implementation is complete.

The result can record:

- `experienced`;
- `feedback-recorded`;
- `declined`;
- `blocked-by-environment`; or
- `not-applicable`.

None of these results is a formal product-acceptance verdict.

### 7. Reframe naive UAT as Unassisted Goal Testing

The human-facing name is **Unassisted Goal Test**.

Its primary question is:

> Can an intended person understand and attempt a meaningful goal from the product and allowed starting information without private coaching?

It activates when an unassisted attempt can reveal a material human-experience uncertainty that other evidence cannot answer well enough. Useful triggers include:

- a new or changed mental model;
- important discoverability or orientation risk;
- a workflow where a wrong assumption causes material loss, confusion, or abandonment;
- a human-facing relationship, state, or recovery path that an implementer may understand only because they know the internal model;
- a new public goal with no prior unassisted evidence; or
- explicit product or release acceptance authority.

It does not activate merely because a user-observable slice exists. It does not run once per phase as ceremony. It does not create a durable obligation merely because it was unnecessary for an early internal or unstable increment.

The agent can prepare the environment, public starting point, goal, observation areas, and finding route. The test instruction must not reveal the expected path, hidden commands, internal identifiers, or intended answer.

The qualified person receives:

- a public or realistic starting point;
- one or a few meaningful goals;
- any safety limit that a real user would receive; and
- no private implementation guidance.

The preferred result language is:

- `clear`: the person understood and attempted the goal without material hidden help;
- `friction`: the attempt exposed confusion, excess effort, a wrong mental model, or weak recovery;
- `blocked`: the product or environment prevented a valid attempt;
- `invalid-run`: coaching, prior private knowledge, broken setup, or evidence loss prevents a valid conclusion; or
- `not-needed-now`: no current decision justifies an unassisted attempt.

The default result is diagnostic. It informs design and remediation. It is not formal acceptance unless current product or release authority explicitly gives it blocking effect.

Existing `NUAT-###` scenario identities remain valid for compatibility. The plan must decide whether new scenarios keep that prefix or introduce a clearer identity with a stable alias. No bulk rename is required.

### 8. Treat Human Experience Review as a lens, not a fifth testing type

Human Experience Review asks whether evidence and the built result satisfy accepted experience promises. It is a review lens.

It can guide:

- the goals and observations in Guided Progress Review;
- the uncertainty and findings in an Unassisted Goal Test;
- expert review of a human-facing result;
- interpretation of indirect technical evidence; and
- remediation after a human finding.

It does not become a fifth core testing type. It does not require a separate test run when another suitable activity already supplies the evidence.

The Human Experience Standard remains product authority for the built result. The testing standard owns how evidence is selected, sized, administered, and explained.

### 9. Apply a human-experience standard to testing itself

Every human testing request must help the person understand:

- why the activity is useful now;
- what goal they will attempt;
- how much time and effort it should take;
- what preparation the agent already completed;
- what they should notice without being coached toward a verdict;
- whether the result is advisory or blocking;
- how to stop, recover, or clean up; and
- what will happen with their feedback.

Human testing instructions must:

- use the public product path;
- start from the person's goal;
- stay brief by default;
- avoid internal IDs, raw payloads, complex environment setup, and diagnostic commands unless the goal truly requires them;
- avoid retesting automated assertions;
- separate optional detail from the normal path;
- state expected effort honestly;
- explain errors in human terms; and
- preserve the person's control to decline, stop, or ask for more detail.

The quality of the testing experience is part of Make Docs product quality. A correct test with needlessly difficult instructions is still a poor Make Docs result.

### 10. Define explicit gate rules

Each testing decision must state one gate effect:

- `blocking-current-work`;
- `blocking-claim-only`;
- `advisory`;
- `informational`; or
- `not-applicable`.

Default gate rules are:

- Automated Implementation Testing can block the correctness claim it covers.
- Performance Testing blocks only an accepted hard outcome or bounded support claim.
- Guided Progress Review is always advisory or informational.
- Unassisted Goal Testing is advisory by default and blocking only through explicit current authority.

A failed or skipped non-blocking test does not silently become a phase gate.

A missing test creates a durable obligation only when an accepted future outcome is still owed. `Not needed now` is not a deferred obligation. `Test later` without an accepted outcome, owner, trigger, and reason is not valid planning.

### 11. Keep testing records small and useful

Make Docs must retain enough evidence to support the decision. It must not require a large artifact set for every test.

The normal evidence level is:

- automated: command or suite identity, scope, outcome, and material failure;
- performance: the current `PERF-###` profile and result contract when applicable;
- guided progress: goal, short path, owner feedback, and any resulting action;
- unassisted goal: goal, allowed context, executor qualification, observations, result, and material finding.

Raw logs, recordings, screenshots, environment captures, or full transcripts are retained only when they are needed for reproduction, specialist evidence, support claims, or accepted authority.

The lifecycle should reuse unchanged evidence when its scope, implementation, environment, and expiry remain valid. A new phase number alone is not a rerun trigger.

### 12. Reconcile product authority before implementation

The downstream change plan must determine the exact current owners. The expected authority changes are:

- create one product-wide testing-governance PRD for the four-type taxonomy, common decision model, proportionality, human testing experience, budgets, stop rules, and gate semantics;
- update [PRD 14](../prd/14-lifecycle-workflow-and-coverage-passes.md) to route the four types without making all four candidates mandatory;
- materially narrow and possibly rename [PRD 46](../prd/46-naive-end-user-acceptance-testing.md) while preserving useful anti-coaching, human-executor, public-path, and finding controls;
- preserve [PRD 48](../prd/48-performance-evidence-governance.md) while strengthening maturity consumption at design, plan, implementation preflight, and phase close;
- update [PRD 49](../prd/49-human-experience-standard-and-intent.md) so it does not broadly require naive UAT and does not define Human Experience Review as a fifth testing type;
- update the product overview, risk register, glossary, metadata and handoff authority, Persona boundary, deferred-obligation rules, conformance owners, and package or system-resource owners where the change plan proves an integration need; and
- revise the [W20 R0 plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md) and [W20 R0 backlog](../work/2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md) only after the testing PRD set is accepted.

Historical design, PRD, scenario, result, obligation, plan, backlog, and history records remain historical evidence. They are not rewritten to pretend that the new model existed earlier.

### 13. Require failure-revealing conformance

The eventual implementation must prove:

- an agent chooses focused automated testing for a small change and stops after sufficient affected proof;
- an agent expands automated testing only when a stated risk or blast radius justifies it;
- an early unstable MVP rejects production-grade performance testing that cannot change a current decision;
- a real MVP feasibility cliff still activates bounded performance evidence;
- a Guided Progress Review gives the owner a short, recognizable, non-duplicative product experience with no sign-off gate;
- an Unassisted Goal Test reveals a hidden mental-model or discoverability failure without coaching;
- a user-observable change can validly skip an Unassisted Goal Test when no material uncertainty or current decision justifies it;
- Human Experience Review is used as a lens without creating duplicate testing work;
- skipped non-blocking testing does not create a false obligation or failed phase;
- a blocking verdict cannot appear without current authority; and
- supported agents explain the reason, scope, executor, budget, stop condition, evidence, and gate effect in plain language.

At least one realistic installed-product exercise must show that the testing process itself is easier, shorter, and more meaningful for the owner than the current technical walkthrough pattern.

## Alternatives Considered

### Patch only W20 R0

Rejected.

W20 R0 consumes testing authority. It should not become the owner of automated, performance, guided, and unassisted testing policy. A local patch would leave the wider Make Docs behavior inconsistent.

### Keep Human Experience Review as a fifth testing type

Rejected.

Human Experience Review is a question applied to evidence and outcomes. Making it a required separate mode can duplicate guided or unassisted human work and recreate the ceremony this design removes.

### Keep naive UAT mandatory at every user-observable boundary

Rejected.

This creates repeated human work, phase-gate pressure, and obligations even when no current uncertainty or decision justifies an unassisted attempt.

### Treat guided manual testing as informal and undocumented

Rejected.

Without a first-class purpose, agents continue to give owners technical retests instead of meaningful product experiences.

### Make all four testing types mandatory for every phase

Rejected.

The testing types answer different questions. Mandatory use would ignore maturity, risk, decision value, and cost.

### Solve proportionality with fixed test-count or time limits

Rejected.

One fixed limit cannot fit a small document change, a state-machine revision, a safety boundary, and a release candidate. The model needs a current decision, risk, budget, and stop condition.

### Require a testing Skill

Rejected.

The core behavior must work through normal Make Docs authority and routing. A Skill can later assist with a specialized workflow. It cannot be required for product correctness.

### Remove tester qualification and anti-coaching controls

Rejected.

Those controls remain useful when an Unassisted Goal Test is selected. The problem is over-activation and gate meaning, not the validity of unassisted evidence.

## Consequences

### Positive consequences

- Agents gain one clear rule for choosing and sizing testing.
- Automated testing remains useful without becoming an unbounded proof exercise.
- Performance work matches product maturity and current decisions.
- Owners receive short, meaningful progress experiences instead of duplicate technical tests.
- Unassisted human testing returns to its intended role as a discoverability and mental-model probe.
- Testing gates become explicit instead of implied by labels such as `acceptance`.
- The Human Experience Standard and testing governance complement each other without sharing one authority.
- Evidence becomes smaller, easier to understand, and more reusable.
- Time and cost become part of testing quality.
- W20 R0 can implement human-experience requirements without inheriting a harmful testing model.

### Negative consequences and costs

- The change affects several current PRDs, resources, prompts, templates, routers, scenarios, conformance assets, and the new W20 R0 backlog.
- PRD 46 requires material reduction rather than a small editorial update.
- Existing `NUAT-###` records need compatibility rules and clear display labels.
- Agents and maintainers must learn the difference between a guided progress experience and an unassisted goal test.
- Testing decisions require a small amount of explicit reasoning before large evidence work begins.
- Some existing phase gates and deferred obligations may need reclassification.
- Conformance must test under-testing as well as over-testing.

### Risks and controls

- **Risk: proportionality becomes permission to skip important correctness work.** Control: automated correctness remains blocking within accepted scope, and agents must state the changed behavior and nearest regression boundary.
- **Risk: `MVP` becomes a blanket reason to avoid performance evidence.** Control: feasibility cliffs, material human waits, safety, resource boundaries, and current decisions can still require bounded proof.
- **Risk: Guided Progress Review becomes a disguised sign-off request.** Control: its gate effect is always advisory or informational, and decline is valid.
- **Risk: an agent coaches the Unassisted Goal Test.** Control: preserve public-starting-point, qualified-human, and anti-coaching rules.
- **Risk: advisory findings disappear.** Control: material findings still route to remediation or an accepted future obligation.
- **Risk: a new compact decision record becomes another checklist.** Control: require the current decision, reason, budget, and stop condition; do not judge quality by field count.
- **Risk: W20 R0 and the testing change diverge.** Control: block W20 R0 implementation until both PRD sets and the revised backlog agree.
- **Risk: agents still give poor human instructions.** Control: conformance must include a realistic installed-product testing experience judged for effort, clarity, relevance, and duplication.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)
- Why: The design changes existing testing, lifecycle, performance, UAT, Human Experience, conformance, obligation, resource, and W20 R0 authority. It requires a coordinated change plan and PRD reconciliation before any implementation or backlog execution.
- Coordinate Handoff: unresolved; planner must assign a separate W/R coordinate, preserve its dependency with W20 R0, and revise W20 R0 only after the testing authority is reconciled.
- Planning Boundary: The plan must preserve all four testing purposes, the separate testing-experience requirement, the non-gate Guided Progress Review, the conditional diagnostic Unassisted Goal Test, affected-first automated testing, maturity-qualified performance evidence, and the pause on W20 R0 implementation.
- Approval Boundary: This draft is not authority for planning or implementation until the owner accepts it. Design acceptance authorizes only the separate change-planning step. It does not authorize PRD edits, backlog revision, implementation, migration, staging, commit, publication, or release.
