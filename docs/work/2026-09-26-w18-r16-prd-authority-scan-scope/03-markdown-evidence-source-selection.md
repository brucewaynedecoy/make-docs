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

Apply the Markdown path rule in [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) and close [D-043](../../prd/03-open-questions-and-risk-register.md) with direct proof.

## Overview

The P2 full-project check passed, but it read 73,242 Markdown files under one plan's `implementation-evidence/` directory. The [P3 plan](../../plans/2026-09-26-w18-r16-prd-authority-scan-scope/03-markdown-evidence-source-selection.md) defines a path rule for stored evidence. This phase changes the validator and shipped guidance, then repeats the full-project check without changing that project.

## Human Experience Outcome

The user receives a complete PRD authority report without moving stored Markdown evidence. Current-authority claims in eligible standard and custom Markdown documents still receive clear diagnostics.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required now. | Prove directory pruning and file access. Preserve eligible Markdown diagnostics, root safety, report shape, CLI/MCP behavior, and package guidance parity. |
| Performance Testing | `not-needed-now` | Record selected-file counts, full-project completion, and elapsed time. No product speed target is defined. |
| Guided Progress Review | `not-needed-now` | No guided user flow changes. |
| Unassisted Goal Testing | `not-needed-now` | The full-project CLI result is the required real-use check. |

- Base maintenance action: `none`
- Performance applicability: `not-needed`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

Human Experience Review: Inspect the real full-project report and the selected-file evidence. Record whether the command met the two human promises, what the evidence cannot prove, and any follow-up. A human response is not required to close this phase.

## Source PRD Docs

- [PRD 39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- [D-043 stored Markdown evidence scan](../../prd/03-open-questions-and-risk-register.md) stays open until the P3 close rule is proved.
- No deferred obligation or Unassisted Goal Testing scenario is active for this phase.

## Stage 1 - Path Selection and Full-Project Proof

### Tasks

- [ ] t1: Update `packages/cli/src/operations/prd/authority.ts` to prune directory segments named exactly `evidence` or `implementation-evidence`, without case sensitivity, before traversal. Apply the rule to active PRD discovery and live Markdown scanning. Preserve root and symlink safety.
- [ ] t2: Add regression tests that fail if an excluded directory is entered or a file inside it is read. Cover nested and mixed-case paths, authority-looking evidence, eligible custom live Markdown, and a filename that merely contains `evidence`.
- [ ] t3: Update the rule upstream in `packages/docs/template/.make-docs/system/references/prd-change-management.md` and `packages/docs/template/.make-docs/system/contracts/output-contract.md`. Dogfood the upstream files and prove packed CLI guidance matches.
- [ ] t4: Run the built validator against the full North Atlantic BuildOS project as read-only input. Save the report, selected Markdown count, elapsed time, and any error in phase evidence. Compare the count with the P2 report without claiming a fixed speed target.
- [ ] t5: Run relevant tests and link checks. Complete the agent Human Experience Review. Close D-043 only if runtime, tests, shipped guidance, and full-project proof meet the PRD rule.

### Acceptance criteria

- The validator does not enter or read either excluded evidence directory family. `markdownFilesScanned` counts only selected Markdown files.
- An eligible authority link or frontmatter field under a standard or custom live Markdown path still reports `PRD-AUTH-005`. A similarly named file remains eligible.
- The existing structured-file exclusion, diagnostic codes, report keys, root safety, and CLI/MCP behavior remain intact.
- Upstream, dogfood, and packed guidance state the same rule as PRD 39.
- The full project returns an authority report. Any remaining failure has a separate recorded cause.

### Dependencies

- P1 and P2 are complete. [D-043](../../prd/03-open-questions-and-risk-register.md) is the open issue for this phase.
- Review the [deterministic and agentic twin guidance](../../assets/project/developing-deterministic-agentic-twins.md) before changing business logic.
- Keep the North Atlantic BuildOS project read-only. Do not move, delete, or trim its evidence.

### Closeout Notes

Open. Record the code and file-access proof, packaged guidance check, full-project result, Human Experience Review, and D-043 disposition here when the phase runs.
