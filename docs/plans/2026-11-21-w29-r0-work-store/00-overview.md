---
title: "W29 R0 Work Store Plan"
kind: "plan"
status: "draft"
coordinate: "W29 R0"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "The plan creates one new capability owner and updates the Store, config, template, operation, and backlog review owners before the work backlog is written."
  coordinate_handoff: "Carry W29 R0 into PRD 52 source lineage, the requirement-history entries of the updated owners, and the downstream work backlog."
source:
  type: "design"
  path: "docs/designs/2026-11-21-work-store.md"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "full-package draft"
  reason: "The owner asked for the complete design, plan, PRD, and backlog package before implementation. The 2.0.8 release gate is met, because 2.0.9 is released. Implementation needs separate owner authority."
---

# W29 R0 Work Store Plan

## Purpose

Plan the [work store](../../designs/2026-11-21-work-store.md): a local, durable record of work in the global Store, with `docs/work/` as a two-way repo copy, a small work queue interface (next, claim, report, close), and an agent form of the same rules. The [factory](../../designs/2026-11-21-factory.md) (W30 R0) depends on this Wave.

This plan, its PRD changes, and its work backlog are review material. They do not authorize CLI, MCP, Store, template, Skill, installation, commit, push, or release changes. The 2.0.8 release gate is met, because 2.0.9 is released. Implementation needs separate owner authority. It must not touch W22 R2 files, branches, or worktrees.

## Objective

Completion requires:

- one accepted work record model, sync table, readiness rule, claim rule, and fixture matrix;
- one append-only Store migration that adds the work tables, with R-MIN rows in PRD 38 first;
- one strict parser and writer that round-trip today's `docs/work/` files byte for byte;
- first import of existing backlogs with no file change, and two-way sync with a conflict stop that blocks only the affected units;
- the `run work status | sync | next | claim | release | report | close | export` operations with CLI and MCP parity;
- `backlog_snapshot` reading from the store when the store is the authority, with the same schema plus resolved readiness facts;
- one upstream system resource, `make-docs://system/reference/work-store.md`, that gives agents the same rules without the CLI;
- one `work` block in `.make-docs/config.yaml` for the repo copy setting and the tracker connection map;
- a tracker connection contract with the local store as the only v1 connection;
- proof that a project without Store access keeps `docs/work/` as the authority and every existing command behaves as before.

## Human Experience Propagation

The source design has `direct` impact. Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| `run work next` names ready units in dependency order and says why each blocked unit waits. | [PRD 52](../../prd/52-work-store-and-work-queue.md) | `run work next` CLI and `work_next` MCP output | [P1](01-record-model-and-rule-catalog.md), [P4](04-work-queue-operations.md) | Fixture matrix, CLI and MCP parity, Guided Progress Review | None |
| Hand edits and teammates' edits through git reach the store after the next work command. Nothing is lost silently. | [PRD 52](../../prd/52-work-store-and-work-queue.md) | `docs/work/` files and sync report | [P3](03-parser-import-and-sync.md), [P6](06-package-parity-and-acceptance.md) | Two-checkout sync test, round-trip tests | None |
| When both sides changed, Make Docs stops, shows both sides, and names one settle command. | [PRD 52](../../prd/52-work-store-and-work-queue.md) | Conflict report from sync and from every work command | [P3](03-parser-import-and-sync.md), [P4](04-work-queue-operations.md) | Conflict fixtures, Guided Progress Review | None |
| Existing `docs/work/` files keep their format and names. A teammate without a Store sees no change. | [PRD 52](../../prd/52-work-store-and-work-queue.md), [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) | Work files in git | [P3](03-parser-import-and-sync.md), [P6](06-package-parity-and-acceptance.md) | Byte-for-byte round trip on this repo's backlogs, no-Store run | None |
| `run work status` says whether the store or the files are the authority, and why. | [PRD 52](../../prd/52-work-store-and-work-queue.md) | `run work status` output | [P4](04-work-queue-operations.md) | Mode fixtures for Store present, absent, denied, and unsafe; Guided Progress Review | None |

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| Automatic sync at the start of each work command on a project with many backlogs. | `create` | `characterize-now` | `characterization-baseline` | `PERF-004`, owned by [P6](06-package-parity-and-acceptance.md) | P6 work phase owns the budget and stop rule. | P6, after the real sync path exists. |

The characterization is informational. It informs whether automatic sync needs a digest-only fast path. It creates no product speed promise.

## Coordinate Decision

