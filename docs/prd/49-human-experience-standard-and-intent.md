---
title: "49 Human Experience Standard and Intent"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md"
---

# 49 Human Experience Standard and Intent

## Purpose

Make Docs must help agents build results that are technically correct and fit for people. This PRD defines one product-wide Human Experience Standard. It also defines how governed work states its human effect, carries that intent through the lifecycle, and proves the result with suitable evidence.

The standard is:

> Every human-facing result must help a person complete a real goal without needless thought, effort, or doubt. The normal path must preserve context, reveal meaning and relationships, make state and next actions clear, and hide internal detail until it is useful. A person must not need to understand the system's internal model. Agents must shape a coherent experience, not merely expose correct capabilities. Work is not complete until proportionate evidence shows that the intended human remains oriented, capable, and in control.

Correctness remains required. A clear human surface must not hide a failure, risk, limit, or material fact. A precise machine surface and a clear human surface can use different forms. They must preserve the same meaning.

## Scope

This capability applies when Make Docs creates or materially updates governed work. It applies to people who use, read, operate, maintain, review, or recover the result.

The capability includes:

- one canonical, technology-neutral standard;
- a required Human Experience Intent section in governed designs;
- the impact values `direct`, `indirect`, and `none`;
- lifecycle rules that carry intent into plans, PRDs, work, review, acceptance, and release claims;
- proportionate evidence rules;
- separate human and machine presentation rules;
- router discovery rules;
- prospective adoption rules; and
- upstream resource, package, dogfood, and conformance duties.

The first release does not define one visual style. It does not make a Skill mandatory. It does not add a score for beauty, joy, or usability. It does not require a full update of existing project authority.

## Terms

- **Human Experience Standard:** The normative product rule quoted in Purpose.
- **Human Experience Intent:** The design section that interprets the standard for one change.
- **Affected human:** A person who uses, reads, operates, maintains, reviews, recovers, or relies on the result.
- **Human surface:** The normal form that a person perceives or uses.
- **Machine surface:** A form made for exact automation, data exchange, audit, or program use.
- **Experience promise:** A clear statement of what the affected human must be able to understand, do, or trust.
- **Human Experience Review:** A review lens that checks evidence and the built result against accepted experience promises. It is not a fifth core testing type and does not require duplicate evidence.

## Component and Capability Map

- The Human Experience Contract owns the short standard, impact rules, required section shape, lifecycle duties, and acceptance boundary.
- The Human Experience Reference explains the principles, impact choices, examples, evidence modes, and common errors.
- The design template and design guidance require one conditional Human Experience Intent section.
- Plan, PRD, work, review, coverage, UAT, and lifecycle authorities carry the accepted intent without copying the full policy.
- Managed agent routers point to the governing authority.
- Structural validators check form and allowed values. They do not certify human quality.
- Package and dogfood checks prove that the installed resources match upstream authority.

## Requirements

### R-HX-01 Canonical Standard

1. Make Docs must publish one canonical Human Experience Standard.
2. The contract must keep the standard short, stable, and technology-neutral.
3. The reference can explain the standard and show examples.
4. Product-specific documents must link to the standard and interpret it for the current work. They must not create a competing standard.
5. Correctness, safety, completeness, and truthful presentation remain required.

### R-HX-02 Impact Classification

1. Each new or materially updated governed design must state one impact value: `direct`, `indirect`, or `none`.
2. `direct` means that the change affects a surface that a person perceives or uses. Examples include commands, help, prompts, output, user interfaces, documents, reports, configuration, public APIs or SDKs, file trees, installation, recovery, review, and handoff.
3. `indirect` means that the normal interaction does not change, but the result can affect a person through performance, reliability, accuracy, data freshness, safety, privacy, security, recovery, diagnostics, maintenance effort, accessibility support, resource use, cost, or risk.
4. `none` means that the change has no direct or indirect human effect.
5. A design that selects `none` must name the preserved experience and provide boundary evidence.
6. Agent-facing work does not become `none` only because an agent is the first consumer. The author must consider the people who author, review, operate, maintain, recover, or rely on the agent result.

### R-HX-03 Human Experience Intent Section

1. A design with `direct` or `indirect` impact must contain these stable fields after Context and before Decision:
   - `Impact`;
   - `Affected humans`;
   - `Human goal or effect`;
   - `Experience promises`;
   - `Complexity kept out of the human path`; and
   - `Evidence required`.
