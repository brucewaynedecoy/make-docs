---
title: "Phase 3: Markdown Evidence Source Selection"
kind: "work"
status: "active"
coordinate: "W18 R16 P3"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 3: Markdown Evidence Source Selection

## Purpose

Apply the working Markdown source rule in [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) and the custom path contract in [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md). Close [D-043](../../prd/03-open-questions-and-risk-register.md) only after proof of the revised rule.

## Overview

The P2 full-project check passed, but it read 73,242 Markdown files under one plan's `implementation-evidence/` directory. An initial P3 candidate skipped two directory names. That candidate passed one full-project run, but its rule is too narrow. The [revised P3 plan](../../plans/2026-09-26-w18-r16-prd-authority-scan-scope/03-markdown-evidence-source-selection.md) selects working documents from canonical path shapes and exact declared custom paths, then checks bounded frontmatter before eligible body reads. The old candidate code and guidance remain uncommitted and are not accepted implementation.

## Human Experience Outcome

The user receives a complete PRD authority report without moving stored Markdown evidence. The report makes its selected-source coverage clear. Current-authority claims in standard, declared custom, and selected older Markdown documents still receive clear diagnostics. Store access is not required.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required now. | Prove positive path selection, bounded header reads, copied-header rejection, legacy fallback, exact custom paths, Store-free operation, eligible Markdown diagnostics, root safety, CLI/MCP behavior, and guidance parity. |
| Performance Testing | `not-needed-now` | Record selected-source classes, full-project completion, and elapsed time. No product speed target is defined. |
| Guided Progress Review | `not-needed-now` | No guided user flow changes. |
| Unassisted Goal Testing | `not-needed-now` | The full-project CLI result is the required real-use check. |

- Base maintenance action: `none`
- Performance applicability: `not-needed`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

Human Experience Review: Inspect a fresh full-project report under the revised rule and the selected-file evidence. Record whether the command met the human promises, what the evidence cannot prove, and any follow-up. A human response is not required to close this phase.

## Source PRD Docs

- [PRD 39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)

## Source Obligations, Scenarios, And Findings

- [D-043 stored Markdown evidence scan](../../prd/03-open-questions-and-risk-register.md) stays open until the P3 close rule is proved.
- No deferred obligation or Unassisted Goal Testing scenario is active for this phase.

## Stage 1 - Directory-Name Candidate and Disposition

### Tasks

- [x] t1: Update `packages/cli/src/operations/prd/authority.ts` to prune directory segments named exactly `evidence` or `implementation-evidence`, without case sensitivity, before traversal. Apply the rule to active PRD discovery and live Markdown scanning. Preserve root and symlink safety.
- [x] t2: Add regression tests that fail if an excluded directory is entered or a file inside it is read. Cover nested and mixed-case paths, authority-looking evidence, eligible custom live Markdown, and a filename that merely contains `evidence`.
- [x] t3: Update the rule upstream in `packages/docs/template/.make-docs/system/references/prd-change-management.md` and `packages/docs/template/.make-docs/system/contracts/output-contract.md`. Dogfood the upstream files and prove packed CLI guidance matches.
- [x] t4: Run the built validator against the full North Atlantic BuildOS project as read-only input. Save the report, selected Markdown count, elapsed time, and any error in phase evidence. Compare the count with the P2 report without claiming a fixed speed target.
- [x] t5: Run relevant tests and link checks. Complete the agent Human Experience Review.
- [x] t6: Record the directory-name selector and its full-project result as narrow candidate evidence. Keep D-043 open because the rule does not define working documents.

### Acceptance criteria

- The candidate does not enter or read either named evidence directory family in its fixture.
- The candidate still reports `PRD-AUTH-005` in its selected standard and custom fixture paths.
- The candidate returns a full-project report with 109 selected Markdown files.
- These facts do not prove source selection by document role. Stage 2 must meet the revised PRDs before P3 closes.

### Dependencies

- P1 and P2 are complete. [D-043](../../prd/03-open-questions-and-risk-register.md) is the open issue for this phase.
- Review the [deterministic and agentic twin guidance](../../assets/project/developing-deterministic-agentic-twins.md) before changing business logic.
- Keep the North Atlantic BuildOS project read-only. Do not move, delete, or trim its evidence.

### Implementation Evidence

