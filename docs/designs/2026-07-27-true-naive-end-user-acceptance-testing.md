---
title: "True Naive End-User Acceptance Testing"
kind: "design"
status: "draft"
follow_on:
  route: "change-plan"
  next_prompt: ".make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "This capability revises the active testing and UAT coverage, lifecycle, Playbook, PRD, work, history, phase-gate, Project State, template, and compatibility contracts."
  coordinate_handoff: "Revises W16 R0 testing and UAT coverage and consumes W18 R10 Global Store boundaries; recommended downstream coordinate W18 R15, contingent on owner disposition of the sibling W18 R14 anti-orphan design."
# coordinate: "W18 R15"
source:
  type: "manual-request"
  path: "manual request for a reusable true naive end-user UAT capability"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "revisit"
  reason: "The owner requested a design-stage correction after the active v2 PRD and implementation lineage had already established generic testing and UAT coverage without a true naive-tester contract."
---

# True Naive End-User Acceptance Testing

> Filename: `2026-07-27-true-naive-end-user-acceptance-testing.md`. See `.make-docs/contracts/system/design-contract.md` for naming and structural rules.

## Purpose

Define a reusable Make Docs v2 capability for true naive end-user acceptance testing. The capability establishes when naive UAT is required, who qualifies as a naive tester, how goal-oriented scenarios are authored without coaching, what interaction and visual evidence is captured, how findings move through PRD and work authority, and where versioned project knowledge ends and machine-local execution state begins.

This is a general Make Docs design, not an Ursa convention and not a GUI-only testing model. It applies to any installed product that exposes a meaningful user goal through a graphical interface, command line, public developer surface, device interaction, or documented workflow. It also preserves a valid `none` outcome for headless or internal work that cannot yet produce meaningful end-user signal.

This design is documentation-first. It stops at the owner-review gate and does not implement contracts, templates, prompts, skills, Playbooks, validators, CLI behavior, Global Store schema, Project State records, migrations, plans, PRDs, work backlogs, tester runs, or product changes.

## Context

The current [coverage-pass contract](../../.make-docs/contracts/system/coverage-pass-contract.md) correctly makes testing and UAT a non-persona-scoped coverage surface and requires every candidate to receive `create`, `update-existing`, `link-only`, or `none` with a reason. The current [testing and UAT starter prompt](../../.make-docs/system/prompts/coverage-pass-testing-uat.prompt.md) enumerates automated validation, manual scenarios, UAT passes, acceptance scripts, smoke tests, no-test decisions, and discoverability pointers. Neither authority defines a qualified naive tester, an anti-coaching boundary, a real-world scenario contract, an evidence schema, or a trigger that turns a user-observable slice into required naive UAT.

That gap has practical consequences. The hand-run W18 R7/R8 UAT found functional defects, misleading state, authoring friction, and CLI mental-model mismatches that automated validation had not exposed; the durable record is [W18 R7/R8 UAT Findings and Remediation Scoping](../assets/archive/history/2026-07-03-w18-r7-r8-uat-findings-and-remediation-scoping.md). The walkthrough was useful, but it was an uncommitted implementation-shaped working file operated with extensive project knowledge. It is evidence that human use matters, not evidence that Make Docs already has a reusable true naive-UAT capability.

The current lifecycle closes each implementation phase through the coverage-pass band before commit and phase gate. The installed [Make Docs lifecycle Playbook](../assets/playbooks/agent/make-docs-lifecycle.playbook.md) can run, defer, or mark UAT/manual testing not applicable, but it does not distinguish naive end-user UAT from knowledgeable manual validation and does not prevent internal instructions from coaching a tester past a discoverability defect.

The current persona model applies to reader-facing guides and Playbooks. It defines configured persona targets such as `agent`, `developer`, and `user`, but testing/UAT coverage deliberately remains non-persona-scoped. This design must preserve that rule while still qualifying the person or isolated agent who executes a naive scenario.

[Global Store and Project State](2026-07-01-global-store-and-project-state.md) establishes the current v2 storage boundary: designs, plans, PRDs, contracts, guides, Playbooks, and history remain versioned repository knowledge; Playbook run-state and work-execution evidence are relocated-canonical operational state in the machine-level store. A naive-UAT design must not reintroduce repository runtime logs, but a database row must not become the only copy of a product requirement, scenario, finding disposition, or future obligation.

The sibling draft [Deferred Obligations and Anti-Orphan Governance](2026-07-27-deferred-obligations-and-anti-orphan-governance.md) proposes stable `O-###` records, required future triggers, end-to-end acceptance scenarios, and explicit `Phase complete` versus `Capability complete` language. This design consumes those rules when the sibling design is approved. Until then, the same future work must remain explicitly routed through the active PRD risk register and a concrete work coordinate rather than disappearing into a `none` reason.

This request intentionally revisits design after the active v2 PRD and implementation lineage. That is an explicit lifecycle departure from continuing directly through implementation. The workflow returns to `change-plan` only after owner approval of this design.

## Decision

### D0. Scope and Core Terms

Naive end-user UAT is a black-box acceptance activity in which a qualified tester attempts a realistic user goal against an installed product using only information that a real target user would possess. It tests whether the product, its normal installation, and its public user-facing instructions support the intended outcome without private implementation help.

A **naive tester** is a person or isolated agent that meets all of these conditions:

