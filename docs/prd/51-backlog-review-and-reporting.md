---
title: "51 Backlog Review and Reporting"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-09-18-w23-r0-backlog-review-and-reporting/00-overview.md"
---

# 51 Backlog Review and Reporting

## Purpose

Own the Make Docs capability that converts repository backlog records into a source-backed status snapshot and a clear human review. This PRD owns the backlog-review data contract, the deterministic snapshot boundary, the first-party review Skill, and the chat and single-file HTML report outcomes.

## Scope

This capability covers:

- read-only discovery of Make Docs work directories and their linked phase records;
- deterministic extraction of recorded lifecycle state, task state, explicit blockers, closeout evidence, source relationships, and optional Git facts;
- conflict and availability diagnostics;
- source-backed agent conclusions about likely current versus historical work;
- recommended implementation order;
- a concise in-chat report; and
- an optional self-contained interactive HTML report.

This capability does not own the general operation registry, MCP naming rules, Store model, Skill installation model, lifecycle semantics, testing policy, or Human Experience standard. Those boundaries remain with [PRD 39](39-cli-command-model-and-operation-registry.md), [PRD 38](38-global-store-and-project-state.md), [PRD 08](08-skills-catalog-and-distribution.md), [PRD 14](14-lifecycle-workflow-and-coverage-passes.md), [PRD 50](50-proportionate-testing-and-human-centered-validation.md), and [PRD 49](49-human-experience-standard-and-intent.md).

Code anchors:

- `packages/cli/src/operations/`
- `packages/cli/src/mcp/`
- `packages/skills/`
- `docs/work/`

## Component and Capability Map

### Backlog snapshot operation

