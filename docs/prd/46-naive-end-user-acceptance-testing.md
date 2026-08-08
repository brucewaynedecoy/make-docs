---
title: "46 Naive End-User Acceptance Testing"
kind: "prd"
status: "active"
coordinate: "W18 R15"
source:
  type: "plan"
  path: "docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md"
---

# 46 Naive End-User Acceptance Testing

## Purpose

Define a reusable Make Docs capability for true naive end-user acceptance testing: black-box attempts by qualified testers against installed products, using only public information a real target user would possess. The capability measures goal completion, discoverability, comprehension, interaction, accessibility observations, confusion, unexpected mental models, and recovery—not merely crashes or coded assertions.

This document is the feature authority for naive end-user UAT. Existing coverage, persona, Playbook, compatibility, template-delivery, lifecycle, and Project State PRDs remain authoritative for their own behavior and are reconciled in place to consume this capability.

## Scope

Naive UAT applies to any installed product surface where an intended external consumer can safely attempt a meaningful goal. This includes GUI and device workflows, public CLI behavior, SDK/API tasks performed from public documentation, public plugins/integrations, and documentation-driven workflows.

The capability governs:

- tester qualification and isolation;
- activation at the first genuinely user-observable slice and complete `none` routing for internal/headless work;
- non-persona testing/UAT coverage;
- separation from automated tests, owner/architecture review, visual/manual interaction, accessibility testing, and visual-regression automation;
- real-world goal scenarios, tester/operator view separation, and anti-coaching;
- scenario, run, finding, evidence, severity, reproducibility, setup, teardown, and traceability contracts;
- phase-gate and deferred-obligation consumption;
- cross-platform and non-GUI scope;
- conservative adoption of existing manual/UAT artifacts;
- documentation-first delivery before runtime automation.

It does not define market research, beta recruitment, production experimentation, conformance testing, architecture approval, or release authorization. Those activities may consume findings but cannot substitute for naive UAT.

## Component and Capability Map

| Component | Capability | Primary authority |
| --- | --- | --- |
| Tester qualification | Prove the tester lacks implementation/private context and uses only public product resources | This PRD and the future naive-UAT contract |
| Activation routing | Require UAT at the first safe user-observable boundary and preserve valid `none` triggers | This PRD and [45 Deferred Obligation Governance](45-deferred-obligation-governance.md) |
| Scenario authority | Maintain stable `NUAT-###` goal records in the PRD that owns the user outcome | This PRD and owning subsystem PRDs |
| Coverage enumeration | Keep naive UAT and other testing/review modes as separate non-persona candidates | [31 Coverage Pass Extensions](31-revise-coverage-pass-extensions-adversarial-review.md) |
| Tester/facilitator workflows | Deliver separate public tester and operator Playbooks without leaking hidden fields | [29 Playbook Contract and Run Playbook](29-revise-playbook-contract-run-playbook.md) and [34 Playbook Contract and Model](34-revise-playbook-contract-and-model.md) |
| Evidence and findings | Preserve versioned scenario/finding meaning while keeping run progress/raw evidence machine-local | [38 Global Store and Project State](38-revise-global-store-and-project-state.md) |
| Compatibility | Classify existing manual/UAT artifacts without silently grandfathering or overwriting them | [18 Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md) |

## Requirements

### R-NUAT-SCOPE Qualified Tester and Installed Product

- R-NUAT-SCOPE-1 (MUST): a naive tester has no source-code, architecture, PRD, backlog, private conversation, prior implementation-session, known-defect, hidden-answer, or successful-path knowledge for the slice under test.
- R-NUAT-SCOPE-2 (MUST): the tester may access only the installed product, ordinary environment/accounts a real user can obtain, and public user-facing instructions appropriate to the intended audience.
- R-NUAT-SCOPE-3 (MUST): an agent qualifies only when isolated in a separate context with no repository access, private memory, implementation conversation, or project-specific instructions beyond the tester packet. Self-attestation alone is insufficient; isolation controls are evidence.
- R-NUAT-SCOPE-4 (MUST): the tested product is a normally consumable release, release candidate, package, application bundle, deployment, device build, CLI, SDK, API, or equivalent user form. A source checkout or development server qualifies only when real target users consume that exact form.
- R-NUAT-SCOPE-5 (MUST): `target_user` identifies the external audience for the tested goal. It is not automatically the configured Make Docs `user` persona and never means an implementer using private knowledge.
- R-NUAT-SCOPE-6 (MUST): testing/UAT coverage remains `coverage_scope: non-persona`. Naive tester is an execution/evidence qualification, not a configured persona.

