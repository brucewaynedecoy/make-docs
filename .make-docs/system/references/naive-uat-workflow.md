# Naive-UAT Workflow

## Purpose

Use this reference to compose and run the Naive-UAT system workflow. The workflow tests whether an isolated qualified tester can complete a real goal with the installed product and public information.

The [Naive UAT Contract](../../contracts/system/naive-uat-contract.md) owns the reusable rules. This reference gives the order of work and the links between peer resources. It does not create a second policy source.

## Resource Composition

| Role | Stable URI | Use |
| --- | --- | --- |
| Governing contract | `make-docs://system/contract/naive-uat-contract.md` | Tester qualification, activation, anti-coaching, scenario, evidence, findings, and gate rules |
| Facilitator prompt | `make-docs://system/prompt/naive-uat-facilitator.prompt.md` | Prepare and supervise one valid run |
| Tester prompt | `make-docs://system/prompt/naive-uat-tester.prompt.md` | Start the isolated tester with only the approved tester packet |
| Workflow reference | `make-docs://system/reference/naive-uat-workflow.md` | Order the resource composition |
| Scenario template | `make-docs://system/template/naive-uat-scenario.md` | Author or update the canonical PRD scenario and render its two views |

The installed provider supplies these resources by default. A project may select a trustworthy local projection, but the workflow does not require one.

## Workflow

1. Decide whether the completed slice gives an intended user a safe, meaningful installed-product goal. Record a complete `none` route when it does not.
2. Select the canonical `NUAT-###` scenario in the PRD that owns the user outcome. Create or update that record before execution when current authority requires it.
3. Resolve exactly one configured Persona. Accept only a `user`- or `maintainer`-primitive Persona. Use the canonical `user` Persona when none is supplied.
4. Qualify an isolated tester separately from Persona selection. The tester must not have repository, implementation, private conversation, known-defect, hidden-answer, or successful-path knowledge.
5. Render the operator view and the selected-Persona tester packet from the same scenario version. Check that no operator-only field entered the tester packet.
6. Prepare the installed product, ordinary user environment, consent, capture, and safety boundary without rehearsing the goal.
7. Give the isolated tester only the tester prompt, tester packet, installed product access, and allowed public resources.
8. Record interventions, observations, outcome, findings, and approved evidence under `docs/assets/<persona-slug>/testing/`. Bind them to the exact scenario version or content digest.
9. Apply teardown, redaction, retention, cleanup, and restoration rules.
10. Route `pass`, `fail`, `revise`, or `blocked` through the owning PRD, finding, obligation, work, and phase-gate authorities. A Store receipt records only the requested Store mutation.

## Access Paths

Direct CLI, native MCP resources, MCP tools where needed, and a future explicitly selected thin Skill must resolve the same resource URIs and typed operations.

A Skill may adapt arguments or format receipts. It must not copy tester qualification, Persona resolution, scenario, anti-coaching, evidence, finding, outcome, or gate policy.

## Stop Conditions

Stop the run when:

- the tester is not isolated or qualified;
- the selected Persona is missing, unknown, or ineligible;
- the installed product or public resources do not match the scenario;
- operator-only content entered the tester packet;
- safety, privacy, consent, access, account, or environment conditions prevent a valid attempt;
- the scenario version or evidence destination is unclear.

Record `blocked` when setup prevents a valid attempt after the slice is observable. Do not change it to `none`.
