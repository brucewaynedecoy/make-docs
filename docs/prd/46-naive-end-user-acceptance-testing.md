---
title: "46 Unassisted Goal Testing"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md"
---

# 46 Unassisted Goal Testing

## Purpose

Define the Make Docs capability for Unassisted Goal Testing: a qualified human attempts a meaningful product goal from a realistic starting point and allowed public information without private coaching.

The primary question is:

> Can an intended person understand and attempt a meaningful goal from the product and allowed starting information without private coaching?

This activity reveals material uncertainty about discoverability, comprehension, mental models, relationships, state, recovery, control, and goal completion. It is diagnostic and advisory by default. It is not a general manual-test mode, a progress walkthrough, or automatic product acceptance.

The stable file path and existing `R-NUAT-*` and `NUAT-###` identities remain valid for compatibility. The human-facing capability name is Unassisted Goal Testing.

## Scope

Unassisted Goal Testing can apply to a normally consumable GUI, device, CLI, SDK, API, integration, or documentation-driven workflow when an intended person can safely attempt a meaningful goal and the attempt can change a current product, release, or Human Experience decision.

It governs:

- current-decision activation and valid `not-needed-now`;
- tester qualification and isolation;
- intended-audience and Persona inputs;
- realistic public starting points and anti-coaching;
- stable scenario identity and compatibility;
- run outcomes, findings, evidence, and reproducibility;
- bounded support-scope conclusions;
- explicit gate effects;
- conservative adoption of existing manual and UAT artifacts; and
- documentation-first system-resource delivery.

It does not activate merely because a user-observable slice exists. It does not run once per phase as ceremony. It does not replace Automated Implementation Testing, Performance Testing, Guided Progress Review, specialist accessibility testing, visual regression, conformance, architecture review, market research, beta recruitment, production experimentation, or release authority.

## Component and Capability Map

| Component | Capability | Primary authority |
| --- | --- | --- |
| Testing selection | Decide whether an unassisted attempt can change a current decision | [PRD 50](50-proportionate-testing-and-human-centered-validation.md) and this PRD |
| Tester qualification | Prove that the executor lacks private path or answer knowledge | This PRD |
| Audience framing | Select a realistic intended audience and public assumptions | This PRD and [PRD 47](47-persona-model.md) |
| Scenario authority | Preserve a stable public goal, allowed context, safety limits, and observation route | This PRD and the PRD that owns the user outcome |
| Execution and findings | Record the unassisted attempt, intervention, observations, result, and material findings | This PRD |
| Human Experience lens | Use accepted experience promises to shape goals and interpret findings | [PRD 49](49-human-experience-standard-and-intent.md) |
| Lifecycle and obligations | Consume the advisory or explicit blocking effect and route accepted later work | [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) and [PRD 45](45-deferred-obligation-governance.md) |
| Evidence home | Keep approved project evidence under the selected Persona testing path | [PRD 22](22-project-documentation-asset-model.md) and [PRD 47](47-persona-model.md) |

## Requirements

### R-NUAT-SCOPE Qualified Tester and Installed Product

- R-NUAT-SCOPE-1 (MUST): the executor has no source-code, architecture, PRD, backlog, private conversation, known-defect, hidden-answer, successful-path, or implementation-session knowledge that would reveal the tested goal.
- R-NUAT-SCOPE-2 (MUST): the executor uses only the product, normal accounts or environment a real person can obtain, and allowed public or realistic starting information.
- R-NUAT-SCOPE-3 (MUST): an agent can execute only when isolated in a separate context with no repository access, private memory, implementation conversation, or project-specific path guidance beyond the tester packet. Self-attestation alone is not sufficient evidence.
- R-NUAT-SCOPE-4 (MUST): the tested form is normally consumable by the intended audience. A source checkout or development server qualifies only when the intended audience normally consumes that exact form.
- R-NUAT-SCOPE-5 (MUST): selected Persona and target-user framing help define audience and evidence routing. They do not prove qualification or weaken isolation.

### R-NUAT-ACTIVATE User-Observable Slices and Valid `none`

The heading is retained for stable links. Current activation is based on material current uncertainty, and current records use `not-needed-now` rather than a mandatory future route for every `none` decision.