- R-BACKLOG-SNAPSHOT-1 (MUST): one read-only operation with stable identifier `work.backlog.snapshot` produces the deterministic backlog snapshot. Its canonical CLI projection is `make-docs run work backlog snapshot --target-root <project> [--json]`. Its MCP projection is derived from the shared registry.
- R-BACKLOG-SNAPSHOT-2 (MUST): one TypeScript core owns the operation logic. The CLI parser and MCP server contain no separate backlog-state logic.
- R-BACKLOG-SNAPSHOT-3 (MUST): the operation accepts an explicit safe target root, performs bounded repository traversal, changes no project, Git, Store, or installation state, and remains testable without the CLI parser or MCP transport.
- R-BACKLOG-SNAPSHOT-4 (MUST): the operation works when the Global Store is not configured, unavailable, unsafe, or denied. A Store result cannot block repository facts. Optional Store context, if later admitted, is supplementary and clearly labeled.
- R-BACKLOG-SNAPSHOT-5 (MUST): Git evidence is optional. The result distinguishes available, unavailable, denied, and not-a-repository states. Missing Git evidence does not erase repository-document facts.
- R-BACKLOG-SNAPSHOT-6 (MUST): the result preserves raw recorded values and reports conflicts. It does not silently replace a recorded `complete` state when open task checkboxes remain, or infer completion from checked tasks when required closeout evidence is absent.
- R-BACKLOG-SNAPSHOT-7 (MUST NOT): the deterministic operation assigns priority, declares a record irrelevant, recommends an implementation order, or converts an ambiguous source conflict into one favorable state.
- R-BACKLOG-SNAPSHOT-8 (MUST): each work record receives `createdAt` from its dated work-directory name and `lastUpdatedAt` from only the work record directory and its linked phase files. Linked product source files and report generation time never affect `lastUpdatedAt`.
- R-BACKLOG-SNAPSHOT-9 (MUST): when scoped record files have local changes, `lastUpdatedAt` is the newest file modification time among the changed or untracked scoped files. When the scoped record is clean, it is the latest Git committer date that affected a scoped file. If Git evidence is unavailable, denied, not in a repository, or has no usable history, the operation uses the newest scoped file modification time. If no usable file time exists, it uses `createdAt`. The result names the evidence source and reports each fallback with a stable diagnostic.
- R-BACKLOG-SNAPSHOT-10 (MUST): the version 1 snapshot value always contains `schemaVersion`, `generatedAt`, `targetRoot`, `project`, `gitRevision`, `capabilities`, `recordCounts`, `records`, and `diagnostics`. `schemaVersion` is the number `1`. A breaking contract change requires a new schema version.
- R-BACKLOG-SNAPSHOT-11 (MUST): `capabilities` always contains `repositoryFiles`, `git`, `store`, and `sourceLinks`. Each capability has a state and diagnostic-code list. The shared state vocabulary is `available`, `partial`, `unavailable`, `denied`, `not-a-repository`, and `not-used`. The operation does not probe the Store only to fill this map. Store is normally `not-used`.
- R-BACKLOG-SNAPSHOT-12 (MUST): every work record has `recordPath`, `scope`, sourced `coordinate`, sourced `title`, sourced `recordedStatus`, `createdAt`, and `lastUpdatedAt`. `recordPath` is the identity because duplicate coordinates are valid conflict evidence. A sourced value contains its value and source references.
- R-BACKLOG-SNAPSHOT-13 (MUST): every defined key is present. Unknown scalar values are `null`. Empty collections are `[]`. Date-only values use `YYYY-MM-DD`. Time values use an ISO 8601 UTC time and name their date, second, or millisecond precision.
- R-BACKLOG-SNAPSHOT-14 (MUST): each diagnostic contains a stable code, rule identifier, severity, optional record and source location, message, reason, and remediation. Snapshot diagnostics and capability limits never add report-layer `waveStatus`, `statusReason`, inference, or recommendation fields.
- R-BACKLOG-SNAPSHOT-15 (MUST): full semantic parsing supports the current frontmatter standard only. A supported work index is `00-index.md` with readable YAML frontmatter that declares `kind: work`, a `Wn Rn` coordinate, title, and status. A supported phase has readable YAML frontmatter that declares `kind: work`, a matching `Wn Rn Pn` coordinate, title, and status.
- R-BACKLOG-SNAPSHOT-16 (MUST): a dated work directory remains a discovered record when its index has no frontmatter, unreadable frontmatter, or incomplete required frontmatter. The record reports `sourceShape.state` as `unsupported` when required frontmatter is absent and `partial` when current frontmatter is present but malformed or incomplete. A valid current record reports `supported`.
- R-BACKLOG-SNAPSHOT-17 (MUST): an unsupported record is inventory-only. The operation may derive its record path, live or archived scope, directory coordinate when parseable, creation date, last-updated evidence, and discovered top-level Markdown files. It leaves title and recorded status `null`, returns no interpreted phases, tasks, dependencies, blockers, or closeout facts, and emits a stable unsupported-shape diagnostic.
- R-BACKLOG-SNAPSHOT-18 (MUST): a partial record exposes only fields that the current frontmatter reader can parse safely. It does not fall back to legacy heading, checkbox, task, status, or closeout conventions. Each missing or unreadable required field remains `null` and has a stable diagnostic.
- R-BACKLOG-SNAPSHOT-19 (MUST): private source readers preserve one adapter boundary. Version 1 implements the current-frontmatter reader and the unsupported inventory reader. A later legacy or version-specific reader can be added without changing the public snapshot contract when its output preserves the same fact and diagnostic meanings.
- R-BACKLOG-SNAPSHOT-20 (MUST): every deterministic rule has one stable catalog identity and one stable diagnostic code. The same diagnostic code may be emitted for more than one affected record. A diagnostic code keeps one meaning and one default severity even when its human message or remediation text improves.
- R-BACKLOG-SNAPSHOT-21 (MUST): `error` means that the operation cannot inspect the target safely enough to return the requested snapshot. `warning` means that the snapshot remains usable but a record is incomplete, unsupported, or conflicting. `info` means that the operation used a safe fallback because optional evidence was unavailable. A normal Store state of `not-used` emits no diagnostic.
- R-BACKLOG-SNAPSHOT-22 (MUST): diagnostics are evidence and control data. A diagnostic never assigns a report-layer wave status, filter, color, priority, or recommendation.
- R-BACKLOG-SNAPSHOT-23 (MUST): before P2 changes a shared operation surface, its preflight confirms that the checkout contains the accepted W22 R0 P6 closeout commit `edd9d7e4` or later accepted authority. The preflight also rereads the current PRD 38 and PRD 39 authority.
- R-BACKLOG-SNAPSHOT-24 (MUST): the operation declares project-read, Store-none, and host-configuration-none access. Optional Git evidence does not broaden this declared access.
- R-BACKLOG-SNAPSHOT-25 (MUST): the operation uses the existing registry-derived CLI and MCP paths. It adds no Store schema or state, setup path, harness trust path, parallel dispatcher, or MCP-only business logic.
- R-BACKLOG-SNAPSHOT-26 (MUST): existing registry, access, CLI, and MCP contract tests pass before P2 changes a shared surface. A failed preflight blocks P2 and reports the drift. It does not permit a temporary workaround. Independent P1 contract and fixture work may continue.

