---
title: "Human Experience Standard and Intent"
kind: "design"
status: "draft"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "This design adds a cross-cutting product standard and requires coordinated changes to active PRDs, lifecycle rules, system resources, templates, review, and acceptance evidence."
  coordinate_handoff: "unresolved; planner must resolve before writing."
---

# Human Experience Standard and Intent

## Purpose

Define one product-wide standard that makes human understanding and a good human experience part of Make Docs authority.

The standard must work across software, command-line tools, user interfaces, documents, APIs, workflows, file trees, operating procedures, and other work that Make Docs can govern.

The standard must help agents make sound choices for the current product and audience. It must not require the owner to list every possible human need for every type of work.

This design also defines a small `Human Experience Intent` section. The section records how each design applies the shared standard. It always records an impact class. It adds detail only when the work has a direct or indirect human effect.

This document is design authority only after owner acceptance. It does not update PRDs, system resources, templates, routers, validators, source code, or installed projects. Those changes require a later change plan, PRD reconciliation, work backlog, and separate implementation authority.

## Context

Make Docs is strong at complex work. It helps a person and an agent preserve facts, choices, requirements, plans, evidence, and gates. This strength can also create a failure mode.

Agents can optimize for what the system can state and prove. They can then expose that internal model to people. The result can be correct and complete while still being hard to understand or use.

This failure can appear in any human-facing surface:

- a command can return correct data but hide the useful meaning;
- a user interface can expose the data model instead of the human task;
- a document can preserve every fact but make the main point hard to find;
- an error can name an internal rule but not explain recovery;
- a file tree can match system boundaries but resist human navigation;
- an API or SDK can be exact but force a person to learn needless internal terms;
- an operating process can record every gate but make the next useful action unclear.

The problem is not a lack of technical quality. It is a missing form of product authority. Current Make Docs rules can tell an agent what to build, what evidence to keep, and which audience owns coverage. They do not yet give every agent one shared standard for how a person should experience the result.

The current system has useful but incomplete parts:

- The [lifecycle anchor](../../.make-docs/references/system/lifecycle.md) has a Persona lens. It keeps one audience from replacing another. It does not define the quality of the experience.
- The [design contract](../../.make-docs/contracts/system/design-contract.md) requires purpose, context, decision, alternatives, consequences, and follow-on routing. It does not require human experience intent.
- The [coverage-pass contract](../../.make-docs/contracts/system/coverage-pass-contract.md) can route testing, manual review, accessibility work, visual checks, and naive UAT. It acts after work exists. It does not author the intended experience.
- The [Naive-UAT contract](../../.make-docs/contracts/system/naive-uat-contract.md) can show whether a human can complete a public goal. It cannot replace design intent, automated correctness, accessibility review, or informed product judgment.
- [PRD 47](../prd/47-persona-model.md) defines Personas. A Persona says who receives an experience. It does not say what that experience must help the person understand or do.
- Some product areas have local experience rules. For example, the CLI can separate human text from machine JSON. These local rules do not form a universal Make Docs standard.

The missing model is therefore not another large checklist. It is a small shared rule, a required local interpretation, and proportionate proof.

This design creates a new decision area. Existing designs cover Personas, UAT, generated documents, template ownership, and feature-specific ergonomics. None owns a product-wide human experience standard that starts during design and remains visible through acceptance.

### Terms Used in This Design

**Human-facing result** means any result that a person reads, uses, navigates, reviews, operates, maintains, recovers, or relies on. It includes visible product surfaces and maintainer surfaces.

**Human experience** means how well a result helps a person understand the current situation, complete a real goal, stay oriented, recover from problems, and remain in control.

**Human Experience Standard** means the shared product rule defined by this design and its future governing contract.

**Human Experience Intent** means the design-local interpretation of the shared standard.

**Experience promise** means a short, testable statement about what the person should be able to understand, do, or avoid.

**Normal path** means the path a suitable person should usually take for the stated goal.

**Progressive disclosure** means showing the detail needed now while keeping more detail available when the person asks for it or needs it.