### R-NUAT-ACTIVATE User-Observable Slices and Valid `none`

- R-NUAT-ACTIVATE-1 (MUST): each stage and phase close enumerates user-observable-slice candidates, considering stage outputs individually and the assembled phase workflow.
- R-NUAT-ACTIVATE-2 (MUST): when an intended user can safely attempt a meaningful installed-product goal and the attempt can produce product signal, naive UAT activates at the earliest safe runnable boundary and no later than the phase gate.
- R-NUAT-ACTIVATE-3 (MUST): automated tests, owner confidence, architecture review, implementer testing, knowledgeable walkthroughs, or prior conformance evidence cannot justify `none` for an activated user-observable slice.
- R-NUAT-ACTIVATE-4 (MUST): `none` is valid only when the completed work cannot yet produce meaningful end-user signal. The record states the concrete reason, evidence, future observable trigger, durable owner, concrete coordinate, linked `O-###` or current register route, and the validation that still applies to the internal slice.
- R-NUAT-ACTIVATE-5 (MUST): an unresolved trigger, missing owner, unresolved target, or “test later” rationale is invalid. A later exposing phase activates the routed candidate even when it does not modify the underlying internal implementation.
- R-NUAT-ACTIVATE-6 (MUST): later work reuses or versions the same scenario for the same goal and creates another scenario only for a materially different goal, audience, platform claim, accessibility condition, or risk.

### R-NUAT-MODES Separate Test and Review Modes

Every applicable mode receives a separate candidate and verdict:

| Mode | Primary question | Does not substitute for |
| --- | --- | --- |
| Automated tests | Does deterministic behavior satisfy coded assertions? | Human comprehension, discoverability, real interaction, or naive UAT |
| Owner/architecture review | Is the design and product boundary acceptable? | Executed user behavior |
| Naive end-user UAT | Can a target user achieve the goal without private help? | Automated correctness, architecture review, specialist accessibility audit, or visual regression |
| Visual/manual interaction | Does the rendered/interactive surface behave under knowledgeable exploration? | Naive discoverability or automated visual diffing |
| Accessibility testing | Can users with relevant access needs perceive, operate, understand, and complete the workflow? | General naive UAT or visual regression |
| Visual-regression automation | Did rendering change relative to an approved baseline? | Usability, meaning, accessibility, discoverability, or goal completion |

A physical run may contribute evidence to multiple modes, but each mode retains its own sufficiency rules and verdict.

### R-NUAT-GOAL Real-World Goals and Anti-Coaching

- R-NUAT-GOAL-1 (MUST): tester instructions describe a realistic situation, goal, starting state, allowed public resources, and genuine safety constraints. They do not prescribe clicks, commands, internal objects, exact output, hidden navigation, expected answers, or the preferred route.
- R-NUAT-GOAL-2 (MUST): operator-only success criteria, risk notes, setup mechanics, known defects, and expected evidence remain outside the tester packet when disclosure would reveal the path or answer.
- R-NUAT-GOAL-3 (MUST): authors, facilitators, observers, evaluators, and agents do not leak source terms, architecture, requirement IDs, backlog coordinates, internal operation names, hidden steps, diagnostic shortcuts, or intended navigation.
- R-NUAT-GOAL-4 (MUST): ordinary public help may be identified only when a real user could have found it. Every intervention and its effect on run validity is recorded.
- R-NUAT-GOAL-5 (MUST): material assistance cannot be counted as tester success. The outcome becomes `revise` or `fail`, or the attempt is invalidated and restarted with the intervention recorded.
- R-NUAT-GOAL-6 (MUST): instructions do not compensate for product discoverability defects. Remediate the product or normal public instructions, then rerun the same user goal.
- R-NUAT-GOAL-7 (MUST): safety intervention is always permitted for harm, data loss, privacy exposure, unauthorized effects, or unexpected spending and is never hidden.

### R-NUAT-SCENARIO Scenario Identity and Artifact Contract

