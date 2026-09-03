# Unassisted Goal Testing Contract

## Purpose

Use this contract to decide whether an unassisted attempt can answer a material current human-experience question.

The stable resource name and `naive-uat` workflow ID remain for compatibility. Current human-facing language uses Unassisted Goal Testing.

An executor can be a human or an agent in a separate isolated context. The executor must not have private knowledge that reveals the tested route. The executor uses only the normally consumable product, realistic starting information, and allowed public resources.

A configured Persona can define audience framing and evidence routing. Persona selection does not prove executor qualification.

## System Workflow Composition

The workflow is complete through these peer system resources:

- `make-docs://system/contract/naive-uat-contract.md`
- `make-docs://system/prompt/naive-uat-facilitator.prompt.md`
- `make-docs://system/prompt/naive-uat-tester.prompt.md`
- `make-docs://system/reference/naive-uat-workflow.md`
- `make-docs://system/template/naive-uat-scenario.md`

The installed provider supplies the resources by default. A project-local projection is optional.

Direct CLI, native MCP, system-resource, and selected thin-Skill paths must resolve the same resources, typed operations, and receipts. The six stable `uat.*` validation operations are compatibility surfaces. A Skill must not copy this policy.

## Qualified Executor And Test Boundary

A valid run:

- uses a human or an agent in a separate isolated context;
- proves that the executor has no repository access, private memory, implementation conversation, known-defect knowledge, hidden answer, successful-path knowledge, or project-specific path guidance beyond the tester packet;
- uses only the product form that the intended audience normally consumes;
- starts from realistic visible conditions;
- uses only allowed public or realistic information;
- avoids hidden route coaching and compensating shortcuts; and
- records qualification, product identity, support scope, public help, interventions, observations, result, and material findings.

An agent execution is valid only when the separate context and access limits are proved. Self-attestation alone is not sufficient.

A source checkout or development server qualifies only when the intended audience normally consumes that exact form.

## Activation And `not-needed-now`

Unassisted Goal Testing activates only when an unassisted attempt can reveal a material current human-experience uncertainty that other evidence cannot answer well enough, or when explicit current product or release authority requires it.

Useful triggers include:

- a new mental model;
- discoverability or orientation risk;
- a costly wrong assumption;
- weak recovery;
- a relationship or state that implementers understand only from private knowledge;
- a new public goal without applicable unassisted evidence; or
- an explicit acceptance requirement.

A user-observable slice, phase close, available executor, existing scenario, or desire for reassurance does not activate a test by itself.

`not-needed-now` is valid when no current decision justifies a run. Record the reason and the evidence that already answers the uncertainty. Do not create a scenario or durable obligation only to record this result.

When an accepted future outcome remains owed, route it through the deferred-obligation contract with an owner, trigger, target, exit criteria, and reason. “Test later” alone is invalid.

## Distinct Testing And Review Types

Unassisted Goal Testing remains separate from:

- automated implementation testing;
- performance testing;
- guided progress review;
- knowledgeable visual or manual exploration;
- specialist accessibility testing;
- visual-regression automation;
- conformance or lab evidence; and
- owner or architecture review.

One type's evidence can inform a testing decision. It cannot be mislabeled as an unassisted attempt.

## Anti-Coaching

Tester instructions describe a realistic situation, goal, visible starting state, allowed public help, and genuine safety constraints. They do not reveal the answer or route.

Do not leak:

- internal terms;
- requirement or work IDs;
- architecture knowledge;
- hidden setup;
- expected answers;
- prescribed clicks, commands, or navigation shortcuts; or
- compensating instructions that hide a discoverability problem.

Safety intervention is always allowed and must be recorded. Material coaching makes the run `invalid-run`.

## Scenario Authority

Canonical scenarios live in the active PRD that owns the primary external outcome. They use stable append-only `NUAT-###` identifiers.

The same goal keeps its ID and increments `scenario_version` for a material change. A materially different goal, audience, support claim, or risk receives a new ID.

Work files, plans, and history records do not become a second scenario authority. A `not-needed-now` decision does not require a scenario.

## Required Scenario And Decision Fields

Each testing decision uses the common PRD 50 fields:

| Field | Requirement |
| --- | --- |
| `testing_type` | Unassisted Goal Testing |
| `decision_informed` | Current product, release, or human-experience decision |
| `reason_now` | Activation reason or `not-needed-now` reason |
| `product_maturity` | Relevant product state |
| `scope` | Product, platform, audience, and support boundary |
| `executor` | Qualified executor or `none` when no run occurs |
| `gate_effect` | `advisory`, `blocking-current-work`, or `blocking-claim-only` |
| `effort_budget` | Finite run and correction limit |
| `stop_condition` | Condition that ends the work |
| `evidence_retained` | Evidence needed for the decision |
| `rerun_trigger` | Material change that justifies another run |

