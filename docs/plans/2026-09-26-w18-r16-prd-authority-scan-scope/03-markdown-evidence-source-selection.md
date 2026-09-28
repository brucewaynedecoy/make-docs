---
title: "Phase 3: Markdown Evidence Source Selection"
kind: "plan"
status: "draft"
coordinate: "W18 R16 P3"
---

# Phase 3: Markdown Evidence Source Selection

## Purpose

Select working Markdown sources before file reads. Use bounded frontmatter to check their role. Preserve current-authority checks in standard, declared custom, and older working documents.

## Authority and scope

The [source-scope design](../../designs/2026-09-26-prd-authority-source-scope.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md), and [D-043](../../prd/03-open-questions-and-risk-register.md) define this phase. The P2 run read 73,242 Markdown files under one `implementation-evidence/` directory. Its [report](../../work/2026-09-26-w18-r16-prd-authority-scan-scope/evidence/2026-09-26-north-atlantic-authority-report.json) passed, but the file selection was broader than the working-document role permits.

The earlier P3 candidate pruned directories named `evidence` or `implementation-evidence`. Its 109-file North Atlantic run proves that candidate only. These names are an observed storage detail, not a durable source rule. Keep its evidence as history; do not use it as acceptance proof for the revised approach.

Define the default source set from the existing output path contract: direct numbered files in `docs/prd/`, dated designs directly in `docs/designs/`, direct overview and phase files in dated W/R plan directories, and direct index and phase files in dated W/R work directories. A file nested deeper under a plan or work package is not selected because it is outside the working document shape, regardless of its directory name. The optional `prd_authority.markdown_sources` list in `.make-docs/config.yaml` names exact custom files under `docs/`. A copied header, a Store record, or a document body cannot add a source. Keep `PRD-AUTH-005` for selected Markdown authority links and frontmatter.

Use frontmatter as a second check. Read it with a finite byte bound before any body read. Check `kind` and `status` against the selected role where the owning contract defines them. Do not drop an older selected document because it lacks frontmatter. Do not silently pass a selected document when malformed or over-limit metadata makes a required check incomplete. A completed work record can remain a working document at its canonical path.

## Runtime and guidance

Replace the uncommitted directory-name selector in `packages/cli/src/operations/prd/authority.ts`. Traverse only the bounded default working document shapes and resolve declared custom file paths directly. Do not traverse arbitrary descendants under plan and work packages. Do not read a file and then decide that it was stored evidence. Read bounded frontmatter for each selected source before the body. Keep root and symlink checks, authority and provenance meanings, CLI and MCP behavior, and existing report fields. Make the selected-source coverage clear. `markdownFilesScanned` must count bodies checked by the Markdown authority scan. The standalone structured-file count remains zero.

Add the optional exact-path config reader without requiring Store access. Invalid, escaping, symlinked, directory, or glob entries must fail with an actionable result. Do not write config during validation. Update the rule upstream in `packages/docs/template/.make-docs/system/references/prd-change-management.md` and `packages/docs/template/.make-docs/system/contracts/output-contract.md`. Dogfood those files into `.make-docs/system/` and confirm that a built CLI archive contains the same rule. No file-size cutoff may stand in for source selection. A finite frontmatter bound protects the header read only.

## Project proof

Add file-access and directory-traversal tests for the standard path shapes. Put authority-looking Markdown and copied `kind`/`status` metadata beneath plan and work packages under several unrelated storage names. Prove the validator never enters or reads those files. Add positive fixtures for a default source, a custom exact path such as `docs/history/current.md`, and a selected older document without frontmatter. Cover a malformed or over-limit header, an invalid custom path, a symlink, and a Store-free project. Keep existing diagnostics and unsafe-root tests passing.

Run the built validator against the full North Atlantic BuildOS project as read-only input. Save the report, source classes, selected-file counts, elapsed time, and any error in [P3 work](../../work/2026-09-26-w18-r16-prd-authority-scan-scope/03-markdown-evidence-source-selection.md). Compare the selected Markdown count with the P2 baseline and the old P3 candidate without calling them equivalent rules. Do not turn one elapsed time into a product speed target. Review the actual report against the human goal and record its limits.

## Acceptance

- The validator selects default working paths without recursing into stored copies under plan or work packages, regardless of storage names or copied metadata.
- A declared custom `docs/` file and a selected older file without frontmatter still produce `PRD-AUTH-005` for a current-authority claim to an action-named PRD.
- Selected files receive bounded header checks before body reads. Invalid source declarations and incomplete required header checks do not silently pass.
- The report and root-safety behavior remain intact. The selected Markdown count excludes stored copies and coverage is clear. Store absence does not change selection or result.
- Upstream, dogfood, and packed guidance match PRDs 39 and 24.
- A fresh full-project run returns an authority report under the revised rule. Close D-043 only after code, tests, guidance, and that fresh evidence meet the rule.
