---
title: "Phase 1: Playbook Contract v2"
kind: "work"
status: "active"
coordinate: "W18 R12 P1"
source:
  type: "prd"
  path: "docs/prd/40-revise-playbook-authoring-contract-v2.md"
---

# Phase 1: Playbook Contract v2

## Purpose

Land the clean-break v2 authoring contract so every downstream consumer — the compiler probe fix, the CLI surfaces, and the W18 R9 conformance wave — compiles against the v2 Playbook model. This phase implements PRD 40 anchors R-DEP-1..3, R-FM-1, R-HEAD-1..2, R-MIG-1..4, R-RIPPLE-1..2, and R-TEST-1.

## Overview

The `## Dependencies` Markdown table becomes a fenced `playbook` block with a top-level `dependencies` key and typed per-entry fields including the optional `probe` defaulting to `id`; the frontmatter version keys shorten to `schema`/`workflowSchema`; the heading spine simplifies (`## Inputs`, `## Workflow`, `## Gates`, `## Outputs`); the schema version advances to the v2 identifier. The break is clean: the v1 table parser is deleted, old keys and spellings are removed, and every old form fails with a pointed diagnostic naming the v2 replacement shape. The contract document and the default Playbook are authored upstream in `packages/docs/template/` and re-seeded downstream; every fixture migrates in place so no v1 document survives in-tree.

## Source PRD Docs

- [40 Revise Playbook Authoring Contract v2](../../prd/40-revise-playbook-authoring-contract-v2.md)
- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md) (still-constraining baseline: workflow block, step model, model shape, layered validation, unchanged diagnostics)
- [19 Revise Template Package Dogfood Source of Truth Contract](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md) (upstream-first authoring order)

## Stage 1 - Parser and Model on the V2 Forms

### Tasks

- [x] t1: Add a dependencies-block parser in `packages/cli/src/playbook/parser/` that parses the fenced `playbook` block with top-level key `dependencies` in `## Dependencies` into the typed registry — fields `id`, `kind`, `requirement`, optional `probe` defaulting to `id`, `source`, `used_by` (typed list), `fallback` — enforcing exactly one authoritative `playbook` fence per governed section and erroring when a fence's top-level key does not match its section (R-DEP-1, R-DEP-2).
- [x] t2: Delete `packages/cli/src/playbook/parser/dependency-table.ts` and every code path that parses the v1 table; wire the parse stage in `parse-playbook.ts` to the dependencies-block parser (R-MIG-1, R-RIPPLE-1).
- [x] t3: Rename the required frontmatter keys to `schema` and `workflowSchema` in `packages/cli/src/playbook/parser/frontmatter.ts` with values and semantics unchanged, and remove acceptance of `schemaVersion`/`workflowSchemaVersion` (R-FM-1).
- [x] t4: Update the heading spine in `packages/cli/src/playbook/parser/headings.ts` to the v2 spellings — `## Inputs`, `## Workflow`, `## Gates`, `## Outputs` — with order and presence rules unchanged, and remove acceptance of the old spellings (R-HEAD-1).
- [x] t5: Advance the document schema identifier to v2 (for example `make-docs.playbook.v2`) and accept only the v2 identifier; validate the `probe` field against the executable-token pattern when present (R-MIG-3, R-DEP-2).
- [x] t6: Extend the model's dependency entry type with `probe` (resolved: declared value or `id` default) and `used_by` as a typed list, keeping every other model surface additive so downstream consumers compile (R-DEP-2; PRD 41 R-INV-1).

### Acceptance criteria

- A conformant v2 document parses to a fully resolved model with a typed dependency registry whose entries expose the resolved `probe`.
- No code path in `packages/cli/` parses the v1 dependency table, the old frontmatter keys, the old heading spellings, or the v1 schema identifier.
- Cross-reference integrity (PRD 34 R-DEP-4) behaves identically over the block-parsed registry.

### Dependencies

- None; this stage opens the phase.

## Stage 2 - Pointed Old-Form Diagnostics

### Tasks

- [x] t7: Add error diagnostics to the catalog for each removed v1 form, each with stable code, severity, precise location, message, and fix hint naming the v2 replacement shape: a Markdown table under `## Dependencies` names the fenced `playbook` dependencies block; `schemaVersion`/`workflowSchemaVersion` name `schema`/`workflowSchema`; an old heading spelling names the v2 heading for its slot; a v1 schema identifier names the v2 identifier (R-MIG-2).
- [x] t8: Confirm the dropped deprecation diagnostics (PB-DEP-008, PB-FM-009, PB-DOC-010) do not exist anywhere — no warning path accepts an old form (R-MIG-1).

### Acceptance criteria

- Each old form fails validation with its pointed diagnostic; no old form parses to a model.
- Diagnostic messages name the exact v2 shape to use, verified in tests by message content, not just code.

### Dependencies

- Stage 1 parser and heading/frontmatter changes.

## Stage 3 - Upstream Contract, Template, and In-Repo Migration

### Tasks

- [x] t9: Rewrite the playbook contract upstream at `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` to the v2 forms — the dependencies-block shape and field table, the `schema`/`workflowSchema` keys, the simplified spine, the v2 schema identifier, and a worked example in the v2 shape — folding the authority/precedence guidance into the `## Inputs` section prose and the contract template text per the resolved user decision (R-HEAD-2, R-RIPPLE-2).
- [x] t10: Migrate the default Playbook upstream at `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md` to the full v2 shape as the canonical example (R-MIG-4, R-RIPPLE-1).
- [x] t11: Re-seed the dogfood instances — `.make-docs/contracts/system/playbook-contract.md` and `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md` — from the upstream sources, and update dogfood-only playbook-authoring guides in place downstream (R-RIPPLE-2).
- [x] t12: Migrate every parser, validator, and compiler fixture under `packages/cli/tests/` to the v2 forms so no v1 document survives in-tree, adding v1-form fixtures only as negative cases pinned to the pointed diagnostics (R-MIG-4, R-TEST-1).

### Acceptance criteria

- The migrated default Playbook validates with zero errors in both `packages/docs/template/` and the repo's dogfood instance.
- The contract's worked example parses without error under the v2 parser.
- `## Inputs` guidance in the contract and template carries the authority/precedence concept as content, and no heading anywhere spells the v1 forms outside negative fixtures and historical lineage text.

### Dependencies

- Stages 1 and 2; the upstream-first order of PRD 19 governs the authoring sequence in this stage.

## Stage 4 - Contract Test Bar

### Tasks

- [x] t13: Land the R-TEST-1 suite: the v2 dependencies block, frontmatter keys, and headings parse and validate; each removed v1 form fails with its pointed diagnostic; no v1 form parses to a model; per-diagnostic failing fixtures follow the PRD 34 R-TEST-1 convention.

### Acceptance criteria

- Every new diagnostic has at least one failing fixture asserting its code and its v2-naming message.
- The full playbook parser/validator test suite passes on the v2 fixtures.

### Dependencies

- Stages 1–3.
