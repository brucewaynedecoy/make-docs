---
title: "51 Backlog Review and Reporting"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-overview.md"
---

# 51 Backlog Review and Reporting

## Purpose

Own the Make Docs capability that converts repository backlog records into a source-backed status snapshot and a clear human review. This PRD owns the backlog-review data contract, the deterministic snapshot boundary, the first-party review Skill, optional exact-match review reuse, the default live MCP App, the concise chat fallback, and the explicit static single-file HTML report.

## Scope

This capability covers:

- read-only discovery of Make Docs work directories and their linked phase records;
- deterministic extraction of recorded lifecycle state, task state, explicit blockers, closeout evidence, source relationships, and optional Git facts;
- conflict and availability diagnostics;
- source-backed agent conclusions about likely current versus historical work;
- recommended implementation order;
- a default live MCP App on compatible hosts;
- a concise in-chat orientation and fallback;
- an explicit-request self-contained static HTML report;
- an optional rebuildable per-record review cache in the Global Store; and
- live and static data views with a user-started JSON download;
- current-data refresh and controlled requests to the active agent;
- visible wave mapping for recommended Next items and wave-specific Attention findings; and
- interactive navigation from those items to the matching Backlog record.

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

### Backlog review cache operations

- R-BACKLOG-CACHE-1 (MUST): P5 must activate two public operations for the optional review cache: `work.backlog-cache.lookup` and `work.backlog-cache.write`. Their canonical CLI projections are `make-docs run work backlog-cache lookup` and `make-docs run work backlog-cache write`. Their MCP tools derive from the shared registry. They are not active before their handlers and required validation land.
- R-BACKLOG-CACHE-2 (MUST): `work.backlog-cache.lookup` is read-only and declares Store-read, project-read, and host-configuration-none access. `work.backlog-cache.write` is mutating and declares Store-write, project-read, and host-configuration-none access. A lookup never requires a write grant.
- R-BACKLOG-CACHE-3 (MUST): both operations use one shared internal backlog-cache service. CLI and MCP surfaces contain no cache logic. Lookup uses one admitted Store session for Store classification, cache validation, checkout binding, and one bulk exact-key lookup.
- R-BACKLOG-CACHE-4 (MUST): every review runs `work.backlog.snapshot` before cache lookup. For each cache operation, the Skill uses the compatible derived MCP tool first and the canonical CLI command second. When neither deterministic surface is available, the agentic fallback performs a full stateless review and does not emulate Store access.
- R-BACKLOG-CACHE-5 (MUST): the shared Store session gate checks configured access, reachability, safety, and policy before cache code runs. `store-not-configured`, `store-unavailable`, `store-unsafe`, and `store-denied` route the Skill to the full stateless review. The Skill does not need a separate Store-status probe before lookup.
- R-BACKLOG-CACHE-6 (MUST): the lookup result distinguishes cache-service availability from per-record results and reports exact hits, misses, and rejected entries. An available cache can return any mix of these record results. Only exact hits supply review fragments.
- R-BACKLOG-CACHE-7 (MUST): Store schema creation and migration use the existing Store migration path. The lookup operation never creates or migrates the Store. A missing, older, newer, corrupt, or otherwise unusable cache schema routes to safe stateless review through the existing typed Store or cache result.
- R-BACKLOG-CACHE-8 (MUST): the write operation stores only validated bounded review fragments in one shared Store write transaction. A denied or failed write does not invalidate the current snapshot, fresh review, or report. It affects only later reuse and receives the natural explanation required by `R-BACKLOG-SKILL-11` through `R-BACKLOG-SKILL-13` when material.

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
- R-BACKLOG-SKILL-15 (MUST): every review starts with a current deterministic snapshot before it considers cache reuse. The snapshot operation remains Store-free. The review rebuilds portfolio tallies, attention findings, recommendation order, and all other cross-record conclusions from the current full snapshot.
- R-BACKLOG-SKILL-16 (MUST): the optional per-record review cache is `Store-cached and rebuildable`. Its exact identity contains checkout identity, record path, deterministic record digest, snapshot schema version, rule catalog version, and Skill version. Only an exact identity match can supply a reusable review fragment.
- R-BACKLOG-SKILL-17 (MUST): a missing, stale, invalid, unreadable, or nonmatching cache entry is a cache miss. The Skill performs fresh review for that record. A cache entry and its write receipt are never product authority, source evidence, a current snapshot, or proof that a conclusion remains valid.
- R-BACKLOG-SKILL-18 (MUST): when the Store is not configured, unavailable, unsafe, or denied, the Skill completes the full stateless review. It reports the cache limit to the human in natural language only when the limit matters to the request. Cache failure does not block independent repository facts or report creation.
- R-BACKLOG-SKILL-19 (MUST): the cache uses the Global Store boundary in PRD 38. It creates no project-local operational file, hidden report copy, or required companion file. Cached values exclude repository document bodies, prompts, secrets, and absolute local paths.
- R-BACKLOG-SKILL-20 (MUST): cache diagnostics report exact hits, misses, invalidations, rejected entries, and fallback use for validation. Normal human output stays concise and does not present cache mechanics as project status.
- R-BACKLOG-SKILL-21 (MUST): the Skill builds project-lead context through one deterministic bounded collector. The collector prefers the project overview, then the root README, then a package description for purpose. It uses explicit current-status sections and purpose, objective, or overview sections from selected current-focus work records for current context. It returns repository-relative paths, headings, lines, bounded excerpts, and content hashes. The agent may summarize only those excerpts for the project lead.
- R-BACKLOG-SKILL-22 (MUST): every recommendation-order item is wave-specific. Its `recordPath` resolves to exactly one included report record. Every Attention item either has one `recordPath` that resolves to exactly one included report record or uses null to mean a backlog-wide finding. Report validation rejects a missing or dangling required reference.
- R-BACKLOG-SKILL-23 (MUST): chat and HTML derive the visible wave coordinate for a Next or wave-specific Attention item from the matched report record. The agent does not need to repeat that coordinate inside claim prose. A null Attention reference uses the fixed label `Backlog finding`, not `Portfolio finding`.
- R-BACKLOG-SKILL-24 (MUST): when the active host supports the required MCP Apps capabilities, the Skill returns the live Backlog Review by default. It selects support through capabilities, not a host product name.
- R-BACKLOG-SKILL-25 (MUST): the Skill creates the static single-file report only after an explicit user request. Opening the live view, losing the live view, or entering chat fallback never writes a static report as a side effect. The Skill never silently creates both delivery modes.
- R-BACKLOG-SKILL-26 (MUST): when the live UI is unavailable, the Skill completes the concise chat review, explains the capability or transport limit in natural language, and offers the static report. It does not create the static file until the user asks.
- R-BACKLOG-SKILL-27 (MUST): live, static, chat, and data views consume one validated report model. Delivery mode can change presentation and local UI state. It cannot change report facts, status meaning, inference, recommendation, evidence limits, or attention and next-item identity.
- R-BACKLOG-SKILL-28 (MUST): after a changed live refresh, the agent performs fresh review only for nonmatching records, rebuilds every portfolio conclusion, validates the full report model, attempts the existing cache write as a best-effort step, and then opens the live view with the new model. A failed or denied cache write does not block the new review.

