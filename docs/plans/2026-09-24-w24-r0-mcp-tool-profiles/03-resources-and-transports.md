---
title: "W24 R0 P3 Resources And Transports"
kind: "plan"
status: "draft"
coordinate: "W24 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-09-24-mcp-tool-profiles.md"
---
# Phase 3: Resources And Transports

## Purpose

Apply profile scoping to native MCP resources and expose selected profiles over supported transports.

## Resource Assignment

The system-resource provider currently builds native MCP resources from the shipped catalog and resolver. Extend source-owned catalog metadata so each concrete MCP resource URI has an explicit nonempty profile set. The catalog schema and provider validation must reject unknown profiles, missing assignments, and assignments to a URI outside the provider inventory. Do not parse a URI or filename to guess its profile. Update `packages/docs/template/.make-docs/` first. Dogfood the exact shipped catalog and schema into this repo's `.make-docs/` only after source validation.

The `all` resource list is the exact deduplicated union. A narrow `resources/list` returns only its assigned resources. A narrow `resources/read` rejects a URI outside that profile even if it exists in the global provider. It uses the same bytes and provenance as `all` for an allowed URI. Common system resources belong in `core`; workflow, setup, and quality resources may overlap when people need them in more than one task. The Backlog Review UI resource belongs to `backlog` and `all`. The app package owns the UI bytes and its content-security contract.

The existing `make_docs_resource_list` and `make_docs_resource_read` tools remain `core` tools. Native resource discovery and reads remain available in each profile under its own resource assignment. Resource selection is an MCP adapter rule; it does not change the CLI `resource` operations or installed provider inventory.

## Stdio And HTTP

Keep `make-docs mcp` on stdio with `all`. `--profile` selects one filtered stdio server. Use the same `createMakeDocsMcpServer` factory for any Streamable HTTP transport. If a supported MCP App or remote-capable host needs HTTP, provide stable routes at `/mcp/core`, `/mcp/setup`, `/mcp/workflow`, `/mcp/quality`, `/mcp/backlog`, and `/mcp/all`. Keep profile identity fixed per route; do not accept a caller-supplied profile override inside one route.

The local HTTP mode should bind to loopback by default and must not silently become a public listener. A public endpoint would need its own deployment, authentication, logging, and release decision. Transport selection cannot change operation access, caller identity, write confirmation, or result shape. Test route startup and teardown without editing host configuration.

## MCP App Boundary

The Backlog Review app uses the `backlog` UI resource and its two named read-only tools. The widget may call refresh through `tools/call`. After review validation, the agent writes reviewed cache data through the existing `work.backlog-cache.write` operation and calls open again. This write keeps its normal permission checks. A wave or follow-up action sends a bounded `ui/message` to the active agent. The agent checks host support before any new Codex task is created. Do not add a generic arbitrary-prompt tool. Keep agent activity out of `backlog_review_cache`; any later durable activity needs a separate schema or Store table.

## Host Context Behavior

Document a short intent description for each profile. State that profile filtering reduces the connected tool catalog. It reduces model-visible context only when the host selectively connects or defers tool definitions. Where supported, use host tool search and deferred loading. `defaultExposure` metadata records a suggested default but cannot force a host to defer a definition.

## Acceptance

- `resources/list` and `resources/read` enforce the same selected profile.
- An allowed system URI returns the same bytes and provenance in `all` and a narrow profile.
- The backlog UI resource is visible only in `backlog` and `all`.
- Existing stdio configuration still starts and lists the full catalog.
- HTTP paths, if implemented for a supported host, use the same server factory and access policy.
