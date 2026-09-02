# Naive UAT Contract

## Purpose

Use this contract for short naive-style user acceptance testing. `Naive` defines the session style. It does not require an uninformed person.

A human must execute the session. The human can be the informed owner or another person. Prior product or implementation knowledge does not disqualify the human. An agent can prepare, facilitate, or record the session. An agent cannot execute the session or satisfy its acceptance requirement.

The session can use a development, test, linked, or installed environment. It starts from a realistic visible state. During the scenario, the human uses public product guidance and public product surfaces. The session does not use hidden route coaching. The run records relevant prior knowledge, environment, public help used, interventions, outcome, and friction.

A configured Persona and richer evidence can be used when they help. They are not required for a valid run.

## System Workflow Composition

The Naive-UAT workflow is complete through these peer system resources:

- `make-docs://system/contract/naive-uat-contract.md`
- `make-docs://system/prompt/naive-uat-facilitator.prompt.md`
- `make-docs://system/prompt/naive-uat-tester.prompt.md`
- `make-docs://system/reference/naive-uat-workflow.md`
- `make-docs://system/template/naive-uat-scenario.md`

The installed provider supplies the resources by default. A project-local projection is optional.

Direct CLI, native MCP, system-resource, and future thin-Skill paths must resolve the same resources, typed operations, and receipts. When a Persona is selected, each path must resolve it in the same way. A typed operation has fixed request and result fields. A Skill must not copy this policy.

## Human Executor And Session Boundary

A valid naive-style run:

- has a human executor;
- can use an informed owner or another person;
- can use a development, test, linked, or installed environment;
- starts from a realistic visible state and the smallest meaningful public goal;
- uses public product guidance and public product surfaces during the scenario;
- avoids hidden route coaching and compensating shortcuts;
- records relevant prior knowledge, environment, public help used, interventions, outcome, and friction.

Prior knowledge does not disqualify the human. The human's identity, role, or environment does not disqualify the run. No agent may block the human for any of those reasons.

An agent cannot be the executor. An agent-run scenario cannot satisfy naive UAT.

A run can record a selected Persona and use `docs/assets/<persona-slug>/testing/` when that structure is useful. Neither item is required.

## Activation And Valid `none`

Enumerate user-observable-slice candidates at stage and phase close. Naive UAT activates at the earliest safe runnable boundary and no later than the phase gate when the smallest meaningful public goal can produce user signal. The environment can be development, test, linked, or installed.

`none` is valid only when the completed slice cannot yet produce meaningful end-user signal. A valid `none` records:

- the concrete reason;
- the still-applicable validation on the internal slice;
- the future observable trigger;
- the durable owner;
- the target coordinate;
- the linked `O-###` or current register route.

Unresolved "test later" language is invalid.

## Distinct Testing And Review Modes

Naive UAT remains separate from:

- automated tests;
- owner or architecture review;
- knowledgeable visual or manual exploration;
- accessibility testing;
- visual-regression automation;
- conformance or lab evidence.

One mode's success does not satisfy another mode's requirements.

## Anti-Coaching

Tester instructions must describe a realistic situation, goal, visible starting state, allowed public help, and genuine safety constraints without revealing the answer or route.

Relevant prior knowledge is allowed. During the scenario, the human must still use public product guidance and public product surfaces. The facilitator must not use the human's prior knowledge as a hidden route or give a private shortcut.

Do not leak:

- internal terms;
- requirement or work IDs;
- architecture knowledge;
- hidden setup;
- expected answers;
- prescribed clicks, commands, or navigation shortcuts;
- compensating instructions that hide discoverability defects.

Safety intervention is always allowed and must be recorded. Material assistance invalidates success and becomes `fail`, `revise`, or a restarted run with the intervention preserved.

## Scenario Authority

Canonical scenarios live in the active PRD that owns the primary external user outcome under a fixed `## Naive UAT Scenarios` section. They use stable append-only `NUAT-###` identifiers.

The same goal keeps its ID and increments `scenario_version` for meaningful changes. Different goals receive new IDs.

Work files, plans, and history records do not become a second scenario authority.

## Required Scenario Fields

| Field | Requirement |
| --- | --- |
| `scenario_id` | Stable `NUAT-###` identity |
| `scenario_version` | Version that increases for each meaningful change |
| `title` | Short product-language title |
| `user_goal` | Real-world target outcome |
| `source_requirements` | Owning requirement links |
| `target_user` | External audience and assumptions |
| `activation_coordinate` | First safe user-observable coordinate |
| `future_trigger` | `active` or complete dormant trigger |
| `obligation_ref` | Linked `O-###` or explicit `none` |
| `supported_scope` | Platform, locale, input, accessibility, account, and network scope |
| `build_identity` | Reproducible development, test, linked, or installed product identity |
| `environment` | Development, test, linked, or installed environment used for the run |
| `starting_state` | Realistic visible starting conditions |
| `public_resources` | Exact allowed user-facing resources |
| `prohibited_context` | Hidden route coaching and non-public product shortcuts forbidden during the scenario |
| `tester_prompt` | Goal-oriented tester-visible packet |
| `operator_success_outcomes` | Operator-only evaluation rules |
| `setup` / `teardown` | Isolation, consent, capture, cleanup, restoration |
| `evidence_requirements` | Required interaction, visual, accessibility, and completion evidence |
| `severity_rules` | Base or project-specific escalation rule |
| `timebox` | Optional observation window; expiration never silently means success |
| `finding_route` | Owning PRD, work, and phase-gate route |

