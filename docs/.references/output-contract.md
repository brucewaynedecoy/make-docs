# Output Contract

See `docs/assets/references/wave-model.md` for W/R/P semantics and resolution.

## Purpose

Use this contract to keep plan, PRD, and work document outputs consistent across repositories and harnesses. Treat the codebase as authoritative, write in plain English, and keep the PRD set descriptive while keeping implementation work prescriptive.

## Required Paths

| Artifact | Required path |
| --- | --- |
| Design | `docs/designs/YYYY-MM-DD-<slug>.md` |
| Plan directory | `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| Work directory | `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| PRD index | `docs/prd/00-index.md` |
| Product overview | `docs/prd/01-product-overview.md` |
| Architecture overview | `docs/prd/02-architecture-overview.md` |
| Risk register | `docs/prd/03-open-questions-and-risk-register.md` |
| Glossary | `docs/prd/04-glossary.md` |
| Archived PRD set | `docs/assets/archive/prds/YYYY-MM-DD/` or `docs/assets/archive/prds/YYYY-MM-DD-XX/` |
| History record | `docs/assets/history/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md` when W/R/P is known; fall back to `docs/assets/history/YYYY-MM-DD-w{W}-r{R}-<slug>.md` when only W/R is known or `docs/assets/history/YYYY-MM-DD-<slug>.md` when no coordinate is known. |

Plan directories contain `00-overview.md` plus one or more `0N-<phase>.md` files. Work directories contain `00-index.md` plus one or more `0N-<phase>.md` files. See `docs/assets/references/wave-model.md` for the full naming pattern and `## Work Phase Structure Rules` below for work content requirements.

For change-oriented plans and delta backlogs, carry the distinguishing context in the `<slug>` (for example `...-auth-recovery-change` or `...-notifications-delta`) rather than in the directory structure. Every plan and every work backlog uses the same W/R directory shape.

## PRD Lifecycle Rules

- `docs/prd/` contains one active PRD namespace at a time.
- Every root entry in `docs/prd/` is part of the active namespace.
- Active namespaces can be created in two ways:
  - `full-set generation` — generate or replace the active namespace as a set
  - `active-set evolution` — append change docs and update impacted baseline docs without replacing the namespace
- Older namespaces belong under `docs/assets/archive/prds/`, not alongside the active namespace.
- Archived PRD sets are historical records and are not part of active PRD validation.

## Archive Rules

Apply these rules only when writing a fresh active PRD namespace through `full-set generation`.

- Before writing a fresh PRD set, inspect `docs/prd/` for active root entries.
- If no such entries exist, proceed normally.
- If active root entries exist, summarize them and ask for explicit approval before moving them.
- On approval, move those entries into `docs/assets/archive/prds/YYYY-MM-DD/`.
- If that dated directory already exists, use `docs/assets/archive/prds/YYYY-MM-DD-XX/`, where `XX` is a zero-padded increment starting at `01`.
- Do not place loose files directly under `docs/assets/archive/prds/`; it should contain dated directories only.
- Never archive designs, plans, work, or PRDs unless the user explicitly asks.

Archive layout and hard rules are authoritative in `docs/assets/archive/AGENTS.md`.

## Active-Set Evolution Rules

Apply these rules when the user wants to add, enhance, revise, deprecate, or remove requirements inside the current active namespace.

- Do not archive the active namespace.
- Append new change docs using the next available `NN-` number.
- Never renumber or reorder existing active PRD docs.
- Preserve prior baseline text unless the user explicitly asks for a cleanup rewrite.
- Update impacted baseline docs with `### Change Notes` blocks as defined in `docs/assets/references/prd-change-management.md`.
- Update `docs/prd/00-index.md` so the effective lineage remains readable.

## PRD Tree Rules

### Fixed core

Always generate the fixed core first or reserve its numbers:

- `00-index.md`
- `01-product-overview.md`
- `02-architecture-overview.md`
- `03-open-questions-and-risk-register.md`
- `04-glossary.md`

### Adaptive middle

Use `05` through `99` for:

- baseline subsystem docs
- baseline reference docs
- additive change docs
- enhancement docs
- revision docs
- removal docs

Prefer a flat PRD tree by default:

```text
docs/prd/
├── 00-index.md
├── 01-product-overview.md
├── 02-architecture-overview.md
├── 03-open-questions-and-risk-register.md
├── 04-glossary.md
├── 05-payments.md
├── 06-notifications-reference.md
├── 07-enhance-notifications.md
└── 08-revise-billing-retries.md
```

Switch to a numbered subfolder only when one baseline subsystem is too large for one doc:

```text
docs/prd/
├── 00-index.md
├── 01-product-overview.md
├── 02-architecture-overview.md
├── 03-open-questions-and-risk-register.md
├── 04-glossary.md
├── 05-backend/
│   ├── 01-server-core.md
│   ├── 02-handlers.md
│   └── 03-stores.md
├── 06-frontend/
│   ├── 01-app-framework.md
│   └── 02-pages.md
├── 07-enhance-auth-recovery.md
└── 08-remove-legacy-session-flow.md
```

