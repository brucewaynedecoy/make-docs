# W18 R4 Run Playbook Orchestration and Harness Capabilities

## Purpose

Harden the v2 Run Playbook architecture before W18 R1, W18 R2, and W18 R3 implementation by turning the W18 R4 design into PRD reconciliation, resolver semantics, harness capability handling, run-state rules, nested-playbook rules, concurrency rules, and downstream guardrails.

## Objective

This plan is complete when the W18 R4 design is accepted as a blocker, the active PRD set reflects resolver/capability/run-state requirements without contradicting existing playbook and plugin boundaries, the W18 R1-R3 backlogs explicitly consume W18 R4, and a derived W18 R4 backlog gives implementers decision-complete phase work.

## Coordinate Decision

- Coordinate: `W18 R4`
- Classification: `revision`
- Evidence: W18 R1, W18 R2, and W18 R3 already exist as Batch 4 playbook/plugin/adversarial-review work. W18 R4 is a corrective hardening wave that blocks those backlogs without replacing them.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-authority-and-prd-reconciliation.md](01-authority-and-prd-reconciliation.md) | Capture W18 R4 authority and reconcile PRDs/risk register. |
| [02-resolver-and-stack-disambiguation.md](02-resolver-and-stack-disambiguation.md) | Define resolver identity, catalog semantics, and stack validation. |
| [03-harness-capabilities-and-config.md](03-harness-capabilities-and-config.md) | Define harness capability records, unknown-capability handling, and config boundaries. |
| [04-run-state-nesting-and-concurrency.md](04-run-state-nesting-and-concurrency.md) | Define Make Docs-owned run state, resume, nested playbooks, and concurrency safety. |
| [05-guardrails-validation-history-and-commit.md](05-guardrails-validation-history-and-commit.md) | Add W18 guardrails, validation, history, explanatory guide, and commit closeout. |

## Dependencies

- [Run Playbook Orchestration and Harness Capabilities](../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [24 Revise Configuration Convention Overlay](../../prd/24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md)

## Validation

Validate changed-file Markdown links, `git diff --check`, and `bash scripts/check-wave-numbering.sh`. Confirm W18 R1, W18 R2, and W18 R3 plan/work indexes all identify W18 R4 as a prerequisite. Confirm PRD 29, PRD 30, and PRD 24 agree that playbooks remain valid without plugins, config does not rename canonical structure, and harness capabilities are reviewed operational hints.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan.
- Why: The plan changes active playbook, plugin, config, conformance, metadata, package, and CLI/MCP requirements before implementation begins.
- Coordinate Handoff: Carry `W18 R4` into PRD reconciliation and the downstream work backlog lineage.
