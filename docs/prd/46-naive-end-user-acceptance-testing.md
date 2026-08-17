---
title: "46 Naive End-User Acceptance Testing"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md"
---

# 46 Naive End-User Acceptance Testing

## Purpose

Define a reusable Make Docs capability for true naive end-user acceptance testing: black-box attempts by qualified testers against installed products, using only public information a real target user would possess. The capability measures goal completion, discoverability, comprehension, interaction, accessibility observations, confusion, unexpected mental models, and recovery—not merely crashes or coded assertions.

This document is the feature authority for naive end-user UAT. The coverage, Persona, system-resource, runtime-operation, compatibility, template-delivery, lifecycle, and Project State PRDs own their respective integration behavior and consume the naive-UAT contract defined here.

## Scope

Naive UAT applies to any installed product surface where an intended external consumer can safely attempt a meaningful goal. This includes GUI and device workflows, public CLI behavior, SDK/API tasks performed from public documentation, public plugins/integrations, and documentation-driven workflows.

The capability governs:

- tester qualification and isolation;
- activation at the first genuinely user-observable slice and complete `none` routing for internal/headless work;
- one configured eligible Persona for every activated execution, with canonical `user` as the no-input default;
- tester qualification and isolation that remain separate from selected Persona identity;
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
| Coverage enumeration | Keep naive UAT distinct from other testing/review candidates while requiring an eligible Persona for activated execution | [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md) and [47 Persona Model](47-persona-model.md) |
| Tester/facilitator workflow | Compose governing contracts, prompts, references, and templates into a system workflow backed by the same typed operations on every access path | This PRD and [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md) |
| Evidence and findings | Keep Persona-specific evidence under `docs/assets/<persona-slug>/testing/` while the Store projects only non-authoritative typed receipts | This PRD, [22 Project Documentation Asset Model](22-project-documentation-asset-model.md), [38 Global Store and Project State](38-global-store-and-project-state.md), and [47 Persona Model](47-persona-model.md) |
| Compatibility | Classify existing manual/UAT artifacts without silently grandfathering or overwriting them | [18 Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md) |

## Requirements

### R-NUAT-SCOPE Qualified Tester and Installed Product

- R-NUAT-SCOPE-1 (MUST): a naive tester has no source-code, architecture, PRD, backlog, private conversation, prior implementation-session, known-defect, hidden-answer, or successful-path knowledge for the slice under test.
- R-NUAT-SCOPE-2 (MUST): the tester may access only the installed product, ordinary environment/accounts a real user can obtain, and public user-facing instructions appropriate to the intended audience.
- R-NUAT-SCOPE-3 (MUST): an agent qualifies only when isolated in a separate context with no repository access, private memory, implementation conversation, or project-specific instructions beyond the tester packet. Self-attestation alone is insufficient; isolation controls are evidence.
- R-NUAT-SCOPE-4 (MUST): the tested product is a normally consumable release, release candidate, package, application bundle, deployment, device build, CLI, SDK, API, or equivalent user form. A source checkout or development server qualifies only when real target users consume that exact form.
- R-NUAT-SCOPE-5 (MUST): `target_user` identifies the external audience and public-experience assumptions for the tested goal. It is distinct from the selected configured Persona slug and never authorizes an implementer to use private knowledge.
- R-NUAT-SCOPE-6 (MUST): every activated execution records exactly one configured Persona whose primitive is `user` or `maintainer`. An explicitly supplied ineligible or unknown Persona fails closed; when no Persona is supplied, resolution uses the canonical `user` Persona.
- R-NUAT-SCOPE-7 (MUST): selected Persona identity controls audience framing and evidence routing, not tester qualification. The tester must independently satisfy R-NUAT-SCOPE-1 through R-NUAT-SCOPE-4, and a `maintainer` selection never weakens installed-product, public-information, isolation, or anti-coaching rules.

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
| Performance evidence | Does a qualified `PERF-###` profile produce comparable evidence for its exact target and support scope? | Naive goal completion, discoverability, comprehension, anti-coaching, or UAT acceptance |
| Owner/architecture review | Is the design and product boundary acceptable? | Executed user behavior |
| Naive end-user UAT | Can a target user achieve the goal without private help? | Automated correctness, architecture review, specialist accessibility audit, or visual regression |
| Visual/manual interaction | Does the rendered/interactive surface behave under knowledgeable exploration? | Naive discoverability or automated visual diffing |
| Accessibility testing | Can users with relevant access needs perceive, operate, understand, and complete the workflow? | General naive UAT or visual regression |
| Visual-regression automation | Did rendering change relative to an approved baseline? | Usability, meaning, accessibility, discoverability, or goal completion |

