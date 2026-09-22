---
title: "W23 R0 Backlog Review and Reporting Plan"
kind: "plan"
status: "draft"
coordinate: "W23 R0"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/system/prompts/plan-to-prd.prompt.md"
  why: "The plan creates one new capability owner and a dependency-ordered implementation backlog."
  coordinate_handoff: "Carry W23 R0 into PRD 51 source lineage and the downstream work backlog."
source:
  type: "design"
  path: "docs/designs/2026-09-18-backlog-review-and-reporting.md"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "full-package draft"
  reason: "The owner explicitly requested the complete draft package before implementation and expects package iteration."
---

# W23 R0 Backlog Review and Reporting Plan

## Purpose

Plan the new [Backlog Review and Reporting](../../designs/2026-09-18-backlog-review-and-reporting.md) capability. The plan defines one Store-free deterministic snapshot operation, one first-party review Skill, one concise chat format, one optional self-contained HTML format, one optional rebuildable review cache in the Global Store, and visible navigation from report actions to their matching wave records. It preserves W22 R0 authority over shared Store, CLI, registry, and MCP boundaries.

This plan, its PRD, its work backlog, and the prototype are review material. They do not authorize CLI, MCP, Skill package, Store, installation, staging, commit, push, publication, or release changes.

## Objective

Completion requires:

- one accepted versioned snapshot schema and rule catalog;
- one read-only TypeScript `work.backlog.snapshot` operation with registry-derived CLI and MCP parity;
- one independently usable `backlog-review` Skill with a documented deterministic-first and agentic-fallback flow;
- one shared report model for concise chat and optional HTML output;
- one Skill-owned, offline, safe, accessible single-file HTML template;
- one exact-match per-record review cache that never replaces the current snapshot or portfolio rebuild;
- one in-report raw-data view and user-started JSON download without a required companion file;
- exact wave mapping for all Next items and wave-specific Attention items;
- accessible click-to-filter navigation plus a conditional search-clear control;
- fixture and installed-package proof across open, complete, closeout-needed, blocked, paused, superseded, historical, and conflicting records;
- explicit W22 R0 dependency gates; and
- one Human Experience Review of the real chat and HTML results.

## Human Experience Propagation

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| Current focus and next actions appear before machine detail. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Chat summary and HTML attention queue | [P3](03-skill-and-chat-report.md), [P4](04-single-file-interactive-report.md) | Guided Progress Review, fixtures, and Human Experience Review | None |
| Recorded facts, inferences, and recommendations stay distinct. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Snapshot, chat labels, HTML evidence detail | [P1](01-data-contract-and-rule-catalog.md), [P3](03-skill-and-chat-report.md), [P4](04-single-file-interactive-report.md) | Automated schema and rendering checks plus Human Experience Review | None |
| Open phases, remaining tasks, closeout gaps, blockers, and conflicts remain visible and traceable. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Snapshot diagnostics and both report formats | [P1](01-data-contract-and-rule-catalog.md), [P2](02-deterministic-snapshot-operation.md), [P7](07-package-parity-and-acceptance.md) | Fixture matrix, CLI/MCP parity, installed proof, and source-link review | None |
| The default result stays concise while exact detail remains available. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | In-chat report and expandable HTML wave detail | [P3](03-skill-and-chat-report.md), [P4](04-single-file-interactive-report.md) | Guided Progress Review and responsive browser review | None |
| A repeat review can avoid repeated agent work for unchanged records without hiding current changes or requiring Store access. | [PRD 51](../../prd/51-backlog-review-and-reporting.md), [PRD 38](../../prd/38-global-store-and-project-state.md) | Skill review flow and optional Global Store cache | [P5](05-incremental-review-cache-and-data-access.md), [P7](07-package-parity-and-acceptance.md) | Exact-key tests, invalidation tests, Store-failure fallback, bounded characterization, and Human Experience Review | None |
| A maintainer can inspect and save the normalized report data without managing a required companion file. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Saved HTML report data view and user-started JSON download | [P5](05-incremental-review-cache-and-data-access.md), [P7](07-package-parity-and-acceptance.md) | Data parity, safe-content, keyboard, browser, and package checks | None |
| A maintainer can see which wave each Next or wave-specific Attention item affects and focus the Backlog on it with one action. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Chat item labels, HTML Next and Attention controls, Backlog search and filter state | [P6](06-report-item-traceability-and-navigation.md), [P7](07-package-parity-and-acceptance.md) | Exact-reference fixtures, interaction tests, responsive review, and Human Experience Review | None |
| The HTML report works offline as one safe and accessible file. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Saved HTML report | [P4](04-single-file-interactive-report.md), [P7](07-package-parity-and-acceptance.md) | Browser checks, network-denial check, keyboard review, and installed Skill proof | None |

## Performance Evidence Plan