## Tester Packet Safety

A single canonical scenario may render two views:

1. an operator view containing the full record;
2. a tester packet containing only the realistic situation, goal, visible starting state, allowed public resources, genuine constraints, consent notice, and tester-owned teardown steps.

Operator-only fields must remain explicitly marked and must not leak into the tester packet.

## Run And Finding Fields

Every run records the exact scenario reference, human executor, relevant prior knowledge, build and environment, public guidance and product surfaces used, interventions, outcome, friction, observations, reproduction details, finding refs, and review disposition.

A run can also record a selected Persona, Persona resolution, evidence root, and richer evidence refs when they are useful.

Every finding records observed behavior, expected user outcome, severity, reproducibility, support scope, evidence refs, source requirement, owner, and disposition.

## Outcome Meanings

| Outcome | Meaning |
| --- | --- |
| `pass` | Human completed the goal without hidden route coaching or an unresolved material barrier |
| `fail` | Goal not completed, unsafe or incorrect behavior occurred, an agent acted as the executor, or hidden route coaching was required |
| `revise` | Goal completed but discoverability, comprehension, terminology, recovery, or public instructions require revision |
| `blocked` | Environment, account, platform, consent, dependency, or setup prevented a valid product attempt |

`blocked` does not become `none` after observability activates.

Prior knowledge, human identity, and use of a development, test, linked, or installed environment do not prevent a pass.

## Severity Meanings

| Severity | Meaning |
| --- | --- |
| `critical` | Credible safety, privacy, security, irreversible-data, unauthorized-external-effect, or severe accessibility risk |
| `major` | Intended goal is impossible for the tested scope or requires private coaching or undocumented workaround |
| `moderate` | Goal completes only with substantial confusion, repeated failure, or misleading mental model |
| `minor` | Bounded friction that does not threaten core completion |

## Phase Gates And Capability Status

`pass` satisfies naive UAT only for the human-executed scenario version and support scope. An agent execution does not satisfy the gate. `fail`, `revise`, `blocked`, and unrun activated scenarios leave acceptance unsatisfied.

A phase must not claim capability completion while an activated scenario remains failed, revised, blocked, unrun, or tied to unresolved findings. When later work remains owed, route the disposition through PRD maintenance and `O-###` governance.

## Evidence Boundary

Repository-canonical:

- scenario identity and meaning;
- target user and supported scope;
- trigger and obligation routing;
- run records, outcomes, findings, and dispositions;
- finding meaning and disposition.

Optional repository evidence can include a selected Persona, an evidence path, a Persona-specific packet, evidence metadata, and approved evidence under `docs/assets/<persona-slug>/testing/`.

Operational or machine-local:

- run progress and timestamps;
- bounded Store receipts and sanitized evidence references.

Large external captures may remain outside the repository when consent, retention, and privacy rules require it. When richer evidence exists, the run record keeps the approved reference and redaction state. Missing or corrupt required evidence makes the acceptance outcome unverified. Repository links alone never imply a pass.

## Compatibility

Adopt the contract conservatively:

- classify prior manual or UAT artifacts by what they actually prove;
- do not relabel an agent run, automated run, or hidden-route walkthrough as naive UAT;
- classify a knowledgeable human walkthrough by its session style, public-surface use, interventions, outcome, and friction;
- move prior evidence only when ownership is proven;
- preserve historical IDs, work coordinates, and archives;
- stop instead of overwriting modified active project content.

## Future Automation Limits

Future tooling may inventory candidates, render packets, facilitate a human run, record observations, or validate links and required fields. Automation and agents must not execute or satisfy naive UAT. They must not infer observability, decide intervention materiality, assign severity, interpret confusion, narrow support scope, cancel requirements, or resolve obligations.

## Non-Goals

- No `naive-tester` Persona.
- No agent executor.
- No hard gate based only on human identity, prior knowledge, Persona selection, evidence-root choice, or development, test, linked, or installed environment.
- No implementation-shaped answer scripts for the tester.
- No conformance, architecture review, automated tests, or accessibility testing substituted for naive UAT.
- No Playbook or Protocol workflow, runner, or asset requirement.
- No copied UAT policy in a Skill, plugin, hook, extension, or harness adapter.