A physical run may contribute evidence to multiple modes, but each mode retains its own authority, required fields, sufficiency rules, and verdict. Performance remains a separate non-persona mode under [48 Performance Evidence Governance](48-performance-evidence-governance.md); Persona-scoped naive UAT and its tester qualification and anti-coaching rules remain independently required when UAT is activated.

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
- R-NUAT-SCENARIO-4 (MUST): one canonical record renders an operator view and a Persona-specific tester packet bound to the selected Persona slug. Any generator or validator fails closed if operator-only content leaks into the tester packet.
- R-NUAT-SCENARIO-5 (MUST): before an active PRD exists, a design or plan may carry a provisional record, but PRD generation migrates it without losing identity.

### R-NUAT-EVIDENCE Setup, Outcomes, Findings, and Reproducibility

- R-NUAT-EVIDENCE-1 (MUST): setup uses a clean or characterized installed environment; records build, platform/device, locale, input, account, network, and assistive-technology scope; removes private/debug context; verifies tester qualification; obtains capture consent; and validates readiness without rehearsing the goal.
- R-NUAT-EVIDENCE-2 (MUST): teardown stops capture, applies consent/retention/redaction, exports approved portable evidence when requested, removes disposable accounts/data, restores shared environments, and records incomplete cleanup.
- R-NUAT-EVIDENCE-3 (MUST): every run records the fields in `## Contracts and Data` and one outcome: `pass`, `fail`, `revise`, or `blocked`.
- R-NUAT-EVIDENCE-4 (MUST): evidence includes completion outcome and, where appropriate, screenshots, recordings, ordered interaction evidence, confusion, hesitation, discoverability failures, unexpected mental models, alternative paths, help requests, recovery, and accessibility observations. Crash-free or assertion-success evidence does not erase user-experience failure.
- R-NUAT-EVIDENCE-5 (MUST): findings record observed behavior, expected user outcome, severity, reproducibility, support scope, evidence, source requirement, owner, and disposition.
- R-NUAT-EVIDENCE-6 (MUST): the shared minimum is one valid independent naive run per claimed support-scope cell. Project PRD severity/risk rules may require more. Additional successful runs never override an unresolved critical or major finding.
- R-NUAT-EVIDENCE-7 (MUST): perceived slowness, hesitation, or responsiveness friction remains a naive-UAT observation or finding. It may trigger performance qualification under PRD 48, but neither the observation nor a naive-UAT outcome certifies a `PERF-###` target, and a performance outcome cannot erase or rewrite the UAT finding or verdict.

### R-NUAT-COVERAGE Coverage-Pass Mechanics

- R-NUAT-COVERAGE-1 (MUST): the existing verdict spine remains: `create`, `update-existing`, `link-only`, and `none`.
- R-NUAT-COVERAGE-2 (MUST): each candidate records ID, delivered behavior, user-observable classification, target user/goal, mode, verdict/reason, scenario reference, selected or defaulted Persona slug when activated, complete `none` route when applicable, execution status, and finding/disposition links.
- R-NUAT-COVERAGE-3 (MUST): enumeration includes changed public instructions, installation paths, defaults, errors, terminology, output rendering, accessibility behavior, and workflows assembled from earlier internal phases.
- R-NUAT-COVERAGE-4 (MUST): one automated-test or conformance row cannot stand in for naive UAT. Naive UAT remains a distinct testing/UAT candidate, but every activated execution uses one eligible configured Persona; Persona selection does not create a second coverage authority or substitute for tester qualification.
- R-NUAT-COVERAGE-5 (MUST): history idempotency remains unchanged. Durable deltas are summarized once; run progress/evidence remains Project State.

### R-NUAT-GATE Phase Gates and Finding Consumption

- R-NUAT-GATE-1 (MUST): `pass` satisfies naive UAT only for the executed scenario version and support scope.
- R-NUAT-GATE-2 (MUST): `revise` or `fail` leaves acceptance unsatisfied. The phase reopens for remediation or product authority defers, narrows, cancels, or supersedes the affected outcome with full PRD and `O-###` routing.
- R-NUAT-GATE-3 (MUST): `blocked` proves only that a valid attempt did not occur. It cannot become `none` after the slice is observable.
- R-NUAT-GATE-4 (MUST): a valid `none` satisfies only the current internal/headless classification and never fulfills its future trigger.
- R-NUAT-GATE-5 (MUST): no phase claims `Capability complete` while an activated scenario is failed, revised, blocked, unrun, or bound to unresolved findings.
- R-NUAT-GATE-6 (MUST): findings link scenario, requirement, PRD disposition, implementation work, obligation when deferred, history breadcrumb, remediation evidence, and later rerun. Completing a task alone does not close a finding.
- R-NUAT-GATE-7 (MUST): an `O-###` route preserves later owed work but cannot change a run outcome, close a finding, or satisfy a gate. Only the authoritative finding disposition and any required valid rerun can change acceptance status.
- R-NUAT-GATE-8 (MUST): a performance profile, result, waiver, or gate remains separate from naive-UAT acceptance. A performance pass does not satisfy an activated UAT scenario; a UAT pass does not certify performance; and a perceived-slowness finding remains qualification input until each applicable authority records its own disposition and verdict.

