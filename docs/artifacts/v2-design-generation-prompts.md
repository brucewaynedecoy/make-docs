# v2 Design Generation Prompts

Status: seed prompt pack
Date: 2026-06-19
Branch: `v2-planning`

This artifact is a non-authoritative prompt pack for generating the v2 design set from [v2-proposed-design-and-roadmap.md](v2-proposed-design-and-roadmap.md). It belongs in `docs/artifacts/` because it is process scaffolding and handoff material, not a design, plan, PRD change, work backlog, guide, or history record.

Use these prompts to keep v2 design generation consistent across context compaction, subagents, or a handoff to another agent. The operating model is: work by batch, draft one design at a time, perform an evidence pass before each draft, reconcile the batch after all design docs in that batch exist, and sign off only when the batch is coherent enough to serve as authority for the next batch.

## Ground Rules

- Use `jdocmunch` for indexed project docs and `jcodemunch` for indexed code and function signatures whenever the tools are available. If a needed doc or code surface is missing or stale, reindex before falling back to direct reads.
- Read [AGENTS.md](AGENTS.md) before writing or editing files under `docs/artifacts/`, and treat artifact files as zero-contract seed material.
- Before generating a design doc, read `docs/designs/AGENTS.md`, `docs/assets/references/design-contract.md`, `docs/assets/references/design-workflow.md`, `docs/assets/templates/design.md`, and `docs/assets/references/lifecycle.md`.
- Use the actual current date in generated design filenames. Do not backdate design docs to match earlier proposals.
- Do not mutate PRDs, risk-register entries, existing design backlinks, plans, work backlogs, guides, history records, package templates, or source code during design generation unless the user explicitly asks for that additional work.
- Keep template ownership explicit when design decisions affect shipped assets: `packages/docs/template/` is the shipped template source, root `docs/` is the dogfood copy, and `packages/cli/template/` is the package bundle.
- Treat `.backup/*.md` files as user-directed historical seed inputs, not authoritative contracts.
- Keep Markdown source in normal paragraph lines, not semantic line breaks.

## Batch Map

Batch 1 design order:

1. **Package and Deployment Boundaries**
2. **System Asset Delivery and Materialization Contract**
3. **Compatibility, Audit, and Migration Disposition**
4. **Template, Package, and Dogfood Source-of-Truth Contract**

Parallel maintainer-infrastructure track:

5. **Agent Harness and Model Conformance Lab**

This track is not part of Batch 1. Run the same 5-prompt workflow for it after Batch 1 sign-off, using the placeholders in the **Parallel Track Specialization** section below. Because this track contains one design doc, Prompt 4 reconciles the single conformance design against Batch 1 authority and Prompt 5 signs off the track as validation/support-claim authority, not as a numbered batch.

Later batches are summarized in [v2-proposed-design-and-roadmap.md](v2-proposed-design-and-roadmap.md). Do not draft later-batch designs until the user approves the preceding batch or explicitly redirects the work.

## Prompt 1 - Batch Kickoff

Use this once at the start of a batch. Its output should be a short batch execution plan and evidence map, not any design docs.

```md
You are working from the make-docs repository root on branch `v2-planning`.

We are preparing v2 design docs from `docs/artifacts/v2-proposed-design-and-roadmap.md`. Focus only on `{batch_name}`.

Before doing any drafting, perform a batch kickoff pass:

1. Read repo instructions and design contracts:
   - `AGENTS.md`
   - `docs/AGENTS.md`
   - `docs/designs/AGENTS.md`
   - `docs/assets/references/lifecycle.md`
   - `docs/assets/references/design-contract.md`
   - `docs/assets/references/design-workflow.md`
   - `docs/assets/templates/design.md`
   - `docs/artifacts/AGENTS.md`
2. Read the v2 roadmap inputs:
   - `docs/artifacts/v2-proposed-design-and-roadmap.md`
   - `docs/artifacts/evolution-direction.md`
   - `docs/artifacts/evolution-direction-structure.md`
   - `docs/artifacts/lifecycle-and-coverage.md`
   - `.backup/PLANNED_CHANGES.md`
   - `.backup/PLANNED_PLUGINS.md`
   - `.backup/PLANNED_RESTRUCTURE.md`
3. Use `jdocmunch` for project docs and `jcodemunch` for code/function surfaces. Reindex before direct reads if an index is missing or stale.
4. Identify the design docs in this batch, their dependency order, and the current repo surfaces each design must inspect.
5. Identify prior designs, PRDs, history entries, code modules, tests, package/template surfaces, risk-register entries, and open decisions that may affect the batch.
6. Do not create or edit design docs yet.

Return:

- The ordered design-doc list for `{batch_name}`.
- The evidence sources to read for each design.
- Cross-design decisions that must stay consistent across the batch.
- Known blockers or user decisions needed before drafting.
- The recommended next single design doc to run through the evidence prompt.
```

## Prompt 2 - Single Design Evidence Pass

Use this before drafting each design. Its output should be an evidence brief that can be reviewed before writing the design doc.

