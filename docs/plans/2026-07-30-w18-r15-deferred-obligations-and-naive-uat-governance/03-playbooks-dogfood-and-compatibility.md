---
title: "W18 R15 Phase 3: Playbooks, Dogfood, and Compatibility"
kind: "plan"
status: "draft"
coordinate: "W18 R15"
---

# W18 R15 Phase 3: Playbooks, Dogfood, and Compatibility

## Purpose

Define the reusable human/agent workflows, upstream-to-installed projection, maintainer dogfood adoption, and conservative treatment of existing projects and evidence.

## New Playbooks

Author these Playbooks upstream:

| Upstream source | Installed projection | Persona | Audience and responsibility |
| --- | --- | --- | --- |
| `packages/docs/template/docs/assets/playbooks/user/naive-uat-tester.playbook.md` | `docs/assets/playbooks/user/naive-uat-tester.playbook.md` | `user` | Qualified tester: consent, black-box goal attempt, allowed public help, evidence awareness, honest observations, and tester-owned teardown |
| `packages/docs/template/docs/assets/playbooks/agent/naive-uat-facilitator.playbook.md` | `docs/assets/playbooks/agent/naive-uat-facilitator.playbook.md` | `agent` | Facilitator: isolation, setup, anti-coaching, intervention logging, observation, evidence capture, evaluation, finding routing, and cleanup verification |

The files conform to the current Playbook v2 contract. The tester and facilitator workflows remain separate because combining them would expose operator-only setup, success outcomes, and evaluation rules.

Projects may author a developer-targeted facilitator adaptation, but it must link to and obey the shared contract. This plan chooses the `agent` primitive for the shipped facilitator Playbook because Make Docs agents perform the lifecycle closeout workflow; it does not create a `naive-tester` persona.

## Lifecycle Playbook Update

Update:

`packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`

The lifecycle Playbook must:

- load the deferred-obligation and naive-UAT contracts;
- enumerate orphan and testing/UAT candidates at stage and phase boundaries;
- invoke or link the facilitator workflow when a user-observable slice activates;
- accept `none` only with its complete routed rationale;
- preserve separate test/review verdicts;
- require scenario, outcome, finding, disposition, and Project State evidence at the phase gate;
- use exact phase/capability completion language;
- stop before implementation, commit, push, publish, or release unless separately authorized.

The lifecycle Playbook must not copy operator-only content into the tester packet.

## Upstream-First Delivery

Implementation order is mandatory:

1. Author or modify reusable defaults under `packages/docs/template/`.
2. Run source validation against that tree.
3. Project the planned sources through the existing template delivery/dogfood mechanism.
4. Verify the maintainer's installed `.make-docs/` and `docs/` copies against their upstream sources and manifest.
5. Validate a fresh instantiated-project fixture.

Direct edits to the maintainer's installed copies are permitted only as generated projection output from the upstream source state. If the current projection tooling cannot materialize a new file class, the implementation stops and records that as a blocker; it does not hand-maintain a second source.

## Projection Map

The downstream project receives:

- `.make-docs/contracts/system/deferred-obligation-contract.md`;
- `.make-docs/contracts/system/naive-uat-contract.md`;
- `.make-docs/templates/system/naive-uat-scenario.md`;
- updated `.make-docs` contracts, references, prompts, templates, and routers from Phase 2;
- `docs/assets/playbooks/user/naive-uat-tester.playbook.md`;
- `docs/assets/playbooks/agent/naive-uat-facilitator.playbook.md`;
- the updated `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`;
- an updated `docs/prd/03-open-questions-and-risk-register.md` default containing the empty fixed deferred-obligations section and instructions.

Project-specific `O-###`, `NUAT-###`, finding, requirement, plan, work, and history records are created by that project's lifecycle. They are not shipped as Make Docs example IDs.

## Maintainer Dogfood Adoption

After upstream resources pass validation, the maintainer project adopts them through projection and performs a scoped first-use exercise:

1. Confirm the active PRD register has the fixed section added by the PRD round.
2. Inventory active deferrals implicated by this W18 R15 change.
3. Create only accepted required obligations; record optional future automation as `not-an-obligation`.
4. Inventory existing active UAT/manual-test materials relevant to the lifecycle and coverage behavior.
5. Classify each as naive UAT, knowledgeable manual testing, automated/conformance evidence, historical evidence, or insufficiently evidenced.
6. Create a canonical `NUAT-###` only for an active Make Docs user goal that meets the contract and is in this round's scope.
7. Record reasoned `none` for documentation-only or internal slices that cannot produce meaningful installed-product signal, with a future trigger only when a real future acceptance outcome remains owed.
8. Run the orphan audit and store operational validation/review/closeout evidence through existing Project State seams.
9. Keep the capability status unverified until the audit evidence is present.

