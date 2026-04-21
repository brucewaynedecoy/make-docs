# Docs Contract v2 — Execution Plan

> Filename: `2026-04-15-docs-contract-v2-execution.md`. See [`../.references/wave-model.md`](../.references/wave-model.md) for W/R semantics.

## Purpose

Settle the implementation approach for items 1–4 of the v2 contract proposals enumerated in the prior planning design: Wave/Revision/Phase (W/R/P) encoding across designs, plans, and work; plans-as-directories; work backlogs as directories; and a single consolidated `docs/.archive/` tree. This design records the phased execution plan, the canonical spec passed to each dispatched agent, and the parallelism strategy used to land the changes without breaking the dogfood repo.

The work described here has largely been carried out (see repo commit `f08ab11` — "Implement improved contracts to support Wave/Revision/Phase ordering of documentation"). This document is recorded retroactively for the historical record so the rationale and dispatch structure remain discoverable.

## Context

At the time of writing, the v2 proposals stood as follows:

| Proposed change | Status |
| --- | --- |
| 1. W/R/P encoding across designs/plans/work | Not done (agent guides piloted the encoding) |
| 2. Plans as directories | Not done |
| 3. Work backlogs as directories | Not done (both file and folder shapes were still supported) |
| 4. Consolidated `docs/.archive/` | Not done (each directory pointed at its own local `archive/`) |
| 5. Agent session guides | Done (shipped in v1.x Phase 1) |

This execution design addresses items 1–4. Item 5 is already in place and is touched only incidentally (a single reference link back to `wave-model.md`).

Five questions were resolved up front and frozen before dispatch:

| Question | Decision |
| --- | --- |
| How do agents discover the active wave and revision? | Filename scan of the target directory. Stateless. Default to `w1-r0` when nothing is present. |
| Do PRDs get a W/R/P prefix? | No. PRDs keep the fixed `NN-<slug>.md` shape. |
| Is `docs/.references/wave-model.md` the sole authority? | Yes. Every other contract, template, and router defers to it. |
| Per-archive `MANIFEST.md` files? | Deferred. |
| Automated v1 to v2 migration tooling? | Deferred. The dogfood `docs/` migrates manually. |

## Decision

Land the v2 contracts in seven phases. Phase 1 establishes the authority file; Phases 2–4 run in parallel across disjoint file sets; Phase 5 sweeps the CLI and tests; Phases 6–7 re-seed the dogfood `docs/` and validate. Each phase leaves the repository in a working state.

### Canonical spec passed to every agent prompt

Every dispatched sub-agent receives the same spec block so that W/R/P semantics, path shapes, archive rules, discovery, and progressive-disclosure posture are identical across all parallel writers:

```
W/R/P encoding:
  w{W} = wave (1+, end-to-end iteration)
  r{R} = revision within wave (0=initial)
  p{P} = phase within plan/work (used INSIDE plan/work dirs, not top-level names)

Paths (v2):
  Design:       docs/designs/YYYY-MM-DD-w{W}-r{R}-<slug>.md
  Plan dir:     docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/ with 00-overview.md + 0N-<phase>.md
  Work dir:     docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/ with 00-index.md + 0N-<phase>.md
  Agent guide:  docs/guides/agent/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md
  PRD:          UNCHANGED (NN-<slug>.md)

Archive:
  All archives go to docs/.archive/ (hidden, single top-level, mirrors docs/)
  Subdirs: designs/, plans/, work/, prds/
  PRD archives: docs/.archive/prds/YYYY-MM-DD/
  HARD RULE: never archive unless user explicitly asks

Discovery:
  Scan filenames in target dir to find highest W/R.
  If none, default w1-r0.

Progressive disclosure:
  Routers stay minimal. Authority in docs/.references/wave-model.md.
```

### Phase 1 — Establish authority (1 agent, sequential)

Create `packages/docs/template/docs/.references/wave-model.md`. This file is the single source of truth for W/R/P semantics, naming patterns, resolution rules, the PRD exemption, and forward-compatibility guarantees. Every contract, template, and router updated in later phases links back here rather than restating the rules.

### Phase 2 — References and contracts (5 agents, parallel)

Run as a single fan-out because each sub-task touches a distinct file:

- **Agent A — `design-contract.md`.** Change the required path to `docs/designs/YYYY-MM-DD-w{W}-r{R}-<slug>.md` and add an Archiving section that defers to `docs/.archive/`.
- **Agent B — `output-contract.md`.** Rewrite the Required Paths section so plans and work are directories with W/R encoding (PRDs unchanged), update Archive Rules to point at `docs/.archive/prds/`, and revise Work Phase Structure Rules to be directory-only (drop the single-file shape).
- **Agent C — `planning-workflow.md` + `prd-change-management.md`.** Update the File Writing Rule to target plan directories, and point change-plan paths at `docs/.archive/`.
- **Agent D — `execution-workflow.md` + `design-workflow.md`.** Update work path references and the design output filename format.
- **Agent E — `agent-guide-contract.md`.** Add a reference link to `wave-model.md`; the guide's existing W/R/P encoding remains untouched as the pilot.

