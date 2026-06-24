---
date: 2026-06-24
coordinate: W9 R3 P1
repo: make-docs
branch: make-docs-v2
status: completed
summary: "Reconciled PRD 22 discovery, baseline citations, risk-register wording, and W9 R3 backlog task tracking."
---

# New Docs Assets Requirements and Register Reconciliation

## Changes

Completed W9 R3 Phase 1 by confirming PRD 22 discovery in the active PRD index, adding the missing product-overview backlink for the PRD 21/PRD 22 namespace split, narrowing stale risk-register wording so `docs/assets/**` no longer reads as both reader-facing storage and make-docs tool-resource storage, and normalizing the W9 R3 backlog task checkboxes to the live phase-tracking contract.

| Area | Summary |
| --- | --- |
| Product overview | Added a [../../prd/01-product-overview.md](../../prd/01-product-overview.md) change note that separates `.make-docs/**` tool resources from future `docs/assets/{guides,playbooks}/` reader-facing assets. |
| Risk register | Updated [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) entries for hidden-dot routing, starter-prompt placement, and restructure migration so PRD 21 owns tool-resource movement while PRD 22 owns guide/playbook/archive targets. |
| Work backlog | Marked Phase 1 complete in [../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/01-requirements-and-register-reconciliation.md](../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/01-requirements-and-register-reconciliation.md) and normalized W9 R3 phase task checkboxes so `wave_status.py` can track remaining phases. |
| Coverage decisions | Developer-guide and user-guide verdicts are `none` because this phase only reconciled active PRD/register requirements. PRD coverage is `baseline-change-note` plus `risk-register-update`; no new PRD doc was needed because PRD 22 already owns the requirement surface. UAT remains deferred until the full W9 R3 wave is complete. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../prd/01-product-overview.md](../../prd/01-product-overview.md) | Adds the missing PRD 21/PRD 22 namespace split backlink. |
| [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) | Narrows stale `docs/assets/**` migration wording to the accepted tool-resource and reader-facing asset split. |
| [../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/01-requirements-and-register-reconciliation.md](../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/01-requirements-and-register-reconciliation.md) | Records Phase 1 completion evidence and coverage decisions. |
| [../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/02-reader-facing-asset-namespace.md](../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/02-reader-facing-asset-namespace.md) | Normalizes open Phase 2 task tracking to the live work-phase checkbox contract. |
| [../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/03-persona-schema-and-validation.md](../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/03-persona-schema-and-validation.md) | Normalizes open Phase 3 task tracking to the live work-phase checkbox contract. |
| [../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/04-package-parity-and-closeout.md](../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/04-package-parity-and-closeout.md) | Normalizes open Phase 4 task tracking to the live work-phase checkbox contract. |

### Developer

None this session.

### User

None this session.