**Joy** means a calm sense of fluency, confidence, and control. It is a design aim. It is not limited to visual style. An agent cannot prove joy through self-assessment.

### Goals

- Give all agents one durable standard for human understanding and experience.
- Keep the standard useful across products and technologies.
- Require agents to interpret the standard instead of copying generic phrases.
- Let internal work record a valid `none` result without inventing false user interaction.
- Shape work before implementation instead of depending on late usability repair.
- Preserve separate human and machine surfaces when both are needed.
- Carry experience intent through plans, PRDs, work, review, and acceptance.
- Use realistic human evidence when the impact warrants it.
- Keep the added document burden small and proportionate.

### Non-Goals

- This design does not fix one named external project or product.
- This design does not define one visual style or design system.
- This design does not require a graphical user interface.
- This design does not make every internal change require human UAT.
- This design does not replace accessibility work.
- This design does not replace automated tests, architecture review, performance evidence, or security review.
- This design does not require one Skill or plugin to govern human experience.
- This design does not make an agent the final judge of human delight.
- This design does not require a repository-wide rewrite of existing designs, PRDs, plans, or work files.
- This design does not authorize the downstream plan, PRD updates, backlog, implementation, dogfood projection, package changes, or release.

## Human Experience Intent

Impact: `direct`

Affected humans: The Make Docs owner, project maintainers, contributors, and people who use products built through Make Docs. Agents also consume the resulting authority, but agent convenience does not replace the human goal.

Human goal or effect: The owner must be able to state one durable expectation for human quality. Agents must then apply that expectation to the current work without asking the owner to restate every product-specific rule.

Experience promises:

- The shared standard will use plain language and remain short enough to remember.
- Every generated design will show whether its human impact is `direct`, `indirect`, or `none`.
- A direct or indirect result will explain the intended human outcome before it explains implementation detail.
- A valid `none` result will stay brief and will not invent a user flow.
- The normal Make Docs path will carry intent forward without copying the same prose into every artifact.
- The owner will be able to see where experience intent entered the work, how it became a requirement, and what evidence supports acceptance.
- Agents will keep machine detail available without making that detail the default human experience.
- The standard will guide command output, user interfaces, documents, APIs, workflows, and project structure without imposing one technology-specific form.

Complexity kept out of the human path:

- The owner does not need to supply a separate checklist for each technology.
- The owner does not need to name every usability risk in advance.
- A person does not need to understand an internal data model, record schema, identifier scheme, or evidence model merely to complete the normal goal.
- A design author does not need to create a full experience specification for work with no new or changed human effect.
- Routers do not repeat the full standard.
- Skills do not become a second source of policy.

Evidence required:

- Contract and template checks must prove that the section is present and that the impact value is valid.
- Conditional checks must prove that `direct`, `indirect`, and `none` use the correct fields.
- Planning evidence must map each experience promise to current PRD authority, planned work, or an explicit no-change result.
- Work acceptance must use observable outcomes instead of a generic statement such as `UX is good`.
- Direct human impact must receive suitable human review when a meaningful human path exists.
- Naive UAT must use a human executor and a realistic public goal when that mode is activated.
- Agent review can find likely problems. It cannot certify the lived human experience by itself.

Contract exception: The owner has explicitly approved this additional section for this design only. The current design contract does not yet include it. This use demonstrates the proposed form. It does not change the installed contract or make the section valid in other designs before later approved implementation.

## Decision

### D1. Establish One Canonical Human Experience Standard

Make Docs will define one normative Human Experience Standard:

> Every human-facing result must help a person complete a real goal without needless thought, effort, or doubt. The normal path must preserve context, reveal meaning and relationships, make state and next actions clear, and hide internal detail until it is useful. A person must not need to understand the system's internal model. Agents must shape a coherent experience, not merely expose correct capabilities. Work is not complete until proportionate evidence shows that the intended human remains oriented, capable, and in control.

The standard applies to people who use, read, operate, maintain, review, or recover the result.