- R-NUAT-SCENARIO-1 (MUST): canonical scenarios use append-only project-wide `NUAT-###` identifiers in the active PRD that owns the primary external user outcome. Cross-subsystem scenarios have one owner and backlinks from contributing PRDs; work files never become a second scenario authority.
- R-NUAT-SCENARIO-2 (MUST): the same user goal keeps its ID and increments `scenario_version` for meaningful changes. Different goals receive new IDs. Results bind to exact scenario version or content digest.
- R-NUAT-SCENARIO-3 (MUST): the scenario fields in `## Contracts and Data` are complete before execution.
- R-NUAT-SCENARIO-4 (MUST): one canonical record renders an operator view and a tester packet. Any future generator or validator fails closed if operator-only content leaks into the tester packet.
- R-NUAT-SCENARIO-5 (MUST): before an active PRD exists, a design or plan may carry a provisional record, but PRD generation migrates it without losing identity.

### R-NUAT-EVIDENCE Setup, Outcomes, Findings, and Reproducibility

- R-NUAT-EVIDENCE-1 (MUST): setup uses a clean or characterized installed environment; records build, platform/device, locale, input, account, network, and assistive-technology scope; removes private/debug context; verifies tester qualification; obtains capture consent; and validates readiness without rehearsing the goal.
- R-NUAT-EVIDENCE-2 (MUST): teardown stops capture, applies consent/retention/redaction, exports approved portable evidence when requested, removes disposable accounts/data, restores shared environments, and records incomplete cleanup.
- R-NUAT-EVIDENCE-3 (MUST): every run records the fields in `## Contracts and Data` and one outcome: `pass`, `fail`, `revise`, or `blocked`.
- R-NUAT-EVIDENCE-4 (MUST): evidence includes completion outcome and, where appropriate, screenshots, recordings, ordered interaction evidence, confusion, hesitation, discoverability failures, unexpected mental models, alternative paths, help requests, recovery, and accessibility observations. Crash-free or assertion-success evidence does not erase user-experience failure.
- R-NUAT-EVIDENCE-5 (MUST): findings record observed behavior, expected user outcome, severity, reproducibility, support scope, evidence, source requirement, owner, and disposition.
- R-NUAT-EVIDENCE-6 (MUST): the shared minimum is one valid independent naive run per claimed support-scope cell. Project PRD severity/risk rules may require more. Additional successful runs never override an unresolved critical or major finding.

### R-NUAT-COVERAGE Coverage-Pass Mechanics

- R-NUAT-COVERAGE-1 (MUST): the existing verdict spine remains: `create`, `update-existing`, `link-only`, and `none`.
- R-NUAT-COVERAGE-2 (MUST): each candidate records ID, delivered behavior, user-observable classification, target user/goal, mode, verdict/reason, scenario reference, complete `none` route when applicable, execution status, and finding/disposition links.
- R-NUAT-COVERAGE-3 (MUST): enumeration includes changed public instructions, installation paths, defaults, errors, terminology, output rendering, accessibility behavior, and workflows assembled from earlier internal phases.
- R-NUAT-COVERAGE-4 (MUST): one automated-test or conformance row cannot stand in for naive UAT. The testing/UAT pass remains non-persona even when resulting guides or Playbooks are persona-targeted.
- R-NUAT-COVERAGE-5 (MUST): history idempotency remains unchanged. Durable deltas are summarized once; run progress/evidence remains Project State.

### R-NUAT-GATE Phase Gates and Finding Consumption

- R-NUAT-GATE-1 (MUST): `pass` satisfies naive UAT only for the executed scenario version and support scope.
- R-NUAT-GATE-2 (MUST): `revise` or `fail` leaves acceptance unsatisfied. The phase reopens for remediation or product authority defers, narrows, cancels, or supersedes the affected outcome with full PRD and `O-###` routing.
- R-NUAT-GATE-3 (MUST): `blocked` proves only that a valid attempt did not occur. It cannot become `none` after the slice is observable.
- R-NUAT-GATE-4 (MUST): a valid `none` satisfies only the current internal/headless classification and never fulfills its future trigger.
- R-NUAT-GATE-5 (MUST): no phase claims `Capability complete` while an activated scenario is failed, revised, blocked, unrun, or bound to unresolved findings.
- R-NUAT-GATE-6 (MUST): findings link scenario, requirement, PRD disposition, implementation work, obligation when deferred, history breadcrumb, remediation evidence, and later rerun. Completing a task alone does not close a finding.

### R-NUAT-STATE Repository and Evidence Boundary