### R-NUAT-STATE Repository and Evidence Boundary

- R-NUAT-STATE-1 (MUST): canonical `NUAT-###` goal and scenario identity/version remain in the active PRD owning the primary external outcome. Persona-specific rendered packets, executions, outcomes, findings, dispositions, evidence metadata, and approved evidence are versioned project knowledge under `docs/assets/<persona-slug>/testing/`, bound to the exact scenario version or content digest.
- R-NUAT-STATE-2 (MUST): the selected Persona slug determines `<persona-slug>`. The testing directory is an execution/evidence home, never a second canonical scenario authority.
- R-NUAT-STATE-3 (MUST): the Global Store may record or project only non-authoritative typed run/evidence receipts with project-relative or sanitized references. It does not own tester packets, outcomes, findings, evidence payloads, dispositions, or gate truth, and Store loss cannot erase versioned project evidence.
- R-NUAT-STATE-4 (MUST): naive-UAT evidence never lives under `.make-docs/archive/` or `docs/artifacts/`. Consent, redaction, retention, and external-capture references are recorded from the selected Persona testing directory.
- R-NUAT-STATE-5 (MUST): missing/corrupt evidence makes the affected acceptance outcome unverified. Repository links alone never imply a pass.
- R-NUAT-STATE-6 (MUST): database projections are rebuildable and non-authoritative.
- R-NUAT-STATE-7 (MUST): migration moves evidence only when Persona mapping and ownership are proven. Ambiguous legacy material remains in its historical location with a typed migration finding, is not recognized as current naive-UAT evidence, and cannot satisfy an acceptance gate until reconciled into the selected Persona testing directory.

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

- R-NUAT-FUTURE-1 (MUST): the capability is exposed as a system workflow composed from governing contracts, prompts, references, and applicable templates. Those resources own qualification, facilitator framing, scenario structure, activation, routing, evidence, and gate policy; no access adapter contains a hidden policy copy.
- R-NUAT-FUTURE-2 (MAY): future validators may check IDs, versions, fields, links, activation coverage, complete `none` routing, tester-packet isolation, evidence/disposition, phase-gate claims, and repository/runtime-state boundaries.
- R-NUAT-FUTURE-3 (MUST): the TypeScript operation registry owns `uat.scenario.validate`, `uat.persona.resolve`, `uat.target.validate`, `uat.evidence-reference.validate`, `uat.finding.validate`, and `uat.result.validate`. Their CLI paths are `make-docs run uat scenario validate`, `make-docs run uat persona resolve`, `make-docs run uat target validate`, `make-docs run uat evidence-reference validate`, `make-docs run uat finding validate`, and `make-docs run uat result validate`. P3 registers them as pending with `pendingLineage: W19 R1 P7`. P7 activates their handlers. Each operation projects to an MCP tool.
- R-NUAT-FUTURE-6 (MUST): UAT execution reuses the lifecycle operation identifiers owned by PRD 38. It does not define a second UAT lifecycle operation set.
- R-NUAT-FUTURE-4 (MUST NOT): automation may not infer observability, certify naivety, decide intervention materiality, assign product severity, interpret confusion, accept a goal, narrow support scope, cancel a requirement, or resolve an obligation.
- R-NUAT-FUTURE-5 (MAY): an explicitly selected first-party Naive-UAT Skill may provide concise discovery, argument adaptation, receipt formatting, and thin shims for harnesses that cannot issue shell commands or use MCP. Every shim delegates to the same typed CLI operations; the Skill contains no qualification, anti-coaching, scenario, evidence, state-machine, finding, gate, or other business logic and is never required for core correctness.

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
| `selected_persona` | Actual configured `user`- or `maintainer`-primitive Persona slug; canonical `user` when defaulted |
| `tester_qualification` | Attestation plus isolation/context-control evidence |
| `public_resources_used` | Help actually consulted |
| `interventions` | Every facilitator, safety, environment, or coaching-like intervention |
| `outcome` | `pass`, `fail`, `revise`, or `blocked` |
| `completion` | Goal status, terminal state, attempts, and useful timing |
| `observations` | Confusion, hesitation, mental models, alternative paths, help, recovery, and ease |
| `interaction_evidence` / `visual_evidence` / `accessibility_evidence` | Applicable evidence or reasoned `not-applicable` |
| `finding_ids` | Stable findings |
| `reproduction` | Conditions and concise reproducibility information |
| `evidence_refs` | References rooted at `docs/assets/<selected-persona-slug>/testing/` plus consent/redaction/retention metadata |
| `review` | Reviewer, decision, disposition, and gate consumption |

