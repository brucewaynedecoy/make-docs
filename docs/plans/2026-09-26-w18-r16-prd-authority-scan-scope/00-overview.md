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
  why: "The existing CLI PRD owns the validator rule."
  coordinate_handoff: "Carry W18 R16 into the PRD history and work backlog."
---

# W18 R16 PRD Authority Scan Scope Plan

## Purpose

Correct the source boundary of `prd.authority.validate` and restore a usable full-project result.

## Objective

The validator must read files that Make Docs defines as current PRD authority sources. P1 and P2 removed the broad structured-file scan and proved the full-project result. P3 applies the same source-role rule to stored Markdown evidence. Live Markdown under `docs/` remains eligible, except paths beneath directory segments named `evidence` or `implementation-evidence`.

This is authoritative PRD maintenance. The existing owner is [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md). No new product PRD is needed. The existing index owner and reading order remain valid.

## Human Experience Propagation

Source: [PRD Authority Source Scope](../../designs/2026-09-26-prd-authority-source-scope.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| Validation does not open unrelated structured evidence. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | A complete CLI or MCP authority report on a project with large evidence files. | [P1](01-validator-selection-and-regression.md), [P2](02-guidance-and-project-proof.md) | Automated selection test and full-project command result. | None. |
| Supported Markdown claims still produce `PRD-AUTH-005`. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | An actionable authority diagnostic. | [P1](01-validator-selection-and-regression.md) | Existing and new positive and negative fixtures. | None. |
| Validation does not enter or read stored Markdown evidence under the named directory families. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | A complete authority report without scanning the 73,242 observed evidence files. | [P3](03-markdown-evidence-source-selection.md) | Directory-traversal and file-access tests plus a full-project report. | None. |
| Live Markdown claims outside evidence directories still produce `PRD-AUTH-005`, including custom document paths. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | The same actionable diagnostic in eligible documents. | [P3](03-markdown-evidence-source-selection.md) | Positive fixtures in standard and custom live paths. | None. |

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
| 3 | [Markdown evidence source selection](03-markdown-evidence-source-selection.md) | Named evidence directories are pruned before traversal; live Markdown checks and full-project reporting remain intact. |

## Dependencies

- Use the [source-scope design](../../designs/2026-09-26-prd-authority-source-scope.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) as the decision and product authority.
- [D-042](../../prd/03-open-questions-and-risk-register.md) closed after P2. Keep D-043 open until P3 code, shipped guidance, tests, and full-project proof agree.
- Author Make Docs system guidance in `packages/docs/template/` first. Then dogfood it into this repo's `.make-docs/` instance and check the packaged CLI copy.
- Review [deterministic and agentic twin guidance](../../assets/project/developing-deterministic-agentic-twins.md) when changing the validator and its agent guidance.
- The North Atlantic BuildOS project is a read-only validation target. Do not move or delete its evidence.

## Validation

- Test that a standalone JSON, JSONL, YAML, or YML file with an apparent `source_prd` field is outside the scan, even when it sits under `docs/plans/**/implementation-evidence/**`.
- Test file access, not just the final diagnostic count. Use a fixture that fails if the validator opens an excluded file.
- Test that a supported Markdown authority link and Markdown frontmatter source field still report `PRD-AUTH-005`.
- Test that `evidence` and `implementation-evidence` directory segments are pruned before traversal or reads, without case sensitivity. Keep similarly named files and other live Markdown paths in scope.
- Test the unchanged report keys, stable diagnostic codes, invalid-root behavior, and symlink protection.
- Run the validator on a project that retains the stored evidence. Record status, counts, elapsed time, and any remaining error. Do not claim that the earlier timeout is explained by the string error alone.
- Check the upstream, dogfood, and packaged guidance for the same source rule. Run the repository's relevant tests and `git diff --check`.
- Repeat the full North Atlantic BuildOS run for P3 without changing the project. Record the new selected Markdown count, elapsed time, report, and any remaining failure. Compare with the [P2 baseline](../../work/2026-09-26-w18-r16-prd-authority-scan-scope/evidence/2026-09-26-north-atlantic-authority-report.json) without using elapsed time as a fixed product target.

## Intended Follow-On

Route: `implementation-loop`.

Next step: Use [W18 R16 P3 work](../../work/2026-09-26-w18-r16-prd-authority-scan-scope/03-markdown-evidence-source-selection.md) to implement the [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) Markdown path rule.

Why: The P2 run proved the structured-file fix and exposed a separate Markdown evidence scan. The validator and shipped guidance must follow the P3 rule.

Coordinate handoff: W18 R16 P3.
