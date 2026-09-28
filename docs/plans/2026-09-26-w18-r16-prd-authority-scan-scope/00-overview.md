---
title: "W18 R16 PRD Authority Scan Scope Plan"
kind: "plan"
status: "draft"
coordinate: "W18 R16"
source:
  type: "design"
  path: "docs/designs/2026-09-26-prd-authority-source-scope.md"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "The CLI and project-config PRDs own the source rule."
  coordinate_handoff: "Carry W18 R16 into the PRD history and work backlog."
---

# W18 R16 PRD Authority Scan Scope Plan

## Purpose

Correct the source boundary of `prd.authority.validate` and restore a usable full-project result.

## Objective

The validator must read files that Make Docs defines as current PRD authority sources. P1 and P2 removed the broad structured-file scan and proved the full-project result. P3 applies the same source-role rule to Markdown. It selects canonical working paths and exact declared custom paths before reading a bounded header. It does not use evidence directory names or copied YAML metadata as proof of source role.

This is authoritative PRD maintenance. [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) owns validator behavior. [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) owns the optional custom source declaration. No new product PRD is needed. The existing index owner and reading order remain valid.

## Human Experience Propagation

Source: [PRD Authority Source Scope](../../designs/2026-09-26-prd-authority-source-scope.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| Validation does not open unrelated structured evidence. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | A complete CLI or MCP authority report on a project with large evidence files. | [P1](01-validator-selection-and-regression.md), [P2](02-guidance-and-project-proof.md) | Automated selection test and full-project command result. | None. |
| Supported Markdown claims still produce `PRD-AUTH-005`. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | An actionable authority diagnostic. | [P1](01-validator-selection-and-regression.md) | Existing and new positive and negative fixtures. | None. |
| Validation does not enter or read stored Markdown copies under a working plan or work package, whatever the copy directory is named. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | A complete authority report without scanning the 73,242 observed evidence files. | [P3](03-markdown-evidence-source-selection.md) | Path-shape and file-access tests plus a fresh full-project report. | None. |
| Working Markdown claims still produce `PRD-AUTH-005`, including an exact declared custom path and a selected older file without frontmatter. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) | The same actionable diagnostic in selected documents. | [P3](03-markdown-evidence-source-selection.md) | Positive fixtures for standard, custom, and older working files. | None. |
| A copied `kind` and `status`, or an optional Store record, cannot add a stored file to the source set. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) | The report states only the sources it actually checked. | [P3](03-markdown-evidence-source-selection.md) | Copied-header and Store-free fixtures with selected-source coverage review. | None. |

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| Fixed elapsed-time target | `none` | `not-needed` | `none` | None. Both defects concern incorrect file selection. | Not applicable. Record P3 selected-file counts, completion, and elapsed time without setting a speed target. | Reassess only if the narrowed full-project run still fails to finish. |

## Coordinate Decision

The validator is part of the CLI command and operation registry capability in W18 R11. This package corrects that existing capability. W18 R15 is the highest prior plan revision in that wave. W18 R16 is the next unused revision for this source lineage.

P3 stays in W18 R16 because the P2 run exposed the Markdown part of the same source-scope decision. [D-043](../../prd/03-open-questions-and-risk-register.md) records the new evidence and remains open until P3 proof.

## Phase Map

| Phase | Plan | Result |
| --- | --- | --- |
| 1 | [Validator selection and regression](01-validator-selection-and-regression.md) | The code selects supported sources before reads and preserves Markdown diagnostics. |
| 2 | [Guidance and project proof](02-guidance-and-project-proof.md) | Shipped and dogfood guidance match the PRD. A full project run confirms the result. |
| 3 | [Markdown evidence source selection](03-markdown-evidence-source-selection.md) | Working documents are selected by path and declared custom sources; bounded frontmatter checks precede body reads; the full-project report states actual coverage. |

## Dependencies

- Use the [source-scope design](../../designs/2026-09-26-prd-authority-source-scope.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), and [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) as the decision and product authority.
- [D-042](../../prd/03-open-questions-and-risk-register.md) closed after P2. Keep D-043 open until the revised P3 code, shipped guidance, tests, and full-project proof agree. The uncommitted directory-name candidate and its run do not close it.
- Author Make Docs system guidance in `packages/docs/template/` first. Then dogfood it into this repo's `.make-docs/` instance and check the packaged CLI copy.
- Review [deterministic and agentic twin guidance](../../assets/project/developing-deterministic-agentic-twins.md) when changing the validator and its agent guidance.
- The North Atlantic BuildOS project is a read-only validation target. Do not move or delete its evidence.

## Validation

- Test that a standalone JSON, JSONL, YAML, or YML file with an apparent `source_prd` field is outside the scan, even when it sits under `docs/plans/**/implementation-evidence/**`.
- Test file access, not just the final diagnostic count. Use a fixture that fails if the validator opens an excluded file.
- Test that a supported Markdown authority link and Markdown frontmatter source field still report `PRD-AUTH-005`.
- Test the default Make Docs path shapes without recursing into other files under a plan or work package. Test stored copies with arbitrary directory names and copied frontmatter.
- Test exact custom Markdown paths in project config, invalid and escaping entries, symlinks, and an absent custom-source list. Test a selected older document without frontmatter.
- Test that a bounded header read precedes any eligible body read. A malformed or over-limit header must not silently produce a passing result.
- Test that optional Store state cannot add a source or change the result. An initialized project without local Store access must validate.
- Test the unchanged report keys, stable diagnostic codes, invalid-root behavior, and symlink protection.
- Run the validator on a project that retains the stored evidence. Record status, counts, elapsed time, and any remaining error. Do not claim that the earlier timeout is explained by the string error alone.
- Check the upstream, dogfood, and packaged guidance for the same source rule. Run the repository's relevant tests and `git diff --check`.
- Repeat the full North Atlantic BuildOS run after the revised P3 implementation, without changing the project. Record the selected source classes, Markdown count, elapsed time, report, and any remaining failure. Compare with the [P2 baseline](../../work/2026-09-26-w18-r16-prd-authority-scan-scope/evidence/2026-09-26-north-atlantic-authority-report.json) without using elapsed time as a fixed product target. Keep the earlier 109-file P3 candidate run as narrow historical evidence only.

## Intended Follow-On

Route: `implementation-loop`.

Next step: Use [W18 R16 P3 work](../../work/2026-09-26-w18-r16-prd-authority-scan-scope/03-markdown-evidence-source-selection.md) to implement the [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) source rule and the [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) custom-path declaration.

Why: The P2 run proved the structured-file fix and exposed a separate Markdown evidence scan. The validator and shipped guidance must follow the P3 rule.

Coordinate handoff: W18 R16 P3.
