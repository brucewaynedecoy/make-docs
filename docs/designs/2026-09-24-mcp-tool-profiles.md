---
title: "Make Docs MCP Tool Profiles"
kind: "design"
status: "draft"
coordinate: "W24 R0"
follow_on:
  route: "change-plan"
  next_prompt: "../../.make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "Current PRD 25 and PRD 39 already own the MCP and registry contracts. This design needs surgical authority updates and a delta backlog."
  coordinate_handoff: "W23 R0 owns the earlier Backlog Review report. This distinct end-to-end MCP exposure initiative uses W24 R0. The Backlog Review MCP App package is separate and depends on the W24 profile foundation."
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "none"
  reason: "The requested package follows the design, plan, PRD, and work order before implementation."
source:
  type: "manual-request"
---
# Make Docs MCP Tool Profiles

## Purpose

Let an MCP host connect to the Make Docs tools needed for one kind of work. Keep the existing full MCP connection working.

## Context

At HEAD `54fc805f`, `packages/cli/src/mcp/server.ts` registers every descriptor whose `mcpReady` value is not false. The current connected Make Docs MCP catalog exposes 43 tools. `packages/cli/src/mcp/tools.ts` combines six hand-defined tools with tools derived from the operation registry. The server also lists and reads native system resources without a profile filter. A host that loads the whole server therefore sees the full catalog, even for a narrow task.

The operation registry, shared operation core, access policy, and resource resolver already own behavior. Profile selection must only narrow discovery and invocation. It cannot grant Store, project, or host configuration access. The [current MCP runtime authority](../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) and [operation registry authority](../prd/39-cli-command-model-and-operation-registry.md) remain the product owners.

The Backlog Review MCP App is separate product work. This design supplies its `backlog` profile and resource ownership. The app package will specify its UI and review flow.

## Human Experience Intent

Impact: `direct`

Affected humans: People who configure Make Docs in an MCP host, use its tools through an agent, review backlog reports, or maintain the server.

Human goal or effect: A person can choose a clear Make Docs tool group for the current task and can keep an existing full connection working.

Experience promises:

- A person can identify a profile by its task name and see which tools and resources it exposes.
- An existing `make-docs mcp` connection still exposes the full compatible catalog after upgrade.
- A profile does not change permission, write behavior, or the meaning of a tool result.
- A person sees a clear error for an unknown profile or a resource outside the selected profile.

Complexity kept out of the human path:

- The person does not have to learn Store tables, registry IDs, or transport internals to select a profile.
- The person does not have to maintain several Make Docs packages or duplicate tool implementations.

Evidence required:

- Compare the existing one-server configuration with the new default `all` profile.
- Inspect each profile's listed tools and resources, then run read and write examples through the existing access policy.
- Review CLI help and one host configuration example for clear profile choices and recovery text.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| Tool definition context for selective hosts | `update-existing` | `characterize-now` | A host can load less tool description text for a narrow task | Whether profiles and host deferral reduce model-visible context | [W24 plan](../plans/2026-09-24-w24-r0-mcp-tool-profiles/00-overview.md) |
| Startup and discovery latency | `update-existing` | `characterize-now` | Profile selection does not make ordinary use unreasonably slow | Whether the filter and transport add material overhead | [W24 plan](../plans/2026-09-24-w24-r0-mcp-tool-profiles/00-overview.md) |

These are characterization baselines. No product latency or token target is approved here. The plan must use bounded measurements and report the host and method used.

## Decision

Keep one CLI, one operation registry, one access model, one resource resolver, and one set of implementations. Expose filtered MCP server profiles named `core`, `setup`, `workflow`, `quality`, and `backlog`. Keep `all` as the exact union and as the default for `make-docs mcp`.

| Profile | User intent |
| --- | --- |
| `core` | Inspect installed state, manifest, config, common resources, and operation domains. |
| `setup` | Plan, install, sync, repair, and check compatibility or layout. |
| `workflow` | Run lifecycle and work-evidence operations. |
| `quality` | Validate PRDs, performance evidence, UAT records, and related quality checks. |
| `backlog` | Read backlog snapshots, use the backlog cache, and open or refresh the Backlog Review MCP App. |
| `all` | Expose the union of the five intent profiles for compatibility. |

