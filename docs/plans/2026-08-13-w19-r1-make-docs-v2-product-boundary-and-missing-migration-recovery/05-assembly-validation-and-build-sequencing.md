---
title: "W19 R1 Phase 5: Assembly, Validation, And Build Sequencing"
kind: "plan"
status: "draft"
coordinate: "W19 R1 P5"
source:
  type: "design"
  path: "docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md"
---

# Phase 5: Assembly, Validation, And Build Sequencing

## Purpose

Define how separately authored PRD updates are assembled into one coherent current-authority set, how that set is validated, and how a later authorized delta backlog should order implementation across documentation, runtime, migration, UAT, retirement, package projection, and dogfood.

## Assembly Inputs

- [Phase 1](01-authority-baseline-and-decision-matrix.md): candidate decisions, owner map, history, and worker boundaries.
- [Phase 2](02-product-boundary-and-resource-authority.md): product/resource/CLI/MCP authority.
- [Phase 3](03-lifecycle-migration-and-data-safety-authority.md): lifecycle, provenance, migration, Store, and safety authority.
- [Phase 4](04-naive-uat-persona-and-agentics-authority.md): paired UAT/Persona, Skill, evidence, and optional-agentics authority.
- Active PRD sections at the separately authorized PRD-stage revision.

## PRD Merge Order

1. Core/resource subject PRDs.
2. Lifecycle/migration subject PRDs.
3. Skills/agentics/retirement subject PRDs.
4. PRDs 46 and 47 as one paired UAT/Persona unit, with PRDs 14 and 45 aligned in the same review cycle.
5. Shared PRDs 00, 03, and 04.
6. Requirement-history consistency and cross-links.
7. Focused authority validation.
8. One bounded correction pass for concrete findings.
9. One confirmation review.

Subject PRD current text settles before the index, glossary, and risk register are finalized. History settles after current normative text.

## Shared-Surface Assembly

### PRD 00 Index

- Keep product-oriented document kinds.
- Preserve stable PRD numbers.
- Reflect any accepted present-tense retitling of PRDs 34-36.
- Do not list this plan or migration procedure as product authority.

### PRD 03 Risk And Decision Register

- Reconcile O-002, Q-015, Q-020, R-016, R-017, R-020, and R-027 in place.
- Preserve stable IDs and statuses.
- Record the accepted W19 R1 boundary and any genuinely unresolved execution risk.
- Do not retain the unexecuted Protocol proposal as an open product decision.

### PRD 04 Glossary

Unify the meanings of:

- system resource;
- contract;
- prompt;
- reference;
- template;
- provider;
- project projection;
- ownership/provenance;
- router;
- run and run evidence;
- Persona;
- Naive UAT;
- Playbook and Protocol as removed/non-product terms.

### Cross-Links

- Link current requirements to current owning PRDs.
- Link requirement history to the accepted design and plan for provenance.
- Keep W19 R0 unchanged unless separate authority permits a supersession backlink.
- Do not rewrite archive/history terminology.

## PRD Authority Validation

Run the repository-authoritative PRD authority validator as a regression check after assembly. A validator result does not authorize broad PRD rewrites. Correct only concrete violations within assigned scopes.

Semantic validation confirms:

- each candidate has one disposition;
- all product requirements live inline in existing owners;
- no recovery/removal/migration/reconciliation PRD was created;
- PRDs 34-36 express present-tense retired-capability boundaries;
- prompts are peer resources;
- CLI and MCP resource availability do not depend on local projection;
- PRDs 46/47 are coherent and inseparable;
- Skill shims delegate only to CLI;
- evidence paths and prohibited destinations agree across PRDs;
- migration quiescence and the 13-stage order remain intact;
- `playbook_runs` remains opaque;
- optional agentics remain optional; and
- finite evidence rules do not introduce arbitrary performance targets.

## Documentation Validation

Use focused, proportional checks:

- required YAML/frontmatter and headings;
- Intended Follow-On route and `W19 R1` handoff;
- relative Markdown links and local anchors;
- repository-authoritative path-hygiene validation;
- PRD authority validator as regression only;
- whitespace and diff hygiene;
- changed-file allowlist;
- one documentation reindex only if the index is stale.

Do not run full implementation, package, build, or cross-platform suites at the PRD or plan gate.

## Scoped Delta-Backlog Decision

A W19 R1 delta backlog is required after the owner accepts the reconciled PRDs and separately authorizes work generation.

- Path: `docs/work/<actual-execution-date>-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/`
- Authority cited by tasks: accepted current PRDs.
- Plan role: dependencies, merge order, and rationale only.
- Scope: only the delta from current implementation to accepted PRD authority.
- Exclusions: no theoretical cleanup, unrelated refactor, benchmark platform, arbitrary target, universal sample count, publication, or deployment.

Backlog creation is not authorized by this plan.

## Later Build Sequence

After accepted PRDs, accepted backlog, and separate implementation authorization, build in this dependency order:

### 1. Upstream Documentation Authority

Author and validate system contracts, prompts, references, templates, metadata, and manifests in `packages/docs/template/`. Remove Playbook/Protocol claims from current upstream authority while preserving historical provenance.

### 2. Resource Identity And Resolver Core

Implement peer resource types, stable URI, provider identity, local-first resolution, ownership/provenance reporting, safe paths, list/read/ensure operations, and deterministic typed outcomes.

### 3. Operation Registry, CLI, And MCP

Register resource, general-run, and Naive-UAT operations; expose consistent CLI commands, native MCP resources, and MCP tools. Keep business logic in the typed core.