### Chat orientation and fallback

- R-BACKLOG-CHAT-1 (MUST): the chat result is the concise orientation for a live review and the complete fallback when live UI is unavailable. It leads with the current focus, attention items, and recommended order.
- R-BACKLOG-CHAT-2 (MUST): the report provides sections for current or open work, completed work that may need closeout, blocked or conflicted work, paused or superseded work, likely historical records, and recommendation order when those sections have content.
- R-BACKLOG-CHAT-3 (MUST): the default report stays concise. Exact tasks, machine fields, and full evidence remain available through linked or expandable detail rather than overwhelming the summary.
- R-BACKLOG-CHAT-4 (MUST): absent evidence, source disagreement, and unverified conclusions remain visible. The report does not present an inference as a recorded fact.
- R-BACKLOG-CHAT-5 (MUST): every Next item and wave-specific Attention item visibly names its matched wave coordinate. A backlog-wide Attention item visibly uses `Backlog finding`.

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
- R-BACKLOG-HTML-12 (MUST): the self-contained report provides an accessible view of its normalized embedded report model and a user-started JSON download of that same model. These controls preserve inert project text and current filtering does not alter the exported full model.
- R-BACKLOG-HTML-13 (MUST): the normal saved result remains one `.html` file. Raw-data access does not require a JSON companion, does not create an automatic hidden copy, and does not turn exported data into product authority or operational state.
- R-BACKLOG-HTML-14 (MUST): the report lead contains exactly two or three source-backed sentences. It starts with project purpose, then states current status or objective, and can add the remaining current role. It contains no backlog totals, report metrics, report-control instructions, or unsupported project claims. The renderer displays normalized lead text but does not create it. When supported context is incomplete, the normalized value is null and the renderer hides the lead.
- R-BACKLOG-HTML-15 (MUST): a wave-specific Next or Attention item is one accessible click or tap target with a visible matched coordinate. Activating it selects `All`, activates Backlog Work, places that coordinate in search, updates the result list, and brings the filtered Backlog result into view when needed. A backlog-wide finding has no false wave action.
- R-BACKLOG-HTML-16 (MUST): search has an icon-only control named `Clear search`. The control is present only while search contains a value. Clearing search preserves the selected filter, restores the applicable result set, and keeps a usable keyboard and focus path.
- R-BACKLOG-HTML-17 (MUST): Next and Attention navigation preserves the independent wave source link, wave disclosure behavior, Data view state, safe project-text handling, reduced-motion preference, and readable print output.

