# Human Experience Contract

## Purpose and Standard

This contract owns the Human Experience Standard and required design form. Use the [Human Experience Reference](../references/human-experience.md) for examples. Its stable identity is `make-docs://system/contract/human-experience-contract.md`.

> Every human-facing result must help a person complete a real goal without needless thought, effort, or doubt. The normal path must preserve context, reveal meaning and relationships, make state and next actions clear, and hide internal detail until it is useful. A person must not need to understand the system's internal model. Agents must shape a coherent experience, not merely expose correct capabilities. Work is not complete until proportionate evidence shows that the intended human remains oriented, capable, and in control.

Correctness, safety, completeness, and truthful presentation remain required. A clear human surface must not hide a failure, risk, limit, or material fact.

## Impact

Classify the proposed change, not the fact that a person can read its design.

| Value | Meaning |
| --- | --- |
| `direct` | The change affects a surface a person perceives or uses. This includes commands, output, prompts, interfaces, documents, reports, configuration, APIs, SDKs, file trees, installation, review, recovery, and handoff. |
| `indirect` | Normal interaction stays the same, but performance, reliability, accuracy, freshness, safety, privacy, security, recovery, diagnostics, maintenance, accessibility support, resources, cost, or risk can affect a person. |
| `none` | The change has no direct or indirect human effect. Name the preserved experience and evidence that proves the boundary. |

Agent-facing or headless work is not automatically `none`. Consider the people who author, review, operate, maintain, recover, and rely on the result. Persona answers “for whom.” Intent answers “to what end and with what experience.” Use configured human Persona slugs, clear human roles, or both. Do not invent a Persona to fill the section. An agent acting in a Persona does not supply lived human experience evidence.

## Design Form

An activated design must contain exactly one `## Human Experience Intent` after `## Context` and before `## Decision`. Keep the fields in the document body, in the order below. Do not add frontmatter keys. Do not rename the fields through configuration.

For `direct` or `indirect`, use this form. Choose one impact value.

```markdown
## Human Experience Intent

Impact: `direct`

Affected humans: {{HUMANS}}

Human goal or effect: {{GOAL_OR_EFFECT}}

Experience promises:

- {{OBSERVABLE_PROMISE}}

Complexity kept out of the human path:

- {{INTERNAL_DETAIL_NOT_REQUIRED_FOR_THE_GOAL}}

Evidence required:

- {{PLANNED_PROOF}}
```

For `none`, replace the full form with this short form. Do not append another section.

```markdown
## Human Experience Intent

Impact: `none`

Reason: {{NO_DIRECT_OR_INDIRECT_EFFECT}}

Preserved experience: {{UNCHANGED_HUMAN_BOUNDARY}}

Evidence required:

- {{BOUNDARY_PROOF}}
```

Fill each field with real content. Resolve placeholders. Describe future evidence as planned evidence; do not claim a test or review happened before it did. If accepted authority does not support a coherent human goal or path, stop for the missing product choice.

## Principles

Apply the principles that matter to the goal:

- Put the human goal before the internal model.
- Preserve orientation and continuity. Show the subject, prior state, relationships, and current place.
- Distinguish success, partial success, waiting, failure, and blocked state. Name the next useful action.
- Show useful meaning first. Keep exact machine detail available through a discoverable secondary path.
- Use human names and explain needed special terms.
- Make ownership, parentage, sequence, membership, aliases, dependencies, and revisions clear where they matter.
- Give enough information for the current decision without flooding it or hiding a caveat.
- Make effects, confirmation limits, control, and recovery clear when needed.
- Use coherent navigation, file names, document structure, and command grammar.
- Support people who must perceive, understand, and operate the result. Use separate accessibility review when required.
- Aim for calm, confidence, and control. Beauty and elegance are not limited to decoration.

Human and machine surfaces may differ in form and density. They must preserve the same meaning and outcome. Exact identifiers, records, revisions, and receipts remain available for automation and audit. Context determines the useful default: interactive use may favor human presentation; pipes, exports, APIs, or explicit machine output may favor exact data.