- R-NUAT-STATE-1 (MUST): goal, scenario identity/version, target user, trigger, requirements, supported scope, public-resource policy, success outcomes, severity rules, findings, disposition, and obligation links are versioned repository knowledge.
- R-NUAT-STATE-2 (MUST): run progress, tester qualification, timestamps, interventions, observations, completion data, review decisions, sign-offs, and raw evidence references are unified Project State in the machine-level Global Store.
- R-NUAT-STATE-3 (MUST): screenshots, recordings, and transcripts are machine-local by default or part of an explicitly exported, consent-aware, redacted portable bundle. Exact physical layout, retention, size, and encryption remain downstream decisions.
- R-NUAT-STATE-4 (MUST): current validation/review/closeout/notes evidence seams are sufficient for the documentation-first round; no new store schema is required.
- R-NUAT-STATE-5 (MUST): missing/corrupt evidence makes the affected acceptance outcome unverified. Repository links alone never imply a pass.
- R-NUAT-STATE-6 (MUST): database projections are rebuildable and non-authoritative.

### R-NUAT-SCOPE-MATRIX Cross-Platform, Visual, and Accessibility Scope

- R-NUAT-SCOPE-MATRIX-1 (MUST): naive UAT is not GUI-dependent. Public CLI, SDK, API, device, and documentation-driven workflows qualify; internal headless modules without a user goal may use complete `none`.
- R-NUAT-SCOPE-MATRIX-2 (MUST): a pass supports only the recorded product/build, platform, device, runtime, locale, input, account/network, and assistive-technology scope. Broader claims require risk-based coverage across materially different paths.
- R-NUAT-SCOPE-MATRIX-3 (MUST): visual evidence is required when appearance, spatial organization, feedback, focus, motion, or visual output materially affects the goal. `not-applicable` requires a reason for non-visual workflows.
- R-NUAT-SCOPE-MATRIX-4 (MUST): accessibility remains a separate mode with a product-surface-appropriate `accessibility_basis`; no web-only standard is imposed on CLI, device, SDK, API, or non-visual products.
- R-NUAT-SCOPE-MATRIX-5 (MUST): accessibility barriers observed during naive UAT are findings even when a specialist accessibility pass remains pending.

### R-NUAT-COMPAT Existing-Artifact Adoption

- R-NUAT-COMPAT-1 (MUST): existing projects remain readable and adopt the capability prospectively at the first qualifying user-observable change.
- R-NUAT-COMPAT-2 (MUST): the first qualifying pass inventories active manual tests, UAT, walkthroughs, smoke checks, acceptance scripts, and historical no-UAT decisions; classifies their actual mode/evidence; creates or links active `NUAT-###` scenarios; and reroutes current `none` decisions under R-NUAT-ACTIVATE.
- R-NUAT-COMPAT-3 (MUST): a human walkthrough is not grandfathered as naive without evidence of tester qualification, anti-coaching, installed-product scope, a goal-oriented prompt, and reproducible outcome.
- R-NUAT-COMPAT-4 (MUST): historical paths, IDs, work coordinates, and archives remain stable. Old IDs may be human-readable aliases but do not become a second canonical namespace.
- R-NUAT-COMPAT-5 (MUST): modified project-owned instructions and artifacts are never overwritten automatically. No immediate Global Store migration is required.

### R-NUAT-FUTURE Documentation-First and Future Automation

- R-NUAT-FUTURE-1 (MUST): the capability works through repository authority, Playbooks, coverage decisions, and human review before dedicated runtime support exists.
- R-NUAT-FUTURE-2 (MAY): future validators may check IDs, versions, fields, links, activation coverage, complete `none` routing, tester-packet isolation, evidence/disposition, phase-gate claims, and repository/runtime-state boundaries.
- R-NUAT-FUTURE-3 (MAY): future CLI/MCP surfaces may inventory candidates, render packets, start/resume facilitator workflows, record evidence, export/import portable bundles, or build query projections through current operation-core and Project State safety rules.
- R-NUAT-FUTURE-4 (MUST NOT): automation may not infer observability, certify naivety, decide intervention materiality, assign product severity, interpret confusion, accept a goal, narrow support scope, cancel a requirement, or resolve an obligation.

## Contracts and Data

Every canonical scenario records:

| Field | Requirement |
| --- | --- |
| `scenario_id` | Stable `NUAT-###` identifier |
| `scenario_version` | Monotonic version for meaningful changes |
| `title` | Short product-language title |
| `user_goal` | Real-world outcome in target-user language |
| `source_requirements` | Links/anchors to owning requirements and decisions |
| `target_user` | External audience and public experience assumptions |
| `activation_coordinate` | First safe user-observable stage or phase |
| `future_trigger` | `active` or complete future trigger for dormant/`none` routing |
| `obligation_ref` | Linked `O-###` when future work remains owed, otherwise explicit `none` |
| `supported_scope` | Product, platform/device, locale, input, accessibility, account, and network claims |
| `installed_build_identity` | Reproducible version/package/build/deployment/digest rule |
| `starting_state` | Realistic visible account/content/permissions/environment |
| `public_resources` | Exact user-facing resources allowed |
| `prohibited_context` | Private sources, assists, and shortcuts |
| `tester_prompt` | Tester-visible situation and goal without hidden steps |
| `operator_success_outcomes` | Observable evaluation conditions, hidden from tester when coaching |
| `setup` / `teardown` | Isolation, consent, capture, cleanup, privacy, and restoration |
| `evidence_requirements` | Interaction, visual, accessibility, completion, and reproducibility evidence |
| `severity_rules` | `base-scale` or project-specific escalation |
| `timebox` | Optional observation window; expiration never silently means success |
| `finding_route` | Owning PRD, work, and phase-gate route |

Every run records:

| Field | Requirement |
| --- | --- |
| `run_id` | Unique run identity |
| `scenario_ref` | Scenario ID, version, and source digest |
| `work_coordinate` | Stage or phase evaluated |
| `product_build` / `environment` | Exact build and tested support scope |
| `tester_qualification` | Attestation plus isolation/context-control evidence |
| `public_resources_used` | Help actually consulted |
| `interventions` | Every facilitator, safety, environment, or coaching-like intervention |
| `outcome` | `pass`, `fail`, `revise`, or `blocked` |
| `completion` | Goal status, terminal state, attempts, and useful timing |
| `observations` | Confusion, hesitation, mental models, alternative paths, help, recovery, and ease |
| `interaction_evidence` / `visual_evidence` / `accessibility_evidence` | Applicable evidence or reasoned `not-applicable` |
| `finding_ids` | Stable findings |
| `reproduction` | Conditions and concise reproducibility information |
| `evidence_refs` | Evidence location plus consent/redaction/retention metadata |
| `review` | Reviewer, decision, disposition, and gate consumption |

Outcome meanings are:

| Outcome | Meaning |
| --- | --- |
| `pass` | Goal completed without prohibited help, material confusion/barrier, or unresolved finding that violates acceptance |
| `fail` | Goal not completed, product unsafe/incorrect, private coaching required, or material accessibility barrier prevented completion |
| `revise` | Goal completed but discoverability, comprehension, terminology, mental model, recovery, or public instructions require revision |
| `blocked` | Environment, consent, account, platform, dependency, or setup prevented a valid product attempt |