- Coordinate: `W29 R0`
- Classification: `new-wave`
- Evidence: Explicit owner guidance in the 2026-11-21 grill (two designs and two Waves: W29 for the work store, W30 for the factory). The outcome test agrees: no earlier Wave promised a work store, a work queue, or claims. The highest Wave in `docs/plans/`, `docs/work/`, and their archives is W28.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Work store design | Markdown | [2026-11-21-work-store.md](../../designs/2026-11-21-work-store.md) | High. Owner-confirmed decisions. |
| Factory design | Markdown | [2026-11-21-factory.md](../../designs/2026-11-21-factory.md) | High. Consumer of the queue interface. |
| Store schema and migration code | TypeScript | `packages/cli/src/store/database.ts` | High. Read at `ba4b95b5`. |
| Backlog snapshot code | TypeScript | `packages/cli/src/operations/work/backlog/` | High. Read at `ba4b95b5`. |
| Twins guide | Markdown | [developing-deterministic-agentic-twins.md](../../assets/project/developing-deterministic-agentic-twins.md) | High. |

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Work store authority, repo copy, sync, first import, work identity, queue rules, tracker contract, and operations | `create` | [PRD 52](../../prd/52-work-store-and-work-queue.md) | A coherent new product subject with no current owner. PRD 51 owns review and reporting, not the record of work. |
| Work tables, R-MIN rows, record classes, and schema migration | `update-existing` | [PRD 38](../../prd/38-global-store-and-project-state.md) | PRD 38 owns every Store field and migration. |
| `work` config block | `update-existing` | [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md) | PRD 24 owns project config keys and the desired-setting boundary. |
| `work-store` reference resource and work template round-trip stability | `update-existing` | [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) | PRD 06 owns stable resource identity and work templates. |
| `backlog_snapshot` reading the store and returning readiness facts | `update-existing` | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | PRD 51 owns the snapshot contract. |
| New operations and their MCP profile membership | `update-existing` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | PRD 25 owns operation boundaries and MCP profiles. |
| CLI command paths | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | PRD 39 owns the admitted CLI paths. |
| Active PRD navigation | `update-existing` | [PRD Index](../../prd/00-index.md) | The new owner needs a discoverable path. |
| Glossary terms: work store, repo copy, claim, ready unit, quick item | `update-existing` | [PRD 04](../../prd/04-glossary.md) | Shared terms. |
| Config cannot be rebuilt from the Store | `update-existing` | [Risk register](../../prd/03-open-questions-and-risk-register.md) as D-060 | Grill finding. Outside this Wave's scope. Logged for a later fix. |
| Plans could be optional in the lifecycle | `update-existing` | [Risk register](../../prd/03-open-questions-and-risk-register.md) as Q-026 | Owner remark in the grill. Outside this Wave's scope. |
| PRD 05 installation lifecycle | `none` | None | Work records are not installation state. Setup does not change. |

## Requirement History Entries

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| PRD 38 | 2026-11-21 / W29 R0 | R-MIN register and schema version | Schema v6 with no work records. | Schema v7 adds work tables with R-MIN rows. | Work needs a durable local record. | [Design](../../designs/2026-11-21-work-store.md) |
| PRD 51 | 2026-11-21 / W29 R0 | Snapshot source | The snapshot always parses `docs/work/`. | The snapshot reads the work store when it is the authority, with the same schema. | One source of readiness facts. | [Design](../../designs/2026-11-21-work-store.md) |
| PRD 24 | 2026-11-21 / W29 R0 | Allowed top-level keys | No `work` key. | A `work` block holds repo copy intent and the tracker map. | Portable work settings. | [Design](../../designs/2026-11-21-work-store.md) |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-record-model-and-rule-catalog.md](01-record-model-and-rule-catalog.md) | Settle the record model, sync table, readiness and claim rules, tracker contract, R-MIN rows, and fixtures. |
| [02-store-schema-and-records.md](02-store-schema-and-records.md) | Add the work tables in one append-only migration and the Store service that reads and writes them. |
| [03-parser-import-and-sync.md](03-parser-import-and-sync.md) | Build the round-trip parser and writer, first import, and two-way sync with the conflict stop. |
| [04-work-queue-operations.md](04-work-queue-operations.md) | Build the `run work` operations, CLI and MCP parity, and the store-backed snapshot. |
| [05-agent-twin-and-config.md](05-agent-twin-and-config.md) | Author the `work-store` reference upstream, the `work` config block, and the tracker connection contract. |
| [06-package-parity-and-acceptance.md](06-package-parity-and-acceptance.md) | Prove package, installed, two-checkout, no-Store, performance, and Human Experience outcomes. |

## Dependencies