- R-NUAT-ACTIVATE-1 (MUST): Unassisted Goal Testing activates only when an unassisted attempt can reveal a material current human-experience uncertainty that other evidence cannot answer well enough, or explicit current product or release authority requires it.
- R-NUAT-ACTIVATE-2 (MUST): useful triggers include a new mental model, discoverability or orientation risk, a costly wrong assumption, weak recovery, a relationship or state that implementers may understand only from internal knowledge, a new public goal without prior unassisted evidence, or explicit acceptance authority.
- R-NUAT-ACTIVATE-3 (MUST NOT): a user-observable slice, phase close, available tester, existing scenario, or desire for reassurance does not activate the test by itself.
- R-NUAT-ACTIVATE-4 (MUST): `not-needed-now` is valid when no current decision justifies an unassisted attempt. It records the reason and any evidence that already answers the uncertainty. It does not create a durable obligation by itself.
- R-NUAT-ACTIVATE-5 (MUST): if an accepted future outcome remains owed, the record must use PRD 45 with an owner, trigger, target, exit criteria, and reason. “Test later” alone is invalid.

### R-NUAT-MODES Separate Test and Review Modes

Unassisted Goal Testing is distinct from:

| Activity | Primary purpose |
| --- | --- |
| Guided Progress Review | Let the owner experience and understand meaningful progress through agent guidance; never a gate |
| Knowledgeable manual or specialist review | Inspect behavior or quality with permitted domain and implementation knowledge |
| Automated Implementation Testing | Prove focused assertions and relevant regressions |
| Performance Testing | Answer a qualified performance decision |
| Human Experience Review | Interpret evidence against accepted experience promises |
| Unassisted Goal Testing | Reveal whether an intended person can understand and attempt a goal without private coaching |

A physical activity can supply evidence to more than one review. Each authority retains its own executor, sufficiency, result, and gate rules. Suitable evidence should be reused instead of creating duplicate activities.

### R-NUAT-GOAL Real-World Goals and Anti-Coaching

- R-NUAT-GOAL-1 (MUST): tester instructions state a realistic situation, one or a few meaningful goals, a public starting point, allowed resources, and real safety limits.
- R-NUAT-GOAL-2 (MUST NOT): tester instructions reveal clicks, commands, internal objects, exact output, hidden navigation, expected answers, or the preferred route.
- R-NUAT-GOAL-3 (MUST): operator-only setup, known defects, risk notes, success interpretation, and evidence mechanics remain outside the tester packet when disclosure would reveal the path or answer.
- R-NUAT-GOAL-4 (MUST): every intervention is recorded. Material coaching makes the result `invalid-run` and cannot count as success.
- R-NUAT-GOAL-5 (MUST): safety intervention is always permitted for harm, data loss, privacy exposure, unauthorized effects, or unexpected spending.
- R-NUAT-GOAL-6 (MUST): instructions must not compensate for a product discoverability defect. Remediate the product or its normal public help, then repeat only when a current rerun trigger exists.

### R-NUAT-SCENARIO Scenario Identity and Artifact Contract

- R-NUAT-SCENARIO-1 (MUST): existing `NUAT-###` scenario identities remain valid and append-only.
- R-NUAT-SCENARIO-2 (MUST): the same public goal keeps its ID and increments `scenario_version` for a material change. A materially different goal, audience, support claim, or risk receives a new identity.
- R-NUAT-SCENARIO-3 (MUST): one canonical record can render an operator view and a tester packet. Operator-only content must not leak into the tester packet.
- R-NUAT-SCENARIO-4 (MUST): work files cannot become a second scenario authority.
- R-NUAT-SCENARIO-5 (MAY): a future implementation can introduce a clearer new prefix only with a stable alias and compatibility proof. No bulk rename is required.

### R-NUAT-EVIDENCE Setup, Outcomes, Findings, and Reproducibility

- R-NUAT-EVIDENCE-1 (MUST): setup records the product build, support scope, public starting state, isolation, qualification, consent, capture, and readiness without rehearsing the goal.
- R-NUAT-EVIDENCE-2 (MUST): teardown applies consent, retention, and redaction; removes disposable state; restores shared environments; and records incomplete cleanup.
- R-NUAT-EVIDENCE-3 (MUST): every run records one result: `clear`, `friction`, `blocked`, or `invalid-run`. A selection record can use `not-needed-now` when no run is justified.
- R-NUAT-EVIDENCE-4 (MUST): evidence preserves material confusion, hesitation, wrong mental models, alternative paths, help use, recovery, relationship understanding, state understanding, and accessibility observations when applicable.
- R-NUAT-EVIDENCE-5 (MUST): findings record observed behavior, expected human outcome, severity, reproducibility, support scope, evidence, source requirement or promise, owner, and disposition.
- R-NUAT-EVIDENCE-6 (MUST): one valid independent run can answer the current bounded uncertainty unless accepted risk or support authority requires more. Additional clear runs cannot erase an unresolved material finding.
- R-NUAT-EVIDENCE-7 (MUST): perceived slowness is a human finding and can trigger PRD 48 qualification. It does not certify a `PERF-###` target.

