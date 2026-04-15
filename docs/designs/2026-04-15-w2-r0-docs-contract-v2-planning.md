# Docs Contract v2 — Planning Proposals

> Filename: `2026-04-15-w2-r0-docs-contract-v2-planning.md`. See [`docs/.references/wave-model.md`](../.references/wave-model.md) for W/R semantics.

## Purpose

Capture, as a settled design, the five proposals that reshape the `starter-docs` v2 `docs/` contract: Wave/Revision/Phase (W/R/P) encoding across artifact families, plans-as-directories, work-as-directories (dropping the `-backlog` suffix), a consolidated hidden `docs/.archive/` mirror with a strict "never archive unless explicitly asked" rule, and agent session guides under `docs/guides/agent/` that pilot the W/R/P scheme.

This document records the design intent that subsequent planning and execution can proceed from. It is recorded retroactively: several of the proposals are already landed in recent commits (W/R/P encoding, agent guides, plans and work as directories); this design captures the decision surface rather than claiming the work is unstarted.

## Context

`starter-docs` v1 established a working `docs/` contract with a clear principle set worth carrying forward:

- Routers stay minimal. Authority lives in `docs/.references/`.
- Progressive disclosure: each directory's `AGENTS.md` or `CLAUDE.md` names only the next files to read and does not restate rules that live in references.
- Templates are structural starters, not authority. Prompts are optional kickoffs, not authority.
- Agents never archive unless the user explicitly asks.

Against those principles, v1 accumulated a few structural pain points that v2 needs to resolve:

- **Single-file vs folder ambiguity.** Plans and work backlogs sometimes appeared as a lone `.md` file and sometimes as a directory, making discovery and cross-linking inconsistent.
- **Scattered archives.** Per-directory `archive/` folders fragmented archival history. PRD archives lived under `docs/prd/archive/YYYY-MM-DD/`, while design and plan archives were kept beside their live artifacts, with no shared policy surface.
- **No iteration encoding.** Dates alone could not distinguish a first pass from a redesign, and phase ordering inside a plan or work backlog relied on informal numbering.
- **Agent session continuity.** v1 had no formal place for agent-to-agent session handoffs or summaries, which led to ad-hoc breadcrumbs in inconsistent locations.

v2 answers each of these while preserving the router/authority split that has served v1 well.

## Decision

v2 adopts the following five changes as a coherent set. They are designed to land together; partial adoption would reintroduce the ambiguities v2 is solving.

### 1. Wave / Revision / Phase encoding (`w{W}-r{R}-p{P}`)

Apply a shared W/R/P token across `docs/designs/`, `docs/plans/`, `docs/work/`, and `docs/guides/agent/`:

- `w{W}` — **Wave.** One end-to-end iteration (design to plan to work). Wave 1 is the initial wave; a new wave opens whenever the user starts a new end-to-end initiative.
- `r{R}` — **Revision.** Revision within a wave. `r0` is the initial revision; `r1+` are meaningful redos of that wave's artifacts (for example a redesign or re-plan after feedback).
- `p{P}` — **Phase.** Phase within a plan or work backlog. `p{P}` appears in inner phase filenames and in agent guide filenames only; it does not appear in the top-level names of designs, plans, or work directories.

Examples:

- Design: `docs/designs/2026-04-15-w1-r0-initial-implementation.md`
- Plan directory: `docs/plans/2026-04-15-w1-r0-initial-implementation/` containing `00-overview.md`, `01-clean-room.md`, `02-integration.md`
- Work directory: `docs/work/2026-04-15-w1-r0-initial-implementation/` containing `00-index.md`, `01-foundation.md`
- Agent guide: `docs/guides/agent/2026-04-15-w1-r0-p1-summary.md`

W and R resolution is centralized: when a new artifact is written, the agent honors explicit user guidance first, otherwise scans the target directory for existing `w{W}-r{R}` entries, keeps `W` and increments `R` for a revision, or increments `W` and resets `R` to `0` for a new initiative, defaulting to `w1-r0` when no prior entries exist.

### 2. Plans always live in directories

Every plan is a directory, even when it is small enough to fit in a single phase file:

```
docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/
  00-overview.md           # always present; plan entry point
  01-<phase>.md            # single-phase plans still have an 01 file
  02-<phase>.md            # additional phases as needed
```

Directory names carry the date plus W/R plus slug with no trailing `-plan` suffix. `00-overview.md` is the canonical entry point for the plan and the target of inbound links from its design. This kills the single-file vs folder ambiguity that existed in v1.

### 3. Work backlogs always live in directories

Work uses the same directory-first shape, and the `-backlog` suffix is dropped from both directory and file slugs because the parent `docs/work/` already communicates intent:

```
docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/
  00-index.md              # replaces the prior single-file work-backlog.md
  01-<phase>.md
  02-<phase>.md
```

`00-index.md` is the work entry point that cross-links to phase files and back to the originating plan.

### 4. Consolidated `docs/.archive/` mirroring `docs/`

Per-directory `archive/` folders are replaced by a single hidden top-level archive whose internal layout mirrors `docs/`:

```
docs/.archive/
  AGENTS.md                # authority: never archive unless explicitly asked
  CLAUDE.md                # router mirror
  designs/
  plans/
  work/
  prds/
    YYYY-MM-DD/            # each archived PRD set lives in its own dated subdir
```