### Internal collectors and rule catalog

- R-BACKLOG-RULES-1 (MUST): private TypeScript modules may collect work indexes, phase files, checkbox facts, source links, timestamps, and Git evidence. A helper becomes a public operation only after a separate product decision proves a stable reusable need.
- R-BACKLOG-RULES-2 (MUST): one stable rule catalog records each fact or diagnostic, its source class, deterministic support state, agent instruction location, judgment requirement, diagnostic code, and focused fixture or test.
- R-BACKLOG-RULES-3 (MUST): a change to deterministic behavior triggers review of its agentic twin. A change to agent instructions triggers review of the deterministic mapping. One-sided behavior requires a stated reason.
- R-BACKLOG-RULES-4 (MUST): stable diagnostics cover unsafe roots, missing work indexes, malformed frontmatter, duplicate coordinates, broken phase links, recorded-status and task-state conflicts, missing source authority, unavailable optional evidence, and unsupported record shapes.
- R-BACKLOG-RULES-5 (MUST): the current-frontmatter reader follows the index phase map. It may also scan numbered top-level Markdown files with current phase frontmatter only to report an unlinked-phase diagnostic. That scan does not silently add an unlinked phase to the interpreted phase set.
- R-BACKLOG-RULES-6 (MUST): rule identifiers use `BACKLOG-RULE-###`. Deterministic diagnostic identifiers use `BACKLOG-VAL-###`. Agent-only rule identifiers use `BACKLOG-AGENT-###` and are not emitted as deterministic snapshot facts.
- R-BACKLOG-RULES-7 (MUST): each catalog entry records its title, rule class, source class, deterministic support state, agent instruction location, judgment requirement, diagnostic code, default severity, focused fixtures or tests, parity mapping, and any one-sided reason.
- R-BACKLOG-RULES-8 (MUST): the shared fixture model has six bounded groups: canonical current record, mixed portfolio, source-shape limits, conflicts and links, dates and capabilities, and safety and human errors. Fixtures are synthetic and contain no copied user-project content.
- R-BACKLOG-RULES-9 (MUST): static deterministic fixtures use fixed dates and expected structured results. Git state, working-tree changes, file-time fallbacks, and unsafe path conditions use isolated temporary repositories or directories created by tests.
- R-BACKLOG-RULES-10 (MUST): agent-response fixtures verify required meaning rather than exact prose. An acceptable response preserves the diagnostic meaning and includes the subject, context, effect, known limit, next useful action, and required or optional human action.

### First-party backlog-review Skill