P5 owns one bounded characterization candidate for repeat report time. The first 70-record report took about 13 minutes end to end. The deterministic snapshot took 1.191 seconds, and HTML rendering took 0.080 seconds. This isolates the current concern to agent review and report-model assembly.

- Base maintenance action: `create`.
- Performance applicability: `characterize-now`.
- Target class: `characterization-baseline`.
- Canonical owner: [P5 work `PERF-001`](../../work/2026-09-18-w23-r0-backlog-review-and-reporting/05-incremental-review-cache-and-data-access.md#perf-001-repeated-backlog-report-review).
- Gate effect: informational for speed. Cache correctness, privacy, Store safety, exact invalidation, and full stateless fallback remain blocking acceptance conditions.
- Limit: no approved latency target exists. The characterization cannot create a product speed promise or support claim.

## Coordinate Decision

- Coordinate: `W23 R0`
- Classification: `new-wave`
- Evidence: The owner explicitly selected W23 R0 because backlog review and reporting is a new standalone feature. It uses existing CLI, MCP, and Skills architecture but owns a distinct human goal, data contract, and report surface.

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Backlog snapshot, interpretation, report, cache, raw-data access, and report-item navigation capability | `update-existing` | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | PRD 51 already owns the capability. It needs narrow current requirements for exact action-to-wave mapping and report navigation. |
| Active PRD navigation | `update-existing` | [PRD Index](../../prd/00-index.md) | The new current authority needs a discoverable product path. |
| TypeScript operation boundary | `link-only` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Current twin and operation-classification rules already govern the implementation. |
| CLI and MCP derivation | `link-only` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Current registry rules own projection. W22 R0 may revise the shared boundary before implementation. |
| First-party Skill delivery | `link-only` | [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | Current packaging and independence rules already govern the new Skill. |
| Rebuildable review-cache fields | `update-existing` | [PRD 38](../../prd/38-global-store-and-project-state.md) | The optional cache adds one Store-cached field group. The core snapshot remains Store-free, and no project-local state is allowed. |

Requirement History records the accepted P5 cache expansion and the accepted P6 traceability expansion in PRD 51. PRD 38 keeps the rebuildable field group. Current requirements remain inline in those owners.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-data-contract-and-rule-catalog.md](01-data-contract-and-rule-catalog.md) | Settle source classification, snapshot schema, diagnostics, fixtures, and deterministic-agentic rule mapping. |
| [02-deterministic-snapshot-operation.md](02-deterministic-snapshot-operation.md) | Build the Store-free TypeScript operation and derive matching CLI and MCP surfaces after the W22 gate. |
| [03-skill-and-chat-report.md](03-skill-and-chat-report.md) | Build the first-party Skill, agentic fallback, interpretation rules, and default concise chat report. |
| [04-single-file-interactive-report.md](04-single-file-interactive-report.md) | Build the Skill-owned offline HTML template and safe report export path. |
| [05-incremental-review-cache-and-data-access.md](05-incremental-review-cache-and-data-access.md) | Add exact-match review reuse, Store-free fallback, raw-data access, and bounded performance characterization. |
| [06-report-item-traceability-and-navigation.md](06-report-item-traceability-and-navigation.md) | Add exact wave mapping, consistent Backlog finding labels, click-to-filter navigation, and search clearing. |
| [07-package-parity-and-acceptance.md](07-package-parity-and-acceptance.md) | Prove package, installed, parity, accessibility, cache, data-access, traceability, and Human Experience outcomes. |

## Dependencies

- Package review may continue now. Implementation requires separate owner authority.
- P1 is the W23 contract gate.
- W22 R0 P6 closed its platform proof at commit `edd9d7e4`. W22 publication or release is not a W23 prerequisite.
- P2 depends on accepted P1 contracts and a successful W22 preflight. The preflight confirms that the checkout contains `edd9d7e4` or later accepted authority, rereads current PRD 38 and PRD 39 authority, and passes existing registry, access, CLI, and MCP contract tests.
- Registry, CLI, MCP, and installed Skill work must use the accepted W22 shared boundary. The operation declares project-read, Store-none, and host-configuration-none access. P2 cannot create a Store schema or state, setup path, harness trust path, temporary dispatcher, or MCP-only business logic.
- A failed W22 preflight blocks P2 and must report the drift. It does not authorize a temporary workaround. Independent P1 work may continue.
- P3 depends on the stable snapshot schema. It can develop fallback fixtures before the live operation is complete, but final proof needs P2.
- P4 depends on the report model from P3.
- P5 depends on P2-P4. P4 must close before P5 implementation starts.
- P6 depends on P1-P5 and the current accepted report model.
- P7 depends on P2-P6 and one identified package candidate.
- PRD 39 currently has concurrent edits from W19 R2. W23 package drafting does not edit that file.

## Output Contract

- Design: `docs/designs/2026-09-18-backlog-review-and-reporting.md`.
- Plan: this directory with `00-overview.md` and seven phase files.
- Product authority: `docs/prd/51-backlog-review-and-reporting.md` plus navigation in `docs/prd/00-index.md`.
- Work backlog: `docs/work/2026-09-18-w23-r0-backlog-review-and-reporting/` with `00-index.md` and seven phase files.
- Prototype: `docs/assets/project/2026-09-18-w23-r0-backlog-review-report-prototype.html`.
- No implementation source, shipped Skill asset, Store, installation, branch, staging, commit, push, publication, or release change is part of this package-writing pass.

## Worker Ownership

Use disjoint write scopes when implementation is authorized.

| Worker role | Responsibility | Primary write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Contract owner | Snapshot schema, rule catalog, fixtures, and diagnostics | Operation types, rule catalog, and fixture paths | Accepted P1 decisions | Stable deterministic and agentic contract. |
| Operation owner | Collectors, operation handler, path safety, and Git capability | `packages/cli/src/operations/` and focused tests | W22 boundary and P1 | Read-only operation core. |
| Surface owner | Registry admission, CLI projection, MCP derivation, and parity | Registry and surface tests | Operation core and W22 boundary | One shared public operation on both surfaces. |
| Skill owner | Skill entrypoint, fallback instructions, interpretation, and chat renderer | `packages/skills/backlog-review/` except HTML template | Stable schema | Independently usable first-party Skill. |
| Report owner | HTML template, safe data embedding, controls, print, and accessibility | Skill template and browser fixtures | Stable report model | One offline interactive report. |
| Cache and data owner | Global Store cache service, exact invalidation, stateless fallback, data view, and JSON download | Store service integration plus focused Skill and report files | P4 closeout and current PRD 38 boundary | Optional rebuildable reuse and inspectable report data. |
| Traceability owner | Report-reference validation, Skill twin guidance, chat coordinate labels, HTML navigation, and search clearing | Report schemas, backlog-review Skill, HTML template, and focused tests | P1-P5 complete and current PRD 51 | Exact action-to-wave mapping and reversible Backlog focus. |
| Validation owner | Performance characterization, package, installed, browser, parity, and Human Experience review | Evidence and bounded fixes returned to owners | Assembled candidate | Final evidence and limits. |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code and function signatures during implementation. Resolve and refresh indexes before fallback reads. The product surface itself uses the existing operation registry so CLI and MCP are projections of the same core. The Skill prefers the compatible MCP tool, falls back to the CLI, and then uses the explicit agentic method when neither deterministic surface is available.

## Validation

- Validate design, plan, PRD, work, path, link, and metadata contracts.
- Run PRD authority validation before the work backlog is treated as implementation authority.
- Prove the snapshot schema against the full fixture matrix.
- Prove operation-core behavior without CLI or MCP transport.
- Prove CLI JSON and MCP result parity.
- Prove Store-free behavior for absent, denied, unsafe, and unavailable Store states.
- Prove that the snapshot always runs, exact cache keys alone permit reuse, and portfolio conclusions always rebuild from the current full snapshot.
- Prove that cached data is rebuildable, privacy-bounded, and never written inside the project.
- Prove that the data view and user-started JSON download match the embedded report model without creating a required companion file.
- Prove every Next and wave-specific Attention reference resolves to one included report record and displays its matched coordinate.
- Prove wave-specific item activation selects `All`, activates Work, applies coordinate search, and that `Clear search` restores results without changing the selected filter.
- Run the finite `PERF-001` characterization and keep its result informational unless later authority approves a target.
- Prove no project, Git, Store, or installation mutation occurs.
- Compare chat and HTML meanings for the same report model.
- Inspect the HTML at desktop and mobile sizes, with keyboard navigation, visible focus, reduced motion, print, and blocked network access.
- Prove the extracted package contains the Skill and template and works without the maintainer checkout.
- Complete a Human Experience Review for every accepted promise. Owner feedback on the prototype and later installed result is invited but is not an acceptance gate.

Automated Implementation Testing is required for every implementation phase. P5 Performance Testing is `characterize-now` under `PERF-001`; other phases remain `not-needed-now` unless later evidence changes a current decision. Guided Progress Review is selected for the chat, HTML, fallback explanation, raw-data, and report-item navigation surfaces because owner feedback can change the presentation before implementation closes. Unassisted Goal Testing is `not-needed-now` because the current design question is an expert review task and guided iteration is the selected evidence path. Reassess only if later authority defines a normal-use discoverability question that needs a qualified separate executor.

## Intended Follow-On

This handoff is advisory-default-but-overridable. The owner approved, reviewed, and closed P6. P7 remains final acceptance and needs separate authority.

- Route: `implementation-loop`
- Next step: Review the P7 contract. Give separate P7 preflight and implementation authority when ready.
- Why: P1-P6 are complete. P7 remains final package acceptance.
- Coordinate Handoff: Continue at `W23 R0 P7` after separate phase-start authority. Preserve P1-P6 history and the P7 acceptance boundary.