The standard is technology-neutral. A downstream design must interpret it for the current product and human. The standard must not grow into a catalog of technology-specific interface rules.

Correctness remains required. Human experience does not permit false, incomplete, unsafe, or misleading behavior. When a precise machine contract and a clear human surface need different forms, both forms must preserve the same meaning.

### D2. Always Consider Human Experience

Every new agent-generated design and every substantial agent-authored design update must contain `## Human Experience Intent`.

The section always begins with exactly one impact value:

```md
Impact: `direct`
```

Allowed values are:

- `direct`
- `indirect`
- `none`

The agent must consider human experience for every design. The agent must add detailed experience work only when the impact is direct or indirect.

The section must describe the change governed by the design. It must not classify the design document merely because a person can read it.

### D3. Define the Three Impact Values

#### Direct

Use `direct` when the design adds or changes a surface that a person will perceive or use.

Examples include:

- commands, help, prompts, output, warnings, and errors;
- graphical interfaces, forms, views, navigation, and visual feedback;
- documentation, reports, instructions, and generated prose;
- APIs and SDKs that people must learn or operate;
- configuration that people author or review;
- file and directory structures that people navigate or maintain;
- install, upgrade, recovery, and operating workflows;
- review, approval, and handoff experiences.

Direct impact requires the full intent form in D4.

#### Indirect

Use `indirect` when the design does not change the normal interaction surface but can change a quality that affects a person.

Examples include:

- response time;
- reliability and availability;
- data accuracy or freshness;
- safety, privacy, or security;
- recovery and rollback;
- diagnostic quality and observability;
- maintenance burden;
- accessibility prerequisites;
- resource use that changes the person's wait, cost, or risk.

Indirect impact requires the full intent form in D4. The human effect can replace a direct human goal when no interaction occurs.

#### None

Use `none` only when the change adds no human interaction, changes no human-facing behavior, changes no material quality that affects a person, and preserves the existing experience.

Examples can include a proven internal refactor or a machine-only representation change whose external behavior, operation, recovery, and maintenance burden remain unchanged.

The following reasons are not sufficient by themselves:

- `The primary consumer is an agent.`
- `The component is headless.`
- `The change is in the backend.`
- `No graphical interface exists.`
- `The tests pass.`

People can still author, review, operate, maintain, recover, or rely on those systems.

`none` must stay valid when it is correct. Make Docs must not force false experience work. A reviewer can reject `none` when the reason ignores a real human effect.

### D4. Use One Small Conditional Section Contract

For `direct` and `indirect`, use this form:

```md
## Human Experience Intent

Impact: `direct`

Affected humans: <configured Persona slugs, human roles, or both>

Human goal or effect: <the goal the person must complete, or the material effect the person will experience>

Experience promises:

- <short observable promise>

Complexity kept out of the human path:

- <internal detail or burden that must not become required human knowledge>

Evidence required:

- <future proof needed to support acceptance>
```

For `none`, use this shorter form:

```md
## Human Experience Intent

Impact: `none`

Reason: <why the work has no direct or indirect human effect>

Preserved experience: <the existing human behavior or quality that remains unchanged>

Evidence required:

- <proof that the claimed boundary remains unchanged>
```

Rules:

- Put the section after `## Context` and before `## Decision`. Human intent must shape the decision.
- Keep the field names stable.
- Use prose and bullets. Do not add a second machine schema in the body.
- Do not add these fields to YAML frontmatter in the first version.
- Keep evidence statements prospective in a design. Do not claim that later testing has already happened.
- Do not copy the canonical standard into every design. Link to the contract and record only the local interpretation.
- When a design covers more than one distinct human path, group experience promises by path or affected human. Do not create more than one `Human Experience Intent` section.

### D5. Apply a Small Set of Universal Experience Principles

The governing contract will keep these principles concise. The dedicated reference can explain them and show examples.

#### Goal Before Model

Start with what the person is trying to do. Do not start with the database, schema, service, component, record type, evidence model, or internal command tree.

#### Orientation and Continuity

