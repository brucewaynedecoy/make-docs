---
title: "Live Backlog Review MCP App"
kind: "design"
status: "draft"
coordinate: "W25 R0"
follow_on:
  route: "change-plan"
  next_prompt: "../../.make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "The design changes the default Backlog Review delivery mode while preserving the accepted static report."
  coordinate_handoff: "Carry W25 R0 into the change plan, PRD 51 reconciliation, and work backlog."
source:
  type: "manual-request"
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "none"
  reason: "The requested package follows the design, plan, PRD, and work order before implementation."
---

# Live Backlog Review MCP App

## Purpose

Make Backlog Review a live MCP App that can refresh repository facts, show the current review model, and send bounded requests to the active agent. Preserve the accepted static single-file report for a user who explicitly asks for it.

## Context

W23 R0 created the deterministic backlog snapshot, the optional rebuildable review cache, the shared review model, and the accepted static report. The saved report is useful for offline review, printing, and sharing. It cannot refresh itself or ask the active agent to act.

MCP Apps add a UI resource to an MCP tool result. The UI can call declared tools through `tools/call` and can send a follow-up message through `ui/message`. This design uses those protocol paths. It does not make the widget an agent, and it does not let the widget create a Codex task on its own.

W24 R0 owns the shared MCP profile foundation. W25 R0 consumes the `backlog` profile. It does not create a second registry, permission model, or tool implementation path.

## Human Experience Intent

Impact: `direct`

Affected humans: Maintainers and product owners who need a current view of a large work backlog.

Human goal or effect: A person can refresh facts, inspect the current review model, and ask the active agent to review or start work on one wave without losing the static report option.

Experience promises:

- A compatible host opens the live MCP App by default.
- A static report is created only when the user explicitly asks for one.
- The live and static views show the same facts, statuses, reasons, actions, and limits.
- A refresh says whether facts changed and which records changed.
- Local search, sort, filter, expand, and data-view actions do not call the server.
- An agent request names the exact project, record path, coordinate, snapshot identity, and requested action.
- The page never turns project text into agent instructions.
- If the live UI is unavailable, the agent explains the limit, completes the review in chat, and offers the static report.
- Store failure never blocks a current stateless review.

Complexity kept out of the human path:

- Transport, cache-key, schema, and session details stay hidden until they help explain a limit or failure.
- A person does not have to understand MCP bridge calls to use refresh or request agent help.

Evidence required:

- Prove one compatible host path and live or static meaning parity.
- Review refresh, keyboard, narrow-screen, and safe failure behavior.
- Review one controlled request to the active agent.

## Performance Evidence Candidates

| Candidate | Base action | Applicability | Planned evidence | Gate effect |
| --- | --- | --- | --- | --- |
| `PERF-002` live Backlog Review open and refresh | `create` | `characterize-now` | One cold open, one unchanged refresh, and one refresh after one controlled record change on the accepted 70-record fixture | Speed is informational. Correctness, privacy, accessibility, and safe failure remain blocking. |

No approved latency or bundle-size target exists. The evidence can describe current behavior. It cannot create a product speed promise.

## Decision

### Delivery modes

The Backlog Review Skill has two delivery modes over one shared validated report model.

1. `live` is the default when the active host supports the required MCP Apps capabilities.
2. `static` creates the accepted self-contained HTML report only after an explicit user request.

The Skill does not silently generate both. Opening the live page does not write a static report. A missing UI capability does not count as a request for a static file.

If live UI is unavailable, the Skill completes a concise chat review, explains the limit, and offers the static report. It creates the static report only after the user accepts or asks for it.

### Shared model and renderers

One validated Backlog report model feeds the live MCP App, the static HTML renderer, the concise chat orientation, and the user-started JSON view. The live UI can add local display state. It cannot change the product meaning of the model.

The implementation extends `BacklogReportV1` additively when possible. It creates `BacklogReportV2` only if a breaking session or action contract is required. A version change must include migration and parity fixtures.

### MCP operations

W25 R0 adds two registry operations and their derived MCP tools.

| Operation | Derived MCP tool | Access | Purpose |
| --- | --- | --- | --- |
| `backlog.review.open` | `make_docs_backlog_review_open` | Project read, Store none, host configuration none | Return the versioned MCP App resource and a validated report model. |
| `backlog.review.refresh` | `make_docs_backlog_review_refresh` | Project read, Store read when admitted, host configuration none | Run a current snapshot and exact cache lookup, then report unchanged or changed record facts. |