### Live MCP App

- R-BACKLOG-APP-1 (MUST): the shared operation registry defines `backlog.review.open` and `backlog.review.refresh`. Their derived MCP tool names are `make_docs_backlog_review_open` and `make_docs_backlog_review_refresh`. Their handlers contain no MCP-only backlog business logic.
- R-BACKLOG-APP-2 (MUST): `backlog.review.open` is read-only. It declares project-read, Store-none, and host-configuration-none access. It accepts only a validated report model and returns a useful non-UI result plus the linked MCP App resource.
- R-BACKLOG-APP-3 (MUST): `backlog.review.refresh` is read-only. It declares project-read, Store-read when admitted, and host-configuration-none access. It reruns `work.backlog.snapshot`, performs one exact cache lookup through the accepted Store gate, and returns the new snapshot identity, exact cache results, and exact changed-record facts. It does not write agent conclusions.
- R-BACKLOG-APP-4 (MUST): the UI resource uses the versioned URI `ui://make-docs/backlog-review/v1.html`, MIME type `text/html;profile=mcp-app`, and `_meta.ui.resourceUri`. A breaking UI contract uses a new versioned resource URI.
- R-BACKLOG-APP-5 (MUST): concise model-visible data uses `structuredContent`. The full widget model can use client-only result metadata when supported. Client-only metadata is not secure storage and cannot contain a secret merely because the model does not see it.
- R-BACKLOG-APP-6 (MUST): search, clear, status filter, sort, disclosure, theme, print, Data view, and JSON download are local UI actions. They do not call an MCP tool or send an agent message.
- R-BACKLOG-APP-7 (MUST): refresh calls `backlog.review.refresh` through `tools/call`. An unchanged result keeps the current validated model. A changed result shows the exact changed records and can send one controlled review request to the active agent through `ui/message`.
- R-BACKLOG-APP-8 (MUST): a wave action uses a fixed action identifier plus current project identity, record path, sourced coordinate, and snapshot identity. Project-authored text cannot become an action identifier or agent instruction.
- R-BACKLOG-APP-9 (MUST): a request to start a separate Codex task sends a controlled message to the active agent. The widget does not create the task. The active agent validates current state and host support, treats the click as an explicit task request, uses the host task action when available, and reports the real result.
- R-BACKLOG-APP-10 (MUST): the existing `work.backlog-cache.write` operation remains the only live-review cache write surface. The live path adds no publish tool and does not store task activity, UI state, or conversation content in `backlog_review_cache`.
- R-BACKLOG-APP-11 (MUST): the W24 `backlog` MCP profile contains the snapshot, cache lookup, cache write, live open, live refresh, and UI resource surfaces. The `all` profile contains their exact union membership. W25 adds no separate registry, access model, or profile selector.
- R-BACKLOG-APP-12 (MUST): the live path preserves stdio. It adds Streamable HTTP only when the selected compatible host requires that transport, and the adapter uses the same server factory, registry, handlers, schemas, and access rules.
- R-BACKLOG-APP-13 (MUST): all repository text and report data are untrusted. The UI uses safe text rendering, a narrow content security policy, no unapproved external domain, and no hidden project, Git, Store, installation, or host mutation.