Result meanings are:

| Result | Meaning |
| --- | --- |
| `clear` | The person understood and attempted the goal without material hidden help or human-experience friction that changes the current decision. |
| `friction` | The attempt exposed confusion, excess effort, a wrong mental model, weak recovery, or another material human-experience issue. |
| `blocked` | The product or environment prevented a valid attempt. |
| `invalid-run` | Coaching, prior private knowledge, broken setup, lost evidence, or another validity failure prevents a conclusion. |
| `not-needed-now` | No current decision justifies an unassisted attempt. No run occurred. |

### R-NUAT-COVERAGE Coverage-Pass Mechanics

- R-NUAT-COVERAGE-1 (MUST): use the common testing decision record from PRD 50.
- R-NUAT-COVERAGE-2 (MUST): record the current uncertainty, activation reason or `not-needed-now` reason, public goal, selected audience, executor qualification, scope, effort budget, stop condition, evidence, gate effect, and rerun trigger.
- R-NUAT-COVERAGE-3 (MUST): automated or conformance evidence cannot claim to be an unassisted attempt. It can answer the current uncertainty and support `not-needed-now` when the reason is explicit.
- R-NUAT-COVERAGE-4 (MUST): a new phase number alone is not a rerun trigger. Reuse valid evidence when goal, product behavior, public context, support scope, and evidence validity remain unchanged.

### R-NUAT-GATE Phase Gates and Finding Consumption

- R-NUAT-GATE-1 (MUST): the default gate effect is `advisory`.
- R-NUAT-GATE-2 (MUST): a result can be `blocking-current-work` or `blocking-claim-only` only when explicit current product or release authority says which result blocks which outcome or claim.
- R-NUAT-GATE-3 (MUST): `friction` creates feedback or remediation. It does not automatically fail a phase.
- R-NUAT-GATE-4 (MUST): `blocked` and `invalid-run` prove no human conclusion. They do not become failure or success unless current authority defines the bounded effect.
- R-NUAT-GATE-5 (MUST): `not-needed-now` is not a failed or deferred test.
- R-NUAT-GATE-6 (MUST): completing a task or obligation cannot rewrite a result or close a finding. Accepted disposition and any justified later evidence control the current conclusion.

### R-NUAT-STATE Repository and Evidence Boundary

- R-NUAT-STATE-1 (MUST): canonical scenario identity remains in the active PRD that owns the primary public outcome.
- R-NUAT-STATE-2 (MUST): approved execution packets, outcomes, findings, dispositions, and evidence metadata remain versioned project knowledge under `docs/assets/<selected-persona-slug>/testing/` when that evidence path applies.
- R-NUAT-STATE-3 (MUST): optional Global Store projection is non-authoritative and rebuildable.
- R-NUAT-STATE-4 (MUST): missing or corrupt required evidence makes the conclusion unverified. Links alone do not imply `clear`.
- R-NUAT-STATE-5 (MUST): raw capture is retained only when needed and allowed. Consent, redaction, retention, and external references remain explicit.

### R-NUAT-SCOPE-MATRIX Cross-Platform, Visual, and Accessibility Scope

- R-NUAT-SCOPE-MATRIX-1 (MUST): Unassisted Goal Testing is not GUI-dependent.
- R-NUAT-SCOPE-MATRIX-2 (MUST): a result supports only the recorded build, platform, device, runtime, locale, input, account, network, and assistive-technology scope.
- R-NUAT-SCOPE-MATRIX-3 (MUST): visual or accessibility observations are retained when they affect the goal. They do not replace specialist testing when specialist authority requires it.
- R-NUAT-SCOPE-MATRIX-4 (MUST): broader claims require risk-based evidence across materially different paths.

### R-NUAT-COMPAT Existing-Artifact Adoption

- R-NUAT-COMPAT-1 (MUST): existing projects and historical records remain readable.
- R-NUAT-COMPAT-2 (MUST): prior knowledgeable walkthroughs remain useful manual evidence. They are not relabeled unassisted without qualification, isolation, anti-coaching, goal, and reproducible-result evidence.
- R-NUAT-COMPAT-3 (MUST): existing IDs, paths, work coordinates, and archives remain stable.
- R-NUAT-COMPAT-4 (MUST): modified project-owned instructions and evidence are not overwritten automatically.