Do not place unnumbered Markdown files directly under `docs/prd/`.
Do not place active PRD docs under `docs/assets/archive/prds/`.

## Section Contracts

Use the matching template in `docs/assets/templates/` and preserve these required headings.

| Doc type | Required headings |
| --- | --- |
| `prd-index.md` | `## Purpose`, `## Reading Order`, `## Document Map`, `## Source Anchors`, `## Audience Paths` |
| `prd-overview.md` | `## Purpose`, `## Users`, `## Key Capabilities`, `## System Boundaries`, `## Current Limitations`, `## Source Anchors` |
| `prd-architecture.md` | `## Purpose`, `## Topology`, `## Module Map`, `## Runtime Boundaries`, `## Data Flow`, `## Configuration Surfaces`, `## Source Anchors` |
| `prd-risk-register.md` | `## Purpose`, `## Confirmed Drift`, `## Open Questions`, `## Rebuild Risks`, `## Source Anchors` |
| `prd-glossary.md` | `## Purpose`, `## Terms`, `## Source Anchors` |
| `prd-subsystem.md` | `## Purpose`, `## Scope`, `## Component and Capability Map`, `## Contracts and Data`, `## Integrations`, `## Rebuild Notes`, `## Source Anchors` |
| `prd-reference.md` | `## Purpose`, `## Reference`, `## Source Anchors` |
| `prd-change-addition.md` | `## Purpose`, `## Change Type`, `## Capability Addition or Enhancement`, `## Affected Baseline Docs`, `## Contracts and Data`, `## Integration Impact`, `## Required Baseline Annotations`, `## Source Anchors` |
| `prd-change-revision.md` | `## Purpose`, `## Change Type`, `## Baseline Being Revised or Removed`, `## Rationale`, `## Effective Requirement`, `## Impacted Docs and Dependencies`, `## Required Baseline Annotations`, `## Source Anchors` |
| `work-index.md` | `## Purpose`, `## Phase Map`, `## Usage Notes` |
| `work-phase.md` | `## Purpose`, `## Overview`, `## Source PRD Docs`, repeatable `## Stage {{STAGE_NUMBER}} - {{STAGE_NAME}}` headings with `### Tasks`, `### Acceptance criteria`, and `### Dependencies` |

## Work Phase Structure Rules

Every work backlog is a directory, not a single file.

- The work directory is `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/`.
- It contains an index file `00-index.md` with:
  - `## Purpose`
  - `## Phase Map`
  - `## Usage Notes`
- It contains one or more phase files named `0N-<phase>.md`. Each phase file contains:
  - `## Purpose`
  - `## Overview`
  - `## Source PRD Docs`
  - one or more `## Stage {{STAGE_NUMBER}} - {{STAGE_NAME}}` sections
- Each stage in a phase file contains:
  - `### Tasks`
  - `### Acceptance criteria`
  - `### Dependencies`

## Code Anchor Rules

### General rule

Every substantive PRD section should cite concrete repo paths in inline code. Prefer relative repo paths with optional line anchors.

Accepted examples:

- `package.json`
- `src/main.ts`
- `src/server/router.ts:42`
- `cmd/sensoroni.go:49`
- `server/modules/modules.go`

### Practical rule

Keep code anchors inside the section they support. Do not rely only on a final source list to justify claims made earlier in the document.

### Source anchors section

Use `## Source Anchors` to aggregate the most important files that shaped the document. This section supplements, but does not replace, section-level anchors.

## Existing Documentation Rule

- Supplement existing docs and cite them where useful.
- Do not silently rewrite or replace existing documentation that already serves a different audience.
- If docs and code disagree, treat the code as authoritative and record the disagreement in `03-open-questions-and-risk-register.md`.
- If an older active PRD namespace exists in `docs/prd/` and the task is full-set generation, archive it as a set before writing the new active namespace.
- If the task is active-set evolution, preserve baseline text and use non-destructive annotations unless the user explicitly asks for a cleanup rewrite.

## Work Backlog Rule

- Keep work out of `docs/prd/`.
- Every work backlog is a directory under `docs/work/` following the W/R naming pattern; link phase files back to the relevant PRD docs.
- Organize phases and stages by dependency order, not by implementation convenience.
- Include task-level acceptance criteria in every stage.
- For active-set evolution work, use a dated delta work directory with a distinguishing slug (for example `...-<subject>-delta`) instead of rewriting a prior backlog.
- Every phase file must include `## Source PRD Docs`.

## Link Rules

- Use relative Markdown links between generated docs.
- Make sure every internal link resolves.
- Use the PRD index and the work `00-index.md` as navigation entry points.
- Archived PRD docs do not need to satisfy the active PRD link contract.
