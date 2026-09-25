---
title: "W24 R0 P2 Profile Inventory And Discovery"
kind: "plan"
status: "draft"
coordinate: "W24 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-09-24-mcp-tool-profiles.md"
---
# Phase 2: Profile Inventory And Discovery

## Purpose

Assign every current MCP-ready tool by user intent and make profile selection a checked server contract.

## Descriptor Contract

Add `mcp: { profiles: McpProfile[], defaultExposure: "eager" | "deferred" }` to each ready tool descriptor. Put this metadata on the six hand-defined descriptors and on each canonical operation definition for derived tools. Derive the MCP descriptor from that operation definition. Keep one operation ID, tool name, schema, description, handler, access fact, and write policy across all profiles. `defaultExposure` is advice for hosts that can defer tools. It does not change MCP visibility on its own.

Reject an empty or unknown profile assignment at build or server initialization. Reject a ready tool that lacks metadata. Keep `mcpReady` admission independent of profile membership. If a new operation becomes MCP-ready, its profile assignment must land in the same change. A profile filter selects from the ready catalog; it does not change the registry or caller admission rules. Tools assigned to several profiles appear once in `all`.

## Current 43-Tool Assignment

The following table is the W24 starting assignment for the 43 tools observed in the connected Make Docs catalog on 2026-09-24. Reconcile it against the implementation inventory before coding. Future additions need explicit assignments. Profile names in one cell indicate one shared tool contract.

| Tool | Profiles |
| --- | --- |
| `make_docs_compatibility_classify` | `setup` |
| `make_docs_config_read` | `core`, `setup` |
| `make_docs_install_plan` | `setup` |
| `make_docs_installed_state` | `core`, `setup` |
| `make_docs_lifecycle_abandon` | `workflow` |
| `make_docs_lifecycle_attach_evidence` | `workflow` |
| `make_docs_lifecycle_checkpoint` | `workflow` |
| `make_docs_lifecycle_complete` | `workflow` |
| `make_docs_lifecycle_fail` | `workflow` |
| `make_docs_lifecycle_list` | `workflow` |
| `make_docs_lifecycle_pause` | `workflow` |
| `make_docs_lifecycle_resume` | `workflow` |
| `make_docs_lifecycle_show` | `workflow` |
| `make_docs_lifecycle_start` | `workflow` |
| `make_docs_manifest_read` | `core`, `setup` |
| `make_docs_operation_domains` | `core` |
| `make_docs_performance_evidence_validate` | `quality` |
| `make_docs_prd_authority_validate` | `quality` |
| `make_docs_project_layout_apply` | `setup` |
| `make_docs_project_layout_prepare` | `setup` |
| `make_docs_project_layout_preview` | `setup` |
| `make_docs_project_layout_verify` | `setup` |
| `make_docs_project_path_hygiene_repair` | `setup` |
| `make_docs_project_path_hygiene_validate` | `setup`, `quality` |
| `make_docs_project_persona_list` | `core`, `workflow` |
| `make_docs_project_state_recover` | `setup` |
| `make_docs_project_state_status` | `core`, `setup` |
| `make_docs_project_surface_ensure` | `setup` |
| `make_docs_resource_ensure` | `setup` |
| `make_docs_resource_list` | `core` |
| `make_docs_resource_read` | `core` |
| `make_docs_uat_evidence_reference_validate` | `quality` |
| `make_docs_uat_finding_validate` | `quality` |
| `make_docs_uat_persona_resolve` | `quality` |
| `make_docs_uat_result_validate` | `quality` |
| `make_docs_uat_scenario_validate` | `quality` |
| `make_docs_uat_target_validate` | `quality` |
| `make_docs_work_backlog_cache_lookup` | `backlog` |
| `make_docs_work_backlog_cache_write` | `backlog` |
| `make_docs_work_backlog_snapshot` | `backlog` |
| `make_docs_work_evidence_read` | `workflow` |
| `make_docs_work_evidence_record` | `workflow` |
| `make_docs_work_item_resolve` | `workflow` |

This starting map yields 8 `core`, 15 `setup`, 14 `workflow`, 9 `quality`, and 3 `backlog` tool memberships. Membership totals exceed 43 because some tools serve more than one intent. The `all` profile must still list exactly 43 unique current tools. The rough ten-function namespace target does not require moving a needed operation away from its task. Hosts with tool search should defer larger or less common groups.

## Backlog Review App Reservation

The separate app package will add these descriptors to `backlog` and therefore `all`:

| Operation and derived tool | Access and caller |
| --- | --- |
| `backlog.review.open` → `make_docs_backlog_review_open` | Read-only agent call that returns the live Backlog Review UI resource. |
| `backlog.review.refresh` → `make_docs_backlog_review_refresh` | Read-only deterministic refresh callable by the UI. |

These are reserved contract names, not claims that handlers exist now. After review validation, the agent uses the existing `work.backlog-cache.write` operation and calls open again. The app package owns operation admission, inputs, outputs, access metadata, review validation, and UI behavior. W24 ensures the profile metadata and registration seam can admit them without a second server or access model.

## Discovery And Invocation

`createMakeDocsMcpServer({ profile })` accepts only the six named values and defaults to `all`. Registration filters tools from one descriptor set. MCP `tools/list` shows only that profile's ready tools. MCP `tools/call` for a hidden name fails as an unknown tool for that server. Direct adapter helpers used in tests must not silently bypass a selected profile. Unknown profiles fail before server startup with a message that lists the allowed values. Stable tool names and schemas do not change with profile.

The CLI parses `make-docs mcp --profile <name>`. It accepts `--help` and no unrelated flags on the stdio path. Its default remains `all`. The generated one-server configuration that runs `make-docs mcp` remains valid.

## Acceptance

- A machine check compares the ready inventory to explicit assignments in both directions.
- `all` equals the deduplicated union of the five named profiles.
- A tool in two profiles has the same schema, description, access, and handler.
- Backlog cache tools appear in `backlog` despite their Store access class.
- The current one-server tool list remains compatible.