### R-NUAT-FUTURE Documentation-First and Future Automation

- R-NUAT-FUTURE-1 (MUST): the capability ships through normal contracts, references, prompts, templates, and routers. No Skill is required.
- R-NUAT-FUTURE-2 (MUST): existing typed UAT validation operations can remain as compatibility surfaces. W21 R0 does not require a new runtime operation.
- R-NUAT-FUTURE-3 (MUST NOT): automation can infer neither material human uncertainty nor tester qualification, intervention materiality, finding severity, product acceptance, support narrowing, or requirement cancellation.
- R-NUAT-FUTURE-4 (MAY): a thin optional Skill or future typed helper can assist with discovery and records. It cannot own policy or make human judgments.

### R-NUAT-HX Human Experience Intent Inputs and Separate Review

1. Accepted experience promises can shape the public goal, observation areas, and finding route.
2. Human Experience Review is a lens. It is not a separate test that must run beside Unassisted Goal Testing.
3. The lens does not weaken executor qualification, public-path, anti-coaching, evidence, or finding controls.
4. Technical completion does not erase observed friction.
5. A valid `none` Human Experience impact does not activate ceremonial unassisted testing. It requires only the boundary proof owned by PRD 49.

## Contracts and Data

Every current selection uses the PRD 50 decision record.

When a canonical scenario is needed, it records:

| Field | Requirement |
| --- | --- |
| `scenario_id` | Stable `NUAT-###` identity or an accepted future identity with a stable alias |
| `scenario_version` | Monotonic version for material changes |
| `user_goal` | Real-world outcome in intended-person language |
| `source_requirements` | Links to owning requirements and accepted experience promises |
| `target_user` | Intended audience and public assumptions |
| `current_uncertainty` | Material question the attempt can answer |
| `supported_scope` | Bounded product and environment claim |
| `starting_state` | Realistic visible state |
| `public_resources` | Allowed starting information |
| `prohibited_context` | Private sources, coaching, and shortcuts |
| `tester_prompt` | Situation and goal without hidden path |
| `operator_observations` | Evaluation areas hidden when they would coach |
| `setup` / `teardown` | Isolation, consent, capture, cleanup, and restoration |
| `effort_budget` / `stop_condition` | Bounded human and operator effort |
| `gate_effect` | PRD 50 gate value and source authority when blocking |
| `rerun_trigger` | Material change or new decision that justifies another attempt |

Every run records identity, scenario version, work coordinate, product build and environment, selected Persona when used, qualification evidence, public resources used, interventions, result, observations, findings, evidence references, cleanup state, and disposition.

## Integrations

- [PRD 50](50-proportionate-testing-and-human-centered-validation.md) owns selection, common records, human testing experience, evidence economy, and gate defaults.
- [PRD 49](49-human-experience-standard-and-intent.md) owns experience promises and the Human Experience Review lens.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) owns lifecycle selection and consumption.
- [PRD 15](15-agent-instruction-ownership-and-managed-blocks.md) owns durable routing and anti-coaching pointers.
- [PRD 06](06-template-contracts-and-generated-assets.md), [PRD 09](09-dogfood-and-maintainer-operations.md), and [PRD 10](10-packaging-validation-and-release-reference.md) own upstream-first delivery, dogfood, and installed proof.
- [PRD 22](22-project-documentation-asset-model.md), [PRD 38](38-global-store-and-project-state.md), and [PRD 47](47-persona-model.md) own evidence paths, optional projection, and Persona semantics.
- [PRD 45](45-deferred-obligation-governance.md) owns accepted future work. It does not turn `not-needed-now` into an obligation.
- [PRD 48](48-performance-evidence-governance.md) owns quantitative performance qualification triggered by a human observation.
- [PRD 43](43-conformance-scenario-model-and-execution-kits.md) and [PRD 44](44-conformance-lab-sessions-and-evidence.md) own maintainer conformance and lab evidence. Their execution is not automatically an Unassisted Goal Test.

## Rebuild Notes

Preserve the current stable file path, `R-NUAT-*` anchors, and existing `NUAT-###` records. Use Unassisted Goal Testing in current human-facing language. Do not rewrite historical documents.

Author the system workflow upstream under `packages/docs/template/`. Keep operator and tester views separate. Use public product paths. Keep existing UAT operations compatible where implemented. Do not require new runtime behavior for the W21 R0 first release.

