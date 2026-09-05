# Unassisted Goal Testing Workflow

## Purpose

Use this reference to decide, prepare, run, and record one Unassisted Goal Test. The stable resource filename and `naive-uat` workflow ID remain for compatibility.

The [Unassisted Goal Testing Contract](../contracts/naive-uat-contract.md) owns the reusable rules. This reference gives the order of work. It does not create a second policy source.

## Resource Composition

| Role | Stable URI | Use |
| --- | --- | --- |
| Governing contract | `make-docs://system/contract/naive-uat-contract.md` | Activation, qualification, anti-coaching, scenario, evidence, finding, result, and gate rules |
| Facilitator prompt | `make-docs://system/prompt/naive-uat-facilitator.prompt.md` | Decide activation and supervise one valid run |
| Tester prompt | `make-docs://system/prompt/naive-uat-tester.prompt.md` | Start a qualified executor with only the approved tester packet |
| Workflow reference | `make-docs://system/reference/naive-uat-workflow.md` | Order the resource composition |
| Scenario template | `make-docs://system/template/naive-uat-scenario.md` | Record a testing decision and author an activated canonical scenario |

The installed provider supplies these resources by default. A project can select a trustworthy local projection. The workflow does not require one.

## Workflow

1. Record the common testing decision fields from PRD 50.
2. Decide whether an unassisted attempt can answer a material current human-experience uncertainty, or whether explicit current authority requires it.
3. When no current decision justifies a run, record `not-needed-now`, its reason, the evidence that already answers the uncertainty, the advisory gate effect, the effort budget, the stop condition, and the rerun trigger. Do not create a scenario or obligation only for this result.
4. When testing activates, select the canonical `NUAT-###` scenario in the PRD that owns the public outcome. Create or update that record before the run when current authority requires it.
5. Resolve exactly one configured Persona. Accept only a `user`- or `maintainer`-primitive Persona. Use canonical `user` when none is supplied.
6. Qualify the executor separately from Persona selection. A human or an agent can execute. An agent must use a separate isolated context with no repository access, private memory, implementation conversation, known-defect knowledge, hidden answer, or successful-path knowledge.
7. Render the operator view and tester packet from the same scenario version. Confirm that no operator-only field entered the tester packet.
8. Prepare the normally consumable product, realistic environment, consent, capture, and safety boundary without rehearsing the goal.
9. Give the executor only the tester prompt, tester packet, product access, and allowed public resources.
10. Record interventions, observations, one result, findings, and approved evidence under `docs/assets/<persona-slug>/testing/`. Bind them to the exact scenario version or content digest.
11. Apply teardown, redaction, retention, cleanup, and restoration rules.
12. Route `clear`, `friction`, `blocked`, or `invalid-run` through the owning PRD, finding, work, and gate authority. A Store receipt records only the requested Store mutation.

## Access Paths

Direct CLI, native MCP resources, MCP tools where needed, and an explicitly selected thin Skill must resolve the same resource URIs and typed operations.

A Skill can adapt arguments or format receipts. It must not copy activation, qualification, Persona, scenario, anti-coaching, evidence, finding, result, or gate policy.

## Gate Effects

The default effect is advisory. Use `blocking-current-work` or `blocking-claim-only` only when explicit current authority names the result and the blocked outcome or claim.

`friction` does not automatically fail a phase. `blocked` and `invalid-run` prove no human conclusion. `not-needed-now` is not a failed or deferred test.

## Stop Conditions

Stop the run when:

- executor qualification or isolation is not proved;
- the selected Persona is missing, unknown, or ineligible;
- the product form or public resources do not match the scenario;
- operator-only content entered the tester packet;
- safety, privacy, consent, access, account, or environment conditions prevent a valid attempt;
- the scenario version or evidence destination is unclear; or
- the accepted effort budget ends.

Record `blocked` when the product or environment prevents a valid attempt. Record `invalid-run` when setup, coaching, private knowledge, or lost evidence prevents a conclusion.

## Typed Helper Access

For input fields and read-only CLI/MCP validation, read `make-docs://system/reference/naive-uat-validation.md`. The helpers check records and references. They do not make qualification or human-experience judgments.
