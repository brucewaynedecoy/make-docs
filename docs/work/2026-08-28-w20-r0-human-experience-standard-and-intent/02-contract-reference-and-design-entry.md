---
title: "Phase 2: Contract, Reference, and Design Entry"
kind: "work"
status: "completed"
coordinate: "W20 R0 P2"
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# Phase 2: Contract, Reference, and Design Entry

## Purpose

Create one canonical rule, one useful interpretation reference, and one small design entry point.

## Overview

The standard must help agents protect human understanding while they solve complex technical problems. It must not become a large copied checklist. This phase puts the universal policy in one contract. It puts adaptable guidance and examples in one reference. It makes each affected design state a local human goal, observable promises, hidden complexity, and required evidence.

The conditional section is necessary but not sufficient. Structural validation can prove that the right form exists. It cannot prove that a result is beautiful, intuitive, coherent, or joyful. Later phases must inspect the built human path.

## Source PRD Docs

- [PRD 01 — Product Overview](../../prd/01-product-overview.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 15 — Agent Instruction Ownership and Managed Blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 23 — Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- Risk: Apply the `R-033` control that field presence cannot replace a coherent human result.
- Obligations: None active at phase start. Create an `O-###` record only for an accepted deferral.
- Unassisted Goal Testing: `not-needed-now` in this phase. Phase 4 decides whether one bounded scenario can answer a material current uncertainty.
- Findings: Structural or interpretation defects found here remain open until fixed or given durable ownership.

## Stage 1: Canonical Upstream Resources

### Tasks

- [x] t1: Add `packages/docs/template/.make-docs/system/contracts/human-experience-contract.md` as the sole normative source for the Human Experience Standard.
- [x] t2: Define `direct`, `indirect`, and `none`, the conditional section forms, field order, design position, lifecycle propagation, evidence levels, validation limits, and prospective activation in the contract.
- [x] t3: Add `packages/docs/template/.make-docs/system/references/human-experience.md` with adaptable guidance for commands, interfaces, documents, APIs, workflows, file trees, and indirect effects.
- [x] t4: Add examples and counterexamples for orientation, continuity, meaning, information amount, next action, recovery, control, terminology, human-and-machine separation, and valid `none` cases.
- [x] t5: Review the reference to ensure that it explains the contract without adding a second policy source.

### Acceptance criteria

- One contract owns the universal standard.
- One reference helps agents apply the standard across different product types.
- The resources protect the human result without reducing it to style, preference, or field presence.
- Direct, indirect, and none cases are clear and mutually usable.
- The reference does not claim that an agent can certify a person's lived experience.

### Dependencies

- Phase 1 authority and requirement trace.

## Stage 2: Design Contract, Template, Workflow, and Prompt

### Tasks

- [x] t6: Update the upstream design contract so each activated design has exactly one `## Human Experience Intent` section after `## Context` and before `## Decision`.
- [x] t7: Update the upstream design template with the direct or indirect fields: `Impact`, `Affected humans`, `Human goal or effect`, `Experience promises`, `Complexity kept out of the human path`, and `Evidence required`.
- [x] t8: Add the short `none` form with `Impact`, `Reason`, `Preserved experience`, and `Evidence required`.
- [x] t9: Update the design workflow so the agent evaluates the change's human effect, not the fact that a person can read the design document.
- [x] t10: Update the request-to-design prompt so the agent resolves Persona or human roles, states the goal before implementation detail, states observable promises, and stops for a missing product choice.
- [x] t11: Keep Human Experience data in the document body. Do not add first-release frontmatter fields.
- [x] t12: Add direct, indirect, none, misleading headless or agent-facing, and missing-product-choice examples to the design-generation fixture set.

### Acceptance criteria

- The section has one stable position and one valid conditional form.
- A direct or indirect design starts with the person or material human effect and not the internal data model.
- A valid none design names the preserved experience and boundary proof without invented interaction.
- The prompt can stop when authority does not support a coherent human path.
- The section remains useful context for later plan, PRD, work, review, and acceptance work.

### Dependencies

- Stage 1 canonical resources.

## Stage 3: Structural Validation and Fixtures

### Tasks

- [x] t13: Extend the current document-validation owner around `validateGeneratedDocumentMetadata` or add the smallest dedicated design-body validator if separation is clearer.
- [x] t14: Validate one section in the required position, one allowed impact value, the correct conditional fields, duplicate sections, empty values, and unresolved template placeholders.
- [x] t15: Implement prospective activation so pre-activation historical designs remain readable and valid.
- [x] t16: Add passing fixtures for direct, indirect, none, and historical cases.
- [x] t17: Add structural failing fixtures for missing fields, invalid impact, duplicate section, wrong section order, and unresolved placeholders. Keep a well-formed but misleading `none` claim as an interpretation-review negative under t29; do not automate human meaning.
- [x] t18: Ensure validator messages state structural facts and useful recovery. Do not report that a design is beautiful, intuitive, joyful, or coherent.
- [x] t19: Add focused tests for all validator outcomes and for compatibility with existing document metadata validation.

### Acceptance criteria

- Valid conditional forms pass and invalid forms fail with clear recovery.
- Historical designs do not fail only because they predate activation.
- A headless or agent-facing label does not make a real human effect disappear.
- Structural checks do not claim to judge the quality of the lived experience.
- The original failure can still be found later even when every required field is present.

### Dependencies

- Stage 2 settled section form.
- Current document-validation preflight from Phase 1.

## Stage 4: Catalog, Rules, Stable URIs, and Projection

### Tasks

- [x] t20: Prove that the existing contract and reference Markdown patterns in `packages/docs/template/.make-docs/system-resources.catalog.json` include the new resources with stable URIs `make-docs://system/contract/human-experience-contract.md` and `make-docs://system/reference/human-experience.md`.
- [x] t21: Update `packages/cli/src/rules.ts` so applicable install profiles include the new resource paths without creating a new resource family.
- [x] t22: Verify `packages/cli/src/tool-directory.ts`, provider catalog validation, and resource resolution accept and discover the new files through existing system-resource behavior.
- [x] t23: Extend resource-provider, resolver, operation-surface, consistency, and template-link tests for list and read behavior, stable identity, local paths, and offline use.
- [x] t24: Update manifest and package-projection expectations through the supported generation path. Do not hand-author generated manifest state.
- [x] t25: Project the reviewed upstream files into the repository dogfood instance only after upstream tests pass.
- [x] t26: Verify upstream, package projection, and dogfood parity under the current source-of-truth contract.

### Acceptance criteria

- Supported agents can discover and read both stable URIs.
- The existing contract and reference resource types remain sufficient.
- Profile selection, provider inventory, resolution, manifest, and template links agree.
- Dogfood files derive from reviewed upstream authority.
- No project-owned content is treated as upstream source.

### Dependencies

- Stages 1 through 3.

## Stage 5: Review, Validation, and Phase Closeout

### Tasks

- [x] t27: Run focused contract, template, validator, catalog, resource, consistency, and link tests.
- [x] t28: Run the current `npm run validate:defaults` command and record the result.
- [x] t29: Review direct, indirect, none, misleading, and historical fixtures against PRD 49 and the canonical contract.
- [x] t30: Apply required Human Experience Review to the design-entry promises. Reuse the fixture and validator evidence. Record `satisfied`, `material gap`, or `insufficient evidence` for each applicable promise.
- [x] t31: Give each material finding a disposition. Remediate and repeat affected proof, accept a bounded caveat or narrower claim, or record partial status. Create a durable obligation only when an accepted future outcome remains owed.
- [x] t32: Record Phase 2 requirement dispositions and capability status with evidence.

### Acceptance criteria

- The contract is normative, and the reference remains explanatory.
- The template and validator agree on position, impact values, conditional fields, and activation.
- Stable URIs work through supported resource access.
- The entry keeps the human goal and promises visible without forcing internal complexity into the normal path.
- A complete section is not accepted as proof that the final human result is good.
- Phase 3 receives stable resources and no unresolved material finding.

### Dependencies

- Stages 1 through 4.

### Closeout Notes

- Testing decision(s): Use focused Automated Implementation Testing. Keep Performance Testing, Guided Progress Review, and Unassisted Goal Testing `not-needed-now`. Record Human Experience Review conclusions without creating a fifth testing type or duplicate verdict.
- Phase / capability status: P2 is `implemented`, including the owner-approved local sync and final parity. The full Human Experience capability remains incomplete. P3 has not started.

## Implementation and Evidence

### Read This First

The owner authorized this P2 implementation plan on 2026-09-08. The starting point is clean `make-docs-v2` at `cc113d37`. One agent performed the work. No branch, worktree, progress Store record, or parallel state file was created. Code and document MCP indexes were unavailable, so source-file reads supplied the evidence.

Source, package, and installed copies now deliver the shared rules and design entry. The owner approved the exact expanded local sync after its two non-P2 effects were explained. Final local reads, byte comparisons, and affected test reruns prove P2 delivery. This does not claim the later P3–P5 human outcome.

### Delivered Source and Interfaces

- `packages/docs/template/.make-docs/system/contracts/human-experience-contract.md` owns the standard, impact, forms, principles, lifecycle duties, evidence limits, adoption, and delivery boundary. The peer reference explains realistic examples without adding policy.
- The upstream design contract, template, workflow, and request-to-design prompt carry one conditional section. The short none form replaces the full form. Human Experience data stays in the body.
- `packages/cli/src/design-body.ts` exports `validateDesignBody(markdown, mode)`. Mode is `required` or `if-present`, with `if-present` as the default. Findings retain `code`, `field`, and a repair message. Checks ignore fenced and commented example structure.
- `validateGeneratedDocumentMetadata` accepts optional `humanExperienceMode`. It combines design findings with the existing metadata findings. No new CLI command, flag, MCP operation, frontmatter field, or Persona schema was added.
- The two existing internal closeout helpers accept `humanExperienceRequiredPaths`. Authoring context selects the changed designs that require the section. Other changed designs use `if-present`. The selected Git scope still bounds the check. Untracked files are enumerated individually so newly created designs can be checked. File dates, names, and diff size never select activation.
- Shared resource selection includes both resources. Existing catalog patterns supply the stable identities. Resource list/read and optional local copies use the existing provider and manifest path.

### Interpretation Review

| Case | Observation and expected conclusion |
| --- | --- |
| Direct command | The fixture names an import operator, safe retry, distinct state, and detail access. The evidence plan calls for installed output and retry proof. The form is valid; later product proof is still owed. |
| Indirect reliability | The fixture preserves normal controls while promising retained work through restart. Technical evidence targets lost or repeated rows. It does not invent a new interaction. |
| None refactor | The short form names unchanged output, errors, steps, and operating bounds. Those are claims to prove, not a pass granted by the label. |
| Misleading agent-facing none | The structurally valid negative says only agents matter while operators receive changed recovery steps. The validator correctly accepts the form. Interpretation review rejects the none claim because its own text names a direct human effect. |
| Missing product choice | The reference's account-recovery example lacks the authority to decide who can restore access. The correct response is to stop for that product choice. The example does not invent permission rules or claim an agent run occurred. |
| Historical and minor edit | Tests preserve a missing section in default mode and reject it only under explicit required context. This is structural compatibility proof, not a file-age rule. |

### Delivery Finding and Ownership

The normal `setup --yes --dry-run` preview has no installer safety stop. It plans the six P2 resource changes plus two changes outside P2: creation of `.make-docs/system/references/naive-uat-validation.md` and removal of the retired `.make-docs/contracts/system/playbook-contract.md`. It skips and preserves the project-owned Playbook. Current harness, resource, and optional integration selections stay the same.

The agent first stopped as the approved plan required. The owner then explicitly approved this exact sync, including the two extra file changes. [PRD 03 R-033](../../prd/03-open-questions-and-risk-register.md#r-033-human-experience-structure-could-become-checklist-compliance) records the finding and its resolution. The normal setup command applied the reviewed changes and generated manifest state. No manifest was hand-edited and no project-owned Playbook content was changed. D-031 retains its existing maintenance owner.

The sandbox attempt stopped at the Store check before project changes. The same approved command succeeded with access to the machine Store. The normal installer retained its backup under `.make-docs/backup/2026-09-09T01-50-09.069Z/`, including the prior manifest, four replaced resource files, and the retired contract. No separate progress Store record was created. The backup is retained as recovery data, not product source.

Final proof: all six P2 resources match upstream, generated package, and installed bytes. Both stable URI reads report `managed-snapshot` and `clean-projection`. Saved selections and the project-owned Playbook match their pre-sync state. A new setup preview has zero creates, updates, or removals; it only reports the preserved Playbook as skipped.

### Testing Decisions and Results

Product maturity is early `2.0.0-rc` maintainer work. Automated checks decide whether P2 structure, caller behavior, resource access, and delivery meet the accepted scope. The executor is the implementing agent. P2-introduced failures block a full P2 implementation claim. The existing D-031 defaults failure limits the all-green claim and remains outside this repair scope.

The budget is one reused baseline and one affected source/delivery pass, with affected reruns for a material edit or failure. Stop at sufficient scoped proof or an unresolved material delivery limit. Retain command identity, result, and limits here; do not duplicate raw logs. Re-run when relevant source, caller context, resource bytes, or the claimed delivery surface changes.

| Check | Result and limit |
| --- | --- |
| Baseline from this task's preflight | PRD authority passed. Defaults had 45/46 passing with only D-031 missing from the test's expected heading inventory. |
| Focused source checks | 141/141 passed across ten suites: design body, metadata, Human Experience resources, operations, operation domains, provider identity, resolver, tool directory, system assets, and template links. |
| Broader affected delivery checks | Before sync, 174/175 passed across thirteen suites. The sole failure exposed the old local prompt. After sync, the affected provider-integration and Human Experience resource suites passed 7/7. Unchanged source and other delivery results are reused. All 175 cases now have passing evidence at their applicable scope. |
| Defaults before and after local sync | Before sync, 42/46 passed with three local-copy parity failures and the known D-031 baseline. After sync, 45/46 pass. All three P2 parity failures are resolved. Only D-031 remains; no all-green defaults claim is made. |
| Corrected indirect fixture | Design-body suite passed 22/22 after its indirect example was made specific to restart reliability. |
| Package | `npm run prepack -w packages/cli` completed the supported package copy and build. All six P2 resource files match upstream byte-for-byte in the generated package copy. |
| Final changed-document checks | All 17 current changed Markdown files passed path hygiene. The 15 non-template documents passed metadata and link checks. Retained installer backups are recovery snapshots, not current-document inputs. Raw design-template metadata and links use the existing defaults/template suites; rendered intent forms use the dedicated design-body suite. |
| Authority and path hygiene | PRD authority passed: 39 PRDs, 1,065 Markdown files, 170 structured files, and 822 authority links. Manifest-selected path hygiene passed after sync: 85 files, no errors or rewrites. `git diff --check` passed. |

Focused commands:

```sh
npm test -w packages/cli -- tests/design-body.test.ts tests/document-metadata.test.ts tests/human-experience-resources.test.ts tests/operations.test.ts tests/operation-domains.test.ts tests/resource-identity-provider.test.ts tests/resource-resolver.test.ts tests/tool-directory.test.ts tests/system-assets.test.ts tests/template-links.test.ts tests/p4-projection-lifecycle.test.ts tests/p3-operation-surfaces.test.ts tests/resource-provider-integration.test.ts
npm run prepack -w packages/cli
node --import tsx packages/cli/src/index.ts setup --yes --dry-run
node --import tsx packages/cli/src/index.ts setup --yes
npm test -w packages/cli -- tests/resource-provider-integration.test.ts tests/human-experience-resources.test.ts
npm run validate:defaults
node --import tsx packages/cli/src/index.ts run prd authority validate --target-root .
python3 .make-docs/scripts/check_path_hygiene.py --repo-root .
git diff --check
```

Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`, with `not-applicable` gate effect and zero run budget. No runtime speed, lived-use, or unassisted-success claim is being made. Reconsider only if a material current uncertainty appears or the owner requests a review. P4 retains conditional scenario selection and P5 retains the real installed-product human outcome. No `O-###` or `NUAT-###` item was created.

### P2 Human Experience Review

Reviewer: the implementing agent. The reviewed surface is source and installed Markdown, rendered fixture content, actual validator messages, and stable resource read results. This is not an independent review, a visual browser test, or a lived human test. Suitable structural and functional evidence is reused; no fifth testing type or duplicate verdict is created.

| Promise | Evidence and observation | Conclusion and limit |
| --- | --- | --- |
| Find the person, goal, and proof in one place | The template places one conditional section between Context and Decision. Valid fixtures use the same order. | `satisfied` for source, generated-fixture structure, and the byte-identical installed template. Lived ease of use is not claimed. |
| Keep none brief without invented interaction | The contract supplies a four-field replacement; the none fixture validates and names preserved boundaries. | `satisfied` for form and reviewable meaning. Boundary proof for a real refactor remains the consuming work's duty. |
| Make a structural failure repairable | Negative tests return the field, defect, and action. Duplicate sections, empty values, wrong forms, and placeholders have direct repair text. | `satisfied` for diagnostics inspected by the agent. Human ease of repair has not been tested. |
| Keep human meaning separate from form | The misleading none negative passes structure and fails interpretation review. Contract and reference retain evidence limits. | `satisfied` for P2's boundary. This does not close R-033 or certify lived experience. |
| Make the entry available through the local installation | Temporary installs prove both resource identities with and without optional local copies. After the approved sync, real local reads report clean projections and all six P2 files match source and package bytes. | `satisfied` for P2 resource delivery. Later installed agent behavior and actual human improvement remain P5 work. |

### Coverage and Handoff

| Surface | Verdict and result |
| --- | --- |
| System resources | `create` for the contract/reference; `update-existing` for the four design-entry resources. Upstream, package, and local projection match. The approved sync also refreshes the existing UAT reference and retires the old contract with a retained backup. |
| PRDs | `update-existing` for the R-033 delivery finding and its resolution; `none` for other PRDs because the implementation follows existing requirements. |
| Plan and work | `update-existing` for this phase and index. Clarify t17 and t20 under the accepted P1 trace, without changing task IDs or product policy. |
| Developer and user guides | `none`: the shared contract, reference, and design workflow own the new entry. No separate guide or Skill is needed. |
| History | `create`: one current session record at the current `.make-docs/archive/history/` path. Current PRD/path authority and the accepted P1 route govern over the installed history resource's old path. |
| Obligations and scenarios | `none`: no newly accepted future outcome or activated human test. Existing P3–P5 work keeps its owners. |

Orphan audit: P2 source ownership, testing, and the resolved delivery limit are recorded. P3 owns lifecycle propagation and routers. P4 owns broader failure-revealing review. P5 owns installed conformance, adoption, and actual human improvement. No later duty is silently claimed as complete.

P2 status is `implemented`: all 32 tasks are complete, local delivery is proved, and no P2 material finding remains unresolved. The existing D-031 defaults failure remains disclosed. The owner requested P2 closeout and a local commit on 2026-09-08 after the implementation result, approved sync, and known defaults-test limit were reported. P2 is accepted and closed for this bounded result. The local commit includes P2 source, tests, upstream and installed resources, generated manifest updates, the approved retired-contract removal and UAT reference addition, and these closeout records. The installer backup stays on disk outside the commit. The full Human Experience capability remains incomplete. P3 is not started or authorized. Publication and release remain outside this authority.