### Human outcomes

The capability follows the [Human Experience Contract](../../.make-docs/system/contracts/human-experience-contract.md).

- R-BACKLOG-HX-1 (MUST): a reader can identify current focus and the next useful action before reading machine detail.
- R-BACKLOG-HX-2 (MUST): a reader can distinguish recorded state from inferred relevance and recommended order.
- R-BACKLOG-HX-3 (MUST): a reader can identify open phases, remaining tasks, closeout gaps, blockers, and conflicting evidence for an included wave.
- R-BACKLOG-HX-4 (MUST): a reader can reach the source evidence for a material claim without first learning an unexplained internal identifier.
- R-BACKLOG-HX-5 (MUST): the report preserves the difference between complete implementation, complete phase tasks, accepted closeout, and closed wave history.
- R-BACKLOG-HX-6 (MUST): a reader can use one stable set of wave statuses while still seeing the specific reason for each classification.
- R-BACKLOG-HX-7 (MUST): a person who receives an error or material limit can understand its context, effect on the requested work, and next useful action without first understanding Make Docs internals.
- R-BACKLOG-HX-8 (MUST): a repeat review can reuse unchanged per-record analysis without hiding current repository changes or requiring Store access.
- R-BACKLOG-HX-9 (MUST): a maintainer can inspect and save the normalized report data from the report without managing a second required file.
- R-BACKLOG-HX-10 (MUST): the report introduction tells a reader what the project is and its current status or objective before report detail. It does not use that space for metrics, technical proof, or report-use instructions.
- R-BACKLOG-HX-11 (MUST): a reader can identify which wave each Next or wave-specific Attention item affects before acting, can focus the Backlog on that wave with one action, and can clear that focus without losing the selected status filter.
- R-BACKLOG-HX-12 (MUST): a compatible host gives the user a live review by default, while the user keeps direct control over whether a static file is created.
- R-BACKLOG-HX-13 (MUST): a live refresh tells the user whether facts changed, which records changed, what remains current, and whether further agent work is required.
- R-BACKLOG-HX-14 (MUST): a wave review or separate-task action names the affected wave, states what the active agent will attempt, and reports the actual host result without claiming success early.
- R-BACKLOG-HX-15 (MUST): live capability, transport, Store, and host-action limits use natural explanations and preserve a useful fallback.

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
- recommendation order with rationale and one exact included-record reference per item;
- attention findings with either one exact included-record reference or an explicit backlog-wide null reference;
- claim evidence class: `fact`, `inference`, or `recommendation`;
- confidence and evidence limits for non-facts;
- display labels and compact explanatory copy;
- a nullable `projectLead` with bounded context sources and exactly two or three role-ordered, source-backed sentences; and
- delivery capability and session identity needed for the live view; and
- one normalized model consumed by live, static, chat, and data rendering.

The report model does not modify the snapshot or project records. Live UI state and a saved HTML file are report presentation, not product authority or operational state.

`projectLead` separates context from prose. Its sources use the deterministic collector and carry a role, repository-relative path, heading, line, bounded excerpt, and content hash. Its sentences use `purpose`, `currentStatus`, or `currentObjective` roles and cite only supplied source ids for the same role. Purpose is first. Current status or objective is second. The optional third sentence uses the remaining current role. When the collector cannot supply purpose plus one current role, `projectLead` is null and the agent explains the omission instead of fabricating text.

