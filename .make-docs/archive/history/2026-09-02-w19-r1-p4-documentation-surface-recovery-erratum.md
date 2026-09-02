---
title: "W19 R1 P4 Documentation Surface Recovery Erratum"
kind: "history"
status: "correction-open"
date: "2026-09-02"
coordinate: "W19 R1 P4"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Records the separate documentation-surface router omission that reopened P4 recovery."
---

# W19 R1 P4 Documentation Surface Recovery Erratum

## Changes

[D-029](../../../docs/prd/03-open-questions-and-risk-register.md#d-029-w19-r1-resource-topology-and-router-authority-drifted) remains closed as the system-resource router correction. [D-030](../../../docs/prd/03-open-questions-and-risk-register.md#d-030-w19-r1-documentation-surface-router-topology-was-omitted) owns the separate documentation-surface omission. This erratum does not expand or rewrite D-029.

`02002ba23` is the authority gap. `efebfa29` is the runtime and test regression. `315dce5d` is an incomplete runtime correction. `90b4fd8` is an incomplete P4 closeout.

The corrected authority requires an unconditional configured-harness router foundation at the project root, `docs/`, `docs/assets/`, `.make-docs/`, `.make-docs/system/`, and the four typed system directories. The resolved effective profile and its dependencies control capability-local routers at `docs/designs/`, `docs/plans/`, `docs/prd/`, and `docs/work/`. An all-four effective profile has 13 surfaces per harness, so two configured harnesses produce 26 router files. Resource projection controls bodies only. `docs/assets/` has one managed router at its root and no managed routers below it. `.make-docs/archive/`, `docs/artifacts/`, and Persona testing remain on demand.

`project.surface.ensure <archive|artifacts|assets>` remains valid. The `assets` target is idempotent when the root surface is current. It may create or safely repair only the `docs/assets/` root and configured-harness routers under normal ownership rules when needed. It does not create Persona or testing children.

P4 is reopened for this correction. P7 is paused again. `P7-AUTHORITY` remains accepted. D-005 and P7-BUDGET remain open. Persona, scenario, risk, and six-operation meaning remain unchanged. P7 resumes at D-005 only after accepted P4 recovery, a new final corrective closeout, and a refreshed baseline and dependency proof.

This record is an open correction erratum. It is not the final corrective closeout. It does not claim that runtime, template, tests, generated package output, independent review, owner acceptance, or final closeout is complete. It does not authorize P7 implementation.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [Accepted recovery design](../../../docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) | Defines the exact router topology and the root-only `docs/assets/` rule. |
| [W19 R1 recovery plan](../../../docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md) | Carries the corrected authority and delivery order. |
| [PRD 03](../../../docs/prd/03-open-questions-and-risk-register.md) | Adds D-030 and keeps D-029 closed. |
| [PRDs 05, 06, 07, 15, and 22](../../../docs/prd/00-index.md) | Own installation, template, command, instruction, and asset topology authority. |
| [P4 work record](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/04-manifest-setup-reconfiguration-and-routers.md#documentation-surface-recovery-reopened---2026-09-02) | Reopens bounded recovery work and states the current authority-only boundary. |
| [W19 R1 work index](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-index.md) | Shows P4 reopened and P7 paused. |
| [P7 work record](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md) | Preserves accepted decisions and the D-005 resume point. |

### Developer

None in this authority candidate.

### User

None in this authority candidate.
