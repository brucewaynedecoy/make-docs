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

Plan the new [Backlog Review and Reporting](../../designs/2026-09-18-backlog-review-and-reporting.md) capability. The plan defines one Store-free deterministic snapshot operation, one first-party review Skill, one concise chat format, and one optional self-contained HTML format while preserving W22 R0 authority over shared Store, CLI, registry, and MCP boundaries.

This plan, its PRD, its work backlog, and the prototype are review material. They do not authorize CLI, MCP, Skill package, Store, installation, staging, commit, push, publication, or release changes.

## Objective

Completion requires:

- one accepted versioned snapshot schema and rule catalog;
- one read-only TypeScript `work.backlog.snapshot` operation with registry-derived CLI and MCP parity;
- one independently usable `backlog-review` Skill with a documented deterministic-first and agentic-fallback flow;
- one shared report model for concise chat and optional HTML output;
- one Skill-owned, offline, safe, accessible single-file HTML template;
- fixture and installed-package proof across open, complete, closeout-needed, blocked, paused, superseded, historical, and conflicting records;
- explicit W22 R0 dependency gates; and
- one Human Experience Review of the real chat and HTML results.

## Human Experience Propagation

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| Current focus and next actions appear before machine detail. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Chat summary and HTML attention queue | [P3](03-skill-and-chat-report.md), [P4](04-single-file-interactive-report.md) | Guided Progress Review, fixtures, and Human Experience Review | None |
| Recorded facts, inferences, and recommendations stay distinct. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Snapshot, chat labels, HTML evidence detail | [P1](01-data-contract-and-rule-catalog.md), [P3](03-skill-and-chat-report.md), [P4](04-single-file-interactive-report.md) | Automated schema and rendering checks plus Human Experience Review | None |
| Open phases, remaining tasks, closeout gaps, blockers, and conflicts remain visible and traceable. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Snapshot diagnostics and both report formats | [P1](01-data-contract-and-rule-catalog.md), [P2](02-deterministic-snapshot-operation.md), [P5](05-package-parity-and-acceptance.md) | Fixture matrix, CLI/MCP parity, installed proof, and source-link review | None |
| The default result stays concise while exact detail remains available. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | In-chat report and expandable HTML wave detail | [P3](03-skill-and-chat-report.md), [P4](04-single-file-interactive-report.md) | Guided Progress Review and responsive browser review | None |
| The HTML report works offline as one safe and accessible file. | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | Saved HTML report | [P4](04-single-file-interactive-report.md), [P5](05-package-parity-and-acceptance.md) | Browser checks, network-denial check, keyboard review, and installed Skill proof | None |

## Performance Evidence Plan

No current performance candidate requires execution. The base capability must use bounded repository traversal and automated correctness tests. Performance Testing is `not-needed-now` because no accepted latency, throughput, or resource decision exists. Reassess only if real project evidence can change scope, implementation, or support.

## Coordinate Decision

- Coordinate: `W23 R0`
- Classification: `new-wave`
- Evidence: The owner explicitly selected W23 R0 because backlog review and reporting is a new standalone feature. It uses existing CLI, MCP, and Skills architecture but owns a distinct human goal, data contract, and report surface.

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Backlog snapshot, interpretation, and report capability | `create` | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | This is one coherent ownerless capability with deterministic and human-facing boundaries. |
| Active PRD navigation | `update-existing` | [PRD Index](../../prd/00-index.md) | The new current authority needs a discoverable product path. |
| TypeScript operation boundary | `link-only` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Current twin and operation-classification rules already govern the implementation. |
| CLI and MCP derivation | `link-only` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Current registry rules own projection. W22 R0 may revise the shared boundary before implementation. |
| First-party Skill delivery | `link-only` | [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | Current packaging and independence rules already govern the new Skill. |
| Store state | `none` | [PRD 38](../../prd/38-global-store-and-project-state.md) | The core review is explicitly Store-free and creates no operational state. |

No Requirement History entry is needed. W23 R0 creates a new owner and does not replace a prior backlog-review contract.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-data-contract-and-rule-catalog.md](01-data-contract-and-rule-catalog.md) | Settle source classification, snapshot schema, diagnostics, fixtures, and deterministic-agentic rule mapping. |
| [02-deterministic-snapshot-operation.md](02-deterministic-snapshot-operation.md) | Build the Store-free TypeScript operation and derive matching CLI and MCP surfaces after the W22 gate. |
| [03-skill-and-chat-report.md](03-skill-and-chat-report.md) | Build the first-party Skill, agentic fallback, interpretation rules, and default concise chat report. |
| [04-single-file-interactive-report.md](04-single-file-interactive-report.md) | Build the Skill-owned offline HTML template and safe report export path. |
| [05-package-parity-and-acceptance.md](05-package-parity-and-acceptance.md) | Prove package, installed, parity, accessibility, and Human Experience outcomes. |

