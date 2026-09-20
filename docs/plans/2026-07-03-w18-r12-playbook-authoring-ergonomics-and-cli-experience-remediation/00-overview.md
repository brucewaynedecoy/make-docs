---
title: "W18 R12 Playbook Authoring Ergonomics and CLI Experience Remediation"
kind: "plan"
status: "draft"
coordinate: "W18 R12"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The plan should become active PRD requirements before the contract v2 break, compiler probe fix, hint retirement, render layer, package grammar, and ship operation are implemented."
  coordinate_handoff: "Carry W18 R12 into the downstream PRD reconciliation and work backlog lineage; W18 R12 lands before the W18 R9 conformance wave executes per register item R-026."
source:
  type: "design"
  path: "docs/designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md"
---

# W18 R12 Playbook Authoring Ergonomics and CLI Experience Remediation

## Purpose

Produce the reviewable change plan for turning [Playbook Authoring Ergonomics and CLI Experience Remediation](../../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md) into active PRD requirements and a decision-complete delta work backlog. The design remediates the 2026-07-03 hand-run UAT findings in one round: the playbook authoring contract advances to v2 as a clean break (dependencies as a fenced YAML block with a typed `probe` field, `schema`/`workflowSchema` frontmatter keys, the simplified heading spine) with the v1 forms removed and old-form documents failing with pointed diagnostics; the packaging compiler's dependency materialization stops scraping `source` prose (F1); run-state resume hints gain retirement semantics (F2); and the CLI gains a human render layer, the intent-named `plan`/`preview`/`write` grammar, the registered `package.ship` composite operation, run-id prefix resolution with `--last`, flag defaults with precondition config absorption, and targeted ExperimentalWarning suppression — all under the agent-invariance rule that operation results, MCP output, and machine-readable CLI output stay byte-identical except for additive fields.

## Objective

This plan is complete when the active PRD namespace carries the remediation as effective requirements through two new numbered revision docs, the genuinely impacted baseline PRDs carry `### Change Notes` backlinks, the PRD index and living risk register reflect the change including the R-026 sequencing gate ahead of W18 R9, and a dependency-ordered delta backlog exists that an implementing agent can execute without re-deriving contract-break, probe, render, grammar, ship, ergonomics, or reconciliation decisions.

## Coordinate Decision

