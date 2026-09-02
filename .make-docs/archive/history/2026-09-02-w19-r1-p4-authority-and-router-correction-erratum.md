---
title: "W19 R1 P4 Authority and Router Correction Erratum"
kind: "history"
status: "correction-open"
date: "2026-09-02"
coordinate: "W19 R1 P4"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Records the authority and router regression that reopened P4 corrective work."
---

# W19 R1 P4 Authority and Router Correction Erratum

## Changes

The [original P4 closeout](../../../docs/assets/archive/history/2026-08-29-w19-r1-p4-manifest-setup-reconfiguration-and-routers.md) remains unchanged as historical evidence. Later review proved that commit `02002ba23` changed accepted authority without owner approval and commit `efebfa29` implemented the changed model. The old closeout therefore does not prove the corrected router and resource-tree requirements.

[D-029](../../../docs/prd/03-open-questions-and-risk-register.md#d-029-w19-r1-resource-topology-and-router-authority-drift) records the drift, controls, and required proof. The [P4 work record](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/04-manifest-setup-reconfiguration-and-routers.md#corrective-work-reopened---2026-09-02) is reopened. P7 remains paused until the recovery is accepted and its baseline and P4 dependency proof are refreshed.

This erratum records an open correction. It does not claim that implementation, review, renewed acceptance, or closeout is complete.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [Accepted recovery design](../../../docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) | Restores the always-local router skeleton, optional resource bodies, one current resource tree, and guarded legacy migration. |
| [W19 R1 overview](../../../docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md) | Corrects the resource-authority summary. |
| [W19 R1 product boundary and resource authority](../../../docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/02-product-boundary-and-resource-authority.md) | Corrects setup, router, and projection authority. |
| [W19 R1 lifecycle, migration, and data safety authority](../../../docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/03-lifecycle-migration-and-data-safety-authority.md) | Separates router ownership from resource-body projection and adds safe legacy migration. |
| [W19 R1 Naive UAT, Persona, and agentics authority](../../../docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/04-naive-uat-persona-and-agentics-authority.md) | Clarifies that optional projection applies to resource bodies only. |
| [PRD index](../../../docs/prd/00-index.md) | Corrects the PRD 17 and PRD 21 summaries. |
| [PRD 01](../../../docs/prd/01-product-overview.md) | Corrects the product overview. |
| [PRD 02](../../../docs/prd/02-architecture-overview.md) | Corrects the architecture bootstrap and resource boundary. |
| [PRD 03](../../../docs/prd/03-open-questions-and-risk-register.md) | Closes D-009 and Q-004, narrows D-019, and adds confirmed drift record D-029. |
| [PRD 04](../../../docs/prd/04-glossary.md) | Corrects project-projection and content-fragment terms. |
| [PRD 06](../../../docs/prd/06-template-contracts-and-generated-assets.md) | Corrects template and router installation authority. |
| [PRD 07](../../../docs/prd/07-cli-command-surface-and-lifecycle.md) | Corrects setup and reconfigure selection authority. |
| [PRD 09](../../../docs/prd/09-dogfood-and-maintainer-operations.md) | Corrects dogfood routing and content-package authority. |
| [PRD 10](../../../docs/prd/10-packaging-validation-and-release-reference.md) | Adds package-retirement and router-skeleton proof to the packaging boundary. |
| [PRD 16](../../../docs/prd/16-package-runtime-and-deployment-boundaries.md) | Separates the router skeleton from optional resource bodies. |
| [PRD 17](../../../docs/prd/17-system-asset-materialization-and-local-bootstrap.md) | Owns the corrected bootstrap, heading, manifest, migration, and validation rules. |
| [PRD 21](../../../docs/prd/21-project-tool-directory-and-resource-tiers.md) | Owns the sole current resource tree and always-local router skeleton. |
| [PRD 22](../../../docs/prd/22-project-documentation-asset-model.md) | Corrects the managed project asset namespace and legacy path rules. |
| [PRD 23](../../../docs/prd/23-generated-document-metadata-and-lifecycle-handoffs.md) | Corrects current system-resource source anchors. |
| [PRD 24](../../../docs/prd/24-project-configuration-and-convention-overlay.md) | Corrects the configuration boundary for optional resource bodies. |
| [PRD 38](../../../docs/prd/38-global-store-and-project-state.md) | Keeps Store authority separate from routers and resource bodies. |
| [W19 R1 work index](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-index.md) | Reopens P4 and pauses P7. |
| [P4 work record](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/04-manifest-setup-reconfiguration-and-routers.md) | Adds the corrective tasks, acceptance criteria, and closeout boundary. |
| [P7 work record](../../../docs/work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md) | Records the pause and the required baseline refresh. |

### Developer

None this session.

### User

None this session.