Outcome meanings are:

| Outcome | Meaning |
| --- | --- |
| `pass` | Goal completed without prohibited help, material confusion/barrier, or unresolved finding that violates acceptance |
| `fail` | Goal not completed, product unsafe/incorrect, private coaching required, or material accessibility barrier prevented completion |
| `revise` | Goal completed but discoverability, comprehension, terminology, mental model, recovery, or public instructions require revision |
| `blocked` | Environment, consent, account, platform, dependency, or setup prevented a valid product attempt |

Severity meanings are:

| Severity | Meaning |
| --- | --- |
| `critical` | The workflow creates a credible safety, security, privacy, irreversible-data, unauthorized-external-effect, or severe accessibility risk. |
| `major` | The intended goal is impossible for the tested scope, requires private coaching or an undocumented workaround, or excludes a required supported user. |
| `moderate` | The tester eventually completes the goal but experiences substantial confusion, repeated failure, a misleading mental model, or fragile recovery. |
| `minor` | The issue creates bounded friction or presentation debt without threatening completion or comprehension of the core goal. |

## Integrations

- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md) owns activation at gates, phase/capability status, candidate enumeration, and verdict mechanics while treating activated UAT as Persona-executed.
- [15 Agent Instruction Ownership and Managed Blocks](15-agent-instruction-ownership-and-managed-blocks.md) owns durable anti-coaching and routing instructions in managed blocks.
- [18 Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md) owns legacy artifact classification and modified-content protection.
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md), [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md), and [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md) jointly own upstream-first delivery through reviewed dogfood projection and installed-package proof.
- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md) owns `docs/assets/<persona-slug>/testing/` as the project evidence namespace, while [47 Persona Model](47-persona-model.md) owns eligible Persona resolution, canonical `user` defaulting, and the selected-slug path contract.
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md) owns deterministic operation-core and CLI/MCP parity; system workflow resources and any optional Skill adapter delegate to those operations.
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md) owns explicit optional selection and distribution of a thin first-party Naive-UAT Skill with no duplicated UAT policy or business logic.
- [38 Global Store and Project State](38-global-store-and-project-state.md) owns typed, non-authoritative receipt projection and never replaces Persona testing assets or gate truth.
- [45 Deferred Obligation Governance](45-deferred-obligation-governance.md) owns routed future work and anti-orphan completion.
- [43 Conformance Scenario Model and Execution Kits](43-conformance-scenario-model-and-execution-kits.md) and [44 Conformance Lab Sessions and Evidence](44-conformance-lab-sessions-and-evidence.md) remain separate maintainer conformance authorities and never count as naive UAT merely because an agent or human executed them.

## Rebuild Notes

The reusable system-workflow resource set is authored upstream under `packages/docs/template/` before dogfood projection:

- future `.make-docs/contracts/system/naive-uat-contract.md`;
- future `.make-docs/prompts/system/naive-uat-tester.md` and facilitator framing;
- future `.make-docs/references/system/naive-uat.md`;
- future `.make-docs/templates/system/naive-uat-scenario.md`;
- the existing testing/UAT coverage starter;
- lifecycle and phase-gate guidance that consumes results and complete `none` records.

The operator view and Persona-specific tester packet remain separate renderings of one canonical `NUAT-###` scenario so operator-only setup and evaluation data cannot coach the tester. The same typed registry operations back direct CLI, native MCP, system-workflow, and optional Skill-assisted access. The first-party Skill, when explicitly selected, contains only thin CLI-delegating shims and no policy or business logic.

## Acceptance Scenarios

