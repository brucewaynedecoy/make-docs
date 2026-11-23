---
title: "Phase 4: Shipped Text and Skills"
kind: "work"
status: "completed"
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

- [x] T1: Change upstream in `packages/docs/template/` first: routers, contracts, references, prompts, and templates. Then reseed this repository's `.make-docs/` and `docs/` copy and refresh the bundled template.
- [x] T2: Change every first-party Skill under `packages/skills/` and its installed copy under `.agents/skills/`.
- [x] T3: Change guides under `docs/assets/`, the package README files, and PRD text that names a current command in passing, including `docs/prd/00-index.md` and the canonical CLI tables in PRD 39.
- [x] T4: Add a test that fails when shipped text names a command that the registry does not have, apart from migration tables that list old names on purpose.

### Acceptance criteria

- A10: A search of shipped text finds no old command name outside migration tables.
- A11: Template and dogfood bytes match, and the template validation suite and router check pass.

### Dependencies

- P2. It can run beside P3.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. The new shipped-text test `packages/cli/tests/w33-r0-shipped-text-names.test.ts` scans 316 shipped Markdown files and finds no former or unknown command or tool name (A10). It reads commands behind an environment prefix, `npx` with the package name, and `node <path>/dist/index.js`, and bare `run <root>` spans. Its 11 tests include fixtures that prove it fails on each form, on a former MCP name, and on a former name after a marked table ends. The name-catalog test now fails PRD 39 R-RUN-1 and PRD 25 R-MCP-PROFILE text that names a former name. The template and dogfood bytes match, the type check passed, `validate:defaults` passed 53 tests, and the router check passed (A11). In `smoke:pack:local` every local packed check passed, including the new retired-operation check. The run then stopped in the W22 R1 package proof, before its first `project move` call, on a Store defect that commit `4daaf18f` (W32 R0 P2) added. That defect is outside this phase ([evidence](evidence.md#release-proof-failure-found)). The full suite has 2377 tests: 2368 passed, 3 failed, and 6 skipped, counted from the JSON report. The 3 failures are the known ones: two `tests/mcp-app-contract.test.ts` stdio tests and the sandbox-only `tests/p5-migration-safety.test.ts` fixture 11. Performance Testing `not-needed-now`: command names do not change run time. Guided Progress Review `not-needed-now`: text follows the accepted name table. Unassisted Goal Testing `not-needed-now`: no current decision needs an unassisted human run.
- Performance evidence: none. Performance Testing is `not-needed-now`.
- Human Experience Review: every shipped router, contract, reference, prompt, Skill, README, guide, and current PRD line that a reader follows now names a command or tool that exists, such as `make-docs check prd`, `make-docs backlog cache lookup`, `make-docs lifecycle <verb>`, and `backlog_cache_lookup`. The README files list the eleven groups with the exact words of `make-docs --help`. The user guide tells readers that renamed names stay hidden aliases and links the name table. Limit: the user guide's alias claim depends on P3. Two release scripts that P2 broke now use the new commands and a check that holds after P3. History records, archives, closed evidence, plans, designs, older backlogs, and the decision register keep the names they recorded.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: not needed for this phase. The owner reviews help output in P5.
- Evidence report: [P4 Shipped Text and Skills](evidence.md#p4-shipped-text-and-skills).
- Phase / capability status: Phase complete on commit. T1 to T4, A10, and A11 are done. Capability partial: aliases (P3) and acceptance (P5) remain. `smoke:pack:local` stays red until the `4daaf18f` setup and Store defect is fixed.
