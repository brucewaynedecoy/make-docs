---
title: "Phase 1: Validator Selection and Regression"
kind: "plan"
status: "draft"
coordinate: "W18 R16 P1"
---

# Phase 1: Validator Selection and Regression

## Purpose

Change the validator's source selection without weakening the supported Markdown checks.

## Authority and scope

The [design](../../designs/2026-09-26-prd-authority-source-scope.md) defines the source boundary. [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) owns `R-PRD-AUTH`.

Remove the `structuredFiles(targetRoot)` whole-project walk from `packages/cli/src/operations/prd/authority.ts`. Do not replace it with an extension scan under another directory. The current product contract names no standalone structured source, so this phase reads none. Retain the active PRD Markdown checks and the live Markdown authority-section and frontmatter checks. Keep `structuredFilesScanned` in the report with value zero.

## Regression proof

Revise `packages/cli/tests/prd-authority.test.ts`. Replace the test that expects diagnostics from a synthetic `docs/conformance/map.jsonl`. Use unrelated structured evidence with authority-like keys as an exclusion fixture. Prove that the validator does not open it. Keep or add tests for `PRD-AUTH-005` from Markdown links and frontmatter. Check CLI and MCP report parity through the existing operation tests.

## Acceptance

- No project-wide structured-file enumeration or read remains in this validator.
- Excluded evidence cannot trigger a diagnostic or read error.
- Supported Markdown diagnostics and root-safety failures still work.
- The report shape stays stable.
