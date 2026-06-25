# W10 R4 Template Package Dogfood Source of Truth Contract Work Index

## Purpose

Sequence implementation work for PRD 19 and the W10 R4 plan.

## W9 R5 Prerequisite

Before executing this backlog, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md). W10 R4 should validate template/source-of-truth behavior against `docs/assets/{archive,artifacts,library,playbooks}/**`, on-demand `docs/assets/archive/history/**`, and `.make-docs/{contracts,references,scripts,templates,agentics}/**`; do not consume W9 R4's superseded `docs/assets/guides/**` or `docs/assets/breadcrumbs/**` targets.

## Migration Link-Rewrite Prerequisite

W10 R4 package/source-of-truth validation must not cite root dogfood cleanup as shipped migration behavior. If source-of-truth or package-copy work depends on moved documentation trees, it must verify that the packaged CLI/shared-core migration flow owns deterministic Markdown link rewriting, review routing, and destination-tree validation, or record that dependency as a blocking gap.

W10 R4 may proceed without implementing deterministic Markdown-tree migration. That implementation belongs to a later dedicated migration-hardening backlog unless a W10 R4 package/source-of-truth change directly depends on moved user Markdown trees.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Phase Order

1. `01-requirements-and-register-reconciliation.md`
2. `02-template-source-ownership.md`
3. `03-dogfood-reseed-and-package-copy.md`
4. `04-validation-and-closeout.md`

## Validation

- `npm test -w packages/cli`
- `npm run validate:defaults -w packages/cli`
- `npm run smoke:pack`
- Package dry-run checks when package contents change
- Targeted dogfood/template parity and instruction-router checks
