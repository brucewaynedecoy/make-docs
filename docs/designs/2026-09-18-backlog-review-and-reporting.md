---
title: "Backlog Review and Reporting"
kind: "design"
status: "draft"
follow_on:
  route: "baseline-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan.prompt.md"
  why: "This is a new product capability with its own deterministic data contract, first-party Skill, and report surfaces."
  coordinate_handoff: "Carry the owner-selected W23 R0 coordinate into the baseline plan and work backlog."
coordinate: "W23 R0"
source:
  type: "manual-request"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "full-package draft"
  reason: "The owner explicitly requested the design, plan, PRD authority, and work backlog together for review before implementation."
---

# Backlog Review and Reporting

## Purpose

Define a Make Docs capability that turns project backlog records into a clear status review. The review must show open work, remaining phases, completed work that still needs closeout, explicit blockers, likely historical records, and a recommended implementation order without forcing a person to inspect every backlog file.

## Context

Make Docs projects can contain many work directories from earlier waves, later revisions, interrupted work, completed phases, superseded records, and active packages. The source records remain authoritative, but their combined state is difficult to understand quickly. A correct review needs both repeatable facts and careful judgment.

The existing TypeScript operation registry is the correct home for repeatable collection and validation. [PRD 25](../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) requires deterministic facts and reused parse primitives to live in focused TypeScript operations. [PRD 39](../prd/39-cli-command-model-and-operation-registry.md) owns the shared CLI and MCP projections. [PRD 08](../prd/08-skills-catalog-and-distribution.md) owns first-party Skill delivery.

[W22 R0](../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md) closed its platform proof in P6 at commit `edd9d7e4`. W23 R0 uses that closeout or later accepted authority as its shared Store, CLI, registry, and MCP baseline. W22 publication or release is not a W23 prerequisite. W23 implementation still requires separate owner authority.

This design follows the deterministic and agentic twin guidance in [Developing Deterministic and Agentic Twins](../assets/project/developing-deterministic-agentic-twins.md). The deterministic method reduces repeated cost and ambiguity. The agentic method remains available when the CLI is absent and owns conclusions that require judgment.

## Human Experience Intent

Impact: `direct`

Affected humans: Maintainers, product leads, and other people who must decide what project work needs attention next.

Human goal or effect: Understand the current backlog at a glance, inspect the evidence behind any claim, and choose the next useful work without reconstructing project history by hand.

Experience promises:

- Lead with the current focus, important conflicts, and recommended next actions.
- Separate recorded facts, source-backed inferences, and recommendations.
- Give every included wave one fixed report status: `attention`, `current`, `conflict`, `deferred`, `complete`, or `history`.
- Keep the fixed status separate from the agent-written status reason and from recorded lifecycle state.
- Keep source links and exact phase or task detail available without putting that detail in the default reading path.
- When a tool reports an error, warning, or material limit, have the agent explain the subject, meaning, effect on the current request, evidence limit, and next useful action in natural language. Keep the exact diagnostic code as secondary detail.
- Provide a concise in-chat report by default and an optional self-contained interactive HTML report on request.
- Keep the HTML report usable offline, responsive, keyboard-accessible, and printable or savable as one file.

Complexity kept out of the human path:

- Raw frontmatter, checkbox parsing, Git commands, registry identifiers, source conflict rules, and internal schema fields are not required to understand the summary.
- Raw error text, stack traces, and diagnostic codes are not required to understand what happened or what to do next.
- Store setup and Store recovery are not required for a repository-backed review.
- The user does not need another visualization Skill or hosted site to open the HTML report.

Evidence required:

- Exercise fixtures that produce every fixed wave status and status reasons for open, completed, closeout-needed, blocked, paused, superseded, historical, and internally conflicting records.
- Compare the structured snapshot, chat report, and HTML report for the same meaning and source traceability.
- Exercise agent handling for operation errors, partial records, unsupported records, and evidence fallbacks. Confirm that the human explanation keeps the exact meaning while adding context, impact, and a useful next action.
- Inspect the rendered HTML at desktop and mobile sizes and exercise all keyboard-accessible filters, sorting controls, source links, and disclosure controls.
- Run a Human Experience Review against the accepted promises and record observations, conclusions, limits, and next actions.

## Performance Evidence Candidates

No current performance candidate requires a product target or a bounded performance run. Automated tests must still prove bounded repository traversal and deterministic results. Reassess performance applicability only if real project evidence shows that report generation time or memory use changes a product decision.

## Decision