### 4. Manifest, Setup, Reconfiguration, And Routers

Implement selection identity, dry-run conflict plans, evidence-backed `AGENTS.md`/`CLAUDE.md` routers, optional projection, update, uninstall, and typed receipts.

### 5. Compatibility, Quiescence, Backup, And Migration

Implement compatibility facets, project lock, public Playbook/Protocol quiescence barrier, frozen classification snapshot, backup/rollback, safe staged transformations, and TypeScript path hygiene.

### 6. Global Store Evolution

Apply ordered transactional migrations for `runs` and `run_evidence`, preserve `playbook_runs` opaquely, implement bounded busy handling, and return typed mutation receipts.

### 7. Naive-UAT Workflow, Persona, And Evidence

Install upstream workflow resources, implement Persona resolution with `user` default, create the thin first-party CLI-delegating Skill, route testing assets to the actual Persona slug, and connect findings/gates without duplicating policy.

### 8. Traced Playbook/Protocol Retirement

Under the still-active quiescence barrier, remove only traced Playbook/Protocol runtime, packaging, tests, conformance, support claims, and unneeded plugin/hook/extension/harness-adapter surfaces. Preserve ambiguous/user-owned content and legacy Store data.

### 9. Optional Agentics

Install only explicitly selected integrations with traced purpose, capability evidence, install/uninstall contracts, and honest support status. Core behavior remains complete without them.

### 10. Package Projection, Dogfood, And Installed-Project Validation

Project upstream resources into the package, validate packaged CLI/provider behavior, dogfood downstream into the maintainer repository, exercise fresh installation and representative legacy migrations, and confirm parity before any release recommendation.

This section defines architectural dependency and merge order. It is not a work-item checklist and does not authorize implementation.

## Future Implementation Workstreams

| Workstream | Exclusive future implementation ownership | Dependency |
| --- | --- | --- |
| Upstream resource authority | `packages/docs/template/` reusable resources and metadata | Accepted PRDs/work |
| Resource/runtime core | Resolver, provider, path safety, operation core | Upstream schemas |
| CLI/MCP projections | CLI grammar, MCP resources/tools | Typed operations |
| Lifecycle/migration | Manifest, setup/reconfigure, lock, quiescence, backup/rollback, migration | Resource operations and accepted safety authority |
| Store | General run schema/operations/receipts | Project identity and migration framework |
| UAT/Persona | Workflow resources, Persona resolution, evidence routing | Resource/runtime and Store interfaces |
| Skill/agentics | Naive-UAT Skill and selected integrations | UAT operations; core must already be complete |
| Retirement | Playbook/Protocol runtime/package/conformance removal | Quiescence, migration, replacement surfaces |
| Package/dogfood validation | Package projection, maintainer dogfood, installed-project fixtures | All prior workstreams |

Future work assignments must name disjoint files. The coordinator owns integration and gates and does not silently broaden scopes.

## Validation Matrix

| Layer | Focused proof | Gate |
| --- | --- | --- |
| Upstream docs | Resource identities, links, schemas, prompt/reference/template parity | Documentation authority |
| Resolver/operations | Deterministic fixtures for identity, precedence, provenance, paths, typed errors | Runtime contract |
| CLI/MCP | Same operation inputs/results and native resource parity | Projection parity |
| Manifest/lifecycle | Dry-run plans, ownership conflicts, lock/quiescence, backup/rollback | Mutation safety |
| Store | Transactional migration, optimistic versions, typed receipts, opaque legacy rows | Data safety |
| UAT/Persona | Qualification, anti-coaching, Persona default, scenario binding, evidence paths, gates | UAT authority |
| Retirement | Current trace, no remaining public Playbook/Protocol claims, preserved ambiguous content | Removal gate |
| Package/dogfood | Upstream/package/root/installed-project parity and representative migrations | Release recommendation only |

## Finite Evidence And Correction Budget

- Documentation/PRD assembly: one authoring pass, one materially distinct correction, one confirmation review.
- Later work budgets are declared per workstream before execution and justified by reversibility, blast radius, data loss/security exposure, platform variance, novelty, and false-result cost.
- An unchanged authority/code/fixture/config/environment fingerprint reuses prior evidence and stops.
- Migration and Store work receive finite fixture/platform counts in the backlog.
- Performance evidence follows the separate accepted performance authority. No workstream invents a latency, throughput, memory, capacity, availability, or bundle-size target.
- Budget exhaustion yields `blocked` or an owner decision, not repeated unchanged execution.

## Planning-Preflight Obligations Before Work Generation

Before the separately authorized backlog stage:

1. confirm the accepted PRD set and exact diff;
2. confirm W19 R1 coordinate and actual backlog date;
3. refresh the current removal-candidate trace only if the implementation revision changed materially;
4. resolve any new production consumer through its existing PRD owner;
5. freeze implementation write scopes and merge order;
6. allocate finite evidence budgets per workstream;
7. record current disk capacity before resource-heavy validation;
8. stop on unsafe growth, memory/context pressure, or contradictory authority.

## Plan Approval Gate

The complete W19 R1 bundle is ready for owner review when:

- all six plan files resolve;
- candidate and PRD mappings are decision-complete;
- the build sequence covers every accepted capability and safety boundary;
- no work-backlog task list or implementation was generated;
- focused plan/design/link/path/whitespace checks pass; and
- unresolved questions are bounded evidence checks rather than open product design.

Owner acceptance uses the exact statement in [the overview](00-overview.md). Acceptance authorizes PRD reconciliation only and no later lifecycle stage.