- R-BACKLOG-SKILL-1 (MUST): `packages/skills/backlog-review/` is the source of truth for one explicitly selected first-party Skill. It follows the packaging, independence, trust, and installed-output rules in PRD 08.
- R-BACKLOG-SKILL-2 (MUST): the Skill uses MCP when the compatible derived tool is available, uses the CLI when MCP is unavailable, and uses its documented agentic fallback only when neither deterministic surface is available.
- R-BACKLOG-SKILL-3 (MUST): the Skill states which method supplied the facts. It never claims that the deterministic operation ran when it used the agentic fallback.
- R-BACKLOG-SKILL-4 (MUST): the Skill separates `fact`, `inference`, and `recommendation` claims. Each inference and recommendation cites the facts that support it and states a useful confidence or evidence limit.
- R-BACKLOG-SKILL-5 (MUST): the Skill assigns every discovered non-archived work record exactly one report-layer `waveStatus`: `attention`, `current`, `conflict`, `deferred`, `complete`, or `history`. The classification is a report conclusion, not a silent change to recorded lifecycle state.
- R-BACKLOG-SKILL-6 (MUST): the Skill can recommend implementation order. It considers explicit dependencies, blockers, accepted authority, active work, closeout debt, supersession, and evidence conflicts. It does not treat file age alone as priority proof.
- R-BACKLOG-SKILL-7 (MUST): every included wave has a nonempty, evidence-backed `statusReason`. The reason is flexible display text. It does not control filter membership or color. Attention findings remain separate from wave status.
- R-BACKLOG-SKILL-8 (MUST): the shared report model contains `workRecordsFound`, `workRecordsStillInScope`, `historicalRecords`, and `archivedRecords`. It satisfies `workRecordsFound = workRecordsStillInScope + historicalRecords + archivedRecords`.
- R-BACKLOG-SKILL-9 (MUST): `workRecordsFound` counts all discovered live and archived work records. `workRecordsStillInScope` counts non-archived records whose `waveStatus` is not `history`. `historicalRecords` counts non-archived records whose `waveStatus` is `history`. `archivedRecords` counts records in the archive work namespace.
- R-BACKLOG-SKILL-10 (MUST): the shared report model includes every discovered live and archived work record. Each record carries archive scope, directory-derived creation date, and deterministic last-updated evidence suitable for sorting.
- R-BACKLOG-SKILL-11 (MUST): when an agent receives a tool error, warning, or material limit, it reports that result to the human in natural language. It names the subject, what happened, why it matters to the current request, what remains known or unknown, and the next useful action. It states whether human action is required or optional.
- R-BACKLOG-SKILL-12 (MUST NOT): an agent does not use a raw diagnostic, stack trace, internal identifier, or lightly reworded tool error as the primary human explanation. It keeps exact codes and technical details available as secondary evidence. It does not assume that the human knows the internal model or has technical project context.
- R-BACKLOG-SKILL-13 (MUST): a natural explanation never hides, softens, or changes a material failure, risk, limit, or required action. Human language and machine output preserve the same meaning.
- R-BACKLOG-SKILL-14 (MUST): tests do not freeze one agent sentence as the only correct response. They verify the required human meaning, evidence limit, and next action while allowing natural wording.

### Chat report

- R-BACKLOG-CHAT-1 (MUST): the default result is an in-chat review. It leads with the current focus, attention items, and recommended order.
- R-BACKLOG-CHAT-2 (MUST): the report provides sections for current or open work, completed work that may need closeout, blocked or conflicted work, paused or superseded work, likely historical records, and recommendation order when those sections have content.
- R-BACKLOG-CHAT-3 (MUST): the default report stays concise. Exact tasks, machine fields, and full evidence remain available through linked or expandable detail rather than overwhelming the summary.
- R-BACKLOG-CHAT-4 (MUST): absent evidence, source disagreement, and unverified conclusions remain visible. The report does not present an inference as a recorded fact.

### Single-file interactive report