Show what happened, what the result belongs to, how it relates to prior state, and where the person is now.

Preserve names and context across steps. Do not make a person reconstruct continuity from opaque identifiers or repeated raw records.

#### Clear State and Next Action

Make success, partial success, waiting, failure, and blocked state distinct.

Name the next useful action when one exists. Do not show a next action merely to fill space.

#### Progressive Disclosure

Use a clear human default. Keep exact machine detail available through a deliberate secondary path such as a detail view, verbose mode, raw mode, JSON mode, log, receipt, or linked evidence record.

The secondary path must remain discoverable. Hiding detail must not remove auditability.

#### Human Language

Use names that match the person's task and domain. Explain necessary special terms at first use.

Do not make internal type names, field names, state codes, or identifiers the primary label when a stable human meaning exists.

#### Visible Meaning and Relationships

Show important ownership, parentage, sequence, membership, aliasing, dependency, and revision relationships in a form a person can understand.

Do not require a person to compare opaque identifiers to infer that two results refer to the same subject.

#### Proportionate Information

Show enough information for the current decision. Do not flood the normal path with every available field.

Do not hide a material caveat, risk, or limit merely to make the result look simple.

#### Control and Recovery

Make destructive effects, pending effects, confirmation boundaries, and recovery paths clear.

When a person can correct, retry, undo, inspect, or escalate, make that path visible at the useful time.

#### Coherent Structure

Apply the standard to navigation, file trees, directory names, document structure, command grammar, and information architecture.

Internal module boundaries do not automatically make a good human structure.

#### Accessibility and Inclusion

Design so suitable people can perceive, understand, operate, and complete the goal.

Human Experience Intent can identify accessibility effects and required evidence. It does not replace separate accessibility review or testing.

#### Calm, Confidence, and Control

Aim for a result that feels fluent and trustworthy. Beauty is not limited to decoration. Elegance means that a complex system presents a simple and truthful mental model for the current human goal.

### D6. Keep Human and Machine Surfaces Distinct but Semantically Aligned

A machine surface can expose stable identifiers, complete records, typed fields, revisions, receipts, and exact state.

A human surface should present the useful meaning first. It should expose machine detail only when the person needs it.

The two surfaces can use different rendering and information density. They must preserve the same semantic outcome. A human summary must not hide a failure or imply a relationship that the machine record does not contain.

The default path depends on the context. A TTY, graphical interface, rendered document, or interactive review can favor human presentation. A pipe, file export, API, or explicit machine flag can favor the machine contract.

This decision is not limited to command-line tools. It applies anywhere internal truth and human presentation need different forms.

### D7. Keep Persona and Human Experience as Separate Axes

A Persona answers `for whom`. Human Experience Intent answers `to what end and with what experience`.

The first version does not change the Persona schema in [PRD 47](../prd/47-persona-model.md).

For direct and indirect impact, `Affected humans` can use configured Persona slugs, clear human roles, or both. Use configured Personas when the project already has a suitable one. Do not invent a Persona only to complete the section.

An `agent` Persona does not count as a human. Agent-facing work can still have direct or indirect human impact through authoring, review, operation, maintenance, recovery, or reliance on agent output.

### D8. Carry Intent Through the Full Lifecycle

Human experience becomes a cross-cutting lifecycle lens. It does not become a new linear lifecycle stage.

#### Design

The design records impact and local intent. It shapes product and architecture choices before implementation.

#### Change Plan or Baseline Plan

The plan maps each experience promise to:

- the PRD that will own the requirement;
- the planned system resource, product surface, or project artifact;
- the work phase that will implement it;
- the evidence mode that can test it;
- any explicit deferral and durable obligation.

The plan must not repeat the full design section in every phase.

#### PRD

The PRD makes current experience requirements normative. It records observable user outcomes and cross-boundary rules in the PRD that owns the product capability.

One new adaptive PRD should own the Human Experience Standard, impact classes, intent section contract, lifecycle propagation, evidence boundary, and adoption policy.