`backlog.review.open` returns a UI resource at `ui://make-docs/backlog-review/v1.html` with MIME type `text/html;profile=mcp-app`. Its result keeps concise model-visible data in `structuredContent`. It can place the full widget model in client-only result metadata when the host supports that path. Client-only metadata is not secure storage.

`backlog.review.refresh` never writes agent conclusions. It reruns `work.backlog.snapshot`, uses the existing exact cache lookup, and reports the new snapshot identity plus exact hit, miss, rejection, and changed-record facts.

There is no separate publish operation. After the agent completes and validates changed record review, it uses the existing `work.backlog-cache.write` operation as a best-effort step. It then calls `backlog.review.open` with the new validated model. This keeps cache read and write authority separate.

### Widget actions

Search, filter, sort, disclosure, theme, print, data view, and JSON download stay local to the UI.

Refresh calls `backlog.review.refresh` through `tools/call`. If no source facts changed, the current review model remains valid. If facts changed, the UI shows the changed records and asks the active agent for a new review through a controlled `ui/message`.

A wave action sends a fixed action identifier plus the project identity, record path, coordinate, and snapshot identity. It does not send agent-written instructions from project content.

A `Start a new Codex task` action sends a follow-up message to the active conversation. That message asks the active agent to check host support and start a separate task for the named wave. The widget does not call a task-creation API. The active agent treats the click as the explicit user request for that task, validates the current wave, and uses the host task tool only when it is available.

### Cache and activity state

The existing `backlog_review_cache` keeps bounded, rebuildable per-record review fragments. It does not store active-agent state, task progress, UI state, or conversation messages.

If future work needs durable task activity, it must define a separate schema and product owner. W25 R0 does not place that state in the review cache.

The Store remains optional. A Store limit produces a complete stateless review and a natural human explanation when the limit matters.

### MCP profile and transport

The W24 R0 `backlog` profile must include the snapshot tool, cache lookup and write tools, the two live-review tools, and the Backlog Review UI resource. The `all` profile includes the same surfaces as part of its exact union.

W25 R0 keeps the current stdio server path. It adds Streamable HTTP only when the selected compatible host needs that transport. It detects required capabilities. It does not branch on a host product name.

The two tools remain useful without their UI. The shared model, concise chat path, and explicit static report path stay available.

### Safety and trust

All repository text and report data are untrusted input. The UI renders text safely. It uses a narrow content security policy and no external network domain unless later authority names one.

The live UI cannot perform hidden project, Git, Store, installation, or host changes. Each server action follows the shared operation access contract. Agent requests use stable action identifiers and exact record references.

The MCP App resource URI is a cache identity. A breaking UI change gets a new versioned URI.

## Design Lineage

- Relationship: `new-doc-related`.
- Prior design: [Backlog Review and Reporting](2026-09-18-backlog-review-and-reporting.md).
- Reason: W23 R0 remains the accepted source for the snapshot, review model, cache, static report, and report UX. W25 R0 adds a new live delivery and agent-interaction boundary without replacing that design history.

## Alternatives Considered

### Replace the static report

Rejected. The static report remains useful offline and is easy to save, print, and share.

### Generate live and static reports every time

Rejected. This creates an unwanted file and makes the user choose between duplicate outputs.

### Let the widget build agent conclusions

Rejected. The widget cannot replace the Skill's evidence rules, cache validation, or agent judgment.

### Add one tool for every UI action

Rejected. Most actions are local display changes. Extra tools would add context and permission cost without product value.

### Let the widget create a Codex task directly

Rejected. Task creation is a host action. The widget sends an explicit request to the active agent, which checks support and owns the action.

### Store task activity in the review cache

Rejected. Review fragments are rebuildable derived data. Task activity has different lifetime, authority, and privacy needs.

## Consequences

- The default experience becomes live on compatible hosts.
- A user keeps full control over static file creation.
- The package depends on W24 R0 for profile selection and resource exposure.
- The Skill needs capability detection and a clear fallback path.
- Live and static renderers need shared parity fixtures.
- The app adds two public operations but reuses the existing snapshot and cache operations.
- The widget can request agent action but cannot promise that every host can create a separate task.
- A breaking widget resource needs a new versioned resource URI.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read` when the plan flow runs.
- Why: The design changes the default Backlog Review delivery mode while preserving the accepted static report.
- Coordinate Handoff: Carry W25 R0 into the change plan, PRD 51 reconciliation, and work backlog.
