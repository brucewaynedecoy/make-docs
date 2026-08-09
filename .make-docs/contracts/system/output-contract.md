# Output Contract

See `.make-docs/references/system/wave-model.md` for W/R/P semantics and resolution.

## Purpose

Use this contract to keep plan, PRD, and work document outputs consistent across repositories and harnesses. Treat the codebase as authoritative, write in plain English, and keep the PRD set descriptive while keeping implementation work prescriptive.

The governing PRD invariant is:

> `docs/prd/` describes the current authoritative shape of the product. It must never describe the editorial operation used to change that authority.

## Markdown Source Formatting

- Do not hard-wrap prose paragraphs for visual width; use editor soft-wrap instead. Paragraphs should be one logical source line unless semantic Markdown structure requires otherwise.
- Insert line breaks only for semantic Markdown structure: paragraph boundaries, headings, list items, tables, blockquotes, code fences, frontmatter, comments, or intentional line-based formats.
- Separate every Markdown block from the next block with one blank line, including headings, paragraphs, lists, fenced code blocks, blockquotes, comments, and tables.
- Prefer one logical line per list item unless nested structure is semantically required. When list continuation or nesting is required, indentation is semantic and must be preserved exactly.

## Required Paths

| Artifact | Required path |
| --- | --- |
| Design | `docs/designs/YYYY-MM-DD-<slug>.md` |
| Plan directory | `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| Work directory | `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/` |
| PRD index | `docs/prd/00-index.md` |
| Product overview | `docs/prd/01-product-overview.md` |
| Architecture overview | `docs/prd/02-architecture-overview.md` |
| Risk and gap register | `docs/prd/03-open-questions-and-risk-register.md` |
| Glossary | `docs/prd/04-glossary.md` |
| Archived PRD set | `docs/assets/archive/prds/YYYY-MM-DD/` or `docs/assets/archive/prds/YYYY-MM-DD-XX/` |
| Breadcrumb record | `docs/assets/archive/history/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md` when W/R/P is known; fall back to `docs/assets/archive/history/YYYY-MM-DD-w{W}-r{R}-<slug>.md` when only W/R is known or `docs/assets/archive/history/YYYY-MM-DD-<slug>.md` when no coordinate is known. |

Plan directories contain `00-overview.md` plus one or more `0N-<phase>.md` files. Work directories contain `00-index.md` plus one or more `0N-<phase>.md` files. See `.make-docs/references/system/wave-model.md` for the full naming pattern and `## Work Phase Structure Rules` below for work content requirements.

For change-oriented plans and delta backlogs, carry the distinguishing context in the `<slug>` (for example `...-auth-recovery-change` or `...-notifications-delta`) rather than in the directory structure. Every plan and every work backlog uses the same W/R directory shape.

## PRD Lifecycle Rules

- `docs/prd/` contains one active PRD namespace at a time.
- Every root entry in `docs/prd/` is part of the active namespace.
- Active namespaces can be established or maintained in two ways:
  - `full-set generation` — generate or replace the active namespace as a set
  - `authoritative PRD maintenance` — surgically update existing product authorities and create a new PRD only for a coherent capability, subsystem, or product boundary with no current owner
- Editorial operations, migration sequencing, and reconciliation activity belong in plans, work backlogs, and history records, not in the active PRD namespace.
- `docs/prd/03-open-questions-and-risk-register.md` is the living register for discovered gaps, confirmed drift, open questions, decisions, and rebuild risks in the active namespace.
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

## Authoritative PRD Maintenance Rules

Apply these rules when a decision, design, implementation, or finding may change the current product authority.

- Do not archive the active namespace merely because current authority needs maintenance.
- Update the existing PRD when its subject owns the changed requirement.
- Put the current normative requirement inline in the owning PRD.
- Create a new numbered PRD only for a coherent, wholesale new capability, subsystem, or product boundary with no suitable existing owner.
- Create no PRD when the current authority already covers the decision; record the rationale in the governing plan, coverage pass, or history record.
- Preserve material prior iterations in the owning PRD's optional, non-normative `## Requirement History` section as defined in `.make-docs/references/system/prd-change-management.md`.
- Express removals and deprecations as current scope, non-goal, limitation, status, or boundary text in the owning PRD, then preserve the prior contract in requirement history when useful.
- Never use active PRD filenames, H1 titles, index kinds, or document identities that describe editorial operations such as additions, enhancements, revisions, removals, migrations, or reconciliation.
- Never renumber or reorder existing active PRDs merely because authority changed.
- Update `docs/prd/03-open-questions-and-risk-register.md` directly for newly discovered or resolved gaps, drift, questions, decisions, and risks.
- Update `docs/prd/00-index.md` so current ownership, status, focus, and navigation remain readable.

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