The optional cache stores bounded per-record report fragments only. It does not cache or replace the current deterministic snapshot. A review always recomputes cross-record values from the current full snapshot. The cache key is exact and includes checkout identity, record path, deterministic record digest, snapshot schema version, rule catalog version, and Skill version.

The report model has one stable snapshot identity and exact project and record references for live actions. Local selected filter, search text, sort direction, disclosure state, theme, and active Work or Data tab do not become report authority. The model extends version 1 additively when possible. A breaking session or action shape requires `BacklogReportV2`, a migration rule, and live/static parity fixtures.

`waveStatus` is the only field that controls exact status filtering and semantic color. `statusReason` supplies the visible badge text. Archive location controls archived scope. An attention finding can refer to any wave and does not change that wave's `waveStatus`.

Every recommendation-order `recordPath` and every non-null Attention `recordPath` resolves to exactly one record in the same report. The matched record supplies the visible wave coordinate. A null Attention path means the finding applies to the Backlog as a whole and uses `Backlog finding`. Agent-written claim text does not carry this identity contract.

The four fixed tallies use these formulas:

- `workRecordsFound = liveRecords + archivedRecords`;
- `workRecordsStillInScope = liveRecords where waveStatus != history`;
- `historicalRecords = liveRecords where waveStatus == history`; and
- `archivedRecords = records in the archive work namespace`.

The report validates that `workRecordsFound` equals the sum of the other three values. The interactive wave list has no record-count limit. Chat summary choices do not change the totals or shared record set. The in-report data view and user-started JSON download expose this same normalized model. They do not export a filter-reduced substitute.

Code anchors:

- `packages/cli/src/operations/`
- `packages/skills/backlog-review/`

## Integrations

