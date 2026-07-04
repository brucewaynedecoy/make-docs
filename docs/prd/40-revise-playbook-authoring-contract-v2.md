---
title: "40 Revise Playbook Authoring Contract v2"
kind: "prd"
status: "active"
coordinate: "W18 R12"
source:
  type: "plan"
  path: "docs/plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-overview.md"
---

# 40 Revise Playbook Authoring Contract v2

## Purpose

Advance the W18 R6 Playbook authoring contract to v2 for the human author: dependencies become a fenced YAML block with typed, named fields including an explicit `probe`, the frontmatter version keys shorten to `schema` and `workflowSchema`, and the required heading spine sheds its jargon. The revision is a clean break — nothing built on the v1 contract was ever distributed, so the v1 dependency-table parser, the old frontmatter keys, and the old heading spellings are removed rather than deprecated, and old-form documents fail with pointed diagnostics naming the v2 replacement shape. The same change fixes UAT defect F1 at its root: the packaging compiler's dependency checks probe the declared `probe` field (defaulting to the dependency `id`), and nothing anywhere parses `source` prose for machine meaning again. Source chain: [the W18 R12 design](../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md) and [the W18 R12 plan](../plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-overview.md); the confirmed defect is register item [D-015](03-open-questions-and-risk-register.md).

## Change Type

This doc records a `revision`. It supersedes the v1 authoring surfaces defined in [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md) — the `## Dependencies` Markdown table (R-DEP-1..3), the `schemaVersion`/`workflowSchemaVersion` frontmatter keys (R-DOC-3), the v1 heading spellings in the eleven-heading spine (R-DOC-5), the parse-dependency-table stage (R-MODEL-3), and the v1 schema identifiers — and the `Source`-scraping probe derivation in [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md) R-DEPMAT-1 check generation. Everything else in the W18 R6 contract — the single-fence workflow contract, the step model, the kind and requirement enumerations, cross-reference integrity, the layered validator, the diagnostics discipline, and the three-authoritative-regions rule — remains active and is consumed unchanged.

## Baseline Being Revised or Removed

- [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md), Dependency Registry (R-DEP): the Markdown table with positional columns `ID`, `Kind`, `Requirement`, `Source`, `Used By`, `Fallback` is superseded by the fenced YAML dependencies block. The registry-of-record role, identifier uniqueness, kind/requirement enumerations, and bidirectional cross-reference integrity (R-DEP-4) carry forward unchanged.
- [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md), Playbook Document Schema (R-DOC): `schemaVersion`/`workflowSchemaVersion` (R-DOC-3) are superseded by `schema`/`workflowSchema`; the R-DOC-5 spine spellings `## Inputs And Authority`, `## Workflow Contract`, `## Gates And Decisions`, and `## Outputs And Handoff` are superseded by `## Inputs`, `## Workflow`, `## Gates`, and `## Outputs`; the v1 schema identifiers are superseded by v2 identifiers. Order and presence rules, the narrative-prose rule (R-DOC-6), and unknown-section handling (R-DOC-7) are unchanged.
- [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md), Playbook Model, Parser, Validator, and Diagnostics (R-MODEL): the parse-dependency-table stage in R-MODEL-3 is superseded by a dependencies-block parsing stage; the diagnostics catalog gains pointed old-form error diagnostics and loses nothing (the R-MODEL-5 set remains).
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md), Dependency Materialization (R-DEPMAT): the implementation practice of deriving the probe target from the first word of `Source` prose (`executableToken` in `packages/cli/src/operations/playbook-packaging/materialization.ts`) is superseded; checks probe the declared `probe` field, defaulting to the dependency `id`. Every other materialization rule in R-DEPMAT-1 — per-kind emission, operation identifiers over CLI strings, explicit degradation — is unchanged.

## Rationale

The 2026-07-03 hand-run UAT proved the v1 authoring format is optimized for the parser at the author's expense, and that its stringly-typed shape causes real defects. F1 ([D-015](03-open-questions-and-risk-register.md)): a dependency `git` with Source `system install` generates a check probing a binary named `system`, because machine meaning (the probe target) lives inside narrative prose — in direct tension with the contract's own R-DOC-6 rule that prose never carries machine meaning. The positional table is error-prone to hand-author; the long frontmatter keys and jargon headings (`## Inputs And Authority`, `## Workflow Contract`) add cognitive load with no machine benefit. A deprecation window was considered and rejected by user decision: nothing built on the v1 contract was ever distributed, so accept-old-warn would preserve dead parsing surface for zero consumers. The clean break keeps the good-error-message half — pointed diagnostics naming the v2 shape — without the legacy-support half.

