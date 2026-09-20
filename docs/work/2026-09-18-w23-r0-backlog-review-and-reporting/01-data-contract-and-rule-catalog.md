---
title: "Phase 1: Data Contract and Rule Catalog"
kind: "work"
status: "complete"
coordinate: "W23 R0 P1"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 1: Data Contract and Rule Catalog

## Purpose

Create the stable source and evidence contract that every deterministic and agentic path will use.

## Overview

This phase inventories supported backlog records, defines the versioned snapshot and report boundaries, assigns stable diagnostics, and builds fixtures before public operation or Skill implementation starts.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct. Recorded facts, source-backed inferences, and recommendations remain distinct.
- Intended human outcome: A reader can understand why a wave received a status or recommendation and can reach its source evidence.
- Human-facing surface or indirect effect: Future chat and HTML reports plus their evidence detail.
- Implementation work: Schema, evidence classes, diagnostics, rule catalog, fixtures, and review examples.
- Evidence source or testing type selected under current authority: Automated schema and fixture checks plus Guided Progress Review of sample reports.
- Executor: Implementing agent and review agent.
- Accepted obligation or deferral route: None.

This phase follows [PRD 51](../../prd/51-backlog-review-and-reporting.md) and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Validate schema examples, diagnostics, rule mappings, and every fixture class. |
| Performance Testing | `not-needed-now` | No current latency, throughput, or resource decision exists. |
| Guided Progress Review | Required | The owner plans to iterate on information density, section order, and visual meaning. |
| Unassisted Goal Testing | `not-needed-now` | The current question is expert contract and presentation review, not unassisted discoverability. |

- Base maintenance action: `create`
- Performance applicability: `not-needed-now`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

## Source PRD Docs

- [PRD 51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [PRD 23 Generated Document Metadata and Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md)
- [PRD 25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: none`

## Stage 1 - Source and schema inventory

### Tasks

- [x] t1: Define valid current-frontmatter work-index and phase shapes, partial current-format handling, inventory-only unsupported handling, phase-map authority, and the private source-reader adapter boundary. Inventory supported task, dependency, blocker, closeout, source-link, and Git evidence shapes without adding a legacy body parser.
- [x] t2: Complete the accepted version 1 snapshot schema with raw values, sourced facts, provenance, the fixed capability map, record counts, repository-relative record identity, required-key rules, and partial-result states.
- [x] t3: Define the separate report model with fact, inference, and recommendation claim classes, one exclusive `waveStatus` per live record, one flexible `statusReason` per displayed wave, four fixed portfolio tallies, archive scope, creation date, and the accepted Git and file-time hierarchy for last-updated evidence.
- [x] t4: Define stable one-to-one rule and diagnostic identities, fixed default severity, human message and remediation fields, and how duplicate coordinates, broken links, malformed records, open-task conflicts, and missing closeout evidence remain visible without controlling report status.

### Acceptance criteria

- A1: Full semantic parsing accepts only the current frontmatter standard. Valid current records are `supported`. Malformed or incomplete current-frontmatter records are `partial` and expose only safe known facts. No-frontmatter records are `unsupported`, remain in live or archived counts, and expose only inventory facts with evidence. No legacy body convention is interpreted.
- A2: The snapshot schema preserves raw recorded values and source locations before any normalization. It uses the accepted version 1 envelope, `recordPath` identity, sourced-value types, timestamp fact types, diagnostic type, capability states, `null` rule, and empty-array rule.
- A3: The report model cannot write an inference or recommendation into the deterministic snapshot. It restricts `waveStatus` to `attention`, `current`, `conflict`, `deferred`, `complete`, or `history`, keeps `statusReason` separate, and classifies every live record before tally calculation. It retains every live and archived record with scope and sort evidence. Last-updated evidence uses only record and linked phase files, names its source, and reports each fallback. The four tallies satisfy `work records found = records in scope + historical records + archived records`.
- A4: Capability availability distinguishes repository, Git, Store context, and source-link support without making Store access mandatory.

### Dependencies

- Separate owner authority to begin W23 implementation.
- Accepted PRD 51 scope.

## Stage 2 - Rules, diagnostics, and fixtures

### Tasks

- [x] t5: Define stable diagnostics with trigger, evidence class, human meaning, and safe next action.
- [x] t6: Create the deterministic-agentic rule catalog with parity mappings and explicit one-sided reasons.
- [x] t7: Create six synthetic fixture groups: canonical current record, mixed portfolio, source-shape limits, conflicts and links, dates and capabilities, and safety and human errors. Use fixed dates and expected structured results for static fixtures. Use test-created temporary repositories or directories for Git, file-time, and path-safety state.
- [x] t8: Draft expected compact chat and HTML report models with status reasons for each fixture class. Define semantic agent-response checks that preserve diagnostic meaning but do not freeze exact prose.
- [x] t9: Review the schema and examples for source traceability, honest uncertainty, and useful default detail.

### Acceptance criteria

- A5: Every rule owns one stable diagnostic code, default severity, and testable trigger. Errors stop unsafe snapshot work. Warnings preserve usable partial or conflicting results. Information diagnostics explain safe fallbacks. Store `not-used` is not an error. No diagnostic controls report status or color.
- A6: Every rule maps both methods or states why only one method can own it.
- A7: The six fixture groups cover current parsing, all wave statuses, archived scope, flexible status reasons, partial and unsupported records, lifecycle evidence, conflicts, links, dates, capability limits, path safety, hostile text, and human error explanations without treating age alone as relevance proof.
- A8: Completed tasks, accepted closeout, commit evidence, and closed history remain separate facts.
- A9: Guided review can change status reasons and presentation without changing snapshot facts or portfolio tally meaning. A change to the fixed wave status taxonomy or tally model requires a report contract change.

### Dependencies

- A1-A4 complete.

### Closeout Notes

- Result: P1 is complete. It defines the private version 1 snapshot and report schemas, stable diagnostic and rule identities, and six synthetic fixture groups.
- Verification: 53 of 53 focused P1 tests passed. The full CLI suite passed 87 files and 1,401 tests, with 1 file and 5 tests skipped. TypeScript, the CLI package build, and `git diff --check` passed. Independent review found no issues.
- Guided Progress Review: The synthetic compact chat and HTML expected models preserve fixed statuses, flexible reasons, separate claim classes, source links, and stable tally meaning.
- Human Experience Review: `satisfied` for the P1 contract surface. The fixtures show why a wave received a status or recommendation and how a reader can reach source evidence. The reviewer was Codex. The review does not claim a lived human reaction or a rendered report experience.
- Coverage: Guide and system-resource edits are `none`. PRD edits are `none` because this private contract matches PRD 51. Performance Testing and Unassisted Goal Testing are `not-needed-now`. Accessibility and visual review stay with P4.
- Evidence: [Central evidence report](evidence.md).
- History: [P1 closeout record](../../../.make-docs/archive/history/2026-09-19-w23-r0-p1-data-contract-and-rule-catalog.md).
- Boundary: P2 has not started. No public operation, CLI, MCP, Store, setup, or Skill surface exists. The backlog review capability remains incomplete until P5.
