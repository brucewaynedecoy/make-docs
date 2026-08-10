---
title: "W18 R4 Run Playbook Orchestration Hardening"
kind: "history"
status: "completed"
coordinate: "W18 R4"
source:
  type: "manual-request"
  path: "docs/designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md"
---

# W18 R4 Run Playbook Orchestration Hardening

## Changes

Captured the W18 R4 corrective planning wave for Run Playbook orchestration. The new design, plan bundle, PRD reconciliation, work backlog, and W18 guardrails make W18 R4 a blocker before W18 R1, W18 R2, or W18 R3 implementation proceeds.

## Decisions

- Playbook paths remain `docs/assets/playbooks/<persona>/<slug>.md`; `stack` remains metadata, not a directory level.
- Resolver identity is `persona/slug`, with bare slug/title selection allowed only when it resolves to one candidate.
- Reviewed harness execution capabilities live in `.make-docs/config.yaml` as operational hints.
- Make Docs-owned playbook run state lives under `.make-docs/runs/playbooks/<run-id>/state.json`.
- Nested and parallel playbook execution require explicit permission and output-surface conflict checks.

## Documentation

- [Run Playbook Orchestration and Harness Capabilities](../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [W18 R4 Plan](../../../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md)
- [W18 R4 Work](../../../work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md)
- [historical closeout](2026-06-29-w18-r1-p4-template-package-lifecycle-closeout.md) (retired action-PRD: `docs/prd/29-revise-playbook-contract-run-playbook.md`)
- [historical closeout](2026-06-29-w18-r2-wave-closeout-and-manual-test-coverage.md) (retired action-PRD: `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md`)
- [historical closeout](2026-06-25-w16-r2-configuration-convention-overlay-wave-closeout.md) (retired action-PRD: `docs/prd/24-revise-configuration-convention-overlay.md`)