### One deterministic snapshot operation

Create one read-only TypeScript operation with the stable identifier `work.backlog.snapshot`. Its intended projections are:

- CLI: `make-docs run work backlog snapshot --target-root <project> [--json]`
- MCP: the registry-derived `make_docs_work_backlog_snapshot` tool

The operation collects and validates source facts. It does not recommend priorities or decide that a record is irrelevant. It returns a versioned structured result with project identity, source provenance, work records, phase and task facts, explicit blocker evidence, closeout evidence, Git evidence when available, conflicts, warnings, and capability availability.

The operation returns a numeric version 1 snapshot value inside the shared operation-result wrapper. The value always contains generation time, target root, nullable project identity, nullable Git revision, capability states, live and archived record counts, every record, and diagnostics. Every record uses its repository-relative path as its identity and keeps sourced coordinate, title, recorded status, creation date, and last-updated evidence. Defined keys are always present. Unknown scalars are `null`, and empty collections are `[]`. The Store capability is normally `not-used`; the operation does not probe the Store only to fill the capability map.

The source reader supports full semantic parsing only for the current frontmatter standard. A valid current index and phase declare `kind: work`, their matching work or phase coordinate, title, and status in readable YAML frontmatter. A current-format record with malformed or incomplete frontmatter is partial and exposes only safely parsed facts. A dated work directory with no required frontmatter is unsupported but remains an inventory-only record. Its safe directory and file facts remain available, and it stays in live or archived counts. The operation does not interpret legacy headings, checkboxes, task syntax, status text, or closeout prose.

Private readers sit behind one adapter boundary. Version 1 includes a current-frontmatter reader and an unsupported inventory reader. This keeps the public snapshot stable if a later decision adds a legacy or version-specific reader.

Internal collectors may parse supported work indexes, linked phase files, task checkboxes, source links, and Git facts. The current reader follows the phase map. It can scan numbered top-level phase files only to report current-frontmatter files that the phase map did not link. The collectors remain private modules unless later evidence shows that another product capability needs a separate public operation. The product does not expose one MCP tool for every parsing helper.

The operation must work without the Global Store. Store absence, denial, unsafe state, or unavailability cannot block repository-backed facts. Optional Store context may be added later only as labeled supplementary data. It cannot become the only authority for backlog state.

### One first-party review Skill

Create the first-party `backlog-review` Skill under `packages/skills/backlog-review/`. The Skill consumes the structured snapshot through MCP when available, through the CLI when MCP is unavailable, or through a documented agentic fallback when neither deterministic surface is available.

The Skill owns:

- conflict-aware interpretation;
- one exclusive fixed wave status and one evidence-backed status reason for each included wave;
- recommended work order and rationale;
- the concise in-chat report structure;
- the optional single-file HTML report template; and
- honest limits when evidence is incomplete.

The Skill must not claim that its fallback ran the deterministic operation. A stable rule catalog must map deterministic support, agent instructions, evidence class, diagnostics, and parity expectations.

### One report model with two first-party presentations

The chat report and HTML report use the same report model. Each claim has one evidence class:

- `fact`: directly supported by a cited repository or Git source;
- `inference`: an agent conclusion based on cited facts; or
- `recommendation`: a proposed next action with rationale and confidence.

The default chat report stays compact and easy to scan. The HTML report is created only when the user asks for it. It contains all CSS, JavaScript, icons, report data, and template code in one file. It makes no network request and loads no remote asset.

The Skill does not depend on Sites, a built-in visualizer, or another visualization Skill. It also does not prevent an agent from using Sites when a user explicitly requests a site.

Each included wave has exactly one `waveStatus` in the shared report model:

| Wave status | Color identity | Meaning |
| --- | --- | --- |
| `attention` | Yellow | The wave needs review, closeout, or another human action. |
| `current` | Blue | The wave is part of the current work or planning focus. |
| `conflict` | Red | Material source evidence disagrees, so the wave state cannot be trusted at face value. |
| `deferred` | Purple | The wave is paused, superseded, or intentionally outside the current queue. |
| `complete` | Green | The wave is complete and still useful in the recent review. |
| `history` | Light grey | The wave is retained lineage and is not part of the current work queue. |

The report model also contains a nonempty `statusReason`. The Skill writes this short, evidence-backed explanation for the selected status. Examples include `Draft package`, `Closeout activity`, `Status conflict`, `Paused`, and `Completed history`. The reason can change between reports. It does not control filtering or color.