- Has no implementation, source-code, architecture, PRD, backlog, acceptance-criterion, private incident, or known-defect knowledge for the slice under test.
- Has no private project conversation, prior agent-run context, hidden expected answer, or memory of the implementation session.
- Can access only the installed product, the same operating environment and accounts a real user could obtain, and public user-facing instructions appropriate to the intended audience.
- Has not rehearsed the scenario and has not previously been shown the successful path for the scenario version being run.
- Is not given internal terminology, hidden navigation, diagnostic shortcuts, developer flags, privileged data, or source-tree access unless one of those is genuinely part of the delivered end-user product.
- May receive ordinary safety, privacy, and environment instructions, but those instructions cannot reveal how to complete the user goal.

A tester may be an actual human or an isolated agent. An agent qualifies only when it starts in a separate context without the implementation conversation, repository knowledge, private memory, source access, or project-specific system instructions beyond the tester packet. An agent's self-assertion that it was naive is not sufficient; the run must record the isolation and context controls used.

The **installed product** is the release, release candidate, package, application bundle, deployed service, device build, or other normally consumable form the intended user would receive. A source checkout or development server is not an installed product unless the product's actual users are expected to consume that exact form.

The **target user** is the intended external consumer of the tested slice. It may be a general user, operator, author, administrator, or developer consuming a public CLI, SDK, or API. It is not automatically the Make Docs configured `user` persona, and it never means an implementer using private knowledge.

This design does not define market research, beta-program recruitment, production experimentation, architecture review, conformance testing, or release authorization. Those activities may consume naive-UAT findings but cannot substitute for the contract below.

### D1. Preserve Non-Persona Testing Coverage

Testing and UAT coverage remains **not persona-scoped**. The coverage pass must evaluate the complete changed product surface regardless of which configured documentation persona owns related guides or Playbooks. A configured persona target cannot be used to omit a product behavior from testing/UAT enumeration.

The naive-tester qualification is an execution and evidence boundary, not a new documentation persona. Make Docs does not add `naive-tester` to the primitive persona set. This prevents a project from treating naive UAT as covered merely because it generated a guide for a persona with that label.

Artifacts created because of a testing/UAT verdict may still be persona-scoped under their owning contracts. A tester-facing Playbook or public guide uses the target `user` persona or an appropriate configured user-like persona. A facilitator Playbook may target `agent` or `developer`. The testing/UAT candidate, scenario activation, result, and disposition remain non-persona coverage decisions.

Every future testing/UAT coverage record must state this separation explicitly: `coverage_scope: non-persona`; `target_user` identifies the product audience for the scenario; and any generated guide or Playbook separately declares its configured persona.

### D2. Activation and the Valid Use of `none`

Each stage and phase closeout must enumerate user-observable-slice candidates. Stage outputs are considered individually, and the phase is also considered as an assembled whole so that a meaningful workflow split across stages is not missed.

A **genuinely user-observable slice** exists when an intended user can safely attempt a meaningful goal against the installed output and the attempt can produce product signal. User-observable surfaces include, when applicable:

- Graphical or device workflows.
- Command-line installation, discovery, help, execution, error recovery, and output interpretation.
- Public SDK or API tasks performed from public documentation.
- Publicly exposed plugins, integrations, automation, import/export, or sharing workflows.
- Documentation-driven tasks where the instructions are part of the delivered user experience.

When a stage or phase first produces such a slice, naive UAT becomes required at the earliest safe runnable boundary and no later than the phase gate. Later changes reuse or update the existing scenario when the same goal remains valid; they create another scenario only for a materially different goal, audience, platform claim, accessibility condition, or risk.

For an activated user-observable slice, automated coverage, owner confidence, architecture review, prior implementer testing, or a successful knowledgeable walkthrough is not a valid `none` rationale. Those forms of evidence answer different questions.

`none` remains valid only when the completed work cannot yet produce meaningful end-user signal. Common valid cases include an internal algorithm, storage seam, private protocol, headless Core layer, documentation refactor invisible to the delivered instructions, or scaffolding that exposes no usable user goal. A `none` record is valid only when it contains:

- The concrete reason a real user cannot yet exercise a meaningful goal.
- The evidence used to make that classification.
- The future observable trigger that will activate naive UAT.
- A durable owner and a concrete future work coordinate.
- A linked deferred-obligation record when that sibling capability is approved, or an active PRD risk/register link until then.
- The automated, architecture, or other validation that still applies to the current internal slice.

An unresolved trigger, missing owner, or vague phrase such as "test later" is not a valid `none` decision. If a previously internal slice becomes exposed by later work, the later coverage pass must activate the routed candidate even when the exposing phase did not modify the internal implementation.

### D3. Keep Test and Review Modes Separate

Each coverage pass must enumerate these modes separately rather than collapsing them into one `tested` statement:

| Mode | Primary question | Knowledge allowed | Typical evidence | Does not substitute for |
| --- | --- | --- | --- | --- |
| Automated tests | Does deterministic behavior satisfy coded assertions and regression guards? | Full implementation knowledge | Test output, coverage, fixtures, assertions | Human comprehension, discoverability, real interaction, or naive UAT |
| Owner or architecture review | Is the design, boundary, and product decision acceptable? | Full design and architecture context | Review decision, rationale, sign-off or waiver | Executed user behavior |
| Naive end-user UAT | Can a real target user achieve the intended goal without private help? | Public product context only | Completion outcome, observations, intervention log, interaction and visual evidence | Automated correctness, architecture review, specialist accessibility audit, or visual regression |
| Visual and manual interaction testing | Does the rendered and interactive surface behave correctly under knowledgeable exploration? | Product and implementation knowledge may be used | Interaction notes, screenshots, recordings, input/device observations | Naive discoverability or automated visual diffing |
| Accessibility testing | Can users with relevant access needs perceive, operate, understand, and complete the workflow? | Public task context; specialist methods and assistive technology are allowed | Automated checks, keyboard path, screen-reader output, contrast/zoom, captions, focus behavior, completion outcomes | General naive UAT or visual regression |
| Visual-regression automation | Did rendered output change relative to an approved baseline? | Test implementation knowledge | Image diffs, thresholds, baseline metadata | Usability, meaning, accessibility, discoverability, or interaction success |