Related PRDs should receive only the changes they own. They must link across boundaries instead of copying the new standard.

#### Work Backlog

The backlog traces implementation and acceptance to current PRD requirements and applicable experience promises.

Acceptance criteria must describe observable results. A criterion such as `The experience is intuitive` or `UX is good` is not sufficient.

#### Implementation and Review

Implementation preserves technical correctness and the intended human path.

Review checks the built result against the experience promises. Review must inspect the real human surface when one exists. Reading code or structured records alone is not enough for direct impact.

#### Coverage and Acceptance

The testing and UAT coverage pass treats Human Experience Review as a separate candidate from automated tests, architecture review, naive UAT, visual checks, accessibility testing, and visual regression.

One physical session can supply evidence to more than one mode. Each mode keeps its own verdict and sufficiency rules.

#### Release and Retrospective

Release claims stay bounded to the human paths and evidence that were tested.

Retrospective work can revise the standard, reference examples, or product-specific requirements when real use exposes a repeatable lesson.

### D9. Define Proportionate Evidence and Acceptance

Evidence depends on impact and risk.

For `direct` impact:

- require review of the real human-facing surface when it exists;
- require realistic human execution when a meaningful public or maintainer goal is ready and the accepted UAT policy activates it;
- keep naive UAT, informed manual review, accessibility testing, and visual review separate;
- record friction even when the person technically completes the goal;
- do not accept private coaching as proof of discoverability.

For `indirect` impact:

- use evidence suited to the stated effect;
- examples include performance profiles, reliability tests, recovery drills, data checks, privacy review, security evidence, observability review, or maintainer walkthroughs;
- require human execution only when it adds meaningful evidence.

For `none`:

- prove the claimed boundary;
- examples include interface compatibility, unchanged public output, invariant behavior, unchanged operating steps, or a focused regression test;
- do not run ceremonial UAT with no human goal.

An agent can draft intent, find likely issues, compare the result with stated promises, and prepare evidence. An agent cannot be the human executor for naive UAT and cannot self-certify joy.

### D10. Make Human Experience Normative Without Blocking Every Commit

The standard becomes product authority. It is not only advice.

The first version will enforce it at artifact validity, planning completeness, capability status, and acceptance. It will not create an automatic ban on every local commit, branch update, push, or draft phase close.

A phase can close as `Phase complete; capability status: partial` when later human evidence is not yet meaningful and a valid obligation preserves the work.

A capability with direct human impact cannot be claimed complete when required experience evidence is absent, a required human path remains untested, or an accepted material finding remains unresolved.

A reviewer or owner can accept a bounded caveat. The acceptance record must name the affected promise, evidence limit, risk, owner, and follow-on route.

### D11. Add a Contract, a Reference, and Template Support

The future system-resource set will use these logical resources:

| Resource | Stable URI | Purpose |
| --- | --- | --- |
| Human Experience Contract | `make-docs://system/contract/human-experience-contract.md` | Own the normative standard, impact values, conditional section form, propagation rules, and evidence boundary. |
| Human Experience Reference | `make-docs://system/reference/human-experience.md` | Explain the principles and give bounded examples for different types of work. |
| Design Template | Existing design template resource | Add the required conditional `Human Experience Intent` section. |

The upstream source for the new contract and reference belongs under `packages/docs/template/.make-docs/` in the accepted contract and reference families.

The plan must preserve the active W19 R1 system-resource URI and optional-projection model. It must not create a new resource type or a mandatory local projection.

The repo-root dogfood copy must follow the accepted upstream-first flow. The implementation must author upstream, build the package projection, reseed only the affected dogfood files, and then verify installed-package behavior.

The implementation will also update the applicable existing resources:

- lifecycle reference;
- design contract;
- output contract;
- design template;
- planning references and templates;
- PRD generation guidance;
- work backlog guidance and templates;
- coverage and UAT guidance;
- request-to-design and downstream planning prompts;
- router pointers;
- validation and parity checks.

The plan must resolve the exact affected resource set from current authority. It must not add copied policy to every prompt or router.