- [PRD 08](08-skills-catalog-and-distribution.md) owns first-party Skill source, packaging, installation, upgrade, and independence.
- [PRD 14](14-lifecycle-workflow-and-coverage-passes.md) owns lifecycle meaning and phase-close behavior.
- [PRD 23](23-generated-document-metadata-and-lifecycle-handoffs.md) owns generated document metadata and lifecycle handoffs.
- [PRD 25](25-typescript-runtime-cli-mcp-operation-boundaries.md) owns the deterministic-versus-agentic boundary and shared TypeScript core.
- [PRD 38](38-global-store-and-project-state.md) owns the Global Store location, safety, lifecycle, privacy, migration, and rebuildable-cache boundary. PRD 51 owns the review-cache meaning and exact identity.
- [PRD 39](39-cli-command-model-and-operation-registry.md) owns registry admission, CLI projection, MCP derivation, JSON parity, and shared error meaning.
- [PRD 49](49-human-experience-standard-and-intent.md) owns the Human Experience standard and review lens.
- [PRD 50](50-proportionate-testing-and-human-centered-validation.md) owns testing selection and evidence use.
- [W22 R0](../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md) closed its P6 platform proof at commit `edd9d7e4`. W23 uses that closeout or later accepted authority as its shared-surface baseline. A W22 publication or release is not a W23 prerequisite. W23 implementation still requires separate owner authority.
- [W24 R0 MCP Tool Profiles](../plans/2026-09-24-w24-r0-mcp-tool-profiles/00-overview.md) owns the shared profile selector, descriptor metadata, server factory, resource filtering, and `all` union. W25 consumes its `backlog` profile after that authority is accepted.
- [MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui) defines the current UI resource, `tools/call`, `ui/message`, capability, and result-channel contracts used by W25.
- [MCP server build guide](https://developers.openai.com/plugins/build/mcp-server) defines the current remote Streamable HTTP guidance. W25 adds that transport only when the selected compatible host needs it.

## Rebuild Notes

- Preserve the separation between deterministic facts and agent judgment. Do not move recommendation logic into the operation to make report generation easier.
- Keep repository facts available without the Store. Do not add a local state file as a fallback.
- Always collect the current snapshot before cache lookup. Keep the cache optional, exact-match only, rebuildable, privacy-bounded, and outside the project.
- Rebuild portfolio-level conclusions from the current full snapshot. Never reuse a cached portfolio summary or recommendation order.
- Keep one public snapshot operation until a separate reusable need justifies more registry entries.
- Preserve raw recorded statuses and source conflicts. Do not create one synthetic status that hides why records disagree.
- Render chat and HTML from the same report model so visual changes cannot change product meaning.
- Render the live MCP App, static HTML, chat orientation, and Data view from the same validated report model.
- Select the live route through capabilities. Do not use a host product name as the feature flag.
- Do not create a static report during live open or fallback. Wait for an explicit user request.
- Keep display-only widget actions local. Use `tools/call` only for declared server actions and `ui/message` only for bounded requests to the active agent.
- Keep task creation in the active host agent. The widget can request it but cannot create it or claim it started.
- Reuse the existing cache write after full model validation. Do not add a live publish tool or mix task activity into the review cache.
- Keep the HTML template self-contained and treat all project content as untrusted text.
- Build project-lead context through the bounded deterministic collector. Keep agent freedom limited to concise wording supported by the supplied excerpts. Never replace missing context with report metrics or generic project prose.
- Expose raw report data from the embedded model only through an accessible view and a user-started download. Do not make a companion file part of the default output.
- Validate report-item references against the full included record set. Derive visible coordinates from matched records instead of depending on agent wording. Keep null Attention references visibly backlog-wide.
- Keep Next and wave-specific Attention navigation accessible, reversible, and independent from wave source links and disclosure controls.
- Preserve the agentic fallback and twin review even when deterministic tooling is available in the maintainer repository.
- Apply the W22 R0 gate before P2 changes a shared surface. Do not add a temporary dispatcher, Store adapter, setup path, trust path, or MCP-only implementation.

Code anchors:

- `docs/assets/project/developing-deterministic-agentic-twins.md`
- `docs/plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/`
- `packages/cli/src/operations/`
- `packages/skills/`

## Requirement History

### 2026-09-22 — W23 R0 P6 report-item traceability and navigation

- Affected requirement or section: Scope; First-party backlog-review Skill; Chat report; Single-file interactive report; Human outcomes; Report model; Rebuild Notes.
- Previous contract: Next items carried a `recordPath`, but the report did not have to show the matched coordinate or validate that every displayed path matched an included record. Attention items could be wave-specific or report-wide, but the report-wide label was not fixed. List items did not focus the Backlog, and search had no template-owned clear control.
- Replacement contract: Every Next reference and every non-null Attention reference must match exactly one included record. Chat and HTML show the matched coordinate outside agent prose. Null Attention references use `Backlog finding`. Wave-specific items focus Backlog Work by selecting `All` and searching for the coordinate. Search provides a conditional accessible clear control.
- Rationale: A recommended action is not useful when a reader cannot tell which wave it affects. Visible deterministic identity and one-action navigation remove that ambiguity without expanding agent inference or changing source facts.
- Source: Owner review of the retained 70-record report and the [P6 work record](../work/2026-09-18-w23-r0-backlog-review-and-reporting/06-report-item-traceability-and-navigation.md).

### 2026-09-21 — W23 R0 P4 project-lead correction

- Affected requirement or section: First-party backlog-review Skill; Single-file interactive report; Human outcomes; Report model; Rebuild Notes.
- Previous contract: The template wrote a fixed lead from the total record count and filter instructions. The report model carried no project-summary context or lead text.
- Replacement contract: One deterministic bounded collector supplies project-purpose and current-context excerpts. The normalized report carries a nullable, role-ordered, source-backed two-to-three-sentence project lead. The agent summarizes only supplied context, and the renderer displays or hides the normalized value without inventing fallback prose.
- Rationale: The report introduction must help a person understand the project and its present goal. Backlog metrics and report instructions already have dedicated surfaces and do not describe the project.
- Source: Owner review of the corrected P4 report and the [P4 work record](../work/2026-09-18-w23-r0-backlog-review-and-reporting/04-single-file-interactive-report.md).

### 2026-09-20 — W23 R0 P5 authority reconciliation

- Affected requirement or section: Scope; First-party backlog-review Skill; Single-file interactive report; Human outcomes; Report model; Integrations; Rebuild Notes.
- Previous contract: Every run performed full agent review. The report had no direct raw-data view or user-started JSON download. The core snapshot and the complete report flow were Store-free.
- Replacement contract: The snapshot remains Store-free and always runs. The Skill can reuse only exact per-record review matches from an optional rebuildable Global Store cache, rebuilds every portfolio-level conclusion from the current full snapshot, completes a full stateless review when Store use fails, and exposes its embedded normalized report model through an accessible data view and user-started JSON download.
- Rationale: The first real 70-record report isolated most elapsed time to agent review and report-model assembly. Exact per-record reuse can reduce repeated work without weakening repository authority, current change detection, portability, privacy, or the one-file report.
- Source: [W23 R0 plan](../plans/2026-09-18-w23-r0-backlog-review-and-reporting/00-overview.md), [P5 plan](../plans/2026-09-18-w23-r0-backlog-review-and-reporting/05-incremental-review-cache-and-data-access.md), and [P5 work record](../work/2026-09-18-w23-r0-backlog-review-and-reporting/05-incremental-review-cache-and-data-access.md).

### 2026-09-21 — W23 R0 P5 cache-operation preflight

- Affected requirement or section: Component and Capability Map; Backlog review cache operations.
- Previous contract: PRD 51 required exact cache lookup and writing through the Global Store boundary but did not define the public operation count, stable operation identifiers, access split, or Store-and-cache routing sequence.
- Replacement contract: One read-only bulk lookup operation and one separate write operation derive through the shared registry. The common Store session gate classifies Store access before cache code runs. Lookup then distinguishes cache availability and exact per-record results. Store or cache limits route to the full stateless review.
- Rationale: Separate read and write operations preserve least access. They let a review reuse readable cache entries without requiring permission to write later results.
- Source: Owner-accepted P5 preflight decision in the [P5 work record](../work/2026-09-18-w23-r0-backlog-review-and-reporting/05-incremental-review-cache-and-data-access.md).

### 2026-09-24 — W25 R0 live MCP App delivery

- Affected requirement or section: Purpose; Scope; First-party backlog-review Skill; Chat orientation and fallback; Live MCP App; Human outcomes; Report model; Integrations; Rebuild Notes.
- Previous contract: The Skill returned a concise chat review by default and created the static single-file HTML report only on request. The report could not refresh repository facts or send a controlled request to the active agent.
- Replacement contract: A compatible host receives a live MCP App by default. The Skill still creates static HTML only after an explicit request. One report model feeds live, static, chat, and data views. Two registry operations open and refresh the live review. Controlled widget actions can ask the active agent to review a wave or start a separate task, but the widget cannot act as the agent or create the task directly.
- Rationale: A live review can stay current and support focused human-agent work without removing the portable static result, hiding Store limits, duplicating backlog logic, or giving untrusted project text control over agent instructions.
- Source: [W25 R0 design](../designs/2026-09-24-live-backlog-review-mcp-app.md), [W25 R0 plan](../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-overview.md), and [W25 R0 work backlog](../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md).

## Source Anchors

- [Backlog Review and Reporting design](../designs/2026-09-18-backlog-review-and-reporting.md)
- [W23 R0 Backlog Review and Reporting plan](../plans/2026-09-18-w23-r0-backlog-review-and-reporting/00-overview.md)
- [W23 R0 Backlog Review and Reporting work backlog](../work/2026-09-18-w23-r0-backlog-review-and-reporting/00-index.md)
- [Live Backlog Review MCP App design](../designs/2026-09-24-live-backlog-review-mcp-app.md)
- [W25 R0 Live Backlog Review MCP App plan](../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-overview.md)
- [W25 R0 Live Backlog Review MCP App work backlog](../work/2026-09-24-w25-r0-live-backlog-review-mcp-app/00-index.md)
- [Developing Deterministic and Agentic Twins](../assets/project/developing-deterministic-agentic-twins.md)
- [W22 R0 Store Architecture Recovery and Platform-Neutral Foundation](../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md)