2. A design with `none` impact must contain these stable fields in the same location:
   - `Impact`;
   - `Reason`;
   - `Preserved experience`; and
   - `Evidence required`.
3. The section must use prose and bullets in the document body.
4. The first release must not add Human Experience Intent fields to frontmatter.
5. A document must contain only one Human Experience Intent section.
6. Evidence named in the design is prospective. Later artifacts must record the actual evidence and verdict.

### R-HX-04 Universal Principles

Governed work must apply the principles that matter to its human goal:

- **Goal before model:** Start with what the person wants to do. Do not make the internal model the starting point.
- **Orientation and continuity:** Show what happened, what the result belongs to, how it relates to prior state, and where the person is now.
- **Clear state and next action:** Make success, partial success, waiting, failure, and blocked states distinct. Name the next useful action when one exists.
- **Progressive disclosure:** Use a clear human default. Keep exact machine detail available through a discoverable secondary path.
- **Human language:** Use names that match the task and domain. Explain needed special terms. Do not use internal identifiers as the main label when stable human meaning exists.
- **Visible meaning and relationships:** Show important ownership, parentage, sequence, membership, aliasing, dependency, and revision relationships in a form a person can understand.
- **Proportionate information:** Show enough information for the current decision. Do not flood the normal path or hide a material caveat.
- **Control and recovery:** Make effects, confirmation limits, and recovery paths clear at the useful time.
- **Coherent structure:** Apply the standard to navigation, file trees, directory names, document structure, command grammar, and information structure.
- **Accessibility and inclusion:** Design so suitable people can perceive, understand, operate, and complete the goal. Use separate accessibility review when required.
- **Calm, confidence, and control:** Present a simple and truthful mental model for the current goal. Beauty and elegance are not limited to decoration.

### R-HX-05 Human and Machine Surfaces

1. A machine surface can expose stable identifiers, complete records, typed fields, revisions, receipts, and exact state.
2. A human surface must present useful meaning first and expose machine detail when the person needs it.
3. Human and machine surfaces can use different rendering and information density.
4. Both surfaces must preserve the same semantic outcome.
5. Context determines the default. A terminal, graphical interface, rendered document, or interactive review can favor human presentation. A pipe, export, API, or explicit machine flag can favor the machine contract.
6. Hiding internal detail must not remove auditability.

### R-HX-06 Persona Boundary

1. Persona and Human Experience Intent are separate product axes.
2. Persona answers `for whom`.
3. Human Experience Intent answers `to what end and with what experience`.
4. `Affected humans` can use configured Persona slugs, clear human roles, or both.
5. A project must not invent a Persona only to complete the Human Experience Intent section.
6. An `agent` Persona does not count as a human.
7. The first release must not change the Persona schema.

### R-HX-07 Lifecycle Propagation

1. Design must record the impact, affected humans, human goal or effect, promises, hidden complexity, and planned evidence.
2. Planning must map each accepted promise to its owning PRD, affected surface or artifact, work phase, evidence source or selected testing type, and obligation route.
3. PRD reconciliation must place observable human outcomes in the PRD that owns the affected capability.
4. Work must trace tasks and acceptance criteria to the governing promise or preserved boundary.
5. Acceptance text such as `UX is good` is invalid. Acceptance must name an observable result or evidence.
6. Implementation and review must inspect the real human surface when direct impact exists and that surface is available.
7. Coverage must explicitly apply Human Experience Review to every applicable experience promise. The review must record whether suitable evidence satisfies the promise, reveals a material gap, or remains insufficient. It must reuse suitable evidence when possible. When evidence is insufficient, [PRD 50](50-proportionate-testing-and-human-centered-validation.md) selects the smallest additional testing activity that can answer the question. Human Experience Review is required acceptance work, not a fifth testing type, and it must not create a duplicate test only to produce a separate test verdict.
8. Release and completion claims must stay within the accepted evidence.
9. Retrospective findings can revise current authority through the normal change process.

### R-HX-08 Proportionate Evidence

