# starter-docs v2 — Planning Scratchpad

> Temporary working doc. Captures ideas for the next major iteration of `starter-docs`. Will be refined into designs/plans once we're aligned. Delete or archive after v2 ships.

## Scope Summary

v2 re-shapes the `docs/` contract to support iteration-aware artifacts (waves, revisions, phases), consolidate archiving, and formalize the "agent router with progressive disclosure" pattern that v1 established ad-hoc.

## Guiding Principles (carry forward from v1)

- Routers stay minimal. Authority lives in `docs/.references/`.
- Progressive disclosure: each directory's `AGENTS.md`/`CLAUDE.md` names only the next files to read, never restating rules already in references.
- Templates are structural starters, not authority. Prompts are optional kickoffs, not authority.
- Agents never archive unless the user explicitly asks.

## Major Changes Proposed

### 1. Wave / Revision / Phase Encoding (`w{W}-r{R}-p{P}`)

Apply across `docs/designs/`, `docs/plans/`, `docs/work/`, and `docs/guides/agent/`.

- `w{W}` — **Wave**. An end-to-end iteration (design → plan → work cycle). Wave 1 is the initial wave.
- `r{R}` — **Revision**. Revision within a wave. `r0` = initial; `r1+` = subsequent revisions of the same wave's artifacts.
- `p{P}` — **Phase**. Phase within a plan or work backlog. Used for per-file naming inside plan/work directories and for agent session summaries.

**Examples**
- Design: `docs/designs/2026-04-15-w1-r0-initial-implementation.md`
- Plan directory: `docs/plans/2026-04-15-w1-r0-initial-implementation/`
  - `00-overview.md`
  - `01-clean-room.md`
  - `02-integration.md`
- Work directory: `docs/work/2026-04-15-w1-r0-initial-implementation/`
  - `00-index.md`
  - `01-foundation.md`
- Agent guide: `docs/guides/agent/2026-04-15-w1-r0-p1-summary.md`

**Open questions**
- How do agents discover the active wave/revision? (Scan existing filenames? Read a manifest?)
- Should PRD docs also carry `w-r-p` prefixes, or stay on the fixed `NN-` numbering since PRD is a living namespace?
- Do we need a top-level `docs/.references/wave-model.md` that defines these terms authoritatively?

### 2. Plans Always Live in Directories

Even a single-file plan becomes a directory:

```
docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/
├── 00-overview.md          # always present
├── 01-<phase>.md           # for small plans, may be only phase
└── 02-<phase>.md           # additional phases as needed
```

- Directory name carries date + w/r + slug (no `-plan` suffix).
- `00-overview.md` is the plan's entry point.
- Kills the current single-file-vs-folder ambiguity.

### 3. Work Backlogs Always Live in Directories

Same pattern, minus the `-backlog` suffix on directory names.

```
docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/
├── 00-index.md
├── 01-<phase>.md
└── 02-<phase>.md
```

- Drop `-backlog` from directory/file slugs — redundant given the parent `docs/work/`.
- `00-index.md` replaces the prior single-file `work-backlog.md` as the entry point.

### 4. Consolidated Archive at `docs/.archive/`

Replace per-directory `archive/` folders with a single hidden top-level archive that mirrors `docs/`.

```
docs/.archive/
├── AGENTS.md                # authority: never archive unless explicitly asked
├── CLAUDE.md                # mirror
├── designs/
├── plans/
├── work/
└── prds/
    └── YYYY-MM-DD/          # each archived PRD set in its own dated subdir
```

- Structure under `docs/.archive/` mirrors `docs/` exactly.
- PRD archives move from `docs/prd/archive/YYYY-MM-DD/` → `docs/.archive/prds/YYYY-MM-DD/`.
- **Hard rule** (repeated in archive AGENTS.md): agents must never move anything into `.archive/` unless the user explicitly asks. Archiving can break relative links and obscure lineage.
- Reference files should gain an "Archiving" section that defers to `docs/.archive/AGENTS.md`.

### 5. Agent Session Guides (being built now as v1.x)

- Path: `docs/guides/agent/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md`
- Pilots the wave/revision/phase encoding ahead of the broader v2 rollout.
- Contract in `docs/.references/agent-guide-contract.md`.
- Shipping in the current iteration; no v2 changes needed unless the W/R/P rules shift.

## Other Observations to Discuss

- Do we want a `docs/.references/wave-model.md` that all W/R/P consumers link to, or embed the rule in each artifact's contract?
- Should archived artifacts have a manifest file (`docs/.archive/designs/MANIFEST.md`) that records when each was archived and why?
- Do we want automation (a skill or npm script) to rename/migrate v1 artifacts to v2 naming, or make it manual?
- The `.backup/` directory at repo root — is that legacy? Should it also be absorbed into `.archive/`?
- Prompt files: should `.prompts/` gain per-artifact sub-dirs so that as the prompt library grows it stays navigable?

## Deferred / Open

- Migration strategy for existing projects built on v1 `starter-docs`.
- Whether to version the `starter-docs` package itself (semver bump to 2.0.0) and how the NPX installer communicates v1→v2 breaking changes.
- Whether `docs/guides/user` and `docs/guides/developer` need any v2 changes, or stay as-is.

## Decision Log

_(Append dated decisions here as they're made. Each entry: date, decision, rationale.)_