## Dependencies

- Package review may continue now. Implementation requires separate owner authority.
- P1 is the W23 contract gate.
- W22 R0 P6 closed its platform proof at commit `edd9d7e4`. W22 publication or release is not a W23 prerequisite.
- P2 depends on accepted P1 contracts and a successful W22 preflight. The preflight confirms that the checkout contains `edd9d7e4` or later accepted authority, rereads current PRD 38 and PRD 39 authority, and passes existing registry, access, CLI, and MCP contract tests.
- Registry, CLI, MCP, and installed Skill work must use the accepted W22 shared boundary. The operation declares project-read, Store-none, and host-configuration-none access. P2 cannot create a Store schema or state, setup path, harness trust path, temporary dispatcher, or MCP-only business logic.
- A failed W22 preflight blocks P2 and must report the drift. It does not authorize a temporary workaround. Independent P1 work may continue.
- P3 depends on the stable snapshot schema. It can develop fallback fixtures before the live operation is complete, but final proof needs P2.
- P4 depends on the report model from P3.
- P5 depends on P2-P4 and one identified package candidate.
- PRD 39 currently has concurrent edits from W19 R2. W23 package drafting does not edit that file.

## Output Contract

- Design: `docs/designs/2026-09-18-backlog-review-and-reporting.md`.
- Plan: this directory with `00-overview.md` and five phase files.
- Product authority: `docs/prd/51-backlog-review-and-reporting.md` plus navigation in `docs/prd/00-index.md`.
- Work backlog: `docs/work/2026-09-18-w23-r0-backlog-review-and-reporting/` with `00-index.md` and five phase files.
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
| Validation owner | Package, installed, browser, parity, and Human Experience review | Evidence and bounded fixes returned to owners | Assembled candidate | Final evidence and limits. |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code and function signatures during implementation. Resolve and refresh indexes before fallback reads. The product surface itself uses the existing operation registry so CLI and MCP are projections of the same core. The Skill prefers the compatible MCP tool, falls back to the CLI, and then uses the explicit agentic method when neither deterministic surface is available.

## Validation

- Validate design, plan, PRD, work, path, link, and metadata contracts.
- Run PRD authority validation before the work backlog is treated as implementation authority.
- Prove the snapshot schema against the full fixture matrix.
- Prove operation-core behavior without CLI or MCP transport.
- Prove CLI JSON and MCP result parity.
- Prove Store-free behavior for absent, denied, unsafe, and unavailable Store states.
- Prove no project, Git, Store, or installation mutation occurs.
- Compare chat and HTML meanings for the same report model.
- Inspect the HTML at desktop and mobile sizes, with keyboard navigation, visible focus, reduced motion, print, and blocked network access.
- Prove the extracted package contains the Skill and template and works without the maintainer checkout.
- Complete a Human Experience Review for every accepted promise. Owner feedback on the prototype and later installed result is invited but is not an acceptance gate.

Automated Implementation Testing is required for every implementation phase. Performance Testing is `not-needed-now`. Guided Progress Review is selected for the chat and HTML information design because owner feedback can change the presentation before implementation closes. Unassisted Goal Testing is `not-needed-now` because the current design question is an expert review task and guided iteration is the selected evidence path. Reassess only if later authority defines a normal-use discoverability question that needs a qualified separate executor.

## Intended Follow-On

This handoff is advisory-default-but-overridable. The owner already requested the complete draft package, so PRD 51 and the work backlog accompany this plan. This does not authorize implementation.

- Route: `prd-generation`
- Next step: Review and iterate on PRD 51, the work backlog, and the report prototype. Give separate implementation authority only after the W22 dependency gate is satisfied.
- Why: The product contract and report experience should settle before source implementation begins.
- Coordinate Handoff: Carry `W23 R0` into PRD 51 source lineage, the work backlog, phase history, and later commits.