1. Evidence must match the impact, risk, and experience promises.
2. `direct` impact requires structural and functional evidence plus review of the real human-facing surface when it exists.
3. `direct` impact does not activate a testing type by itself. Testing selection follows [PRD 50](50-proportionate-testing-and-human-centered-validation.md). Unassisted Goal Testing activates only under the current-decision rules in [PRD 46](46-naive-end-user-acceptance-testing.md).
4. Private coaching is not proof of discoverability.
5. `indirect` impact requires technical or operational evidence tied to the stated human effect. It requires human review when the effect is perceivable or important to a human decision.
6. `none` impact requires proof of the claimed boundary. Suitable proof can include interface compatibility, unchanged public output, invariant behavior, unchanged operating steps, or a focused regression test.
7. The first release must include at least one realistic installed-product flow that proves an actual human-facing improvement.
8. Human Experience Review applies orientation, continuity, meaning, information amount, next action, recovery, and control as a lens over suitable evidence. It must not require a duplicate activity when existing evidence answers the accepted promise.
9. An agent can draft intent, find likely issues, compare a result with promises, and prepare evidence.
10. An agent cannot replace the qualified human executor for an Unassisted Goal Test. An agent cannot self-certify joy or lived human experience.

### R-HX-09 Completion and Obligations

1. The standard is product authority. It is not optional advice.
2. The first release must enforce the standard at artifact validity, planning completeness, capability status, and acceptance.
3. The first release must not create an automatic ban on each local commit, branch update, push, or draft phase close.
4. A phase can close with partial capability status when accepted later human evidence is still owed and a valid obligation preserves the outcome, owner, trigger, target, and exit criteria. `not-needed-now`, a declined Guided Progress Review, or skipped advisory testing is not an obligation.
5. A capability with direct human impact cannot be complete when evidence required by current authority is absent or an accepted material finding remains unresolved. Direct impact alone does not make every human path or testing type a gate.
6. A bounded caveat can be accepted only when the record names the affected promise, evidence limit, risk, owner, and follow-on route.

### R-HX-10 Resource and Router Authority

1. The Human Experience Contract must use the stable URI `make-docs://system/contract/human-experience-contract.md`.
2. The Human Experience Reference must use the stable URI `make-docs://system/reference/human-experience.md`.
3. Upstream source must live under `packages/docs/template/.make-docs/`.
4. Packaging, installation, upgrade, reconfigure, and dogfood must preserve the resource contract and existing ownership rules.
5. The resource must use the existing stable URI and optional projection model. The first release must not create a new resource type or a mandatory projection.
6. Managed `AGENTS.md`, `CLAUDE.md`, and equivalent router blocks must point agents to lifecycle and Human Experience authority when governed work is created or materially updated.
7. Routers must not copy the full standard, impact rules, or evidence model.
8. The first release must not make a Human Experience Skill mandatory.
9. An optional Skill must remain subordinate to the contract and reference. It can aid discovery, drafting, review, or evidence preparation. It must not copy the full policy or own product decisions.

### R-HX-11 Validation Boundary

1. Structural validation must check the required section, one allowed impact value, stable field names, section count, and conditional shape.
2. Structural validation must not claim to prove beauty, elegance, intuition, usefulness, or joy.
3. Conformance must include generated-artifact checks, installed-resource checks, and agent-behavior scenarios.
4. Agent-behavior scenarios must show correct impact classification, lifecycle propagation, real-surface evidence selection, and a valid `none` boundary.
5. Reviewers must treat a complete section as necessary evidence, not as proof that the result is good for people.

### R-HX-12 Prospective Adoption

1. Existing designs, PRDs, plans, work files, and archives remain valid when they predate the implemented contract.
2. New agent-generated designs must use the section after implementation.
3. A substantial agent-authored design update must add or reconcile the section.
4. A minor edit must not cause an unrelated document rewrite.
5. Active work must adopt the rule when a planned change affects its human path.
6. Archived documents remain unchanged.
7. Install, upgrade, and reconfigure must preserve project-owned changes under the existing ownership and conflict rules.
8. The first release must not require a repository-wide backfill.

## Contracts and Data

The Human Experience Intent section is body authority. It does not add frontmatter keys or a new machine schema.

For `direct` and `indirect` impact, the form is:

```markdown
## Human Experience Intent

Impact: `direct`

Affected humans: ...

Human goal or effect: ...

Experience promises:

- ...

Complexity kept out of the human path:

- ...

Evidence required:

- ...
```

For `none` impact, the form is:

```markdown
## Human Experience Intent

Impact: `none`

Reason: ...

Preserved experience: ...

Evidence required:

- ...
```

Downstream artifacts must link to the owning requirement and record their own mapping, work, evidence, or verdict. They must not copy the full intent section into every artifact.