- product capability docs
- subsystem docs
- reference docs

Prefer a flat PRD tree by default:

```text
docs/prd/
├── 00-index.md
├── 01-product-overview.md
├── 02-architecture-overview.md
├── 03-open-questions-and-risk-register.md
├── 04-glossary.md
├── 05-payments.md
├── 06-notifications.md
├── 07-notifications-reference.md
└── 08-billing-reliability.md
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
├── 07-account-recovery.md
└── 08-session-lifecycle.md
```

Do not place unnumbered Markdown files directly under `docs/prd/`. Do not place active PRD docs under `docs/assets/archive/prds/`.

## Section Contracts

Use the matching template in `.make-docs/templates/system/` and preserve these required headings.

| Doc type | Required headings |
| --- | --- |
| `prd-index.md` | `## Purpose`, `## Reading Order`, `## Document Map`, `## Source Anchors`, `## Audience Paths`, `## Intended Follow-On` |
| `prd-overview.md` | `## Purpose`, `## Users`, `## Key Capabilities`, `## System Boundaries`, `## Current Limitations`, `## Source Anchors` |
| `prd-architecture.md` | `## Purpose`, `## Topology`, `## Module Map`, `## Runtime Boundaries`, `## Data Flow`, `## Configuration Surfaces`, `## Source Anchors` |
| `prd-risk-register.md` | `## Purpose`, `## Confirmed Drift`, `## Open Questions`, `## Rebuild Risks`, `## Source Anchors` |
| `prd-glossary.md` | `## Purpose`, `## Terms`, `## Source Anchors` |
| `prd-subsystem.md` | `## Purpose`, `## Scope`, `## Component and Capability Map`, `## Contracts and Data`, `## Integrations`, `## Rebuild Notes`, `## Source Anchors` |
| `prd-reference.md` | `## Purpose`, `## Reference`, `## Source Anchors` |
| `work-index.md` | `## Purpose`, `## Phase Map`, `## Usage Notes`, `## Intended Follow-On` |
| `work-phase.md` | `## Purpose`, `## Overview`, `## Source PRD Docs`, repeatable `## Stage {{STAGE_NUMBER}} - {{STAGE_NAME}}` headings with `### Tasks`, `### Acceptance criteria`, and `### Dependencies` |

Product overview, architecture, subsystem, reference, glossary, and other requirement-owning PRDs may include an optional `## Requirement History` section immediately before `## Source Anchors`. Current normative requirements remain in the main body and always win. History is non-normative and uses the dated entry contract in `.make-docs/references/system/prd-change-management.md`. The PRD index and living risk register use their own navigation and item-history contracts instead.

Risk-register items under `## Confirmed Drift`, `## Open Questions`, and `## Rebuild Risks` use numbered `###` item headings with a `Status` / `Decision` / `Follow-Up` table. Use `D-001`, `D-002`, etc. for confirmed drift; `Q-001`, `Q-002`, etc. for open questions; and `R-001`, `R-002`, etc. for rebuild risks. Assign the next available number within the section and never renumber existing items, even when they move to `Closed`. Valid item statuses are `Open`, `Confirming`, `Deferred`, and `Closed`. Each item should include `Question` or `Issue`, `Why it matters`, `Recommendation`, and `To close`; include `Resolution` only for closed items.

## Intended Follow-On Handoffs

The `## Intended Follow-On` section is advisory-default-but-overridable: it is
authoritative unless the user explicitly overrides it, and it is not a gate or
precondition.
No document fails validation solely because its follow-on is deferred,
overridden, or unresolved.

Each handoff includes:

- `Route:` the downstream workflow route
- `Next step:` the recommended next action
- `Why:` the reason that next step normally follows
- `Coordinate Handoff:` the W/R/P lineage or coordinate question the downstream
  workflow should carry

For PRD indexes, use route `work-backlog-generation` and recommend creating or
updating the work backlog from the PRD set.
For work indexes, use route `implementation-loop` and recommend starting with
the first applicable phase in the backlog.

