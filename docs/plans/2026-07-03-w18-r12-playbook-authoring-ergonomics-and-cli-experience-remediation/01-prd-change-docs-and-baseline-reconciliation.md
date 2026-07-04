---
title: "W18 R12 Phase 1: PRD Change Docs and Baseline Reconciliation"
kind: "plan"
status: "draft"
coordinate: "W18 R12"
---

# W18 R12 Phase 1: PRD Change Docs and Baseline Reconciliation

## Purpose

Turn the accepted design into active PRD requirements: author the two revision change docs, annotate the impacted baselines non-destructively, and bring the PRD index and the living risk register to the resolved state.

## Change Doc Shapes

### PRD 40 — Revise Playbook Authoring Contract v2

Authored from `.make-docs/templates/system/prd-change-revision.md`. It carries the contract side of the design:

- R-DEP-1..3 — the `## Dependencies` Markdown table is replaced by a fenced `playbook` block with a top-level `dependencies` key; per-entry fields `id`, `kind`, `requirement`, optional `probe` defaulting to `id`, `source` as unparsed human provenance prose, `used_by` as a typed list, and `fallback`; `probe` is the only field dependency-check generation may target, and nothing anywhere parses `source` prose for machine meaning (the D-015 close bar).
- R-FM-1 — `schema` and `workflowSchema` replace `schemaVersion` and `workflowSchemaVersion`; the old keys are removed and fail with pointed diagnostics.
- R-HEAD-1 — the heading spine simplifies: `## Inputs And Authority` → `## Inputs`, `## Workflow Contract` → `## Workflow`, `## Gates And Decisions` → `## Gates`, `## Outputs And Handoff` → `## Outputs`; the authority/precedence concept survives as guidance content inside `## Inputs` and in the contract template text (resolved user decision).
- R-MIG-1..4 — the clean v2 break: the v1 dependency-table parser, old headings, and old frontmatter keys are removed, not deprecated; the proposed PB-DEP-008/PB-FM-009/PB-DOC-010 deprecation diagnostics are dropped; old-form documents fail with pointed error diagnostics naming the v2 replacement shape; the schema version advances to the v2 identifier and only v2 parses; the default Playbook, all fixtures, and the upstream template migrate in place within the round.
- R-RIPPLE-1..2 — the coherent ripple across parser, validator, diagnostics catalog, compiler materialization, playbook contract, and default Playbook, authored upstream in `packages/docs/template/` first per the maintainer dogfooding rule.
- R-FIX-1 and R-TEST-1..2 — the F1 root fix and the contract/probe verification bar, pinned by fixtures whose `source` prose does not begin with the binary name.

### PRD 41 — Revise CLI Human Experience and Package Grammar

Authored from the same revision template. It carries the experience side under agent invariance:

- R-INV-1 — operation results, MCP output, and non-TTY/`--json` CLI output stay byte-identical except for additive fields and flags (MUST).
- R-RENDER-1..3 — the render layer at the `printJson` seam keyed by the existing `OperationRenderMode`; TTY default is human text (report, cursor, next hint and command), `--json` and non-TTY defaults are unchanged full JSON, MCP untouched; capability snapshot renders once at `start` and evidence logs are not restated in text mode.
- R-GRAM-1..3 — `run package plan` (with `--output`), `run package preview`, `run package write` with `--write` retired; and `package.ship`, a real registered composite operation (W18 R11 parity rule — no CLI-only composites) surfaced as `run package ship` and derived to MCP, executing plan → preview → write through the operation core, aborting at the first stop, unresolved proposal, or warning with guidance naming the granular command, performing the classification write, and preserving every fail-before-write rail.
- R-RUNID-1, R-FLAG-1..2, R-NOISE-1 — run-id prefix resolution and `--last`; `--repo-root`/`--store-root` defaults; precondition config absorption as convenience, never authority; targeted SQLite ExperimentalWarning suppression.
- R-FIX-2 — subject-scoped resume hints with retirement on every mutating transition and full retirement at `close` (the D-016 close bar); the evidence log is unchanged.
- R-SEQ-1..2 and R-TEST-3..6 — the before-R9 sequencing rule, the PRD 37 / W18 R9 backlog reconciliation obligation, and the render-invariance, grammar, hint-retirement, and ship verification bars.

## Baseline Annotations

Apply the annotation plan from [00-overview.md](00-overview.md) exactly: `#### Change Notes` blocks under the impacted `###` requirement sections in PRD 34 (R-DOC, R-DEP, R-MODEL), PRD 36 (R-DEPMAT), PRD 35 (R-STORE/R-STATE), PRD 39 (R-RUN superseded; R-REG/R-CORE/R-SURF enhanced), and PRD 37 (R-SCEN); plus an `Enhanced by` bullet appended newest-last to PRD 36's existing Impacted Docs `### Change Notes`. Never delete or rewrite baseline text.

## Index and Register

- `docs/prd/00-index.md`: add document-map rows for 40 and 41 with Current status, extend the reading-order and audience-path prose, add source anchors for the new docs, the design, the plan, and the backlog, and add the Intended Follow-On bullet gating W18 R9 behind W18 R12 per R-026.
- `docs/prd/03-open-questions-and-risk-register.md`: update in place — D-015 (drop the legacy-table ID-first transition language; the resolution is the clean break plus the `probe` field), D-016 (point follow-up at PRD 41 and the W18 R12 backlog), and R-026 (replace the accept-old-warn description with the clean v2 break, add `package.ship`, and point follow-up at PRD 40/41 and the backlog). Never renumber items.

## Exit Criteria

- PRD 40 and PRD 41 exist, use the revision template headings, and carry their assigned requirement families with stable IDs matching the design.
- Every planned annotation exists with the planned verb, newest note last.
- The index and register reflect the resolved decisions with no renumbering.