### D12. Use Routers Only for Discovery

Managed `AGENTS.md`, `CLAUDE.md`, and equivalent router blocks will point agents to the lifecycle and Human Experience Contract when the task creates or materially updates governed work.

Routers will not restate the full standard, impact rules, or evidence model.

This follows the existing router rule: route to authority instead of copying policy into every context.

### D13. Keep Skills Optional and Subordinate

The Human Experience Standard does not depend on a Skill.

A future Skill can help an agent inspect a command, interface, document, workflow, or project structure. A domain-specific Skill can add methods for visual design, accessibility, content design, or interaction testing.

Every Skill must read or route to the governing contract. It must not redefine the standard, impact values, section fields, acceptance gates, or evidence rules.

No first-version Skill is required unless change planning finds a real execution gap that current prompts, references, and tools cannot cover.

### D14. Add One Primary PRD and Bounded Cross-Boundary Updates

The downstream change plan should create one new adaptive PRD named for the Human Experience Standard and Intent. The planner must choose the next valid PRD number.

The new PRD will own:

- the canonical standard;
- `direct`, `indirect`, and `none` meanings;
- the conditional section contract;
- the cross-cutting lifecycle lens;
- the design-to-acceptance trace;
- the human-versus-machine presentation boundary;
- the evidence and self-certification limits;
- the prospective adoption rule.

The plan should reconcile these existing PRDs:

- [01 Product Overview](../prd/01-product-overview.md): add the standard as a key Make Docs capability and product quality boundary.
- [06 Template Contracts and Generated Assets](../prd/06-template-contracts-and-generated-assets.md): add the contract and reference resources, template delivery, upstream-first mutation, package projection, dogfood, and parity requirements.
- [14 Lifecycle Workflow and Coverage Passes](../prd/14-lifecycle-workflow-and-coverage-passes.md): add the cross-cutting lens, Human Experience Review candidate, propagation, phase status, and capability-close rules.
- [15 Agent Instruction Ownership and Managed Blocks](../prd/15-agent-instruction-ownership-and-managed-blocks.md): add only the router discovery and managed-block integration it owns.
- [23 Generated Document Metadata and Lifecycle Handoffs](../prd/23-generated-document-metadata-and-lifecycle-handoffs.md): confirm that Human Experience Intent remains body authority and does not add first-version frontmatter fields.
- [46 Naive End-User Acceptance Testing](../prd/46-naive-end-user-acceptance-testing.md): use applicable experience promises as scenario inputs while preserving human-executor, public-goal, anti-coaching, evidence, and finding rules.
- [47 Persona Model](../prd/47-persona-model.md): link Persona selection to `Affected humans` without changing the Persona schema.

The plan should inspect [03 Open Questions and Risk Register](../prd/03-open-questions-and-risk-register.md) for new risks or decisions. It should not add a risk merely because a new capability exists.

Feature PRDs should adopt product-specific experience requirements when they are next created or materially updated. The change must not copy the full standard into every active subsystem PRD.

### D15. Adopt Prospectively and Preserve Existing Authority

Existing designs, PRDs, plans, and work files remain valid when they predate the implemented contract.

After implementation:

- new agent-generated designs use the section;
- substantial agent-authored design updates add or reconcile the section;
- minor edits do not require unrelated document rewrites;
- accepted experience intent moves forward when the next plan or PRD change touches that capability;
- active work adopts the rule when a planned change affects its human path;
- archived documents remain historical and unchanged.

Install, upgrade, and reconfigure must preserve project-owned changes under existing ownership and conflict rules.

Existing projects do not require a repository-wide backfill. A focused adoption or migration can remain an explicit future option.

This design is the only pre-implementation exception. The owner authorized its additional section so it can serve as the first complete example.

### D16. Validate Meaning, Structure, Delivery, and Real Use

The downstream backlog must include these validation families.

#### Contract and Template Validation

