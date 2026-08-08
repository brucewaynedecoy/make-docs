---
title: "W18 R15 P1 PRD Capability Reconciliation"
kind: "history"
status: "completed"
date: "2026-07-30"
client: "Codex Desktop"
provider: "OpenAI"
coordinate: "W18 R15 P1"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Added capability-oriented PRD authorities for deferred obligations and naive UAT, reconciled existing owners in place, and recorded initial obligations without creating revise-only PRDs."
---

# W18 R15 P1 PRD Capability Reconciliation

## Changes

- Added PRD 45 and PRD 46 as genuinely new feature/capability authorities rather than `revise-*` change documents.
- Added the canonical deferred-obligation register to PRD 03, including O-001, O-002, conservative migration dispositions, and unverified maintainer-dogfood capability status.
- Updated the PRD index, product overview, glossary, and existing lifecycle, template, dogfood, compatibility, instruction, persona, playbook, coverage, and Project State authorities in place.
- Corrected the W18 R15 plan bundle so future PRD work follows capability ownership instead of the legacy append-only revision-document pattern.
- Verified that PRDs 20 and 37 do not claim that conformance or internal testing is equivalent to naive UAT.
- Ran repository validation: all 1,075 tests passed, wave numbering passed, touched Markdown links and whitespace passed, and managed path hygiene passed. The aggregate `just validate` command remains red because the pre-existing root instruction-router parity/line-budget check fails; this session did not change either root instruction file.
- Stopped at PRD reconciliation. No templates, contracts, playbooks, skills, runtime behavior, Global Store schema, migration, work backlog, installed projection, staging, commit, push, publication, or PR was created.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/45-deferred-obligation-governance.md](../../../prd/45-deferred-obligation-governance.md) | New capability authority for durable deferred obligations and anti-orphan governance. |
| [docs/prd/46-naive-end-user-acceptance-testing.md](../../../prd/46-naive-end-user-acceptance-testing.md) | New capability authority for true naive end-user UAT. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Added the canonical obligation register and initial migration dispositions. |
| [docs/prd/00-index.md](../../../prd/00-index.md) | Updated active-set navigation, capability-authority policy, and future handoff. |
| [docs/prd/01-product-overview.md](../../../prd/01-product-overview.md) | Added both capabilities to the product-level feature map. |
| [docs/prd/04-glossary.md](../../../prd/04-glossary.md) | Added obligation, UAT, evidence, outcome, and status vocabulary. |
| [W18 R15 plan overview](../../../plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/00-overview.md) | Corrected the bundle to use capability-oriented PRD ownership. |
| [W18 R15 Phase 1](../../../plans/2026-07-30-w18-r15-deferred-obligations-and-naive-uat-governance/01-prd-capability-authority-and-baseline-reconciliation.md) | Defines the completed reconciliation scope and conservative migration rules. |

### Developer

None this session.

### User

None this session.