```md
You are working from the make-docs repository root on branch `v2-planning`.

Run an evidence pass for one v2 design doc. Do not draft the design doc yet.

Batch: `{batch_name}`
Design title: `{design_title}`
Expected slug: `{design_slug}`
Design order in batch: `{design_order}`
Prior accepted v2 designs in this batch, if any: `{prior_designs}`

Required process:

1. Read the repo and design instructions:
   - `AGENTS.md`
   - `docs/AGENTS.md`
   - `docs/designs/AGENTS.md`
   - `docs/assets/references/lifecycle.md`
   - `docs/assets/references/design-contract.md`
   - `docs/assets/references/design-workflow.md`
   - `docs/assets/templates/design.md`
2. Read the governing roadmap sections in `docs/artifacts/v2-proposed-design-and-roadmap.md`.
3. Read earlier accepted v2 designs in `{prior_designs}` and treat them as stronger authority than artifact proposals.
4. Use `jdocmunch` to search docs for prior designs, PRDs, history entries, guides, risk-register entries, and archived planning docs relevant to `{design_title}`.
5. Use `jcodemunch` to search code and function signatures relevant to `{design_title}`. Include current source surfaces, tests, package scripts, template sync paths, manifest behavior, audit/backup behavior, installer/skills behavior, or MCP/CLI surfaces as applicable.
6. If indexed docs or code are missing or stale, reindex first. Only use direct file reads after the relevant reindex attempt fails or when reading unindexed local-only seed files.
7. Identify whether the new design should include `## Design Lineage`, and whether it likely updates, supersedes, extends, or only references prior design intent. Do not edit prior designs.
8. Identify risks, open questions, and PRD/risk-register entries that should be referenced but not mutated.
9. Identify downstream blockers this design must remove for later designs in the batch or next batch.

Return an evidence brief with:

- Proposed filename using today's actual date: `docs/designs/YYYY-MM-DD-{design_slug}.md`
- Design scope and non-scope.
- Current repo surfaces and evidence.
- Prior docs and lineage candidates.
- Decisions this design must make.
- Decisions this design should explicitly defer.
- Risks/open questions to reference.
- Template/package/dogfood implications.
- Validation expectations for the future implementation, if already clear.
- Recommended route for `## Intended Follow-On`: `baseline-plan` or `change-plan`, with rationale.
- Any user questions that must be answered before drafting.
```

## Prompt 3 - Single Design Draft Pass

Use this only after the evidence brief is reviewed or accepted. Its output should be exactly one design doc unless the user explicitly asks for related edits.

```md
You are working from the make-docs repository root on branch `v2-planning`.

Draft one v2 design doc from the accepted evidence pass.

Batch: `{batch_name}`
Design title: `{design_title}`
Design slug: `{design_slug}`
Evidence source: `{evidence_source}`
Prior accepted v2 designs in this batch, if any: `{prior_designs}`

Required process:

1. Re-read the accepted evidence source and the relevant section of `docs/artifacts/v2-proposed-design-and-roadmap.md`.
2. Re-read `docs/designs/AGENTS.md`, `docs/assets/references/design-contract.md`, `docs/assets/references/design-workflow.md`, `docs/assets/templates/design.md`, and `docs/assets/references/lifecycle.md`.
3. Inspect `docs/designs/` for existing same-area designs and confirm create-vs-update. For v2 planning, default to creating a new dated design unless the user explicitly asks to update an existing design.
4. Create exactly one file: `docs/designs/YYYY-MM-DD-{design_slug}.md`, using today's actual date.
5. Use the design template structure and include all required headings:
   - `## Purpose`
   - `## Context`
   - `## Decision`
   - `## Alternatives Considered`
   - `## Consequences`
   - `## Intended Follow-On`
6. Include `## Design Lineage` when the evidence pass shows a material relationship to prior design intent.
7. In `## Intended Follow-On`, include `Route:`, `Next Prompt:`, `Why:`, and `Coordinate Handoff:` according to the design contract.
8. Surface lifecycle departures explicitly. These v2 designs are being generated from artifact roadmap inputs as an intentional source-to-design straddle before returning to design -> plan -> PRD -> work -> implementation.
9. Reference risks and open questions without mutating PRD/risk-register state.
10. Do not edit prior design backlinks, PRDs, risk registers, plans, work backlogs, guides, history records, package templates, or source code.

Validation:

- Run `git diff --check -- docs/designs/YYYY-MM-DD-{design_slug}.md`.
- Check Markdown links in the new design file.
- Reindex docs with `jdocmunch` if available.
- Register edits with `jcodemunch` if appropriate for cache invalidation.

Return:

- The created design file path.
- A short summary of the design decision.
- Validation results.
- Any unresolved questions or follow-on items for batch reconciliation.
```

## Prompt 4 - Batch Reconciliation

Use this after every design doc in the batch has been drafted. Its output should identify contradictions and required fixes before sign-off.

```md
You are working from the make-docs repository root on branch `v2-planning`.

Run a reconciliation pass for `{batch_name}`. Do not generate plans, PRDs, work backlogs, guides, history records, or implementation changes.