- The design contract lists the new heading and its position.
- The design template contains one section with no unresolved placeholder after generation.
- `Impact` accepts only `direct`, `indirect`, or `none`.
- Direct and indirect fixtures require the full fields.
- None fixtures require `Reason`, `Preserved experience`, and `Evidence required`.
- A design cannot contain more than one Human Experience Intent section.
- A validator rejects a missing section only for documents governed after activation or for substantial updates that claim the new contract version.

#### Propagation Validation

- Plan fixtures map experience promises without copying full design prose.
- PRD fixtures place normative experience requirements in the owning PRD.
- Work fixtures trace tasks and acceptance to current PRD authority.
- Deferred work uses existing obligation rules instead of disappearing.
- `none` remains valid for a proven internal slice.

#### Delivery Validation

- Upstream contract, reference, and template sources agree.
- Package projection contains the intended resources.
- Dogfood projection matches the reviewed upstream bytes where ownership requires parity.
- Installed-project fixtures can resolve and read the stable resource URIs.
- Modified project-owned router text survives managed-block updates.

#### Agent Conformance Validation

- Supported agent harnesses create a direct-impact design with the full section.
- Supported agent harnesses create an indirect-impact design with a suitable human effect and evidence path.
- Supported agent harnesses create a valid `none` section without inventing interaction.
- A test asks the agent to classify a misleading headless or agent-facing case. The agent must still find the human effect when one exists.
- Deterministic validation checks structure. Human review checks whether the interpretation is coherent.

#### Human Outcome Validation

- At least one realistic installed-product flow proves that the standard changes an actual human-facing result instead of only document structure.
- The human review checks orientation, continuity, meaning, information amount, next action, and recovery where applicable.
- Naive UAT uses the installed or public path when that mode is activated.
- Findings can produce planned remediation or a linked obligation. They cannot be hidden by a technically successful result.

### D17. Prevent Checklist Compliance From Replacing Judgment

The standard must not become a score that agents can satisfy through keywords.

The contract will define the stable rule and section form. The reference will provide examples and questions. Product-specific requirements and evidence will carry the actual meaning.

Validators will check structure and exact values. They will not claim that a design is elegant, intuitive, beautiful, or joyful.

Reviewers will ask whether the experience promises follow from the stated human goal and whether the proposed evidence can reveal failure.

An agent that cannot infer a coherent human path must state the gap or request a product choice. It must not expose the internal model as the default merely because the requirements did not describe presentation in detail.

### D18. Keep the First Release Small

The first release includes:

- one governing contract;
- one explanatory reference;
- one required conditional design section;
- lifecycle, plan, PRD, work, review, and UAT propagation;
- router pointers;
- structural validators and examples;
- prospective adoption;
- installed-resource and agent-conformance proof.

The first release does not include:

- a new generic workflow engine;
- a mandatory Skill;
- a numerical experience score;
- a repository-wide migration;
- automatic rewriting of product interfaces;
- one aesthetic standard;
- agent-only certification of human quality.

## Alternatives Considered

### Put the Rule Only in Post-Implementation Checks

Rejected.

Late review can find friction. It cannot reliably correct a product whose architecture, data model, command grammar, navigation, or file structure already assumed that the internal model was the human model.

### Put the Rule Only in Work Backlogs

Rejected.

A backlog should derive from accepted design and PRD authority. A backlog cannot safely invent a cross-cutting product standard that its source requirements do not own.

### Put the Full Rule in Router Files

Rejected.

Routers are discovery surfaces. Repeating policy across router files creates drift, context cost, and ownership conflicts.

### Make a Skill the Primary Authority

Rejected.

Skills can be optional, unavailable, harness-specific, or selected only for some work. A Skill is a method. It is not stable product authority.

### Require a Full Experience Specification for Every Design

Rejected.

Internal work with no direct or indirect human effect must not create ceremonial user flows. The three impact values keep consideration universal while keeping detail proportionate.

### Make the Section Optional

Rejected.

An optional section would preserve the current failure mode. Agents would omit it when the requirements are highly technical, which is when the internal model is most likely to leak into the human surface.

