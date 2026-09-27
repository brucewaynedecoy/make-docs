---
title: "Phase 3: Markdown Evidence Source Selection"
kind: "plan"
status: "draft"
coordinate: "W18 R16 P3"
---

# Phase 3: Markdown Evidence Source Selection

## Purpose

Stop the validator from entering stored Markdown evidence directories while preserving current-authority checks in live Markdown documents.

## Authority and scope

The [source-scope design](../../designs/2026-09-26-prd-authority-source-scope.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), and [D-043](../../prd/03-open-questions-and-risk-register.md) define this phase. The P2 run read 73,242 Markdown files under one `implementation-evidence/` directory. Its [report](../../work/2026-09-26-w18-r16-prd-authority-scan-scope/evidence/2026-09-26-north-atlantic-authority-report.json) passed, but the file selection was broader than the evidence role permits.

The eligible Markdown family remains `docs/**/*.md`, including custom live paths. Exclude any path beneath a directory segment exactly named `evidence` or `implementation-evidence`, without case sensitivity. Apply the same exclusion to active PRD discovery and the live Markdown authority scan. Do not exclude a file solely because its name contains `evidence`. Keep `PRD-AUTH-005` for eligible authority links and frontmatter.

## Runtime and guidance

Change `packages/cli/src/operations/prd/authority.ts` so its directory walk rejects excluded segments before it enters them. Do not read a file and then decide that it was evidence. Keep root and symlink checks, diagnostic codes, CLI and MCP behavior, and report fields. `markdownFilesScanned` must count only selected Markdown files. The standalone structured-file count remains zero.

Update the rule upstream in `packages/docs/template/.make-docs/system/references/prd-change-management.md` and `packages/docs/template/.make-docs/system/contracts/output-contract.md`. Dogfood those files into `.make-docs/system/` and confirm that a built CLI archive contains the same rule. Do not add a project-wide registry, configuration field, or size limit for this phase.

## Project proof

Add file-access and directory-traversal tests for the two excluded names, mixed-case names, and nested evidence paths. Use authority-looking Markdown inside excluded directories so the test proves the exclusion is path-based. Add positive fixtures for eligible Markdown under a standard path and a custom path such as `docs/history/`. Check that a similarly named file remains eligible. Keep existing diagnostic and unsafe-root tests passing.

Run the built validator against the full North Atlantic BuildOS project as read-only input. Save the report, selected-file counts, elapsed time, and any error in [P3 work](../../work/2026-09-26-w18-r16-prd-authority-scan-scope/03-markdown-evidence-source-selection.md). Compare the selected Markdown count with the P2 baseline. Do not turn one elapsed time into a product speed target. Review the actual report against the human goal and record its limits.

## Acceptance

- The validator does not enter or read paths beneath either named evidence directory segment.
- Eligible live Markdown, including a custom `docs/` path, still produces `PRD-AUTH-005` for a current-authority claim to an action-named PRD.
- The report shape and root-safety behavior remain intact. The selected Markdown count excludes stored evidence.
- Upstream, dogfood, and packed guidance match PRD 39.
- The full project returns an authority report. Close D-043 only after the code, tests, guidance, and full-project evidence meet the rule.