An activated scenario also records:

| Field | Requirement |
| --- | --- |
| `scenario_id` | Stable `NUAT-###` identity |
| `scenario_version` | Version that increases for each material change |
| `title` | Short product-language title |
| `user_goal` | Real-world target outcome |
| `source_requirements` | Owning requirement links |
| `target_user` | Intended audience and assumptions |
| `selected_persona` | One eligible configured Persona or canonical `user` default |
| `build_identity` / `environment` | Reproducible product identity and normally consumable form |
| `starting_state` | Realistic visible starting conditions |
| `public_resources` | Exact allowed public resources |
| `prohibited_context` | Private knowledge and hidden-route guidance |
| `tester_prompt` | Goal-oriented tester packet |
| `operator_success_outcomes` | Operator-only evaluation rules |
| `setup` / `teardown` | Isolation, consent, capture, cleanup, and restoration |
| `evidence_requirements` | Evidence needed for the current decision |
| `severity_rules` | Base or project-specific escalation rule |
| `finding_route` | Owning PRD, work, and gate route |

## Tester Packet Safety

One canonical scenario can render two views:

1. an operator view with the complete record;
2. a tester packet with only the situation, goal, visible starting state, allowed public resources, genuine constraints, consent notice, and tester-owned teardown steps.

Operator-only fields must not enter the tester packet.

## Run, Result, And Finding Fields

Every run records the exact scenario reference, executor qualification, selected Persona, product build and environment, support scope, public guidance, interventions, result, observations, reproduction details, evidence references, finding references, and review disposition.

Every finding records observed behavior, expected human outcome, severity, reproducibility, support scope, evidence, source requirement or promise, owner, and disposition.

## Result Meanings

| Result | Meaning |
| --- | --- |
| `clear` | The executor understood and attempted the goal without material hidden help or human-experience friction that changes the current decision. |
| `friction` | The attempt exposed confusion, excess effort, a wrong mental model, weak recovery, or another material human-experience issue. |
| `blocked` | The product or environment prevented a valid attempt. |
| `invalid-run` | Coaching, prior private knowledge, broken setup, lost evidence, or another validity failure prevents a conclusion. |
| `not-needed-now` | No current decision justifies an unassisted attempt. No run occurred. |

One valid independent run can answer the bounded current uncertainty unless accepted risk or support authority requires more. More clear runs cannot erase an unresolved material finding.

## Severity Meanings

| Severity | Meaning |
| --- | --- |
| `critical` | Credible safety, privacy, security, irreversible-data, unauthorized-external-effect, or severe accessibility risk |
| `major` | The intended goal is impossible for the tested scope or needs private coaching or an undocumented workaround |
| `moderate` | The goal completes only with substantial confusion, repeated failure, or a misleading mental model |
| `minor` | Bounded friction that does not threaten core completion |

## Gate Effects

The default gate effect is `advisory`.

A result is `blocking-current-work` or `blocking-claim-only` only when explicit current product or release authority names the result and the blocked outcome or claim.

`friction` creates feedback or remediation. It does not automatically fail a phase. `blocked` and `invalid-run` prove no human conclusion. `not-needed-now` is not a failed or deferred test.

Task or obligation completion cannot rewrite a result or close a finding.

## Evidence Boundary

Repository-canonical material includes:

- scenario identity and meaning;
- testing decisions and gate effects;
- target audience and support scope;
- run records, results, findings, and dispositions; and
- approved evidence references.

Persona-specific packets, runs, findings, and approved evidence live under `docs/assets/<persona-slug>/testing/`.

Operational or machine-local state can contain run progress, timestamps, bounded Store receipts, and sanitized project-relative evidence references.

Large external captures can remain outside the repository when consent, retention, and privacy rules require it. Missing or corrupt required evidence prevents a conclusion.

## Compatibility

Adopt this contract conservatively:

- preserve stable resource names, `NUAT-###` IDs, and `R-NUAT-*` anchors;
- classify earlier manual or UAT artifacts by what they prove;
- do not relabel an automated run or coached walkthrough as Unassisted Goal Testing;
- preserve historical language in historical records;
- keep the six typed `uat.*` validators as compatibility surfaces; and
- stop instead of overwriting modified active project content.

## Future Automation Limits

Future tooling can inventory candidates, render packets, facilitate runs, record observations, or validate links and required fields.

Automation must not infer material human uncertainty, executor qualification, intervention materiality, finding severity, product acceptance, support narrowing, or requirement cancellation.

## Non-Goals

- No automatic test because a phase has a user-observable slice.
- No required `naive-tester` Persona.
- No human-only executor rule.
- No implementation-shaped answer script.
- No other test or review type mislabeled as an unassisted attempt.
- No Playbook or Protocol workflow, runner, or asset requirement.
- No copied policy in a Skill, plugin, hook, extension, or harness adapter.
