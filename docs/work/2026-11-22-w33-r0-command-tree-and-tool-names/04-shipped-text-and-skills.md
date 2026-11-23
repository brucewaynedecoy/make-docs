---
title: "Phase 4: Shipped Text and Skills"
kind: "work"
status: "active"
coordinate: "W33 R0 P4"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 4: Shipped Text and Skills

## Purpose

Move every shipped text and this repository's instructions to the new names.

## Overview

Templates, routers, references, prompts, Skills, guides, READMEs, and PRDs move to the new names, upstream first, then the dogfood copy.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Every instruction an agent or person reads names a command that exists ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-NAME-5).
- Intended human outcome: no guide or Skill sends a reader to an old command.
- Human-facing surface or indirect effect: shipped Skills, routers, references, prompts, guides, and PRDs.
- Implementation work: text changes, reseed, and a shipped-text test.
- Evidence source or testing type selected under current authority: shipped-text search test, template and dogfood parity.
- Executor: the implementing agent.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | A shipped-text test that fails on an unknown command name, template and dogfood parity, `validate:defaults`, and the router check. |
| Performance Testing | not-needed-now | Command names do not change run time. |
| Guided Progress Review | not-needed-now | Text follows the accepted table. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)

## Source Obligations, Scenarios, And Findings

- None.

## Stage 1 - Text

### Tasks

- [ ] T1: Change upstream in `packages/docs/template/` first: routers, contracts, references, prompts, and templates. Then reseed this repository's `.make-docs/` and `docs/` copy and refresh the bundled template.
- [ ] T2: Change every first-party Skill under `packages/skills/` and its installed copy under `.agents/skills/`.
- [ ] T3: Change guides under `docs/assets/`, the package README files, and PRD text that names a current command in passing, including `docs/prd/00-index.md` and the canonical CLI tables in PRD 39.
- [ ] T4: Add a test that fails when shipped text names a command that the registry does not have, apart from migration tables that list old names on purpose.

### Acceptance criteria

- A10: A search of shipped text finds no old command name outside migration tables.
- A11: Template and dogfood bytes match, and the template validation suite and router check pass.

### Dependencies

- P2. It can run beside P3.

### Closeout Notes

- Four testing decisions: Pending.
- Performance evidence: Pending.
- Human Experience Review: Pending.
- Optional experience handoff: Pending.
- Explicit human acceptance gate: Pending.
- Evidence report: Pending.
- Phase / capability status: Pending.