Code anchors:

- `packages/cli/src/operations/playbook-packaging/materialization.ts`
- `packages/cli/src/playbook/parser/dependency-table.ts`
- `packages/cli/src/playbook/parser/frontmatter.ts`
- `packages/cli/src/playbook/parser/headings.ts`
- `.make-docs/contracts/system/playbook-contract.md`
- `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`

## Effective Requirement

### Dependencies Block (R-DEP)

- R-DEP-1 (MUST): the `## Dependencies` section carries one fenced block with info string `playbook` and top-level key `dependencies`, the same fence discipline as the workflow contract block, distinguished by its top-level key. Exactly one authoritative `playbook` fence is allowed per governed section; a `playbook` fence whose top-level key does not match its section is an error.
- R-DEP-2 (MUST): per-entry fields are `id` (required; stable, unique local identifier referenced by `uses`/`requires`), `kind` (required; the unchanged W18 R6 enumeration), `requirement` (required; `required`/`optional`/`preferred`/`conditional`, unchanged), `probe` (optional; the executable or reference target generated dependency checks verify, defaulting to `id`; the `command -v` binary for `cli` and `package-manager` kinds, the manifest reference identifier for `skill` and `plugin` kinds, reserved for other kinds; must match the executable-token pattern when present), `source` (required; human provenance prose, never parsed for machine meaning by anything), `used_by` (required; a typed YAML list of step ids or workflow phase names), and `fallback` (required; prose describing behavior when the dependency is missing).
- R-DEP-3 (MUST): `probe` is the only field dependency-check generation may target; `executableToken` scraping of `source` is removed entirely, and no code path anywhere parses `source` prose for machine meaning. This is the root fix for F1 and the [D-015](03-open-questions-and-risk-register.md) close bar.

### Frontmatter Keys (R-FM)

- R-FM-1 (MUST): `schema` replaces `schemaVersion` and `workflowSchema` replaces `workflowSchemaVersion` as the canonical required frontmatter keys, values and semantics unchanged. The old keys are removed, not deprecated: a document declaring either fails validation with a pointed diagnostic naming the v2 key.

### Heading Spine (R-HEAD)

- R-HEAD-1 (MUST): the required spine simplifies with order and presence rules unchanged — positions 1–3 and 5, 7, 10, 11 are unchanged (`# <Title>`, `## Purpose`, `## When To Use`, `## Dependencies`, `## Step Guidance`, `## Validation`, `## Packaging Notes`); position 4 `## Inputs And Authority` becomes `## Inputs`, position 6 `## Workflow Contract` becomes `## Workflow`, position 8 `## Gates And Decisions` becomes `## Gates`, and position 9 `## Outputs And Handoff` becomes `## Outputs`.
- R-HEAD-2 (MUST): the authority/precedence concept formerly signaled by "And Authority" survives as guidance content inside `## Inputs` and as prose in the contract template text, not as heading vocabulary (resolved user decision); handoff guidance likewise folds into `## Outputs`. Only the v2 spellings are valid; an old spelling fails validation with a pointed diagnostic naming the v2 heading for that slot.

### Clean v2 Break (R-MIG)

- R-MIG-1 (MUST): all three changes ship as one contract revision and the revision is a clean break — the v1 dependency-table parser, old heading spellings, and old frontmatter keys are removed, not deprecated. No accept-old-warn window exists; the deprecation diagnostics proposed in earlier drafts (PB-DEP-008, PB-FM-009, PB-DOC-010) are dropped. This aligns with the W18 R11 no-alias precedent.
- R-MIG-2 (MUST): old-form documents fail with pointed error diagnostics naming the v2 replacement shape — a `## Dependencies` Markdown table fails naming the fenced `playbook` dependencies block, `schemaVersion`/`workflowSchemaVersion` fail naming `schema`/`workflowSchema`, and an old heading spelling fails naming the v2 heading for that slot. Old forms never parse to a model.
- R-MIG-3 (MUST): the document schema version advances (for example `make-docs.playbook.v2`); the parser accepts only the v2 identifier, and a v1 identifier fails with a pointed diagnostic naming the v2 identifier.
- R-MIG-4 (MUST): no v1 document survives in-tree — the shipped default Playbook, every parser/validator/compiler fixture, and the upstream template source of truth in `packages/docs/template/` migrate in place within the W18 R12 round.