The fixed status controls exact status-filter membership and the badge and status-filter color. Attention findings remain separate report items. An attention finding about a current wave does not move that wave into the `attention` filter. Archive location separately controls archived scope.

The report uses four fixed portfolio tallies:

| Tally label | Rule |
| --- | --- |
| Work records found | All live and archived work records. |
| Records in scope | All non-archived records not classified as `history`. |
| Historical records | Non-archived records classified as `history`. |
| Archived records | Records in the archive work namespace. |

The model must satisfy `work records found = records in scope + historical records + archived records`. Archive location is a deterministic fact. Historical classification remains a report-layer conclusion. The Skill assigns a wave status to every discovered live record before it calculates or presents these totals. The interactive report includes every discovered live and archived record. A concise chat presentation can group or summarize records, but it cannot omit them from the portfolio tallies or shared report model.

The interactive report opens with `In Scope`. It also provides the six exact status filters, `Archived`, and `All`, with `All` last. `In Scope` matches non-archived records whose wave status is not `history`. `History` matches non-archived `history` records. `Archived` matches the archive namespace. `All` matches every discovered record.

The report sorts by directory creation date, wave coordinate, or last-updated date and toggles each sort between ascending and descending. The default is last updated, newest first. The created date comes from the dated work-directory name. The last-updated scope contains only the work record directory and its linked phase files. Local changes use the newest modification time among changed or untracked scoped files. A clean record uses the latest Git committer date that affected a scoped file. Git absence, denial, a non-repository location, or missing history falls back to the newest scoped file modification time. Missing usable file time falls back to the created date. Each fallback is explicit. Linked product source files and report generation time never affect this value. Equal primary sort values use wave coordinate, then record path, in ascending order.

Each collapsed wave summary is a large pointer target. Its wave-name link continues to open the source index and does not toggle detail. Expanded detail does not close when a user selects or activates its content. The summary surface exposes its open or closed state and supports keyboard activation.

### W22 R0 integration gate

P1 contract and fixture work may continue after separate W23 implementation authority. Before P2 changes a shared operation surface, its preflight must confirm that the checkout contains W22 R0 P6 closeout commit `edd9d7e4` or later accepted authority. It must reread the current PRD 38 and PRD 39 authority. It must also pass the existing registry, access, CLI, and MCP contract tests.

The W23 operation declares project-read, Store-none, and host-configuration-none access. It uses the existing registry-derived CLI and MCP paths. It does not add a Store schema or state, setup path, harness trust path, parallel dispatcher, or MCP-only business logic. If the preflight fails, P2 stops and reports the drift. It does not create a temporary workaround. Independent P1 work may continue.

## Alternatives Considered

### Separate Python tool

Rejected for the current scope. The work is Markdown, frontmatter, Git, JSON, and existing TypeScript operation-registry work. A Python tool would add another runtime, release path, trust boundary, and MCP integration without a matching product benefit.

### Agent-only review

Rejected as the primary method. Agents can perform the review, but repeatable source collection and conflict detection should not consume repeated tokens or vary by agent when the facts can be computed.

### CLI-owned final narrative and HTML rendering

Rejected. Priority, relevance, and implementation-order conclusions require judgment. The Skill should own those conclusions and both human presentations. The CLI should return structured facts and diagnostics.

### Many small public operations

Rejected for the initial release. Public operations create permanent CLI and MCP surface area. Private modules provide reuse without exposing low-level parser concepts to users and agents.

### Store-backed report state

Rejected. The repository contains the versioned backlog authority. The report must remain useful when Store access is absent or unavailable.

## Consequences

- The product gains a clear boundary between source facts and agent judgment.
- The same deterministic result can support chat, HTML, future automation, and later site generation.
- The Skill carries a reusable visual template without adding a visualization dependency.
- The structured result needs a versioned schema and stable diagnostics before the Skill can be treated as portable.
- Git facts remain optional because some project copies may not have Git or may restrict access.
- Agentic fallback must be maintained with the deterministic implementation and reviewed whenever either changes.
- W22 R0 can change shared CLI or MCP mechanics without changing the W23 product model if the stable operation contract is preserved.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../../.make-docs/system/prompts/designs-to-plan.prompt.md). Read `make-docs://system/prompt/designs-to-plan.prompt.md` with `make-docs resource read`.
- Why: This design defines a new product capability that needs its own plan, PRD owner, and work backlog.
- Coordinate Handoff: Carry the owner-selected `W23 R0` coordinate into the baseline plan and work backlog.