- Coordinate: `W18 R12`
- Classification: `revision`
- Evidence: The design's Coordinate Handoff declares W18 lineage — it revises W18 R6 (PRD 34), W18 R7 (PRD 35), W18 R8 (PRD 36), and W18 R11 (PRD 39) — and names W18 R12 as the downstream coordinate. `docs/plans/` contains W18 R1 through W18 R11, so R12 is the next unused revision of wave 18. Register item [R-026](../../prd/03-open-questions-and-risk-register.md) already records the round under this coordinate and the user-approved rule that it lands before the W18 R9 conformance wave executes.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Playbook Authoring Ergonomics and CLI Experience Remediation design | design doc | [../../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md](../../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md) | High — accepted authority with D0–D12 decisions, R-* requirement IDs, and three resolved user decisions (clean v2 break, `package.ship`, `## Inputs` fold) |
| W18 R7/R8 UAT findings | risk register items | [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) (D-015, D-016, R-026, Q-015, Q-016) | High — confirmed by the 2026-07-03 hand-run UAT |
| PRD 34 Revise Playbook Contract and Model | change PRD | [../../prd/34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) | High — the primary contract baseline being revised: R-DOC frontmatter/headings, R-DEP table, R-MODEL parse stages and diagnostics |
| PRD 36 Revise Playbook Packaging Compiler and Harness Adapters | change PRD | [../../prd/36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | High — R-DEPMAT-1 check generation currently scrapes `Source` prose (`executableToken` in `packages/cli/src/operations/playbook-packaging/materialization.ts`) |
| PRD 35 Revise Run Playbook State Machine | change PRD | [../../prd/35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) | High — R-STATE-1 resume hints currently accumulate without retirement (`withHint` in `packages/cli/src/operations/playbook/progression.ts`) |
| PRD 39 Revise CLI Command Reorganization and Operation Registry | change PRD | [../../prd/39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) | High — owns the operation registry, `run` tree, and derived MCP surface the render layer, grammar, and `package.ship` change or extend |
| PRD 37 Enhance Playbook and Package Conformance | change PRD | [../../prd/43-conformance-scenario-model-and-execution-kits.md](../../prd/43-conformance-scenario-model-and-execution-kits.md#requirements) | High — its scenarios and the [W18 R9 backlog](../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) bind to surfaces this round changes; reconciliation is an explicit obligation (R-SEQ-2, R-026) |

Open questions and ambiguities discovered during execution are promoted into [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) per its numbering and status rules.

## Baseline Context

- Active `docs/prd/` status: active namespace, docs `00` through `39`; next available numbers are `40` and `41`.
- Impacted baseline docs: PRD 34 (the dependency-table registry, `schemaVersion`/`workflowSchemaVersion` frontmatter keys, the eleven-heading spine spellings, the parse-dependency-table stage, and the v1 schema identifiers are superseded by the v2 contract), PRD 36 (R-DEPMAT-1's check generation is superseded where it derives the probe target: checks probe the declared `probe` field, defaulting to `id`, and nothing parses `source` prose; the `run package` CLI spellings it references gain the intent-named grammar and the `package.ship` composite), PRD 35 (R-STATE-1 resume hints gain subject scoping and retirement semantics; the evidence log is unchanged), PRD 39 (the `run package` subtree spellings are superseded by `plan`/`preview`/`write` with `--write` retired; the registry gains the `package.ship` composite operation; the CLI presentation seam gains the render layer under agent invariance), and PRD 37 (its first-pass scenarios' dependency-check expectations, command spellings, and CLI-output consumption must be reconciled to the remediated surfaces before W18 R9 executes).
- Not annotated after verification: PRD 38 (the store schema is consumed unchanged; any run-state serialization change is additive per its schema-versioning rules, which is compliance, not revision), PRD 25 (the CLI/MCP operation-boundary rules are obeyed, not altered — the render layer is presentation inside the CLI surface), and PRD 29/30 (already superseded in the relevant scopes by PRD 34/35 chains; the effective requirement resolves through those newer docs).
- Discovery pass required: no
- Discovery scope if required: n/a

## Output Contract

- Plan directory: `docs/plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/`
  - entry point: `docs/plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-overview.md`
  - phase files: `docs/plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/0N-<phase>.md`
- New change docs:
  - `docs/prd/34-playbook-authoring-contract-and-model.md`
  - `docs/prd/39-cli-command-model-and-operation-registry.md`
- Baseline docs to annotate: `docs/prd/34-playbook-authoring-contract-and-model.md`, `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`, `docs/prd/35-run-playbook-state-machine-and-portability.md`, `docs/prd/39-cli-command-model-and-operation-registry.md`, `docs/prd/20-agent-harness-conformance-and-support-claims.md`
- Index and register updates: `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` (update D-015, D-016, and R-026 in place to the resolved decisions)
- Delta backlog:
  - `docs/work/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/`

## Change Doc Strategy

Two change docs carry the round because its two requirement areas have materially different baselines and rationale: the authoring-contract v2 break revises the document contract lineage (PRD 34) and the compiler consumption of the registry (PRD 36), while the human-experience layer revises the CLI surface and run-state lineage (PRD 39, PRD 35) under the agent-invariance rule. They share one delivery sequence — the single W18 R12 backlog.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) | revision | Supersedes the v1 dependency table, `schemaVersion`/`workflowSchemaVersion` keys, and legacy heading spellings with the clean v2 authoring contract — fenced YAML dependencies with the `probe`-only rule, `schema`/`workflowSchema`, the simplified spine, pointed old-form diagnostics, and in-repo migration of the default Playbook, fixtures, and the upstream template. | PRD 34, PRD 36, PRD 37, plus the PRD index and risk register. |
| [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md#human-experience-and-package-grammar) | revision | Supersedes the JSON-dump-only CLI presentation, the `write`-without-`--write` dry-run spelling, and accumulate-only resume hints with the TTY render layer under agent invariance, the `plan`/`preview`/`write` grammar with `plan --output`, the registered `package.ship` composite, run-id prefix resolution and `--last`, flag defaults and precondition config, warning suppression, and hint retirement. | PRD 39, PRD 35, PRD 36, PRD 37, plus the PRD index and risk register. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) | Playbook Document Schema (R-DOC); Dependency Registry (R-DEP); Playbook Model, Parser, Validator, and Diagnostics (R-MODEL) — each as a new `#### Change Notes` block | Superseded by | [34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) |
| [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | Dependency Materialization (R-DEPMAT) as a new `#### Change Notes` block | Superseded by | [34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) |
| [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | Impacted Docs and Dependencies `### Change Notes`, appended newest-last | Enhanced by | [Package Grammar Boundary](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) (historical section: `package-grammar-boundary`) |
| [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md) | Run-State Storage and Record (R-STORE, R-STATE) as a new `#### Change Notes` block | Superseded by | [CLI Portability Boundary](../../prd/35-run-playbook-state-machine-and-portability.md) (historical section: `cli-portability-boundary`) |
| [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) | The Run Surface After Pruning (R-RUN) as a new `#### Change Notes` block | Superseded by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md#human-experience-and-package-grammar) |
| [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md) | The Operation Registry and Shared Core (R-REG, R-CORE, R-SURF) as a new `#### Change Notes` block | Enhanced by | [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md#human-experience-and-package-grammar) |
| [43-conformance-scenario-model-and-execution-kits.md](../../prd/43-conformance-scenario-model-and-execution-kits.md#requirements) | Required First-Pass Scenarios (R-SCEN) as a new `#### Change Notes` block | Superseded by | [34-playbook-authoring-contract-and-model.md](../../prd/34-playbook-authoring-contract-and-model.md) and [39-cli-command-model-and-operation-registry.md](../../prd/39-cli-command-model-and-operation-registry.md#human-experience-and-package-grammar) |

## Worker Ownership

The coordinator write scope is `none` when delegation is available; every output-writing task below belongs to a role-based worker with a disjoint write scope.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Contract change doc author | Author PRD 40 from the revision template with the design's R-DEP, R-FM, R-HEAD, R-MIG, R-RIPPLE, R-FIX-1, and R-TEST-1/2 requirement IDs | `docs/prd/34-playbook-authoring-contract-and-model.md` | Accepted W18 R12 design | The contract v2 effective-requirement change doc. |
| CLI change doc author | Author PRD 41 from the revision template with the design's R-INV-1, R-RENDER, R-GRAM (including R-GRAM-3 `package.ship`), R-RUNID, R-FLAG, R-NOISE, R-FIX-2, R-SEQ, and R-TEST-3/4/5/6 requirement IDs | `docs/prd/39-cli-command-model-and-operation-registry.md` | Accepted W18 R12 design | The human-experience effective-requirement change doc. |
| Baseline annotation worker | Add the `### Change Notes`/`#### Change Notes` backlinks per the annotation plan, newest note last in existing blocks | `docs/prd/34-*.md`, `docs/prd/35-*.md`, `docs/prd/36-*.md`, `docs/prd/37-*.md`, `docs/prd/39-*.md` (annotations only) | PRD 40 and PRD 41 exist | Non-destructive supersession/enhancement annotations. |
| Index and register assembler | PRD index rows, reading-order and lineage mentions, and in-place register updates to D-015, D-016, and R-026 reflecting the clean v2 break, hint retirement, and `package.ship` decisions | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` | PRD 40, PRD 41, and annotations | Accurate catalog status, lineage, and register state. |
| Delta backlog author | Dependency-ordered W18 R12 implementation backlog with the P1–P4 phase split | `docs/work/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/**` | PRD 40 and PRD 41 shapes settled | Decision-complete delta backlog. |
| Validation worker | Link, path-hygiene, wave-numbering, annotation, and traceability checks plus `npm run validate:defaults` | Changed docs only (fix-up edits) | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search and section reads when indexed and `jcodemunch` for code-anchor verification (`materialization.ts`, `progression.ts`, `cli.ts`, `types.ts`, `dependency-table.ts`); reindex before falling back.
- Fallback plan if unavailable: direct file reads plus targeted `grep` for section location, with repository contracts under `.make-docs/**` as the structural authority.

## Validation

Execution validates that PRD 40 and PRD 41 use the revision template and carry every design requirement family assigned to them; that every impacted baseline doc contains the required change-note backlink with the planned verb, newest note last, and no baseline text was deleted or renumbered; that `docs/prd/00-index.md` shows docs 40 and 41 with Current status and consistent reading-order and lineage prose; that the risk register's D-015, D-016, and R-026 items are updated in place to the resolved clean-break, retirement, and sequencing decisions without renumbering; that every backlog phase cites its change docs plus the still-constraining baselines and names its PRD requirement anchors; and that changed files pass `npm run validate:defaults`, `python3 .make-docs/scripts/check_path_hygiene.py`, relative-link resolution, and `git diff --check`.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-prd-change-docs-and-baseline-reconciliation.md](01-prd-change-docs-and-baseline-reconciliation.md) | Author PRD 40 and PRD 41, annotate the impacted baselines, and update the PRD index and risk register. |
| [02-contract-and-cli-scope.md](02-contract-and-cli-scope.md) | Settle the contract-break, probe, render, grammar, ship, and ergonomics scope the backlog must encode, grounded in D0–D12 and the three resolved user decisions. |
| [03-delta-backlog-and-validation.md](03-delta-backlog-and-validation.md) | Generate the W18 R12 delta backlog with the P1–P4 phase split and run the closing validation pass. |

## Dependencies

- [Playbook Authoring Ergonomics and CLI Experience Remediation](../../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md) is the accepted authority; the 2026-07-03 UAT findings recorded in register items D-015, D-016, and R-026 are its source evidence.
- Three user decisions are resolved and binding: the contract revision is a clean v2 break with no legacy parsing (nothing built on v1 was ever distributed; old forms fail with pointed diagnostics naming the v2 shape); `package.ship` is a real registered composite operation per the W18 R11 parity rule, never a CLI-only composite; and `## Inputs And Authority` folds to `## Inputs` with the authority/precedence concept surviving as guidance content inside the section and in the contract template text.
- Agent invariance (design R-INV-1) constrains every CLI change: operation results, MCP tool output, and non-TTY/`--json` CLI output stay byte-identical except for additive fields and flags; no MCP tool schema changes.
- The run-state machine's progression semantics beyond hint retirement, the packaging pipeline and adapter contracts beyond probe consumption and the ship composite, the operation registry's materialization rules, and conformance evidence are owned by their existing lineages per design R-SCOPE-1 and are consumed, not redefined.
- Sequencing: W18 R12 lands before the W18 R9 conformance wave executes (design R-SEQ-1, register R-026), and this round's planning includes the PRD 37 / W18 R9 backlog reconciliation obligation (design R-SEQ-2) as an explicit backlog phase.
- The playbook contract and the default Playbook are dogfooded template assets authored upstream in `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and `packages/docs/template/docs/assets/playbooks/agent/` first, then re-seeded downstream, per the maintainer dogfooding rule; the parser, validator, compiler, and CLI are ordinary source code under `packages/cli/`. This planning round writes project planning/PRD/work content only and authors nothing under `packages/`.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then implement from the W18 R12 delta backlog.
- Why: The plan should become the product requirement contract before the contract break, compiler fix, render layer, grammar, and ship implementation begins, because the W18 R9 conformance wave binds its evidence to the surfaces this round changes.
- Coordinate Handoff: Carry `W18 R12` into the downstream PRD reconciliation and the delta work backlog lineage, adding the active P coordinate per phase; W18 R9 executes only after this round lands and PRD 37 plus the W18 R9 backlog are reconciled (R-026).