Batch design docs:

{batch_design_docs}

Required process:

1. Read every design doc in `{batch_design_docs}`.
2. Read `docs/artifacts/v2-proposed-design-and-roadmap.md` and compare the accepted batch output to the intended batch goals.
3. Re-read `docs/assets/references/lifecycle.md`, `docs/assets/references/design-contract.md`, and `docs/assets/references/design-workflow.md`.
4. Check that every design has required headings, intended follow-on route, prompt link, coordinate handoff, and lineage where needed.
5. Check that later designs in the batch do not contradict earlier accepted designs.
6. Check cross-design consistency for package ownership, template/dogfood/package bundle boundaries, migration disposition, manifest schema assumptions, system asset materialization, CLI/installer split, skills/plugin boundaries, conformance-lab claims, and any other batch-specific invariants.
7. Check that open questions are explicit and not silently converted into implementation decisions.
8. Check that no PRD/risk-register state, prior design backlink, plan, work backlog, guide, history record, package template, or source code change is required before sign-off unless the user explicitly approves it.

Return:

- Findings first, ordered by severity, with file/line references.
- Required edits before sign-off.
- Optional polish that can wait.
- Cross-design decisions that are now stable.
- Open questions that must carry into the next batch.
- Whether the batch appears ready for the sign-off prompt.
```

## Prompt 5 - Batch Sign-Off

Use this only after reconciliation findings are resolved or explicitly accepted by the user.

```md
You are working from the make-docs repository root on branch `v2-planning`.

Run a sign-off pass for `{batch_name}`. The goal is to determine whether this batch can serve as authority for the next batch.

Batch design docs:

{batch_design_docs}

Required process:

1. Read the batch design docs and the latest reconciliation result.
2. Confirm every required design doc for the batch exists and follows the design contract.
3. Confirm every design's `## Intended Follow-On` is present and coherent.
4. Confirm known contradictions have been resolved or explicitly accepted.
5. Confirm the batch decisions remove the blockers they were supposed to remove for the next batch.
6. Identify any decisions that remain provisional and must be carried into later design work.
7. Confirm no unauthorized downstream lifecycle artifacts were created or mutated.

Return:

- Sign-off verdict: `ready`, `ready-with-caveats`, or `not-ready`.
- Authority summary: what this batch now establishes.
- Unblocked next work: which batch or design docs can proceed.
- Carry-forward questions or constraints.
- Required fixes if the verdict is not `ready`.
- Suggested first prompt to run next.
```

## Batch 1 Specialization

For Batch 1, set placeholders as follows:

- `{batch_name}`: `Batch 1 - Packaging, Compatibility, and Ownership`
- Design 1 `{design_title}`: `Package and Deployment Boundaries`
- Design 1 `{design_slug}`: `package-and-deployment-boundaries`
- Design 2 `{design_title}`: `System Asset Delivery and Materialization Contract`
- Design 2 `{design_slug}`: `system-asset-delivery-and-materialization-contract`
- Design 3 `{design_title}`: `Compatibility, Audit, and Migration Disposition`
- Design 3 `{design_slug}`: `compatibility-audit-and-migration-disposition`
- Design 4 `{design_title}`: `Template, Package, and Dogfood Source-of-Truth Contract`
- Design 4 `{design_slug}`: `template-package-and-dogfood-source-of-truth-contract`

Run the Batch 1 designs in that order. Do not include the parallel **Agent Harness and Model Conformance Lab** design in the Batch 1 design count or Batch 1 sign-off; draft it only after Batch 1 contracts are accepted or otherwise stable enough to define initial conformance scenarios.

## Parallel Track Specialization

For the maintainer conformance track, set placeholders as follows:

- `{batch_name}`: `Parallel Track - Maintainer Conformance Infrastructure`
- `{design_title}`: `Agent Harness and Model Conformance Lab`
- `{design_slug}`: `agent-harness-and-model-conformance-lab`
- `{design_order}`: `single design in parallel track`
- `{prior_designs}`: accepted Batch 1 design docs, especially package/deployment boundaries, system asset delivery, compatibility/audit/migration disposition, and template/package/dogfood source of truth.

Run Prompt 1 after Batch 1 sign-off or after the user explicitly accepts Batch 1 as stable enough. Run Prompt 2 and Prompt 3 for the one conformance lab design. Run Prompt 4 with `{batch_design_docs}` containing only the conformance lab design, while treating the accepted Batch 1 designs as authority/context. Run Prompt 5 to decide whether the track is ready to support harness/model support claims. This sign-off is separate from Batch 1 sign-off and does not gate ordinary Batch 2 drafting unless the user chooses to make conformance evidence a Batch 2 prerequisite.

## Closeout Checks for This Prompt Pack

When editing this artifact, run:

- `git diff --check -- docs/artifacts/v2-design-generation-prompts.md`
- A changed-file Markdown link check for `docs/artifacts/v2-design-generation-prompts.md`

Do not treat repo-wide broken-link output as required cleanup for this prompt-pack artifact unless the changed file introduced the broken links.