One physical run may collect evidence relevant to more than one mode, but the verdicts remain distinct. For example, a naive keyboard-only run may contribute accessibility observations, but it does not satisfy a full accessibility pass unless that pass's own authority says the evidence is sufficient.

### D4. Require Real-World Goals and Prohibit Coaching

Naive-UAT scenarios describe a situation and a user goal, not the product's implementation sequence. The tester-facing instruction states what the user is trying to accomplish, the realistic starting conditions, the allowed public resources, and any genuine safety boundary. It does not prescribe clicks, commands, internal objects, exact output, hidden navigation, or the preferred route.

A valid goal resembles "Install the tool, create a shareable workflow, and confirm another user can discover and run it" or "Create a note, close the application, and find the note again." An invalid implementation-shaped script resembles "Run internal operation X, inspect state table Y, click the third toolbar icon, and assert field Z equals the fixture."

The scenario record may contain operator-only success criteria, risk notes, setup mechanics, and expected evidence, but the tester packet must exclude those fields when they would reveal the answer or path. The tester packet is a projection, not the canonical scenario record.

Agents that author, facilitate, observe, or evaluate a run must obey these anti-coaching rules:

- Do not reveal source terms, architecture, requirement identifiers, backlog coordinates, internal operation names, hidden steps, expected answers, known defects, or the intended navigation path.
- Do not rewrite the goal into a step-by-step tutorial to help the tester succeed.
- Do not answer a discoverability question with private knowledge. Point only to a public resource the real user would have been able to find; record both the question and the intervention.
- Do not silently manipulate the environment, pre-position the product, create hidden data, or correct the tester's state after the run begins.
- Do not treat facilitator intervention as tester success. Material help changes the outcome to `revise` or `fail`, or invalidates and restarts the attempt with the intervention recorded.
- Do not discard unexpected mental models, alternative paths, hesitation, repeated navigation, abandoned attempts, or requests for help merely because the final command exits successfully.
- Do not modify the tester instructions to compensate for a product discoverability defect. Remediate the product or its normal public documentation, then rerun the same user goal.

Safety intervention is always allowed when continuing could cause harm, data loss, privacy exposure, unauthorized external effects, or unexpected spending. A safety intervention stops the attempt and records `blocked` or `fail` according to cause; it is never hidden to preserve a clean result.

### D5. Define the Scenario Artifact Contract

The durable scenario source is versioned project knowledge. In the active PRD, the baseline subsystem or change document that owns the user outcome carries the canonical scenario record. Before an active PRD exists, a design or plan may carry a provisional record, but PRD generation must migrate it without losing its stable identity. Work backlogs reference the scenario; they do not become a second scenario authority.

Scenario identifiers use stable project-wide `NUAT-###` values. IDs are append-only and never reused. A materially revised scenario keeps its ID and increments `scenario_version` when it tests the same user goal; a different user goal receives a new ID. Historical result records always bind to the exact scenario version or content digest they executed.

Every scenario record contains:

| Field | Contract |
| --- | --- |
| `scenario_id` | Stable `NUAT-###` identifier. |
| `scenario_version` | Monotonic version for meaningful scenario changes. |
| `title` | Short product-language title. |
| `user_goal` | Real-world outcome in the intended user's language. |
| `source_requirements` | Relative links and anchors to owning PRD requirements, acceptance criteria, and related decisions. |
| `target_user` | Intended external audience and relevant public experience assumptions, without implementation knowledge. |
| `activation_coordinate` | Stage or phase where a safe installed user-observable slice first exists. |
| `future_trigger` | Required when dormant or paired with `none`; otherwise `active`. |
| `obligation_ref` | Linked `O-###` when deferred-obligation governance is available, or explicit `none` when no future obligation exists. |
| `supported_scope` | Product surface, platform, device, locale, input method, assistive technology, and account or network assumptions actually claimed by the run. |
| `installed_build_identity` | Version, package, build, deployment, or digest rule that makes the tested product reproducible. |
| `starting_state` | Realistic account, content, permissions, data, and environmental state visible to the tester. |
| `public_resources` | Exact public instructions and product help a real user may use. |
| `prohibited_context` | Private sources, assists, and shortcuts the tester and facilitator must not use. |
| `tester_prompt` | Tester-visible situation and goal, free of hidden steps and expected answers. |
| `operator_success_outcomes` | Observable completion conditions used for evaluation but omitted from the tester packet when disclosure would coach. |
| `setup` | Facilitator-only preparation, isolation, consent, capture, and validation steps. |
| `teardown` | Cleanup, account/data disposal, evidence retention, privacy, and restoration steps. |
| `evidence_requirements` | Required interaction, visual, accessibility, completion, and reproducibility evidence, including justified `not-applicable` entries. |
| `severity_rules` | Project-specific escalation over the base severity scale in D6, or `base-scale`. |
| `timebox` | Optional observation window; expiration produces evidence and never silently becomes success. |
| `finding_route` | Owning PRD, work, and phase-gate route for findings. |

The scenario template must render two views from one canonical record:

1. An operator view containing all fields.
2. A tester packet containing only the tester-visible goal, realistic starting state, allowed public resources, genuine constraints, consent/capture notice, and teardown actions the real user must perform.

Any future generator or validator must fail closed if an operator-only field leaks into the tester packet.

### D6. Define Setup, Evidence, Outcomes, Severity, and Reproducibility

Tester setup establishes a credible black-box environment before the attempt:

- Install through the supported end-user path into a clean or explicitly characterized environment.
- Record product build identity, platform, device, locale, input method, account state, network state, and applicable assistive technology.
- Use realistic but disposable data and least-privilege accounts; never use a maintainer's irreplaceable production data.
- Confirm that debug menus, developer flags, source mounts, pre-seeded hidden state, private documentation, and implementation logs are absent unless real users receive them.
- Confirm tester qualification and record any prior exposure.
- Obtain consent for screenshots, recordings, interaction logs, and quoted observations; define redaction and retention before capture starts.
- Validate only environment readiness. Do not rehearse the goal or prove the successful path during setup.

Teardown must stop capture, preserve evidence according to consent, redact secrets and personal data, export any approved portable bundle, remove disposable accounts and fixtures, restore shared devices or environments, and record incomplete cleanup as a finding or blocker.

Every run record contains:

| Field | Contract |
| --- | --- |
| `run_id` | Unique run identity. |
| `scenario_ref` | `NUAT-###`, scenario version, and source digest. |
| `work_coordinate` | Stage or phase being evaluated. |
| `product_build` | Exact installed build identity. |
| `environment` | Platform, device, locale, input, account, network, and applicable assistive technology. |
| `tester_qualification` | Attestation and isolation evidence showing why the tester qualifies as naive. |
| `public_resources_used` | Public docs or help actually consulted. |
| `interventions` | Every facilitator, safety, environment, or coaching-like intervention and its effect on validity. |
| `outcome` | Exactly one of `pass`, `fail`, `revise`, or `blocked`. |
| `completion` | Goal completed or not completed, elapsed time if useful, attempt count, and terminal state. |
| `observations` | Confusion, hesitation, discoverability failures, unexpected mental models, alternative paths, help requests, recovery behavior, and notable ease. |
| `interaction_evidence` | Ordered user actions or event references sufficient to understand the attempt without turning the scenario into a scripted replay. |
| `visual_evidence` | Screenshot, recording, or explicit `not-applicable` rationale. |
| `accessibility_evidence` | Applicable observations or a link to the separate accessibility pass; otherwise a reasoned `not-applicable`. |
| `finding_ids` | Stable findings produced by the run. |
| `reproduction` | Conditions and concise steps sufficient for a new qualified run to reproduce the observation without revealing a hidden successful path to the current tester. |
| `evidence_refs` | Global Store or approved portable-bundle references, with redaction and retention metadata. |
| `review` | Reviewer, review decision, disposition links, and phase-gate consumption. |

The run outcomes mean:

| Outcome | Meaning |
| --- | --- |
| `pass` | The tester completed the user goal without prohibited help, material confusion, material accessibility barrier, or an unresolved finding that violates the owning acceptance outcome. |
| `fail` | The user goal could not be completed, the product behaved incorrectly or unsafely, prohibited coaching was required to complete it, or a material accessibility barrier prevented completion. |
| `revise` | The goal was technically completed, but discoverability, comprehension, terminology, mental-model mismatch, excessive recovery, documentation dependence, or another material experience issue requires product or public-instruction revision before acceptance. |
| `blocked` | Environment, account, platform, consent, dependency, or setup conditions prevented a valid attempt before the product could be evaluated. `blocked` is honest evidence but does not satisfy required naive UAT. |

Findings use this base severity scale:

| Severity | Use when |
| --- | --- |
| `critical` | The workflow creates a credible safety, security, privacy, irreversible-data, unauthorized-external-effect, or severe accessibility risk. |
| `major` | The intended goal is impossible for the tested scope, requires private coaching or an undocumented workaround, or excludes a required supported user. |
| `moderate` | The tester eventually completes the goal but experiences substantial confusion, repeated failure, misleading mental models, or fragile recovery. |
| `minor` | The issue creates bounded friction or presentation debt without threatening completion or comprehension of the core goal. |

A finding records observed behavior, expected user outcome, severity, reproducibility, affected support scope, evidence references, source requirement, and disposition. Screenshots and recordings are evidence, not a verdict. A clean crash-free recording can still support `revise` when the user is visibly lost, and a successful assertion can still fail naive UAT when completion required coaching.

### D7. Define Reusable Contracts, Templates, and Playbooks

Future implementation must introduce one shared naive-UAT contract and reuse it rather than copying the rules into every prompt or Playbook. Because these are Make Docs system resources and defaults, the maintainer repository must author them upstream under `packages/docs/template/` first and dogfood them into the installed `.make-docs/` and `docs/` trees only through planned template delivery.

The documentation-first resource set is:

- A system contract defining activation, tester qualification, scenario fields, anti-coaching, outcomes, evidence, storage boundaries, and lifecycle consumption.
- A scenario section template that writes canonical `NUAT-###` records into the owning active PRD authority and renders an operator view plus a tester packet.
- An update to the testing/UAT coverage starter so it enumerates naive-UAT activation candidates independently from other test modes.
- A `user`-targeted tester Playbook that explains consent, the black-box attempt, evidence capture, and teardown without operator-only fields or implementation steps.
- An `agent`- or `developer`-targeted facilitator Playbook that prepares the environment, verifies isolation, enforces anti-coaching, records interventions, captures evidence, and routes findings.
- Phase-gate and lifecycle Playbook guidance that consumes required naive-UAT outcomes and valid `none` records.