- R-BACKLOG-HTML-1 (MUST): the Skill creates HTML only when the user requests it. The user can choose a save path. The result is one portable `.html` file.
- R-BACKLOG-HTML-2 (MUST): the file embeds its CSS, JavaScript, icons, normalized report data, and presentation template. It loads no remote font, script, image, stylesheet, or analytics endpoint and makes no network request.
- R-BACKLOG-HTML-3 (MUST): the HTML and chat reports preserve the same status meanings, source distinctions, warnings, and recommendation rationale.
- R-BACKLOG-HTML-4 (MUST): the report supports keyboard-accessible filters, sorting, text search, expandable wave detail, source navigation, print, and responsive layouts. Reduced-motion and visible-focus preferences are honored.
- R-BACKLOG-HTML-5 (MUST): project-derived text is safely encoded. It cannot inject markup or executable script into the report.
- R-BACKLOG-HTML-6 (MUST): the Skill owns its template. It does not require Sites, another visualization Skill, or a hosted service. An agent may still use Sites when the user explicitly requests a site.
- R-BACKLOG-HTML-7 (MUST): the filter group defines `In Scope`, `Attention`, `Current`, `Conflict`, `Deferred`, `Complete`, `History`, `Archived`, and `All` in that order. `In Scope` is the default. `All` is always present and matches every discovered record. A non-aggregate filter is hidden only when the full unfiltered report has no match. Search and the selected filter combine without changing membership.
- R-BACKLOG-HTML-8 (MUST): `attention` uses yellow, `current` blue, `conflict` red, `deferred` purple, `complete` green, and `history` light grey. The same semantic color applies to a wave badge and its filter hover, focus, and selected states. Visible text still names the reason, so meaning does not depend on color alone.
- R-BACKLOG-HTML-9 (MUST): the summary strip shows the four fixed tally labels: `work records found`, `records in scope`, `historical records`, and `archived records`. The values cover the full portfolio even when the detailed wave list is summarized.
- R-BACKLOG-HTML-10 (MUST): the wave list contains every discovered live and archived record and supports created-date, coordinate, and last-updated sorting in both ascending and descending directions. It defaults to last updated, newest first. Equal primary sort values use wave coordinate, then record path, in ascending order.
- R-BACKLOG-HTML-11 (MUST): the collapsed wave summary toggles detail when a user activates a non-interactive part of it. The wave-name source link remains independent. Expanded detail is not a toggle surface. The summary surface exposes `aria-expanded`, `aria-controls`, an accessible name, and the same open or closed state to keyboard and assistive-technology users.

### Human outcomes

The capability follows the [Human Experience Contract](../../.make-docs/system/contracts/human-experience-contract.md).

- R-BACKLOG-HX-1 (MUST): a reader can identify current focus and the next useful action before reading machine detail.
- R-BACKLOG-HX-2 (MUST): a reader can distinguish recorded state from inferred relevance and recommended order.
- R-BACKLOG-HX-3 (MUST): a reader can identify open phases, remaining tasks, closeout gaps, blockers, and conflicting evidence for an included wave.
- R-BACKLOG-HX-4 (MUST): a reader can reach the source evidence for a material claim without first learning an unexplained internal identifier.
- R-BACKLOG-HX-5 (MUST): the report preserves the difference between complete implementation, complete phase tasks, accepted closeout, and closed wave history.
- R-BACKLOG-HX-6 (MUST): a reader can use one stable set of wave statuses while still seeing the specific reason for each classification.
- R-BACKLOG-HX-7 (MUST): a person who receives an error or material limit can understand its context, effect on the requested work, and next useful action without first understanding Make Docs internals.

Code anchors:

- `packages/cli/src/operations/registry.ts`
- `packages/cli/src/operations/context.ts`
- `packages/cli/src/mcp/tools.ts`
- `packages/skills/`

## Contracts and Data

### Snapshot result

The operation returns a versioned JSON-compatible result. It includes:

- schema version and operation version;
- target project identity and normalized root;
- generation time and optional Git revision;
- capability availability for repository files, Git, Store context, and source links;
- one work record per discovered backlog;
- source-shape state and discovered top-level Markdown files for each work record;
- directory-derived `createdAt` and evidence-backed `lastUpdatedAt` values for each work record;
- phase and task counts with source provenance;
- recorded statuses without normalization loss;
- explicit blocker and dependency records;
- closeout and acceptance evidence records;
- source conflicts and stable diagnostics; and
- links or repository-relative paths to supporting records.

Each material fact records its source path and, where practical, a stable section, field, or line locator. The snapshot does not embed agent conclusions.

The snapshot value follows the accepted version 1 contract in the W23 R0 P1 data-contract plan. `recordCounts.found` equals `recordCounts.live + recordCounts.archived`.

Full semantic facts come only from the current frontmatter standard. Unsupported no-frontmatter records remain in the snapshot and counts as inventory-only records. Partial current-format records retain only safely parsed facts and explicit diagnostics.

### Report model

The Skill adds a report layer to the snapshot. It contains:

- summary counts and attention items;
- fixed portfolio tallies for all records, records still in scope, historical records, and archived records;
- every discovered live and archived record, with archive scope, `createdAt`, and `lastUpdatedAt` evidence;
- exactly one source-backed `waveStatus` per included wave: `attention`, `current`, `conflict`, `deferred`, `complete`, or `history`;
- one nonempty agent-written `statusReason` per included wave;
- recommendation order with rationale;
- claim evidence class: `fact`, `inference`, or `recommendation`;
- confidence and evidence limits for non-facts;
- display labels and compact explanatory copy; and
- one normalized model consumed by chat and HTML rendering.

The report model does not modify the snapshot or project records. A saved HTML file is a report artifact, not product authority or operational state.

`waveStatus` is the only field that controls exact status filtering and semantic color. `statusReason` supplies the visible badge text. Archive location controls archived scope. An attention finding can refer to any wave and does not change that wave's `waveStatus`.

The four fixed tallies use these formulas:

- `workRecordsFound = liveRecords + archivedRecords`;
- `workRecordsStillInScope = liveRecords where waveStatus != history`;
- `historicalRecords = liveRecords where waveStatus == history`; and
- `archivedRecords = records in the archive work namespace`.

The report validates that `workRecordsFound` equals the sum of the other three values. The interactive wave list has no record-count limit. Chat summary choices do not change the totals or shared record set.

Code anchors:

- `packages/cli/src/operations/`
- `packages/skills/backlog-review/`

## Integrations

- [PRD 08](08-skills-catalog-and-distribution.md) owns first-party Skill source, packaging, installation, upgrade, and independence.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) owns lifecycle meaning and phase-close behavior.
- [PRD 23](23-generated-document-metadata-and-lifecycle-handoffs.md) owns generated document metadata and lifecycle handoffs.
- [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md) owns the deterministic-versus-agentic boundary and shared TypeScript core.
- [PRD 39](39-cli-command-model-and-operation-registry.md) owns registry admission, CLI projection, MCP derivation, JSON parity, and shared error meaning.
- [PRD 49](49-human-experience-standard-and-intent.md) owns the Human Experience standard and review lens.
- [PRD 50](50-proportionate-testing-and-human-centered-validation.md) owns testing selection and evidence use.
- [W22 R0](../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md) closed its P6 platform proof at commit `edd9d7e4`. W23 uses that closeout or later accepted authority as its shared-surface baseline. A W22 publication or release is not a W23 prerequisite. W23 implementation still requires separate owner authority.

## Rebuild Notes

- Preserve the separation between deterministic facts and agent judgment. Do not move recommendation logic into the operation to make report generation easier.
- Keep repository facts available without the Store. Do not add a local state file as a fallback.
- Keep one public snapshot operation until a separate reusable need justifies more registry entries.
- Preserve raw recorded statuses and source conflicts. Do not create one synthetic status that hides why records disagree.
- Render chat and HTML from the same report model so visual changes cannot change product meaning.
- Keep the HTML template self-contained and treat all project content as untrusted text.
- Preserve the agentic fallback and twin review even when deterministic tooling is available in the maintainer repository.
- Apply the W22 R0 gate before P2 changes a shared surface. Do not add a temporary dispatcher, Store adapter, setup path, trust path, or MCP-only implementation.

Code anchors:

- `docs/assets/project/developing-deterministic-agentic-twins.md`
- `docs/plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/`
- `packages/cli/src/operations/`
- `packages/skills/`

## Source Anchors

- [Backlog Review and Reporting design](../designs/2026-09-18-backlog-review-and-reporting.md)
- [W23 R0 Backlog Review and Reporting plan](../plans/2026-09-18-w23-r0-backlog-review-and-reporting/00-overview.md)
- [W23 R0 Backlog Review and Reporting work backlog](../work/2026-09-18-w23-r0-backlog-review-and-reporting/00-index.md)
- [Developing Deterministic and Agentic Twins](../assets/project/developing-deterministic-agentic-twins.md)
- [W22 R0 Store Architecture Recovery and Platform-Neutral Foundation](../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md)