## Work Phase Structure Rules

Every work backlog is a directory, not a single file.

- The work directory is `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/`.
- It contains an index file `00-index.md` with:
  - `## Purpose`
  - `## Phase Map`
  - `## Usage Notes`
  - `## Intended Follow-On`
- It contains one or more phase files named `0N-<phase>.md`. Each phase file contains:
  - `## Purpose`
  - `## Overview`
  - `## Source PRD Docs`
  - one or more `## Stage {{STAGE_NUMBER}} - {{STAGE_NAME}}` sections
- Each stage in a phase file contains:
  - `### Tasks`
  - `### Acceptance criteria`
  - `### Dependencies`
- `### Tasks` items are markdown task list items with phase-local task IDs: `- [ ] t1: {{TASK}}` for open tasks and `- [x] t1: {{TASK}}` for completed tasks.
- Task IDs start at `t1` in each phase file and increment across all stages in that file. Do not reset numbering in later stages and do not renumber existing task IDs when inserting or completing work.
- `### Acceptance criteria` items are always plain unordered bullets (`- {{ACCEPTANCE}}`). Do not use checkbox syntax or `t{T}` labels in acceptance criteria.

## Code Anchor Rules

### General rule

Every substantive PRD section should cite concrete repo paths in inline code. Prefer relative repo paths with optional line anchors. Apply `.make-docs/references/system/path-and-link-hygiene.md` for repo-relative path rules, relative Markdown links, sanitized placeholders, and full-path exceptions.

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
- Do not create separate questions, decisions, risks, gaps, or architecture-decision files when the active PRD risk register exists unless the user explicitly asks for a new convention.
- If an older active PRD namespace exists in `docs/prd/` and the task is full-set generation, archive it as a set before writing the new active namespace.
- If the task is authoritative PRD maintenance, update the owning current requirement surgically, preserve material prior state in non-normative requirement history, and keep editorial operations outside `docs/prd/`.

## Work Backlog Rule

- Keep work out of `docs/prd/`.
- Every work backlog is a directory under `docs/work/` following the W/R naming pattern; link phase files back to the relevant PRD docs.
- Organize phases and stages by dependency order, not by implementation convenience.
- Include markdown task-list items and plain-bullet acceptance criteria in every stage.
- Use phase-local task IDs (`t1`, `t2`, etc.) on task items so a task can be referenced externally as `w{W} r{R} p{P} t{T}`.
- For PRD authority-maintenance work, use a dated delta work directory with a distinguishing slug (for example `...-<subject>-delta`) instead of rewriting a prior backlog.
- Treat updated and genuinely new product PRDs as downstream requirement authority. Plans describe sequencing and requirement-history entries preserve provenance; neither overrides the current normative PRD body.
- Every phase file must include `## Source PRD Docs`.
- Every work `00-index.md` includes `## Intended Follow-On` recommending the implementation loop as the next step. The handoff is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

## Link Rules

- Use relative Markdown links between generated docs.
- Apply `.make-docs/references/system/path-and-link-hygiene.md` when deciding whether an absolute path or sanitized placeholder is warranted.
- Make sure every internal link resolves.
- Use the PRD index and the work `00-index.md` as navigation entry points.
- Archived PRD docs do not need to satisfy the active PRD link contract.

## PRD Authority Validation

Run `make-docs run prd authority validate --target-root <project>` before treating an active PRD set as downstream authority. The read-only validator enforces `PRD-AUTH-001` through `PRD-AUTH-008` as defined in `.make-docs/references/system/prd-change-management.md`: filename/H1 editorial stems use the narrow twelve-term set that allows legitimate Update Delivery, Replacement Policy, and Migration Safety subjects; controlled kinds additionally prohibit update/replace/replacement/migrate/migration; and the remaining diagnostics cover retired headings, authority targets, top-level coordinates, invalid target roots, and unsafe or escaping documentation roots. It scans authority-bearing Markdown sections and structured JSON/JSONL/YAML/YML fields, exempts standardized provenance sections/containers, and grants a path-wide provenance exemption only to `docs/assets/archive/**`. Human TTY output summarizes diagnostics and remediation; `--json` and non-TTY output return the complete report. An explicit `failed` report exits nonzero after rendering.