The tester Playbook and facilitator Playbook must remain separate because combining them would expose operator-only setup, expected outcomes, and evaluation rules to the tester. Both are reusable workflow documents under the current Playbook contract, not hidden skills, plugins, or runtime executors.

Projects may add domain-specific public guides or Playbooks, but those artifacts cannot weaken the shared contract. A project-specific tester guide is a `user` persona artifact; it is not the canonical scenario or run evidence.

### D8. Extend Testing/UAT Coverage-Pass Mechanics

The testing/UAT coverage pass keeps the base verdict spine. It adds required candidate fields and semantics rather than inventing another coverage system:

| Coverage verdict | Naive-UAT use |
| --- | --- |
| `create` | A newly observable user goal requires a new canonical scenario or no existing scenario owns it. |
| `update-existing` | The same user goal remains authoritative but its build scope, public resources, setup, evidence, platform, accessibility, or finding route changed. |
| `link-only` | An existing scenario and evidence are sufficient for the unchanged goal, but the current stage, phase, requirement, or history needs a traceability link. |
| `none` | No meaningful end-user signal is possible yet and the record includes the full rationale, future trigger, owner, coordinate, obligation/risk route, and still-required non-UAT validation from D2. |

Every stage and phase produces a testing/UAT candidate table with at least:

- `candidate_id`
- delivered behavior or assembled workflow
- `user_observable_slice`: `yes` or `no`
- target user and real-world goal when `yes`
- testing mode
- verdict and reason
- `scenario_ref` when activated
- `none_rationale` when not activated
- future trigger, owner, work coordinate, and obligation or risk-register reference
- execution outcome or explicit pending/blocked status
- finding and disposition links

The pass must create separate candidate rows for automated tests, owner/architecture review, naive end-user UAT, visual/manual interaction, accessibility, and visual regression when those modes are applicable. It must not use one `link-only` automated-test row to stand in for naive UAT.

Candidate enumeration also includes changed public instructions, install paths, error messages, defaults, terminology, output rendering, and accessibility behavior even when implementation code did not change. A user-observable workflow assembled from earlier internal phases is a candidate at the phase that first exposes it.

The existing history-idempotency rule remains unchanged. The pass records durable changes once in the current session's history breadcrumb and stores run-level progress and evidence through Project State rather than duplicating it in history.

### D9. Consume Findings Through Gates Without Orphaning Them

The phase gate must consume the naive-UAT candidate record, scenario reference or valid `none` record, execution outcome, findings, dispositions, and Project State evidence.

Gate behavior is:

- `pass` satisfies the naive-UAT requirement for the tested scenario version and support scope.
- `revise` or `fail` does not satisfy user acceptance. The current phase reopens for remediation, or product authority uses PRD change management to defer, cancel, narrow, or supersede the affected outcome. A deferred finding must receive an owner, coordinate, trigger, acceptance exit criteria, and `O-###` link when deferred-obligation governance is available. The phase may be described as implementation-complete only with explicit capability-partial language and cannot claim the user-observable slice or capability accepted.
- `blocked` proves only that a valid attempt did not occur. The required naive-UAT gate remains open until setup is corrected and the scenario runs, or product authority changes the supported scope through PRD authority. A blocked run cannot be converted into `none` after the slice is already user-observable.
- A valid `none` record satisfies only the current internal/headless classification. It does not fulfill the routed future trigger.

A phase may not claim `Capability complete` while an activated scenario is `fail`, `revise`, `blocked`, unrun, or bound to unresolved findings. When the sibling anti-orphan design is approved, phase and capability language follows its exact completion rules. Without that design, the same distinction must still be recorded in the phase gate and active PRD.

Finding routing follows one authority chain:

1. Link the finding to the scenario and source requirement.
2. Decide whether the finding shows an existing requirement is unmet, a new product gap, a documentation gap, a platform/accessibility gap, or an invalid test/setup issue.
3. Update the active PRD requirement, change doc, or risk register as required by PRD change management.
4. Create or update implementation work with scenario and finding links.
5. Record a deferred obligation when remediation is not in the current phase.
6. Record the durable delta and outcome in the current history breadcrumb.
7. Bind remediation evidence and the later rerun to the same finding and scenario lineage.

History is a concise immutable breadcrumb. It summarizes scenario outcomes and material findings and links to PRD/work authority; it does not copy raw transcripts, recordings, or the operational audit log. Later work cannot close a finding merely by completing a task. It closes only when the linked scenario reruns successfully or product authority intentionally changes the requirement and records that disposition.

### D10. Preserve Repository and Global Store Boundaries

Naive UAT uses the current v2 project-knowledge versus operational-state test:

| Information | Canonical home | Rule |
| --- | --- | --- |
| User outcome, scenario identity and version, target user, activation trigger, source requirements, supported scope, public-resource policy, success outcomes, severity rules, finding route, and deferred obligation | Active repository authority, primarily the owning PRD plus links from design, plan, and work | Versioned project knowledge must survive machine changes, database loss, store pruning, and clones. |
| Reusable system contract, section template, starter prompt, and default tester/facilitator Playbooks | `packages/docs/template/` upstream, then planned dogfood/install projection | Maintainer source-of-truth rules apply; installed copies are not authored directly. |
| Public project guides and project-specific Playbooks | `docs/assets/library/<persona-slug>/` and `docs/assets/playbooks/<persona-slug>/` | Persona-scoped reader-facing knowledge; not scenario or result authority. |
| Candidate verdicts, scenario and finding links, and phase acceptance obligations | Active PRD and work artifacts | Durable lifecycle traceability. |
| Material scenario outcomes and finding dispositions | PRD/work authority plus `docs/assets/archive/history/` breadcrumb | History summarizes; it does not become a live run log. |
| Run progress, tester-qualification attestation, timestamps, interventions, interaction observations, completion data, review decisions, sign-offs, and raw evidence references | Unified Project State in the machine-level Global Store | Relocated-canonical operational evidence keyed by stable project and canonical work-item identity, with no repository runtime-state copy. |
| Raw screenshots, recordings, transcripts, and capture files | Global-Store-managed evidence area or an explicitly exported portable evidence bundle | Machine-local by default; consent, redaction, retention, and size rules apply. Exact physical layout is a downstream implementation decision. |
| Cross-project scenario index or database projection | Optional rebuildable projection only | Repository authority remains canonical; projection loss cannot erase or change scenario meaning. |

Project State may use existing validation, review, closeout, and notes evidence seams for the documentation-first capability. The exact payload fields, evidence-file layout, and whether a future dedicated naive-UAT evidence kind is justified remain downstream decisions. This design does not require a schema change.

If Global Store evidence is missing or corrupt, the repository still retains scenario and finding meaning, but the affected acceptance outcome becomes unverified until valid evidence is restored through explicit export/import or the scenario reruns. Make Docs must never infer a pass from a repository link alone or reconstruct a product decision from stale operational data.

If a screenshot, recording, or transcript must become durable project evidence, a reviewed and redacted bundle may be explicitly promoted under a project-chosen repository evidence policy. Promotion is opt-in, must preserve consent and provenance, and does not make raw machine-local run state repository-canonical.

### D11. Apply Cross-Platform, Non-GUI, Visual, and Accessibility Rules

Naive UAT is not GUI-dependent. A CLI user can be naive, an SDK consumer can be naive, and a public API workflow can be user-observable when public documentation is the intended interface. A headless internal module with no directly consumable user goal remains eligible for `none`.

Every scenario states the support scope actually tested. A pass supports only the recorded platform, device, runtime, locale, input method, assistive technology, and build combination; it cannot be generalized silently to every claimed platform. Projects choose a risk-based matrix, but every materially different supported interaction path must be covered before the corresponding broad support claim is accepted.

Visual evidence is required when appearance, spatial organization, discoverability, feedback, focus, motion, or visual output materially affects the goal. Capture should show the starting state, decisive interaction state, completion or failure state, and any confusion or recovery sequence. A static screenshot is insufficient when timing, motion, focus, drag/drop, gesture, or multistep interaction is the issue; use a recording or ordered capture.

For a non-visual workflow, `visual_evidence: not-applicable` is valid with a reason. Interaction and completion evidence still apply. Terminal or structured-text output may use captures or redacted transcripts when they help explain comprehension or error recovery.

Accessibility testing remains a distinct mode. When the delivered slice has an applicable accessibility requirement or claim, the coverage pass creates an accessibility candidate in addition to naive UAT. The scenario identifies relevant keyboard, screen-reader, voice, switch, contrast, zoom, captions, reduced-motion, cognitive-load, or other conditions without assuming every project is a web GUI. An accessibility barrier observed during naive UAT is always a finding even if a separate specialist pass remains pending.

Visual-regression automation may protect stable rendering after acceptance, but an image match cannot prove comprehension, discoverability, accessible operation, or goal completion.

### D12. Migrate Existing Projects and Artifacts Conservatively

Existing Make Docs projects remain readable and do not fail merely because they lack `NUAT-###` records. The capability applies prospectively at the first qualifying user-observable change and may be adopted earlier through an explicit inventory.

The first qualifying coverage pass:

1. Inventories active manual-test, UAT, acceptance-script, walkthrough, smoke, and no-UAT decisions relevant to the changed user goal.
2. Classifies whether each artifact is truly naive, knowledgeable manual validation, automated validation, conformance evidence, obsolete history, or insufficiently evidenced.
3. Creates canonical `NUAT-###` records for active user goals, updates or links sufficient existing coverage, and records reasoned `none` decisions for internal slices.
4. Preserves stable historical paths and does not rewrite archive history.
5. Adds traceability as active PRD and work files are touched; it does not perform an opportunistic repository-wide backfill.
6. Runs the scenario when activation conditions hold and routes findings through the current PRD/work lifecycle.

An existing walkthrough is not grandfathered as naive merely because a human performed it. It qualifies only when the available evidence establishes tester naivety, anti-coaching compliance, an installed-product boundary, a goal-oriented prompt, and a reproducible outcome. Otherwise it remains valid evidence for its actual mode and can inform a new naive scenario.

Existing historical `none` decisions remain truthful records of their time. The next affected coverage pass reassesses them under D2; it does not retroactively falsify or rewrite the old history entry.

Existing UAT/manual-test filenames, IDs, work coordinates, and archived artifacts remain stable. Active scenarios may be adopted under `NUAT-###` with backlinks to prior artifacts; old identifiers remain aliases only in human-readable lineage and do not become a second canonical ID namespace.

No Global Store migration is required for the documentation-first design. If later planning adds a dedicated evidence kind, file area, or scenario projection, it must version the store schema when needed, preserve write-ahead logging and locking behavior, handle newer-schema stores explicitly, and keep repository project knowledge recoverable without the database.