## Acceptance Scenarios

1. A public goal with a new hidden mental model activates an unassisted attempt and records `friction` when the person cannot infer the relationship.
2. A user-visible change with strong existing evidence and no material current uncertainty records `not-needed-now` without an obligation.
3. A Guided Progress Review lets the owner enjoy a completed feature but does not count as an unassisted result.
4. Private coaching invalidates a run even when the person reaches the expected end state.
5. A broken environment records `blocked`; it does not imply product failure or acceptance.
6. A material finding routes remediation without silently failing the phase because the test is advisory.
7. Explicit release authority makes one scenario `blocking-claim-only` for a bounded public claim.
8. Valid unchanged evidence is reused across a new phase number.
9. A prior `NUAT-###` scenario remains valid after the human-facing capability name changes.
10. Technically correct instructions fail the testing-experience standard when they expose internal IDs, duplicate automation, or impose needless setup.

## Non-Requirements

- No mandatory run for every user-observable slice or phase.
- No formal acceptance by default.
- No `naive-tester` configured Persona.
- No substitution for Guided Progress Review, automation, performance, accessibility, conformance, architecture, or visual regression.
- No GUI requirement.
- No automatic obligation for `not-needed-now`.
- No bulk rename of `NUAT-###`, historical records, or the stable PRD file path.
- No mandatory Skill or new runtime command.
- No agent-only certification of lived human understanding.

## Requirement History

### 2026-08-14 — W19 R1

- Affected requirement or section: `Scope`, `Component and Capability Map`, `R-NUAT-SCOPE`, `R-NUAT-SCENARIO`, `R-NUAT-COVERAGE`, `R-NUAT-GATE`, `R-NUAT-STATE`, `R-NUAT-FUTURE`, `Contracts and Data`, `Integrations`, and `Rebuild Notes`
- Previous contract: Naive UAT was classified as non-persona, delivered through tester/facilitator Playbooks, allowed evidence to remain machine-local by default, and treated dedicated typed CLI/MCP operations as optional future support.
- Replacement contract: Every activated run resolves one eligible configured `user` or `maintainer` Persona with canonical `user` as the no-input default; tester qualification remains independent; the capability is a system workflow backed by identical typed CLI/MCP operations; any first-party Skill is explicit, optional, and thin; canonical scenarios remain PRD-owned; and Persona-specific packets, runs, findings, outcomes, and evidence live only under `docs/assets/<persona-slug>/testing/` while the Store projects non-authoritative receipts.
- Rationale: W19 R1 removes Playbook delivery without weakening installed-product, public-information, anti-coaching, scenario, evidence, finding, gate, or one-valid-run sufficiency semantics.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-28 — W20 R0

- Affected requirement or section: public goals, observations, evidence, findings, coverage, gates, valid `none`, and `R-NUAT-HX`.
- Previous contract: Naive UAT proved realistic installed-product completion and friction, but it did not name accepted experience promises as scenario inputs or preserve a separate Human Experience Review verdict.
- Replacement contract: Accepted experience promises can shape Naive-UAT goals and observations, while tester independence, anti-coaching, evidence, findings, and the separate verdict remain intact.
- Rationale: Real human execution is important evidence for direct impact, but it must not collapse all experience judgment into one test mode.
- Source: [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: title, purpose, scope, activation, modes, outcomes, gate semantics, obligations, Human Experience integration, and current acceptance scenarios.
- Previous contract: Naive UAT activated at every first safe user-observable slice, used pass/fail acceptance language, and normally behaved as a phase gate with a durable route for every valid `none`.
- Replacement contract: Unassisted Goal Testing activates only for a material current human uncertainty or explicit authority, uses diagnostic result language, is advisory by default, permits `not-needed-now` without a false obligation, and remains distinct from non-gate Guided Progress Review.
- Rationale: Human testing must reveal gaps in understanding without becoming repetitive sign-off work or forcing unstable products through ceremonial acceptance.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

## Source Anchors

- [Proportionate Testing and Human-Centered Validation design](../designs/2026-08-28-proportionate-testing-and-human-centered-validation.md)
- [W21 R0 testing plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)
- [Performance Evidence Governance](48-performance-evidence-governance.md)
- [Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md)
- [True Naive End-User Acceptance Testing design](../designs/2026-07-27-true-naive-end-user-acceptance-testing.md)
- [W18 R15 combined plan](../plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md)
