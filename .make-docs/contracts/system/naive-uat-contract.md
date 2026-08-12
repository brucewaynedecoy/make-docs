# Naive UAT Contract

## Purpose

Use this contract for true naive end-user acceptance testing: black-box attempts by qualified testers against installed, user-observable product slices using only public information a real target user could possess.

Naive UAT is non-persona testing and UAT coverage. A naive tester is an execution and evidence boundary, not a configured persona.

## Qualified Tester Boundary

A valid naive tester:

- lacks source, architecture, PRD, backlog, known-answer, and private implementation context for the slice under test;
- uses only the installed product, ordinary obtainable environment or accounts, and allowed public resources;
- records isolation controls when the tester is an agent or another mediated environment;
- is not counted as successful when material coaching or hidden-path assistance occurs.

## Activation And Valid `none`

Enumerate user-observable-slice candidates at stage and phase close. Naive UAT activates at the earliest safe runnable boundary and no later than the phase gate when a meaningful installed-product goal can produce end-user signal.

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
| `scenario_version` | Monotonic meaningful-change version |
| `title` | Short product-language title |
| `user_goal` | Real-world target outcome |
| `source_requirements` | Owning requirement links |
| `target_user` | External audience and assumptions |
| `activation_coordinate` | First safe user-observable coordinate |
| `future_trigger` | `active` or complete dormant trigger |
| `obligation_ref` | Linked `O-###` or explicit `none` |
| `supported_scope` | Platform, locale, input, accessibility, account, and network scope |
| `installed_build_identity` | Reproducible build or package identity |
| `starting_state` | Realistic visible starting conditions |
| `public_resources` | Exact allowed user-facing resources |
| `prohibited_context` | Private sources and shortcuts forbidden to the tester |
| `tester_prompt` | Goal-oriented tester-visible packet |
| `operator_success_outcomes` | Operator-only evaluation rules |
| `setup` / `teardown` | Isolation, consent, capture, cleanup, restoration |
| `evidence_requirements` | Required interaction, visual, accessibility, and completion evidence |
| `severity_rules` | Base or project-specific escalation rule |
| `finding_route` | Owning PRD, work, and phase-gate route |

## Tester Packet Safety

A single canonical scenario may render two views:

1. an operator view containing the full record;
2. a tester packet containing only the realistic situation, goal, visible starting state, allowed public resources, genuine constraints, consent notice, and tester-owned teardown steps.

Operator-only fields must remain explicitly marked and must not leak into the tester packet.

## Run And Finding Fields

Every run records exact scenario reference, build and environment, tester qualification evidence, public resources used, interventions, outcome, observations, reproduction details, evidence refs, finding refs, and review disposition.

Every finding records observed behavior, expected user outcome, severity, reproducibility, support scope, evidence refs, source requirement, owner, and disposition.

## Outcome Meanings

| Outcome | Meaning |
| --- | --- |
| `pass` | Goal completed without prohibited help or unresolved material barrier |
| `fail` | Goal not completed, unsafe or incorrect behavior occurred, or private coaching was required |
| `revise` | Goal completed but discoverability, comprehension, terminology, recovery, or public instructions require revision |
| `blocked` | Environment, account, platform, consent, dependency, or setup prevented a valid product attempt |

`blocked` does not become `none` after observability activates.

## Severity Meanings

| Severity | Meaning |
| --- | --- |
| `critical` | Credible safety, privacy, security, irreversible-data, unauthorized-external-effect, or severe accessibility risk |
| `major` | Intended goal is impossible for the tested scope or requires private coaching or undocumented workaround |
| `moderate` | Goal completes only with substantial confusion, repeated failure, or misleading mental model |
| `minor` | Bounded friction that does not threaten core completion |

## Phase Gates And Capability Status

`pass` satisfies naive UAT only for the executed scenario version and support scope. `fail`, `revise`, `blocked`, and unrun activated scenarios leave acceptance unsatisfied.

A phase must not claim capability completion while an activated scenario remains failed, revised, blocked, unrun, or tied to unresolved findings. When later work remains owed, route the disposition through PRD maintenance and `O-###` governance.

## Evidence Boundary

Repository-canonical:

- scenario identity and meaning;
- target user and supported scope;
- trigger and obligation routing;
- finding meaning and disposition.

Operational or machine-local:

- tester qualification attestation;
- run progress and timestamps;
- interventions and observations;
- recordings, screenshots, transcripts, and large evidence refs.

Missing operational evidence makes the acceptance outcome unverified. Repository links alone never imply a pass.

## Compatibility

Adopt the contract conservatively:

- classify prior manual or UAT artifacts by what they actually prove;
- do not relabel knowledgeable walkthroughs as naive without qualification and anti-coaching evidence;
- preserve historical IDs, work coordinates, and archives;
- stop instead of overwriting modified active project content.

## Future Automation Limits

Future tooling may inventory candidates, render packets, or validate links and required fields. Automation must not infer observability, certify naivety, decide intervention materiality, assign severity, interpret confusion, narrow support scope, cancel requirements, or resolve obligations.

## Non-Goals

- No `naive-tester` persona.
- No implementation-shaped answer scripts for the tester.
- No runtime automation requirement in this round.
- No conformance, architecture review, automated tests, or accessibility testing substituted for naive UAT.
- No new store schema, evidence kind, or CLI/MCP surface required in this round.