Modified project-owned instructions and artifacts are never overwritten automatically. Compatibility follows [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md): classify first, update known-clean managed defaults through planned delivery, and stop for review on modified or ambiguous content.

### D13. Separate Future Deterministic Support From the Documentation Contract

The capability must work through documentation authority, Playbooks, coverage decisions, and human review before dedicated runtime support exists. Future automation may validate or project the contract, but it cannot define its meaning.

A future validator may check:

- Stable and unique `NUAT-###` IDs and monotonic scenario versions.
- Required fields, valid outcomes, valid severity, and resolving relative links.
- A scenario or complete `none` record for every user-observable-slice candidate.
- A concrete future trigger, owner, coordinate, and obligation/risk route for `none`.
- Scenario-to-PRD-to-work-to-finding traceability.
- Tester packet exclusion of operator-only fields.
- Presence of tester qualification, intervention records, evidence references, and review disposition.
- Phase gates that do not claim acceptance from `blocked`, unresolved `fail`, unresolved `revise`, or missing evidence.
- No repository-local runtime-state or raw-evidence paths that violate the Global Store boundary.

A future CLI or MCP surface may inventory candidates, render tester packets, start or resume a facilitator Playbook, record evidence, export/import a portable bundle, or project a queryable scenario index. Any mutating surface must use the same operation core and Project State safety rules as current v2 operations.

Automation must not infer that a slice is user-observable, certify that a tester was truly naive, decide that intervention was immaterial, assign product severity, interpret confusion, mark a goal accepted, narrow supported scope, cancel a requirement, or resolve a deferred obligation. Those are evidence-backed authority decisions.

Database projections remain non-authoritative. Deleting or rebuilding them cannot alter scenario definitions, PRD requirements, findings, or work obligations.

### D14. Worked Example: Ursa as an Illustrative Consumer

Ursa illustrates the activation boundary but does not define it.

Suppose an Ursa phase implements a headless Core for note identity, local authorization, persistence semantics, or synchronization rules without a usable shell or public user workflow. The coverage pass still requires automated tests and owner/architecture review. Naive UAT may record `none` because an end user cannot yet attempt a meaningful installed-product goal. The record must say what is internal, identify the first shell or user workflow that will expose it, name the future coordinate and owner, and link the deferred obligation or current risk route. "Core is headless" alone is not enough.

When the first usable shell exposes a real workflow, the trigger fires even if the shell phase mostly wires existing Core behavior. A canonical scenario might ask a qualified tester, using an installed build and only the public getting-started instructions, to create a note about a real topic, close the product, relaunch it, and find the note again. The tester is not told about Core, Actor identity, storage tables, internal commands, or the intended navigation path.

The run records whether the tester completes the goal, what public help they discover, where they hesitate, what model of notebooks or search they infer, whether relaunch changes their confidence, and any visual, interaction, keyboard, screen-reader, or platform evidence appropriate to the shell. A technically successful persistence assertion does not erase discoverability failure. A `revise` finding routes to Ursa's own PRD and work coordinates; the generic Make Docs capability and IDs remain unchanged.

Another project with only a public CLI, SDK, or device interface applies the same contract to its own real user goal. No project is required to invent a GUI to qualify for naive UAT.

### D15. Fixed Decisions and Open Questions

The following decisions are fixed by this design and must not be reopened during change planning without explicit owner direction:

- Testing/UAT coverage remains non-persona-scoped.
- Naive tester is an execution qualification, not a configured Make Docs persona.
- A genuinely user-observable slice activates required naive UAT.
- `none` requires a no-signal rationale plus a routed future trigger, owner, coordinate, and obligation/risk link.
- Scenarios are real-world goals, not implementation scripts.
- Anti-coaching applies to authors, facilitators, observers, evaluators, agents, and tester packets.
- Automated tests, owner/architecture review, naive UAT, visual/manual testing, accessibility testing, and visual regression remain distinct.
- Canonical scenario meaning and finding disposition are versioned repository knowledge.
- Run progress and raw evidence are operational Project State in the machine-level Global Store.
- Database projections are non-authoritative.
- Historical manual/UAT artifacts are classified by evidence and never silently grandfathered as naive.
- Documentation-first behavior precedes dedicated CLI, validator, Global Store, or migration support.

The following decisions remain open for downstream change planning:

1. Which active PRD section shape should hold `NUAT-###` records across baseline subsystem docs and change docs while keeping one canonical owner when a scenario spans subsystems?
2. Which existing Project State evidence kinds are sufficient for the first documentation-only implementation, and would a later dedicated naive-UAT evidence kind materially improve validation without duplicating the record?
3. What machine-level evidence-file layout, retention defaults, size limits, encryption expectations, and export/redaction format should screenshots and recordings use?
4. Which durable product role may approve a `revise` or `fail` deferral, supported-scope narrowing, or requirement cancellation?
5. What risk rule requires more than one independent naive tester before a product may generalize an acceptance claim?
6. How should projects declare accessibility standards and supported assistive-technology scope without making web-specific standards mandatory for CLI, device, API, or non-visual products?
7. Should W18 R15 remain the downstream coordinate if the sibling W18 R14 anti-orphan design is not approved first, or should planning resolve both designs into one revision?

## Alternatives Considered

### Keep Generic Testing/UAT Coverage Only

Rejected. The current verdict spine is useful mechanics but cannot distinguish an implementation-aware walkthrough from true black-box acceptance, cannot prevent coaching, and does not activate UAT when a real user slice first appears.

### Add `naive-tester` as a Persona