### Phase 3 — Templates (3 agents, parallel)

- **Agent F — Plan templates.** Add a new `plan-overview.md` template shaped for `00-overview.md`. Audit existing `plan-prd.md`, `plan-prd-decompose.md`, and `plan-prd-change.md` for path examples that need to move to the directory form.
- **Agent G — Work templates.** Rename `work-backlog-index.md` to `work-index.md` and `work-backlog-phase.md` to `work-phase.md`. Remove or deprecate `work-backlog.md`. Update contents to match the directory-only shape.
- **Agent H — `design.md` template.** Update the example filename to the W/R/P form.

### Phase 4 — Routers (4 agents, parallel)

- **Agent I — `docs/designs/{AGENTS,CLAUDE}.md`.** Apply W/R naming guidance; defer archive rules to `docs/.archive/`.
- **Agent J — `docs/plans/{AGENTS,CLAUDE}.md`.** Adopt plans-as-directories with W/R naming; defer archive rules to `docs/.archive/`.
- **Agent K — `docs/work/{AGENTS,CLAUDE}.md`.** Adopt work-as-directories with W/R naming; drop `-backlog` from routing language.
- **Agent L — `docs/.archive/{AGENTS,CLAUDE}.md`.** Create these routers from scratch. Encode the never-archive-without-ask rule and the mirror-structure rule.

### Phase 5 — CLI renderers and tests (1 agent, sequential)

Sweep `packages/cli/src/renderers.ts` for hardcoded path strings and update them to the v2 shapes. Update `packages/cli/tests/*.ts` path-substring assertions to match. Run the test suite until green.

### Phase 6 — Re-seed dogfood `docs/` (main thread)

Copy the template tree at `packages/docs/template/docs/*` (including dotfiles) over the repo-root `docs/` so the dogfood tree matches the shipping template.

### Phase 7 — Final validation (main thread)

- `npm test -w make-docs`
- `bash scripts/check-instruction-routers.sh`
- `node scripts/smoke-pack.mjs`

### Dispatch rounds

Phases 2, 3, and 4 edit disjoint file sets and collapse into a single wide dispatch round:

| Round | Parallelism | Phases covered |
| --- | --- | --- |
| 1 | 1 | Phase 1 |
| 2 | 12 | Phases 2 + 3 + 4 |
| 3 | 1 | Phase 5 |
| 4 | main | Phases 6 + 7 |

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [2026-04-15-w2-r0-docs-contract-v2-planning.md](2026-04-15-w2-r0-docs-contract-v2-planning.md)
- Reason: This design captures the execution plan for items 1–4 of the proposals enumerated in the planning design.

## Alternatives Considered

- **Manifest-driven wave discovery vs. filename scan.** A central manifest would make the active wave/revision explicit, but it introduces a second source of truth that agents must keep in sync with the filesystem. Filename scan keeps discovery stateless and auditable; chosen.
- **Prefixing PRDs with W/R vs. exempting them.** Applying W/R/P uniformly would simplify the mental model, but the PRD namespace evolves through active-set evolution and change docs rather than wave-scoped iteration. PRDs are exempted and keep `NN-<slug>.md`.
- **Per-artifact archive sections vs. a single `.archive/` authority.** Leaving archive rules inside each artifact type's router forces duplication and drift. A single hidden `docs/.archive/` tree mirroring `docs/` with its own routers concentrates the rules in one place; chosen.
- **Per-archive `MANIFEST.md` files vs. deferral.** Manifests inside each archived set would ease later discovery, but they add overhead to every archive operation before we know the real retrieval patterns. Deferred.
- **Automated v1 to v2 migration vs. manual migration.** A codemod would scale to consumer repos, but the only repo that needs migrating today is the dogfood `docs/`. Manual migration is cheaper and lower-risk; a tool can follow once the v2 shape is proven.

## Consequences

- **Phase 5 is the sharpest risk.** If `renderers.ts` has hardcoded path couplings beyond what a substring sweep catches, the tests will surface it — the agent is instructed to stop and flag rather than force-fix.
- **Template renames in Phase 3 Agent G** (dropping `-backlog`) could surprise `catalog.ts` if it hardcodes filenames. CLI code walks the filesystem so coupling is unlikely; Phase 5 confirms.
- **Rollout posture:** each phase is individually shippable. Phase 1 adds a new file without touching consumers. Phases 2–4 update docs in place against a stable authority. Phase 5 keeps the CLI aligned with the new shapes. Phases 6–7 close the loop by re-seeding and validating the dogfood tree.
- PRDs are unaffected by the W/R migration, preserving the active-set workflow.
- The `.archive/` consolidation gives a single place to evolve archive policy (retention, indexing, eventual manifests) without re-touching every artifact router.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: Per recent commits the execution plan has already been carried out; any remaining cleanup or follow-on work should flow through baseline planning rather than a change plan.
