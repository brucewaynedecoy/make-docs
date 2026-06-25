# Phase 4: Validation Breadcrumbs Closeout

## Purpose

Close W9 R4 with validation, breadcrumb/history handling, PRD/risk verification, and a final manual-test decision.

## Overview

This phase verifies the full pivot across docs, templates, package copies, CLI path knowledge, dogfood state, and historical-reference preservation. Manual/UAT remains deferred until this phase.

## Source PRD Docs

- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)
- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Stage 1 - Validation Matrix

### Tasks

- [ ] t1: Run changed-file Markdown link checks.
- [ ] t2: Run `git diff --check`.
- [ ] t3: Run relevant CLI/package tests after template or CLI path changes.
- [ ] t4: Run package smoke validation after package-copy changes.
- [ ] t5: Run targeted path-reference checks for shipped top-level `docs/artifacts/**`, shipped top-level `docs/archive/**`, current `docs/assets/history/**`, and future `docs/assets/breadcrumbs/**`.

### Acceptance criteria

- No future-facing shipped contract points to top-level `docs/artifacts/**` or top-level `docs/archive/**`.
- Historical references are either preserved as historical evidence or explicitly migrated with link repair.
- Package/template validation passes for the changed surfaces.

### Dependencies

- Phases 1 through 3 complete.

## Stage 2 - Closeout Surfaces

### Tasks

- [ ] t6: Update the risk register entry for R-013 with implementation evidence and remaining follow-up, if any.
- [ ] t7: Reconcile PRD 21 and PRD 22 source anchors or acceptance evidence if implementation differs from the planned path.
- [ ] t8: Create or update the W9 R4 closeout history record at the current live `docs/assets/history/**` path.
- [ ] t9: Record that `docs/assets/breadcrumbs/**` is the future breadcrumb target while the current closeout still uses `docs/assets/history/**`.
- [ ] t10: Decide whether manual/UAT is worthwhile for the completed W9 R4 implementation and document the decision.

### Acceptance criteria

- W9 R4 has one closeout breadcrumb under the current live history contract.
- Risk and PRD state reflect implementation evidence.
- Manual/UAT is explicitly marked worthwhile with a scenario or not worthwhile with a reason.

### Dependencies

- Stage 1 complete.