Rejected. Testing/UAT coverage is intentionally non-persona-scoped, and tester naivety is an evidence qualification rather than a documentation audience. Persona-scoping the pass would create omission risk and let an artifact label stand in for an isolated tester.

### Use Detailed Acceptance Scripts

Rejected as the naive-tester input. Step-by-step scripts are useful for deterministic regression or knowledgeable manual checks, but they teach the tester the product's intended path and conceal discoverability failures. Operator-only setup and evaluation rules remain structured; the tester receives a goal.

### Require Naive UAT for Every Internal Phase

Rejected. A headless or internal slice may have no meaningful user signal, and forcing a scenario would create theater. `none` remains valid with a concrete rationale and routed future trigger.

### Treat Any Successful Human Walkthrough as Naive UAT

Rejected. A knowledgeable maintainer can validate interaction and still unconsciously compensate for poor terminology, hidden steps, brittle setup, or architecture-shaped mental models.

### Store Scenarios and Findings Only in SQLite

Rejected. User outcomes, requirements, finding dispositions, and future obligations are versioned project knowledge. The machine-level store may hold execution evidence and rebuildable projections, but it cannot become the only authority.

### Commit Every Screenshot, Recording, and Transcript

Rejected as the default. Raw evidence can be large, sensitive, personally identifying, and machine-local. The Global Store or an explicit portable bundle is the default; reviewed redacted promotion is opt-in.

### Reuse Conformance Scenarios as Naive UAT

Rejected. The conformance lab tests support claims through maintainer-controlled definitions, generated kits, target agents, and deterministic instruments. Naive UAT evaluates whether a target user can achieve a product goal without private help. The two may share observations but have different subjects, evidence bars, and authority.

### Make Naive UAT GUI-Only

Rejected. CLI, SDK, API, device, and documentation-driven user workflows can expose comprehension, discoverability, error-recovery, and completion failures without a graphical interface.

## Consequences

Make Docs gains an honest activation rule: internal work can close with a reasoned routed `none`, while the first real user slice cannot quietly inherit only automated or maintainer evidence. Coverage summaries become more verbose because they must distinguish test modes and record triggers, but that cost is the mechanism that prevents user acceptance from disappearing between phases.

Product teams must budget for isolated testers, realistic environments, consent, evidence handling, and reruns. Naive UAT can reveal inconvenient findings late in a phase, and `revise` intentionally prevents technically successful but confusing behavior from being flattened into a pass.

The repository gains durable scenario and finding traceability without becoming a runtime log. The Global Store gains a clear evidence role without becoming product authority. Cross-machine continuation requires explicit evidence export/import or rerun rather than an assumption that another machine's pass exists locally.

Future system-resource implementation affects the coverage-pass contract and prompt, lifecycle and phase-gate guidance, PRD and work templates, Playbook assets, history guidance, compatibility behavior, and upstream template delivery. Those changes must be planned and authorized separately. This design does not authorize direct edits to installed copies or generated defaults.

The design aligns with the sibling anti-orphan proposal by requiring future triggers, obligations, end-to-end scenario evidence, and capability-partial language. Owner review must decide whether the two designs proceed as separate W18 R14/R15 revisions or one combined change plan.

No runtime, template, skill, Playbook, validator, Global Store, Project State, migration, plan, PRD, work, history, release, or product behavior changes as part of this design-only artifact.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs:
  - [Coverage-Pass Extensions and Adversarial Review](2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
  - [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
  - [Generated Metadata and Lifecycle Handoffs](2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
  - [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md)
  - [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md)
  - [Global Store and Project State](2026-07-01-global-store-and-project-state.md)
  - [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md)
  - [Playbook Authoring Ergonomics and CLI Experience Remediation](2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md)
  - [Agent Instruction File Ownership](../assets/archive/designs/2026-06-18-agent-instruction-file-ownership.md)
  - [Deferred Obligations and Anti-Orphan Governance](2026-07-27-deferred-obligations-and-anti-orphan-governance.md)
- Reason: This design adds a distinct true naive-UAT qualification and lifecycle contract to the existing non-persona testing/UAT coverage surface. It preserves the current coverage spine, persona model, Playbook model, compatibility model, agent-instruction ownership, repository/global-store boundary, and Project State semantics while defining the missing activation, anti-coaching, scenario, evidence, and finding-consumption rules.

## Owner Approval Gate

This draft is not authority for planning or implementation until the owner approves it. Approval accepts the fixed decisions in D15 and acknowledges that the listed open questions remain downstream planning decisions rather than permission for an implementer to choose silently.

Exact owner-approval statement:

> I approve the True Naive End-User Acceptance Testing design as the authoritative basis for change planning, including its non-persona coverage rule, user-observable activation trigger, qualified naive-tester and anti-coaching boundaries, scenario and evidence contracts, repository and Global Store split, finding and deferred-obligation lifecycle, migration policy, and documentation-first implementation boundary. Proceed to change planning at W18 R15, subject to explicit reconciliation with the W18 R14 anti-orphan design; do not implement, migrate, publish, or change runtime state without separate authorization.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)
- Why: This capability revises the active testing and UAT coverage, lifecycle, Playbook, PRD, work, history, phase-gate, Project State, template, and compatibility contracts rather than creating a fresh product baseline.
- Coordinate Handoff: Revises W16 R0 testing/UAT coverage and lifecycle closeout, consumes W18 R10 Global Store and Project State boundaries, and must reconcile the sibling W18 R14 anti-orphan design; recommended downstream coordinate W18 R15, with final coordinate ownership resolved at owner approval.
