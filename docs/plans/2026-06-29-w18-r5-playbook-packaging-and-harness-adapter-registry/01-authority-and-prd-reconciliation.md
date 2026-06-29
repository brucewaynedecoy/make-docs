# Authority and PRD Reconciliation

## Purpose

Establish W18 R5 as the active authority for Playbook packaging and harness adapter registry work, then reconcile PRDs, risks, and W18 guardrails before implementation begins.

## Scope

- Add PRD 33 as an enhancement to Playbook, plugin, shared-agentics, CLI/MCP, conformance, package, lifecycle, and adversarial-review requirements.
- Annotate affected PRDs with change notes instead of rewriting prior baseline text.
- Add W18 R5 prerequisite notes to W18 R1, W18 R2, and W18 R3 plan/work indexes.
- Preserve W18 R4 as the runner orchestration authority and make W18 R5 a packaging/adapter authority layered on top.

## Requirements

- PRD 33 must state that Playbook packaging is required for v2, not a post-v2 eventuality.
- PRD 33 must keep Playbooks valid without packaging and prevent one-plugin-per-playbook as a requirement.
- PRD 33 must define `plugin` and `skills-bundle` as first-class output kinds.
- PRD 33 must define `native`, `agents-standard`, and `auto` as surfaces or surface-selection modes, not harness ids.
- PRD 33 must require a harness adapter registry for future harness additions.
- PRD 33 must require review-gated agent assistance for semantic package-plan drafting.

## Validation

- The new change doc uses the next available PRD number.
- No existing PRD docs are renumbered.
- The PRD index includes PRD 33 in reading order, document map, source anchors, audience paths, and intended follow-on.
- The risk register records the new packaging/source boundary risk without reopening the closed R-012 boundary.
- W18 R1/R2/R3 plan and work indexes point at W18 R5 before implementation.
