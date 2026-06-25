# Phase 1: Authority and Migration Inventory

## Purpose

Confirm the reconciled W9 R4 authority set and produce the concrete migration inventory that later phases must execute.

## Overview

This phase is the implementation safety gate. It verifies that active PRDs, the W9 R4 plan, and the pivot design agree before code, template, or router changes start. It also separates shipped template targets from make-docs repo dogfood and unmanaged local material.

## Source PRD Docs

- [../../prd/00-index.md](../../prd/00-index.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)
- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Stage 1 - Authority Verification

### Tasks

- [ ] t1: Re-read the W9 R4 design, plan, PRD 21, PRD 22, PRD index, and risk register.
- [ ] t2: Confirm the implementation scope uses `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**` and `.make-docs/{contracts,references,scripts,templates,agentics}/**`.
- [ ] t3: Confirm top-level `docs/artifacts/**` is a hard move and top-level `docs/archive/**` is not a shipped v2 target.
- [ ] t4: Confirm existing `docs/assets/history/**` remains the current closeout path until the breadcrumb contract migration lands.

### Acceptance criteria

- The phase notes identify the exact accepted authority files.
- No implementation decision remains open for artifact hard move, archive target, breadcrumb target, or dogfood boundary.
- Any discovered disagreement is reconciled into the current phase before later phases start.

### Dependencies

- W9 R4 design and PRD reconciliation are present in the worktree.

## Stage 2 - Migration Inventory

### Tasks

- [ ] t5: Inventory future-facing references to top-level `docs/artifacts/**`, top-level `docs/archive/**`, current `docs/assets/history/**`, and transitional `docs/assets/{prompts,references,templates}/**`.
- [ ] t6: Classify each hit as historical evidence, active contract, shipped template, CLI/package path knowledge, dogfood state, or unmanaged local material.
- [ ] t7: Map every active-contract or shipped-template hit to its W9 R4 target path family.
- [ ] t8: Record which hits must be preserved as historical references instead of rewritten.

### Acceptance criteria

- The inventory covers docs, package templates, CLI template copies, CLI source/tests, smoke scripts, and `.make-docs/manifest.json` where relevant.
- Historical references are explicitly separated from future-facing targets.
- The inventory is sufficient for phases 2 and 3 to edit without searching for policy decisions.

### Dependencies

- Stage 1 complete.