## Integrations

- [PRD 01](01-product-overview.md) owns the product-wide capability and quality boundary.
- [PRD 06](06-template-contracts-and-generated-assets.md) owns upstream resources, packaging, projection, dogfood, and installed parity.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) owns lifecycle propagation, testing selection consumption, obligations, and phase-close rules.
- [PRD 15](15-agent-instruction-ownership-and-managed-blocks.md) owns managed router discovery.
- [PRD 23](23-generated-document-metadata-and-lifecycle-handoffs.md) owns the body-authority and no-new-frontmatter boundary.
- [PRD 46](46-naive-end-user-acceptance-testing.md) owns conditional Unassisted Goal Testing, qualified-human execution, public paths, anti-coaching, and findings.
- [PRD 47](47-persona-model.md) owns the Persona boundary and affected-human link.
- [PRD 50](50-proportionate-testing-and-human-centered-validation.md) owns testing selection, the four-type taxonomy, human testing experience, evidence reuse, and gate effects. Human Experience Review remains a lens owned here.

## Rebuild Notes

A rebuild must preserve this authority in three layers:

1. The contract states the normative rule and required form.
2. The reference explains application and examples.
3. Lifecycle resources carry the intent into owned requirements, work, evidence, review, and completion claims.

The implementation must update upstream template authority first. It must then project the resources into the maintainer repository through the normal dogfood path. Installed-product evidence must use the real installed or linked Make Docs path.

## Acceptance Scenarios

1. A design for a public command selects `direct`, names the affected humans and goal, states observable promises, and requires review of the installed command output.
2. A design for an internal performance change selects `indirect`, states the human effect, and requires performance evidence tied to that effect.
3. A design for a refactor selects `none`, names the preserved public behavior, and proves the boundary without ceremonial UAT.
4. A plan maps each accepted promise to an owning PRD, work phase, surface, and evidence source or selected testing type.
5. A reconciled PRD makes the observable human outcome normative in the capability owner without copying the full contract.
6. A backlog task names a testable human result. It does not use `UX is good` as acceptance.
7. A coverage review applies Human Experience Review as a lens over suitable evidence and does not create a fifth testing type or duplicate run.
8. A human-facing result presents useful meaning first and keeps exact machine detail available through a discoverable secondary path.
9. A managed agent router points to the governing Human Experience authority and does not copy the full policy.
10. A validator rejects a missing or malformed section but does not claim that a valid section proves a joyful experience.
11. An installed-product flow shows that a person can remain oriented, understand relationships, see state, and find the next useful action without reading the internal model.
12. A pre-existing design remains valid until substantial work changes its human path.

## Non-Requirements

- A universal visual style or aesthetic system.
- Automatic rewriting of product interfaces.
- A generic workflow engine.
- A mandatory Human Experience Skill.
- A numeric quality score.
- Agent-only certification of human experience.
- A full migration of existing project documents.
- A new resource type or mandatory resource projection.
- New Human Experience frontmatter fields.
- A replacement for correctness, security, privacy, accessibility, performance, visual, or Unassisted Goal Testing authority.

## Requirement History

### 2026-08-28 — W21 R0

- Affected requirement or section: terms, `R-HX-07`, `R-HX-08`, `R-HX-09`, integrations, acceptance scenarios, and non-requirements.
- Previous contract: Human Experience Review was a separate review verdict, and direct impact broadly activated naive UAT when a meaningful goal was ready.
- Replacement contract: Human Experience Review is a required acceptance lens that records a conclusion against each applicable promise while reusing suitable evidence, and PRD 50 selects the smallest additional testing activity only when evidence is insufficient. Unassisted Goal Testing is conditional and advisory by default under PRD 46.
- Rationale: The Human Experience Standard must govern the built result without creating a fifth testing type, duplicate evidence, ceremonial human work, or false phase gates.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

## Source Anchors

- [Human Experience Standard and Intent design](../designs/2026-08-28-human-experience-standard-and-intent.md)
- [Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [Product Overview](01-product-overview.md)
- [Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [Agent Instruction Ownership and Managed Blocks](15-agent-instruction-ownership-and-managed-blocks.md)
- [Generated Document Metadata and Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md)
- [Unassisted Goal Testing](46-naive-end-user-acceptance-testing.md)
- [Persona Model](47-persona-model.md)
- [Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md)