This first-use exercise must not fabricate tester qualification or retroactively relabel prior walkthroughs as naive.

## Existing-Project Compatibility

Existing Make Docs projects remain readable when they lack the new contracts, sections, scenarios, or Playbooks.

The first qualifying change plan, PRD revision, or phase-close coverage pass:

- inventories only the active authority chain and relevant changed behavior;
- adds missing managed defaults when they are known-clean;
- preserves modified project-owned instructions and artifacts;
- stops for human reconciliation on modified or ambiguous managed content;
- keeps existing `D-###`, `Q-###`, `R-###`, manual-test IDs, UAT filenames, work coordinates, and archived paths stable;
- adds `O-###` and `NUAT-###` prospectively with backlinks;
- does not rewrite archive history;
- does not fabricate old audit or run evidence;
- does not require a Global Store migration.

Existing historical `none` decisions remain truthful records of their time. The next affected coverage pass reassesses the current slice without editing the old history entry.

## Evidence and Privacy Boundary

Repository-canonical:

- obligation meaning and disposition;
- scenario meaning and version;
- target user and support scope;
- source requirements;
- finding meaning and product disposition;
- work and history links.

Project State in the machine-level Global Store:

- candidate progress and verdict counts;
- tester qualification and isolation attestations;
- run timestamps and build identity;
- interventions and interaction observations;
- completion outcomes and review/sign-off;
- raw evidence references.

Machine-local or explicitly exported:

- screenshots;
- recordings;
- transcripts;
- large capture files.

The first implementation defines reference, consent, redaction, and retention metadata but does not create a new physical evidence-file layout. A reviewed portable bundle may be promoted under a project's own evidence policy. Missing operational evidence makes the affected acceptance outcome unverified; it never erases repository meaning or becomes an inferred pass.

## Cross-Platform and Accessibility Coverage

Acceptance fixtures must cover at least:

- a non-GUI CLI or documentation-driven user goal;
- a GUI or visually meaningful goal where screenshots or recording are required;
- a headless/internal slice with a valid, routed `none`;
- an accessibility candidate separate from naive UAT;
- support-scope language that does not generalize one run to every platform;
- a visual-evidence `not-applicable` rationale for a genuinely non-visual workflow.

The Ursa example demonstrates the headless-Core versus first-shell trigger but is not used as a template fixture that hard-codes Ursa names into Make Docs defaults.

## Required Acceptance Scenarios

The implementation backlog must preserve:

1. Multi-phase obligation remains visible until later fulfillment and end-to-end evidence.
2. A closed question or risk cannot silently lose the future work it created.
3. An obligation moves coordinates without changing identity.
4. Cancellation or supersession updates product authority and the obligation together.
5. An execution-discovered orphan blocks phase completion until routed.
6. Database loss preserves repository meaning but invalidates unsupported local acceptance claims.
7. Cross-machine continuation requires explicit evidence transfer or rerun.
8. A legacy project migrates without archive rewrite or content overwrite.
9. A headless slice records valid `none`; a later public workflow activates the routed `NUAT-###`.
10. Automated or conformance success cannot substitute for naive UAT.
11. Coaching or leaked operator content invalidates or revises the run.
12. A crash-free but confusing attempt can produce `revise`.
13. A blocked environment does not become `none`.
14. Visual and accessibility evidence are required only when applicable and remain distinct verdicts.

## Future Deterministic Support

Later work may add validation, candidate inventory, tester-packet rendering, Playbook start/resume, evidence export/import, or a rebuildable scenario projection. That later work requires a new approved design or change plan if it changes runtime, operations, schema, storage, permissions, or migration behavior.

This W18 R15 backlog must not include placeholder runtime tasks for those possibilities. They remain optional future directions, not hidden deferred requirements.

## Exit Criteria

- The tester and facilitator Playbooks are separate, contract-compliant, and free of cross-view leakage.
- The lifecycle Playbook consumes both new contracts and preserves approval boundaries.
- Every reusable resource is authored upstream before projection.
- Maintainer and fresh-project projections match the planned upstream sources.
- Existing-project adoption is conservative and does not overwrite modified content.
- Evidence ownership, privacy, and missing-evidence behavior are explicit without a new schema or file-layout implementation.
- Acceptance fixtures cover GUI, non-GUI, headless, visual, accessibility, migration, and anti-coaching behavior without becoming project-specific.