### Treat Persona Selection as Sufficient

Rejected.

A Persona identifies an audience. It does not state the goal, experience promise, hidden complexity, or proof.

### Treat Naive UAT as the Whole Solution

Rejected.

Naive UAT tests a ready human goal. It does not set design intent. It also cannot replace automated tests, informed interaction review, accessibility testing, or owner judgment.

### Add Technology-Specific Rules to the Core Contract

Rejected.

The core contract must remain small and universal. The reference, product PRDs, and optional methods can adapt it to a CLI, interface, API, document, workflow, or file structure.

### Add Human Experience Fields to Frontmatter in the First Version

Rejected.

The body section must remain easy for people and agents to read. The first version does not yet need indexing or automation that justifies a second machine-readable representation.

## Consequences

### Benefits

- Human experience becomes product authority before implementation.
- Agents receive one common rule instead of many owner reminders.
- Technical complexity can remain rich without becoming the default human surface.
- The same model applies to command output, interfaces, documents, APIs, workflows, and project structure.
- Direct, indirect, and none keep effort proportionate.
- The section creates a visible handoff from design intent to evidence.
- Personas, review modes, UAT, accessibility, and machine contracts keep their separate roles.
- Existing projects adopt the rule without a forced rewrite.

### Costs

- Every governed design gains one required section.
- Contracts, templates, prompts, references, routers, validators, PRDs, and package delivery need coordinated changes.
- Reviewers must use judgment that deterministic validation cannot replace.
- Direct-impact work can reveal late remediation when current products already expose internal models.
- Supported harnesses need conformance proof so the rule works beyond one agent session.

### Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Agents copy generic experience language. | Require local goals or effects, observable promises, hidden complexity, and future evidence. |
| The section becomes long and repetitive. | Keep one section, stable fields, short promises, links to authority, and no copied standard. |
| Agents classify all work as direct. | Define indirect and none with valid examples and proportionate evidence. |
| Agents overuse none for technical work. | Reject headless, backend, agent-facing, or passing-tests claims when a real human effect exists. |
| Human quality becomes a false automated score. | Limit validators to structure. Keep meaning and acceptance with informed and human review. |
| The standard becomes visual-only. | Define human experience across commands, documents, APIs, workflows, operations, and structure. |
| Simplicity hides material truth. | Require semantic alignment and visible caveats. Keep full machine detail available. |
| New policy drifts across routers and Skills. | Keep one contract as authority. Use routers and Skills only as pointers or methods. |
| Existing projects become invalid. | Adopt prospectively and preserve existing ownership and archive rules. |
| Human review blocks internal progress too early. | Use impact classes, proportionate evidence, partial capability status, and durable deferral. |

### Accepted Trade-Off

Make Docs will add a small amount of structure to prevent a much larger form of complexity from reaching people.

The standard cannot make human judgment deterministic. That limit is accepted. The product will use deterministic checks for structure and evidence boundaries, then use informed and human review for meaning and lived experience.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs:

- [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)
- [Generated Metadata and Lifecycle Handoffs](2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- [Playbook Authoring Ergonomics and CLI Experience Remediation](2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md)
- [True Naive End-User Acceptance Testing](2026-07-27-true-naive-end-user-acceptance-testing.md)
- [Make Docs v2 Product Boundary and Missing Migration Recovery](2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)

Reason: Prior designs establish audience identity, human testing, generated-document handoffs, upstream template authority, current v2 product boundaries, and one feature-specific example of human-versus-machine rendering. This design creates a related but distinct decision area. It defines the missing product-wide standard that must shape work before implementation and remain traceable through acceptance.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md) (`make-docs://system/prompt/designs-to-plan-change.prompt.md`)

Why: This design changes active product authority and adds a new cross-cutting capability. The next step must map bounded updates across the PRD set, lifecycle, system resources, templates, prompts, routers, validators, package projection, dogfood, conformance evidence, and installed-project proof before any implementation begins.

Coordinate Handoff: unresolved; planner must resolve before writing.