- The 2.0.8 release gate is met, because 2.0.9 is released. W22 R2 files, branches, and worktrees stay untouched.
- P1 is the contract gate. No code starts before P1 is accepted.
- P2 depends on P1 and on the PRD 38 R-MIN rows.
- P3 depends on P1 and P2.
- P4 depends on P2 and P3.
- P5 can start after P1. Its final text depends on P4 behavior.
- P6 depends on P2 to P5 and one identified package candidate.
- W30 R0 implementation depends on P4 and P6.

## Output Contract

- Design: `docs/designs/2026-11-21-work-store.md`.
- Plan: this directory with `00-overview.md` and six phase files.
- New product authority: `docs/prd/52-work-store-and-work-queue.md`.
- Updated owners: PRDs 00, 03, 04, 06, 24, 25, 38, 39, and 51.
- Work backlog: `docs/work/2026-11-21-w29-r0-work-store/` with `00-index.md` and six phase files.
- No implementation source, shipped asset, Store, installation, staging, commit, push, or release change is part of this package-writing pass.

## Worker Ownership

Use disjoint write scopes when implementation is authorized.

| Worker role | Responsibility | Primary write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Contract owner | Record model, rule catalog, sync table, tracker contract, fixtures | Operation types and fixture paths | Accepted design | P1 contract |
| Store owner | Migration, tables, Store service, R-MIN parity | `packages/cli/src/store/` and focused tests | P1, PRD 38 rows | P2 schema and service |
| Sync owner | Parser, writer, import, sync, conflict report | `packages/cli/src/operations/work/` sync paths and tests | P1, P2 | P3 sync |
| Surface owner | Operations, registry admission, CLI, MCP, snapshot source switch | Registry, operation handlers, surface tests | P2, P3 | P4 operations |
| Resource owner | Upstream `work-store` reference, config schema, dogfood copy | `packages/docs/template/`, config validator, then `.make-docs/` | P1 | P5 twin and config |
| Validation owner | Package, installed, two-checkout, no-Store, `PERF-004`, Human Experience Review | Evidence file and bounded fixes returned to owners | P2 to P5 | P6 evidence |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code during implementation. Reindex before falling back to direct reads. The product surface uses the existing operation registry, so CLI and MCP are projections of one core. Agents prefer the MCP tool, then the CLI, then the `work-store` reference when neither is present.

## Validation

- Validate design, plan, PRD, work, path, link, and metadata contracts.
- Run PRD authority validation before the work backlog is treated as implementation authority.
- Prove the parser and writer round-trip every current backlog in this repo byte for byte.
- Prove first import changes no file and matches the current `backlog_snapshot` facts.
- Prove each row of the sync table, including a conflict that blocks only its own units.
- Prove claims: one live claim per unit, renewal, expiry, refusal of a stale claimant's report, and the handle check before takeover.
- Prove CLI JSON and MCP result parity for every new operation.
- Prove no-Store, denied, and unsafe Store states keep `docs/work/` as the authority with no behavior change.
- Prove the agent twin and the CLI give the same answer on the shared fixtures.
- Run the finite `PERF-004` characterization.
- Complete a Human Experience Review for each promise above.

Automated Implementation Testing is required for every implementation phase. Guided Progress Review is selected for `run work next`, `run work status`, and the conflict report, because owner feedback can change those outputs before P6 closes. Unassisted Goal Testing is `not-needed-now`: the current questions are expert review tasks.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `prd-generation`
- Next step: Create PRD 52 and update PRDs 00, 03, 04, 06, 24, 25, 38, 39, and 51 from this plan.
- Why: The plan should become the product contract before the work backlog is written.
- Coordinate Handoff: Carry `W29 R0` into PRD 52 source lineage, the requirement-history entries, and `docs/work/2026-11-21-w29-r0-work-store/`.

## Change History

### 2026-11-22 — W29 R0

- Kind: `edit`
- Affected scope: P2, P3, P4, and P5 scope.
- Previous scope: eight `run work` operations, with no add operation, no URI read, and no project name.
- Replacement scope: `run work add`, `export --quick <path>`, and `make-docs://project/<project>/tasks/` and `.../backlog/` URIs that always name the project. P2 records `projectName`. P3 waits for the task ID case Wave. P5 states the URIs and validates `projectName`.
- Rationale: the owner chose Store-only quick items, URIs that name the project, a readable project name, and upper-case task IDs in their own Wave, and plain numbers for quick items.
- PRD decision: `update-existing` — PRD 52, 38, 24, 17, 21, 25, 39, 53, and 04; register D-061, D-062, and D-063.
- Owner approval: the owner's answers on 2026-11-22.
- Source: [W29 R0 backlog](../../work/2026-11-21-w29-r0-work-store/00-index.md)