1. **Headless-to-observable activation:** an internal Core phase records a complete `none` route; the first installed shell/user workflow fires the trigger and requires a real-world naive scenario even if it only wires prior internal behavior.
2. **Discoverability failure without crash:** the tester technically completes the goal only after substantial confusion or hidden help; the run records `revise`, preserves interaction/visual observations, and routes remediation rather than calling the product accepted.
3. **Blocked environment:** account or platform setup prevents a valid attempt; the result remains `blocked`, the gate remains open, and the phase does not convert the result into `none`.
4. **Cross-platform claim:** one supported platform passes but another materially different interaction path is untested; acceptance remains bounded to the recorded scope.
5. **Accessibility observation:** a naive run exposes an accessibility barrier; the finding routes immediately while the separate accessibility mode remains independently required.
6. **Legacy walkthrough classification:** a prior knowledgeable manual walkthrough remains useful manual evidence but is not relabeled naive without qualification and anti-coaching proof.
7. **Evidence loss:** repository scenario/finding meaning survives, but a missing machine-local recording/sign-off makes the outcome unverified until restored or rerun.
8. **Ursa illustration:** a headless Ursa Core phase may validly record `none`; the first usable shell activates a goal such as creating, closing, relaunching, and finding a note using only public instructions. Ursa illustrates the generic rule and does not define it.
9. **Persona default and isolation:** an activated run with no supplied Persona resolves canonical `user`; an explicit eligible `maintainer` Persona routes evidence to that slug without granting the qualified tester private implementation context.
10. **Evidence and access-path parity:** direct CLI, native MCP, system-workflow, and explicitly selected Skill-assisted runs resolve the same Persona and typed operations, bind evidence under that Persona slug’s testing directory, and produce the same gate semantics.

## Non-Requirements

- No `naive-tester` configured persona.
- No detailed implementation-shaped test scripts.
- No naive UAT requirement for internal work that cannot produce user signal, provided `none` is complete and routed.
- No substitution by automated tests, architecture review, conformance, visual/manual testing, accessibility testing, or image diffs.
- No GUI requirement.
- No requirement to commit unredacted raw recordings or screenshots; consent-aware evidence records and any external-capture references remain rooted in the selected Persona testing directory.
- No Playbook-shaped tester or facilitator document kind.
- No dedicated alternative state machine, policy implementation, or evidence authority in a Skill, MCP adapter, CLI renderer, or Global Store projection.
- No requirement to install or expose the optional first-party Skill for core workflow correctness.
- No automated product judgment, tester certification, finding severity, support narrowing, or requirement cancellation.

## Requirement History

### 2026-08-14 — W19 R1

- Affected requirement or section: `Scope`, `Component and Capability Map`, `R-NUAT-SCOPE`, `R-NUAT-SCENARIO`, `R-NUAT-COVERAGE`, `R-NUAT-GATE`, `R-NUAT-STATE`, `R-NUAT-FUTURE`, `Contracts and Data`, `Integrations`, and `Rebuild Notes`
- Previous contract: Naive UAT was classified as non-persona, delivered through tester/facilitator Playbooks, allowed evidence to remain machine-local by default, and treated dedicated typed CLI/MCP operations as optional future support.
- Replacement contract: Every activated run resolves one eligible configured `user` or `maintainer` Persona with canonical `user` as the no-input default; tester qualification remains independent; the capability is a system workflow backed by identical typed CLI/MCP operations; any first-party Skill is explicit, optional, and thin; canonical scenarios remain PRD-owned; and Persona-specific packets, runs, findings, outcomes, and evidence live only under `docs/assets/<persona-slug>/testing/` while the Store projects non-authoritative receipts.
- Rationale: W19 R1 removes Playbook delivery without weakening installed-product, public-information, anti-coaching, scenario, evidence, finding, gate, or one-valid-run sufficiency semantics.
- Source: [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 performance evidence plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [48 Performance Evidence Governance](48-performance-evidence-governance.md)
- [True Naive End-User Acceptance Testing design](../designs/2026-07-27-true-naive-end-user-acceptance-testing.md)
- [Deferred Obligations and Anti-Orphan Governance design](../designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md)
- [W18 R15 combined plan](../plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md)
- [W18 R15 P1 reconciliation history](../assets/archive/history/2026-07-30-w18-r15-p1-prd-reconciliation.md)
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md)
- [10 Packaging, Validation, and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [18 Compatibility Classification and Migration Safety](18-compatibility-classification-and-migration-safety.md)
- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [Accepted W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [38 Global Store and Project State](38-global-store-and-project-state.md)
- [43 Conformance Scenario Model and Execution Kits](43-conformance-scenario-model-and-execution-kits.md)
- [44 Conformance Lab Sessions and Evidence](44-conformance-lab-sessions-and-evidence.md)
- [47 Persona Model](47-persona-model.md)
- [45 Deferred Obligation Governance](45-deferred-obligation-governance.md)
- [Coverage pass contract](../../.make-docs/contracts/system/coverage-pass-contract.md)
- [Execution workflow](../../.make-docs/references/system/execution-workflow.md)
