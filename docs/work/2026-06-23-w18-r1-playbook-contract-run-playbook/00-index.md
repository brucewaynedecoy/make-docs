# W18 R1 Playbook Contract Run Playbook Work

## W9 R5 Prerequisite

Before executing this backlog, apply [W9 R5 v2 Library and Archive History IA Correction](../2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction/00-index.md). W18 R1 playbook behavior must target `docs/assets/playbooks/**`, use `.make-docs/**` for system contracts and prompts, and treat `docs/library/playbooks/**` only as historical migration evidence.

## Purpose

Implement the v2 playbook content contract and generic Run Playbook model described by PRD 29.

## Source Chain

- Design: [docs/designs/2026-06-20-playbook-contract-and-run-playbook.md](../../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- Plan: [docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
- PRD: [docs/prd/29-revise-playbook-contract-run-playbook.md](../../prd/29-revise-playbook-contract-run-playbook.md)

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| P1 | [01 Requirements and Register Reconciliation](01-requirements-and-register-reconciliation.md) | Keep PRD and risk entries aligned with the playbook content/execution boundary. |
| P2 | [02 Playbook Contract and Catalog Validation](02-playbook-contract-and-catalog-validation.md) | Add path, frontmatter, body, persona, and stack validation. |
| P3 | [03 Run Playbook Invocation Model](03-run-playbook-invocation-model.md) | Implement generic Run Playbook selection, gates, assists, and output routing. |
| P4 | [04 Template Package Lifecycle Closeout](04-template-package-lifecycle-closeout.md) | Prove template, package, dogfood, lifecycle, and support-claim behavior. |

## Acceptance Gate

Do not close W18 R1 while playbooks require plugins to be valid, while `docs/library/playbooks/**` is treated as the v2 canonical home, or while build-stack and run-stack playbooks can silently substitute for each other.
