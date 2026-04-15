# starter-docs v2 — Contracts Implementation Plan

> Temporary working doc. Captures the execution plan for implementing the four major contract changes proposed in `starter-docs-v2-planning.md` (W/R/P encoding, plans-as-directories, work-as-directories, consolidated `.archive/`). Plan will be worked from memory, not from this file; this file exists for record-keeping so it can later be rewritten as a formal design doc.

## Status Against the Planning Doc

| Proposed change | Status |
|---|---|
| 1. W/R/P encoding across designs/plans/work | Not done (agent-guides pilot it) |
| 2. Plans as directories | Not done |
| 3. Work backlogs as directories | Not done (both file + folder currently supported) |
| 4. Consolidated `docs/.archive/` | Not done (each dir references its own `archive/`) |
| 5. Agent session guides | Done (v1.x Phase 1) |

This plan implements items 1–4.

## Frozen Decisions

| Question | Decision |
|---|---|
| How do agents discover active wave/revision? | Filename scan of target dir. Stateless. If none, default `w1-r0`. |
| PRDs get W/R/P prefix? | No. PRDs keep fixed `NN-<slug>.md`. |
| `docs/.references/wave-model.md` as sole authority? | Yes. Every contract defers here. |
| Archive `MANIFEST.md` per sub-dir? | Defer. |
| Automation to migrate v1→v2 naming? | Defer. Manual for the dogfood `docs/`. |

## Canonical Spec (passed to every agent prompt)

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

## Execution Phases

### Phase 1 — Establish authority (1 agent, sequential)

Create `packages/docs/template/docs/.references/wave-model.md`. Defines W/R/P semantics, examples, resolution rules, forward-compat note. All downstream references link here.

### Phase 2 — References + contracts (5 agents, parallel)

- **Agent A** — `design-contract.md`: required path → `docs/designs/YYYY-MM-DD-w{W}-r{R}-<slug>.md`; add Archiving section deferring to `.archive/`.
- **Agent B** — `output-contract.md`: rewrite Required Paths (plans/work as directories, W/R encoding, PRDs unchanged), Archive Rules (`.archive/prds/`), Work Phase Structure Rules (directory-only, drop single-file).
- **Agent C** — `planning-workflow.md` + `prd-change-management.md`: File Writing Rule uses plan directories; change-plan paths reference `.archive/`.
- **Agent D** — `execution-workflow.md` + `design-workflow.md`: update work path refs and design output format.
- **Agent E** — `agent-guide-contract.md`: add reference link to `wave-model.md`.

### Phase 3 — Templates (3 agents, parallel)

- **Agent F** — Plans templates: add new `plan-overview.md` (shape for `00-overview.md`); audit existing `plan-prd.md`, `plan-prd-decompose.md`, `plan-prd-change.md` for path examples needing updates.
- **Agent G** — Work templates: rename `work-backlog-index.md` → `work-index.md`, `work-backlog-phase.md` → `work-phase.md`, remove/deprecate `work-backlog.md`. Update contents.
- **Agent H** — `design.md` template: update example filename to W/R/P form.

### Phase 4 — Routers (4 agents, parallel)

- **Agent I** — `docs/designs/{AGENTS,CLAUDE}.md`: W/R naming; archive defers to `.archive/`.
- **Agent J** — `docs/plans/{AGENTS,CLAUDE}.md`: plans-as-directories + W/R naming; archive defers to `.archive/`.
- **Agent K** — `docs/work/{AGENTS,CLAUDE}.md`: work-as-directories + W/R naming, drop `-backlog`.
- **Agent L** — Create `docs/.archive/{AGENTS,CLAUDE}.md`: never-archive-without-ask rule; mirror-structure rule.

### Phase 5 — CLI renderers + tests (1 agent, sequential)

- Sweep `packages/cli/src/renderers.ts` for hardcoded path strings; update to v2 forms.
- Update `packages/cli/tests/*.ts` path-substring assertions.
- Run tests until green.

### Phase 6 — Re-seed dogfood (main thread)

Copy `packages/docs/template/docs/*` (including dotfiles) over repo-root `docs/`.

### Phase 7 — Final validation (main thread)

- `npm test -w starter-docs`
- `bash scripts/check-instruction-routers.sh`
- `node scripts/smoke-pack.mjs`

## Dispatch Rounds

| Round | Parallelism | Phases covered |
|---|---|---|
| 1 | 1 | Phase 1 |
| 2 | 12 | Phases 2 + 3 + 4 (non-overlapping file sets) |
| 3 | 1 | Phase 5 |
| 4 | main | Phases 6 + 7 |

Round 2 collapses Phases 2, 3, 4 because they edit disjoint file sets; no cross-file dependencies within round.

## Risks

- Phase 5 is slowest (CLI + tests). If renderer coupling surfaces unexpected cases, stop and inspect manually.
- Template renames in Phase 3 Agent G could surprise `catalog.ts` if it hardcodes filenames. CLI code uses filesystem walks, so likely safe; Phase 5 agent flags if not.

## Decision Log

_(Append dated decisions here as they're made.)_