Severity uses `critical`, `major`, `moderate`, and `minor`, with the meanings fixed by [the design](../designs/2026-07-27-true-naive-end-user-acceptance-testing.md#d6-define-setup-evidence-outcomes-severity-and-reproducibility).

## Integrations

- [14 Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md) owns activation at gates and phase/capability status.
- [15 Agent Instruction File Ownership](15-revise-agent-instruction-file-ownership.md) owns durable anti-coaching and routing instructions in managed blocks.
- [18 Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md) owns legacy artifact classification and modified-content protection.
- [19 Template Package Dogfood Source of Truth](19-revise-template-package-dogfood-source-of-truth-contract.md) owns upstream-first delivery.
- [22 Docs Assets, Playbooks, and Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md) preserves non-persona testing coverage while tester/facilitator reader assets use configured personas.
- [29 Playbook Contract and Run Playbook](29-revise-playbook-contract-run-playbook.md) and [34 Playbook Contract and Model](34-revise-playbook-contract-and-model.md) own separate tester/facilitator workflow documents.
- [31 Coverage Pass Extensions](31-revise-coverage-pass-extensions-adversarial-review.md) owns candidate enumeration and verdict mechanics.
- [38 Global Store and Project State](38-revise-global-store-and-project-state.md) owns operational evidence storage.
- [45 Deferred Obligation Governance](45-deferred-obligation-governance.md) owns routed future work and anti-orphan completion.
- [43 Conformance Scenario Model](43-revise-conformance-scenario-model-and-execution-kit.md) and [44 Conformance Lab Execution Protocol](44-revise-conformance-lab-execution-protocol-and-evidence-homes.md) remain separate maintainer conformance authorities and never count as naive UAT merely because an agent or human executed them.

## Rebuild Notes

The documentation-first resource set is authored upstream under `packages/docs/template/` before dogfood projection:

- future `.make-docs/contracts/system/naive-uat-contract.md`;
- future `.make-docs/templates/system/naive-uat-scenario.md`;
- the existing testing/UAT coverage starter;
- future `docs/assets/playbooks/user/naive-uat-tester.playbook.md`;
- future `docs/assets/playbooks/agent/naive-uat-facilitator.playbook.md`;
- lifecycle and phase-gate guidance that consumes results and complete `none` records.

The tester and facilitator Playbooks remain separate so operator-only setup and evaluation data cannot coach the tester. This PRD reconciliation does not implement those resources, change Global Store, add migrations, create runtime operations, or modify external consumer repositories.

## Acceptance Scenarios

1. **Headless-to-observable activation:** an internal Core phase records a complete `none` route; the first installed shell/user workflow fires the trigger and requires a real-world naive scenario even if it only wires prior internal behavior.
2. **Discoverability failure without crash:** the tester technically completes the goal only after substantial confusion or hidden help; the run records `revise`, preserves interaction/visual observations, and routes remediation rather than calling the product accepted.
3. **Blocked environment:** account or platform setup prevents a valid attempt; the result remains `blocked`, the gate remains open, and the phase does not convert the result into `none`.
4. **Cross-platform claim:** one supported platform passes but another materially different interaction path is untested; acceptance remains bounded to the recorded scope.
5. **Accessibility observation:** a naive run exposes an accessibility barrier; the finding routes immediately while the separate accessibility mode remains independently required.
6. **Legacy walkthrough classification:** a prior knowledgeable manual walkthrough remains useful manual evidence but is not relabeled naive without qualification and anti-coaching proof.
7. **Evidence loss:** repository scenario/finding meaning survives, but a missing machine-local recording/sign-off makes the outcome unverified until restored or rerun.
8. **Ursa illustration:** a headless Ursa Core phase may validly record `none`; the first usable shell activates a goal such as creating, closing, relaunching, and finding a note using only public instructions. Ursa illustrates the generic rule and does not define it.

## Non-Requirements

- No `naive-tester` configured persona.
- No detailed implementation-shaped test scripts.
- No naive UAT requirement for internal work that cannot produce user signal, provided `none` is complete and routed.
- No substitution by automated tests, architecture review, conformance, visual/manual testing, accessibility testing, or image diffs.
- No GUI requirement.
- No mandatory repository storage for raw recordings or screenshots.
- No dedicated CLI, MCP tool, validator, Global Store schema, evidence kind, or migration in the PRD-only reconciliation.
- No automated product judgment, tester certification, finding severity, support narrowing, or requirement cancellation.

## Source Anchors

- [True Naive End-User Acceptance Testing design](../designs/2026-07-27-true-naive-end-user-acceptance-testing.md)
- [Deferred Obligations and Anti-Orphan Governance design](../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md)
- [W18 R15 combined plan](../plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md)
- [W18 R15 P1 reconciliation history](../assets/archive/history/2026-07-30-w18-r15-p1-prd-reconciliation.md)
- [14 Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [18 Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [22 Docs Assets, Playbooks, and Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [29 Playbook Contract and Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [31 Coverage Pass Extensions](31-revise-coverage-pass-extensions-adversarial-review.md)
- [34 Playbook Contract and Model](34-revise-playbook-contract-and-model.md)
- [38 Global Store and Project State](38-revise-global-store-and-project-state.md)
- [43 Conformance Scenario Model](43-revise-conformance-scenario-model-and-execution-kit.md)
- [44 Conformance Lab Execution Protocol](44-revise-conformance-lab-execution-protocol-and-evidence-homes.md)
- [45 Deferred Obligation Governance](45-deferred-obligation-governance.md)
- [Coverage pass contract](../../.make-docs/contracts/system/coverage-pass-contract.md)
- [Execution workflow](../../.make-docs/references/system/execution-workflow.md)