The PRD archive location moves from `docs/prd/archive/YYYY-MM-DD/` to `docs/.archive/prds/YYYY-MM-DD/`. The hard rule, restated in `docs/.archive/AGENTS.md` so agents encounter it when they land there, is that nothing moves into `.archive/` unless the user explicitly asks; archiving can break relative links and obscure lineage. Reference files that previously hinted at archival gain a short "Archiving" section that defers to `docs/.archive/AGENTS.md` rather than restating policy.

### 5. Agent session guides under `docs/guides/agent/`

Agent session summaries follow the W/R/P scheme from the start:

- Path: `docs/guides/agent/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md`
- Contract: `docs/.references/agent-guide-contract.md`
- Template: `docs/.templates/agent-guide.md`

Agent guides were the first consumer of W/R/P, piloting the scheme ahead of the broader v2 rollout. No separate v2 changes apply to them unless the W/R/P resolution rules themselves shift.

## Alternatives Considered

Each alternative below was surfaced in the original scratchpad as an open question and was resolved in favor of the decisions above.

- **Embed W/R/P rules in each artifact's contract, rather than a central `wave-model.md`.** Rejected. Embedding would force every contract to restate resolution rules and would drift as artifact families changed. A single `docs/.references/wave-model.md` linked from designs, plans, work, and the agent-guide contract keeps the rules in one place and is consistent with v1's authority-in-references principle.
- **Per-directory `archive/` folders kept as-is.** Rejected. Per-directory archives fragment history, duplicate policy, and make the "never archive proactively" rule harder to enforce because it would have to be restated in every live directory. A consolidated `docs/.archive/` mirror centralizes both the policy surface and the history.
- **PRDs participating in W/R/P.** Rejected. PRDs are intentionally exempt. The PRD namespace evolves in place through active-set evolution and change docs rather than through waves, so PRD docs keep the fixed `NN-<slug>.md` convention, change management continues under `docs/.references/prd-change-management.md`, and archived PRD sets are grouped by date (not by wave) under `docs/.archive/prds/YYYY-MM-DD/`.
- **Manifest-driven discovery of the active wave and revision.** Rejected for v2's baseline. A manifest file (for example `docs/.archive/designs/MANIFEST.md` or a top-level active-wave pointer) was considered for both archive tracking and W/R resolution. The chosen approach is filename scan against the target directory, per the resolution rules in `wave-model.md`; a manifest can be revisited if scanning proves insufficient.
- **Leave plans and work backlogs as single files when small.** Rejected. Keeping the single-file shape preserved v1's ambiguity and made it impossible to add a second phase without a rename-and-relink migration. Directory-always is slightly heavier for one-phase plans but eliminates a whole class of structural edits later.

## Consequences

**Files that shift.** Routers, contracts, and templates for designs, plans, work, and the archive are the primary edit surface:

- `docs/.references/wave-model.md` becomes the single source of truth for W/R/P. Design, plan, work, and agent-guide contracts link to it rather than restating resolution rules.
- `docs/.references/design-contract.md`, the planning and execution workflow references, and the output contract update their path patterns to the new W/R/P-encoded paths and their "Archiving" guidance to defer to `docs/.archive/AGENTS.md`.
- Templates under `docs/.templates/` adopt the new filename blockquote referencing `wave-model.md`.
- `docs/.archive/` is established with its own `AGENTS.md`/`CLAUDE.md` and mirror subdirectories for `designs/`, `plans/`, `work/`, and `prds/`.

**Archive structure.** The consolidated archive simplifies future lifecycle work (retention, audits, migrations) at the cost of relative links that pointed into old per-directory `archive/` folders. Any such links need updating when artifacts are moved, and the "never archive proactively" rule exists in part to keep this cost bounded.

**Migration burden.** Existing v1 artifacts under `docs/plans/` and `docs/work/` that follow the single-file or `-backlog` conventions need to be reshaped into directories when they are next revised. The explicit policy is that migration happens opportunistically during normal revision (a new `r{R}` bump), not as a mass rewrite, so link breakage stays localized.

**Already-landed changes.** Several v2 elements are already in place per recent commits on `main`: W/R/P encoding, plans-as-directories, work-as-directories, and the agent session guides. This design records the decision surface behind those changes; readers should treat the repository state as the ground truth for exact file layout and treat this document as the rationale.

**Explicitly deferred.** The following items from the scratchpad are not decided here and are left for later designs:

- Migration strategy for existing downstream projects built on v1 `starter-docs`.
- Whether to version the `starter-docs` package itself (semver bump to 2.0.0) and how the NPX installer communicates v1 to v2 breaking changes.
- Whether `docs/guides/user/` and `docs/guides/developer/` need any v2-specific structural changes or stay as-is.
- Whether `.prompts/` gains per-artifact sub-directories as the prompt library grows.
- Whether the repo-root `.backup/` directory is legacy and should be absorbed into `.archive/`.
- Whether archived artifacts gain a manifest file (for example `docs/.archive/designs/MANIFEST.md`) recording when and why each was archived.
- Whether a skill or npm script automates v1 to v2 artifact renaming, or migration stays manual.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: This design sets the v2 contract surface; its execution plan is captured separately in `2026-04-15-w2-r0-docs-contract-v2-execution.md`, and baseline planning is the correct downstream route for turning these proposals into sequenced phases.