- The shared Markdown walker in `packages/cli/src/operations/prd/authority.ts` skips the two exact directory names before recursive entry. Both active PRD discovery and the live Markdown scan use this walker.
- `packages/cli/tests/prd-authority.test.ts` records directory visits and file reads. The new fixture proves that nested and mixed-case evidence directories are not entered or read. It also proves that standard and custom live Markdown paths still report `PRD-AUTH-005` and that a filename containing `evidence` stays eligible. All 22 authority tests passed.
- The upstream and dogfood guidance files match byte for byte. A packed CLI archive contains byte-matching copies of both upstream files. The 53 default consistency, link, and package safety tests passed. TypeScript checking passed.
- The [full-project report](evidence/2026-09-27-north-atlantic-authority-report.json) passed with 8 PRDs, 109 Markdown files, 0 structured files, 142 authority links, and no findings. The [run record](evidence/2026-09-27-north-atlantic-authority-run.txt) records the command, exit code, time, comparison, and limit. P2 counted 73,372 Markdown files. The selected count fell by 73,263.
- The built validator also passed on this Make Docs repo. The changed guidance has no broken links. `git diff --check` passed.

### Human Experience Review

This review applies only to the superseded directory-name candidate. It does not satisfy the revised P3 promises.

| Promise | Observation | Conclusion | Limit and next action |
| --- | --- | --- | --- |
| The command returns a complete report without reading stored Markdown evidence. | The full-project command returned a passing report with 109 selected Markdown files. The fixture recorded no directory entry or file read beneath either excluded directory name. | Satisfied within the full-project report and file-access test. | The access spy ran on a fixture. The full-project count supports the same selection rule but is not a read trace. Keep this rule in future regression tests. |
| Eligible standard and custom live Markdown still gets authority diagnostics. | The fixture produced `PRD-AUTH-005` in `docs/work/`, `docs/history/`, and a filename containing `evidence`. | Satisfied within the fixture. | The full project had no diagnostic to inspect. Future reports must still be checked when a real authority claim is found. |

This review checks the command result and tests. It makes no claim about a person's lived experience. No human acceptance gate is defined for this phase.

### Closeout Notes

This candidate is superseded. Its code, tests, and guidance are still uncommitted. The passing 109-file run is historical evidence for the directory-name rule only. D-043 and P3 remain open. Stage 2 owns the accepted fix and fresh proof.

## Stage 2 - Working Markdown Source Selection and Proof

### Tasks

- [ ] t1: Replace directory-name pruning with default source selection from direct PRD, design, plan, and work document shapes. Do not enter unrelated descendants beneath plan or work packages. Keep root and symlink safety.
- [ ] t2: Add the optional `prd_authority.markdown_sources` exact-path reader in project config. Reject directories, globs, archive paths, symlinks, unsafe paths, and missing declared files with clear validation results. Do not write config or require Store access.
- [ ] t3: Read a finite YAML header after path selection and before any body read. Use `kind` and `status` as role checks where contracts define them. Keep selected older documents without frontmatter in scope. Fail clearly when malformed or over-limit metadata prevents a required check.
- [ ] t4: Add access and diagnostic tests for default paths, arbitrary stored-copy directory names, copied frontmatter, standard and custom working paths, older files, invalid declarations, Store absence, report coverage, and existing CLI/MCP behavior.
- [ ] t5: Update shipped guidance upstream, dogfood it, and check the packed CLI copy. Explain how a project declares a custom working document and how a user reads the coverage result.
- [ ] t6: Run the built validator against North Atlantic BuildOS as read-only input. Save the fresh report, selected-source classes, counts, elapsed time, and limits. Compare with P2 and the superseded P3 candidate without treating their rules as equivalent.
- [ ] t7: Complete the agent Human Experience Review from the fresh result. Run relevant tests and link checks. Close D-043 only when runtime, tests, shipped guidance, and full-project proof meet the revised PRDs.

### Acceptance criteria

- The validator does not enter or read stored copies under standard plan or work packages, whatever their directory name or copied header says.
- A standard source, a declared custom source, and a selected older source still receive `PRD-AUTH-005` for an invalid current-authority claim.
- Source selection works without Store access. Invalid declared paths and incomplete required header checks do not produce a passing report.
- The report names or clearly summarizes its selected-source coverage. Existing report keys, structured-file exclusion, root safety, and CLI/MCP behavior remain intact.
- Upstream, dogfood, and packed guidance agree with PRDs 39 and 24. A fresh full-project run proves the revised rule.

### Dependencies

- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) and [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) own the current rule. [D-043](../../prd/03-open-questions-and-risk-register.md) stays open until Stage 2 closes.
- The Stage 1 code, tests, and guidance must be replaced or adapted without losing the recorded evidence.
- North Atlantic BuildOS stays read-only. Do not move, delete, or trim its evidence.

### Implementation Evidence

Pending Stage 2 implementation and a fresh full-project report. Stage 1 evidence does not satisfy this stage.

### Human Experience Review

Pending the fresh report and access tests. Review the actual selected-source coverage, preserved diagnostics, limits, and next action for each promise.

### Closeout Notes

Stage 2 is not implemented. P3 and D-043 remain open.