## Lifecycle Duties

Carry accepted intent through the current [lifecycle](../references/lifecycle.md). Do not add a lifecycle stage or copy the full section into each later artifact.

- Design records intent and planned evidence.
- Planning maps every promise to an owning PRD, affected surface or artifact, work phase, evidence source or selected testing type, and obligation route.
- PRD reconciliation makes observable human outcomes normative in the capability owner.
- Work traces tasks and acceptance criteria to each promise or preserved boundary. “UX is good” is not an acceptance criterion.
- Implementation and review inspect the real human surface for direct impact when it is available.
- Coverage applies Human Experience Review to every applicable promise. Record `satisfied`, `material gap`, or `insufficient evidence` from suitable evidence.
- Release and completion claims stay within accepted evidence. Retrospective findings use the normal authority change process.

## Evidence and Completion

Match evidence to the impact, risk, and promise. Direct work needs structural and functional proof plus review of the real surface when it exists. Indirect work needs technical or operational evidence tied to the human effect, with human review when that effect is perceivable or matters to a decision. None needs proof of the preserved boundary.

Human Experience Review is required acceptance work, not a fifth testing type or a duplicate test verdict. Reuse suitable evidence. When proof is insufficient, select the smallest added activity that can answer the current question under the current testing authority and [coverage contract](coverage-pass-contract.md). Direct impact alone does not activate every testing type. Follow the [Unassisted Goal Testing contract](naive-uat-contract.md) for its conditional selection, qualified human executor, public path, and anti-coaching rules. Private coaching does not prove discoverability.

An agent can draft intent, inspect structure, compare evidence, and report likely issues and limits. It cannot self-certify joy or lived human experience. A complete section is necessary structure, not proof that the result is good for people.

| Conclusion | Completion effect |
| --- | --- |
| `satisfied` | Supports only the exact reviewed promise or claim. It does not broaden completion beyond the accepted evidence. |
| `material gap` | Blocks complete status for the affected promise or claim. Remediation and repeated proof, or an owner-accepted bounded caveat or narrower claim, can resolve the current completion effect. Partial status may continue only when a valid obligation preserves an accepted owed outcome; the obligation does not resolve the gap. |
| `insufficient evidence` | Supports no completion claim. Select the smallest added testing activity that can answer the current question under the current testing authority. |

Do not mark a directly affected capability complete while required evidence is missing or an accepted material finding remains unresolved. A bounded caveat names the promise, evidence limit, risk, owner, and follow-on route. A phase can close with partial capability status when an accepted later outcome has a valid [deferred obligation](deferred-obligation-contract.md) with owner, trigger, target, dependencies, and exit criteria. Skipped advisory work and `not-needed-now` do not create obligations. This contract does not impose an automatic ban on each local commit, push, or draft phase close.

## Adoption and Structural Validation

Apply the section to new agent-generated designs and substantial agent-authored design updates under this contract. Minor edits do not trigger unrelated rewrites. Existing and archived artifacts remain valid until applicable substantial work adopts the rule. Active work adopts it when a planned change affects its human path. Do not require a repository-wide backfill.

Authoring context selects required validation. Do not infer activation from file age, dates, names, diff size, or an agent-facing label. Without that context, a structural check may inspect an existing section but must not invalidate an older design merely because the section is absent. See the [design workflow](../references/design-workflow.md) for the internal validation call and its limits.

Structural checks verify one section, its position, one allowed impact value, stable conditional fields in order, nonempty content, and resolved placeholders. Headings and labels inside fenced examples do not count as live section structure. Diagnostics state the structural defect and repair. Meaning, intuition, beauty, usefulness, and joy require suitable review; do not build semantic judgments from keywords.

## Delivery Boundary

Use the existing contract and reference resource types and optional projection model. Keep the reference at `make-docs://system/reference/human-experience.md`. Author upstream, then build and review package and local projection parity under the [System Resource Contract](system-resource-contract.md). Preserve project ownership and conflict rules. No mandatory Skill, new resource type, Persona schema, or Human Experience frontmatter is required.