One tool or resource may belong to several profiles. Every MCP-ready tool and native resource must have at least one explicit profile assignment. Tool metadata belongs on the hand-defined descriptor or the canonical operation descriptor from which an MCP tool is derived. Resource metadata belongs with the shipped resource catalog or app resource descriptor. Do not infer assignments from names, URI paths, or Store use. A representative descriptor is `mcp: { profiles: ["backlog"], defaultExposure: "deferred" }`. `defaultExposure` is host guidance, not a permission or an MCP protocol guarantee.

The server factory accepts a profile, for example `createMakeDocsMcpServer({ profile: "backlog" })`. The CLI accepts `make-docs mcp --profile core|setup|workflow|quality|backlog|all`. Existing `make-docs mcp` remains stdio with `all`. Hosts that need HTTP can select stable Streamable HTTP paths `/mcp/core`, `/mcp/setup`, `/mcp/workflow`, `/mcp/quality`, `/mcp/backlog`, and `/mcp/all`. Add HTTP only for a supported host or MCP App need. Keep the same factory and policy for both transports.

The `backlog` profile owns the Backlog Review UI resource. The later app package supplies `make_docs_backlog_review_open` as a read-only UI launcher and `make_docs_backlog_review_refresh` as a read-only deterministic refresh callable by the UI. It also uses `work.backlog.snapshot`, `work.backlog-cache.lookup`, and `work.backlog-cache.write`. After the agent validates a changed review model, it calls the existing cache write operation and opens the result again. The cache stays a rebuildable data cache. Agent activity does not enter `backlog_review_cache`.

The app package admits `backlog.review.open` and `backlog.review.refresh` through the canonical operation registry. The stable derived tool names are the two names above. The app package owns their typed inputs, outputs, access classes, and handlers.

The widget can send controlled `ui/message` requests for wave or follow-up work to the active agent. It does not create a Codex task directly. The active agent checks host support and user intent before creating a separate task. There is no arbitrary-prompt server tool.

Tool search and deferred loading remain host capabilities. A Make Docs profile can reduce the available catalog, but it only reduces model context when the host selectively connects or defers tools. Roughly ten functions per namespace is a design target, not a protocol limit.

## Alternatives Considered

- Separate MCP packages or copied servers would duplicate release, policy, and tool behavior. The shared-profile factory keeps one authority.
- A flat full catalog with host-only search leaves no stable task-specific endpoint for hosts that select MCP connections.
- Grouping by Store access would place backlog cache tools away from the backlog task. Intent grouping keeps the tools a person needs together.

## Consequences

The operation and resource catalogs gain explicit MCP exposure metadata and completeness checks. The default profile preserves the current one-server configuration. A narrow profile rejects out-of-profile tool calls and resource reads. The implementation must prove that duplicate exposure never changes a tool contract and that `all` is the exact union.

Streamable HTTP adds a transport and security review only when a supported host requires it. It does not imply public deployment. Host documentation must say when selective connection or deferred loading actually saves context.

## Primary References

- [OpenAI tool search](https://developers.openai.com/api/docs/guides/tools-tool-search) describes host-controlled deferred tool loading.
- [OpenAI deployment checklist](https://developers.openai.com/api/docs/guides/deployment-checklist#use-tool_search) recommends grouping by user intent and treats about ten functions per namespace as a design target.
- [OpenAI plugin tool planning](https://developers.openai.com/plugins/plan/tools) frames tools around user goals.
- [OpenAI MCP server guide](https://developers.openai.com/plugins/build/mcp-server) describes Streamable HTTP and authorization checks.
- [OpenAI MCP UI guide](https://developers.openai.com/plugins/build/chatgpt-ui) documents the shared `tools/call` and `ui/message` bridge.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read` when the plan flow runs.
- Why: Current PRD 25 and PRD 39 already own the MCP and registry contracts. This design needs surgical authority updates and a delta backlog.
- Coordinate Handoff: W23 R0 owns the earlier Backlog Review report. This distinct end-to-end MCP exposure initiative uses W24 R0. The Backlog Review MCP App package is separate and depends on the W24 profile foundation.
