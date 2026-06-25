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

- [x] t1: Run changed-file Markdown link checks.
- [x] t2: Run `git diff --check`.
- [x] t3: Run relevant CLI/package tests after template or CLI path changes.
- [x] t4: Run package smoke validation after package-copy changes.
- [x] t5: Run targeted path-reference checks for shipped top-level `docs/artifacts/**`, shipped top-level `docs/archive/**`, current `docs/assets/history/**`, and future `docs/assets/breadcrumbs/**`.

### Acceptance criteria

- No future-facing shipped contract points to top-level `docs/artifacts/**` or top-level `docs/archive/**`.
- Historical references are either preserved as historical evidence or explicitly migrated with link repair.
- Package/template validation passes for the changed surfaces.

### Dependencies

- Phases 1 through 3 complete.

### Validation Evidence

| Check | Result |
| --- | --- |
| Changed-file Markdown link check | Passed for 41 changed Markdown files, including the W9 R4 authority bundle, active PRD/risk closeout, future-work prerequisite notes, router files, and the W9 R4 breadcrumb. |
| `git diff --check` | Passed. |
| `npm test -w packages/cli -- --reporter=dot` | Passed: 17 test files, 280 tests. |
| `npm run validate:defaults -w packages/cli` | Passed: 24 consistency tests. |
| `npm run build -w packages/cli` | Passed. |
| `npm run smoke:pack` | Passed after updating the smoke-pack assertions to the W9 R4 package/install/uninstall contract. |
| `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .` | Passed: 84 checked files, 0 findings. |
| Dogfood dry run | Passed: `clean-v2-full-snapshot`, 85 managed files current, 0 changes planned. |
| Targeted path checks | Passed: root dogfood and shipped template no longer expose top-level `docs/artifacts/**`, top-level `docs/archive/**`, or `docs/assets/{prompts,references,templates}/**`; root dogfood keeps `docs/assets/history/**` and adds `docs/assets/breadcrumbs/**`. |
| Future backlog sequencing check | Passed: W9 R4 is marked as the blocking pivot/prerequisite for W9 R2, W9 R3, W10 R4, W10 R5, W10 R6, W16 R1, W16 R2, W16 R3, W17 R1, W17 R2, W18 R1, W18 R2, and W18 R3 work indexes. |
| `bash scripts/check-wave-numbering.sh` | Passed. |
| `bash scripts/check-instruction-routers.sh` | Root-only baseline failure remains: `./AGENTS.md` and `./CLAUDE.md` differ because `CLAUDE.md` carries local jdocmunch/jcodemunch instructions outside the managed block, and root `CLAUDE.md` exceeds the root 12-line budget. W9 R4 router edits were compressed so `docs/AGENTS.md` and `docs/CLAUDE.md` are within their 17-line budget and pair-identical. |

## Stage 2 - Closeout Surfaces

### Tasks

- [x] t6: Update the risk register entry for R-013 with implementation evidence and remaining follow-up, if any.
- [x] t7: Reconcile PRD 21 and PRD 22 source anchors or acceptance evidence if implementation differs from the planned path.
- [x] t8: Create or update the W9 R4 closeout breadcrumb record under `docs/assets/breadcrumbs/**`.
- [x] t9: Record that existing `docs/assets/history/**` records are preserved migration evidence and that new closeout breadcrumb records use `docs/assets/breadcrumbs/**`.
- [x] t10: Decide whether manual/UAT is worthwhile for the completed W9 R4 implementation and document the decision.

### Acceptance criteria

- W9 R4 has one closeout breadcrumb under the current live history contract.
- Risk and PRD state reflect implementation evidence.
- Manual/UAT is explicitly marked worthwhile with a scenario or not worthwhile with a reason.

### Dependencies

- Stage 1 complete.

### Closeout Evidence

- R-013 is closed with implementation evidence and remaining follow-ons assigned back to PRDs 23, 24, 29, and 31.
- PRD 21 and PRD 22 already describe the implemented W9 R4 target paths, so no new PRD change document was needed.
- Accepted v2 design and W18 R3 plan/PRD references now point to `docs/assets/artifacts/**`, `.make-docs/contracts/system/**`, and `.make-docs/references/system/prompts/**` where the W9 R4 pivot moved those authority surfaces.
- Remaining unimplemented v2 work indexes now declare W9 R4 as a prerequisite or supersession gate before package/template/workflow phases use path-sensitive assumptions.
- The W9 R4 breadcrumb is [../../assets/breadcrumbs/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move.md](../../assets/breadcrumbs/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move.md).
- Existing `docs/assets/history/**` records remain pre-migration evidence. New closeout breadcrumb records use `docs/assets/breadcrumbs/**`.
- `./.make-docs/build-process/` was not present in this checkout. The phase work used `docs/AGENTS.md`, `.make-docs/references/system/lifecycle.md`, W9 R4 phase docs, and the active PRD/design/plan authority.

### Manual/UAT Decision

Manual UAT is worthwhile because W9 R4 changes the shipped install surface and a person can verify the generated tree the way a first-time project administrator would.

Scenario:

1. From the repository root, run `npm run build -w packages/cli`.
2. Create a temporary target directory outside the repo.
3. Run `node packages/cli/dist/index.js --target <temp-target> --yes`.
4. Confirm the fresh install includes `.make-docs/contracts/system`, `.make-docs/references/system/prompts`, `.make-docs/templates/system`, `.make-docs/scripts/check_path_hygiene.py`, `docs/assets/archive`, `docs/assets/artifacts`, `docs/assets/breadcrumbs`, `docs/assets/guides`, and `docs/assets/playbooks`.
5. Confirm the fresh install does not include top-level `docs/archive`, top-level `docs/artifacts`, `docs/assets/history`, `docs/assets/prompts`, `docs/assets/references`, or `docs/assets/templates`.
6. Run `node packages/cli/dist/index.js --target <temp-target> --yes --dry-run`.
7. Confirm the dry-run reports `Compatibility state: clean-v2-full-snapshot`, `Managed files evaluated: 85`, and `Changes planned: 0`.
8. Report pass if all expected paths and dry-run values match. Report fail with the first missing expected path, first unexpected old path, or the dry-run summary values that differ.