### Ripple and Authoring Order (R-RIPPLE)

- R-RIPPLE-1 (MUST): the change lands coherently across the parser (`packages/cli/src/playbook/parser/` — a dependencies-block parser replacing `dependency-table.ts`, which is deleted), the validator layers and diagnostics catalog, the packaging compiler's dependency materialization, the playbook contract document with its worked example rewritten to the v2 shape, and the shipped default Playbook as the canonical example.
- R-RIPPLE-2 (MUST): the playbook contract and the default Playbook are dogfooded template assets authored upstream in `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and `packages/docs/template/docs/assets/playbooks/agent/`, then re-seeded into this repo's `.make-docs/` and `docs/` instances; dogfood-only authoring guides update in place downstream.

### Defect Fix (R-FIX)

- R-FIX-1 (MUST): F1 is fixed at the root by the `probe` field per R-DEP-3; with the v1 table parser deleted per R-MIG-1, no `source`-scraping path survives. The regression is pinned by fixtures whose `source` prose does not begin with the binary name — the blind spot that let the defect through — including the UAT repro (`git` with source `system install of git`).

### Verification (R-TEST)

- R-TEST-1 (MUST): the v2 dependencies block, frontmatter keys, and headings parse and validate; each removed v1 form (dependency table, old frontmatter keys, old heading spellings, v1 schema identifier) fails with its pointed diagnostic naming the v2 replacement; no v1 form parses to a model.
- R-TEST-2 (MUST): generated `cli` and `package-manager` checks probe `probe` (or `id` when absent), verified with a fixture whose `source` does not start with the binary name; the UAT repro passes.

Code anchors:

- `packages/cli/src/playbook/parser/parse-playbook.ts`
- `packages/cli/src/playbook/parser/dependency-table.ts`
- `packages/cli/src/operations/playbook-packaging/materialization.ts`
- `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`
- `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`
- `packages/cli/tests/playbook-parser.test.ts`

## Impacted Docs and Dependencies

- [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md): the dependency-table shape, the v1 frontmatter version keys, the v1 heading spellings, the parse-dependency-table stage, and the v1 schema identifiers are superseded as described above; the workflow contract block, step model, model shape, layered validation, remaining diagnostics, and three-authoritative-regions rule remain active there and are consumed unchanged.
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): dependency-check generation now targets the model's `probe` field; the rest of R-DEPMAT and the compiler, adapters, and distributable model remain active there. The compiler consumes the v2 model through the parser and never re-parses Markdown.
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): first-pass scenario expectations about generated dependency checks bind to probe-based checks after this revision; the reconciliation obligation is carried by register item [R-026](03-open-questions-and-risk-register.md) and the [W18 R12 backlog](../work/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-index.md) Phase 4.
- [41-revise-cli-human-experience-and-package-grammar.md](41-revise-cli-human-experience-and-package-grammar.md): the sibling W18 R12 change doc; it owns the CLI render, grammar, `package.ship`, ergonomics, and hint-retirement requirements and shares this doc's delivery sequence.
- Agent invariance: the parsed model change is contract-internal; operation results and MCP output shapes change only additively per the sibling doc's R-INV-1.
- Maintainer dogfooding: the contract and default Playbook are authored upstream in `packages/docs/template/` first per [19-revise-template-package-dogfood-source-of-truth-contract.md](19-revise-template-package-dogfood-source-of-truth-contract.md); the parser, validator, and compiler are ordinary source code under `packages/cli/`.

Code anchors:

- `packages/cli/src/playbook/parser/`
- `packages/cli/src/operations/playbook-packaging/materialization.ts`
- `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`

## Required Baseline Annotations

- [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md): `Superseded by` as new `#### Change Notes` blocks under Playbook Document Schema (R-DOC), Dependency Registry (R-DEP), and Playbook Model, Parser, Validator, and Diagnostics (R-MODEL).
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): `Superseded by` as a new `#### Change Notes` block under Dependency Materialization (R-DEPMAT).
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): `Superseded by` as a new `#### Change Notes` block under Required First-Pass Scenarios (R-SCEN), shared with [41-revise-cli-human-experience-and-package-grammar.md](41-revise-cli-human-experience-and-package-grammar.md).

## Source Anchors

- `docs/designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md`
- `docs/plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-overview.md`
- `docs/prd/34-revise-playbook-contract-and-model.md`
- `docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `packages/cli/src/playbook/parser/dependency-table.ts`
- `packages/cli/src/operations/playbook-packaging/materialization.ts`
- `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`
