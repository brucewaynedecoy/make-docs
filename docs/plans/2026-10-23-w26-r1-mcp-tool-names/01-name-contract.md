---
title: "W26 R1 P1 MCP Name Contract"
kind: "plan"
status: "draft"
coordinate: "W26 R1 P1"
---

# W26 R1 P1 MCP Name Contract

## Purpose

Set every public MCP tool name before changing source. The current names come from `make_docs_` plus the operation ID, with six separate hand-defined names. The MCP server already supplies the Make Docs identity, so that repeated prefix adds length without clarifying the task.

## Rules

1. Use lowercase `snake_case` names with a verb where the tool changes or checks a state.
2. Keep domain words where a bare verb would be unclear. Use `lifecycle_` and `uat_` for those groups.
3. Keep each name at most 26 characters. Use one exact name per operation and no duplicate names in the whole server.
4. Keep operation IDs and CLI commands unchanged. The registry still supplies the operation, schema, access class, and handler. The name table is only its MCP projection.
5. Show only new names in `tools/list`. Old names do not remain as visible aliases. An old saved call must use the migration table below. Do not claim that a profile rename or new server entry is needed.
6. Keep profile membership and native resources unchanged. A hidden tool still fails in that profile.

## Hand-Defined Tools

| Current name | New name |
| --- | --- |
| `make_docs_operation_domains` | `domains` |
| `make_docs_installed_state` | `install_status` |
| `make_docs_manifest_read` | `manifest` |
| `make_docs_config_read` | `config` |
| `make_docs_compatibility_classify` | `compatibility` |
| `make_docs_install_plan` | `install_plan` |

## Registry Operations

| Operation ID | Current name | New name |
| --- | --- | --- |
| `prd.authority.validate` | `make_docs_prd_authority_validate` | `prd_validate` |
| `performance.evidence.validate` | `make_docs_performance_evidence_validate` | `performance_validate` |
| `work.item.resolve` | `make_docs_work_item_resolve` | `work_item_resolve` |
| `work.evidence.record` | `make_docs_work_evidence_record` | `evidence_record` |
| `work.evidence.read` | `make_docs_work_evidence_read` | `evidence_read` |
| `work.backlog.snapshot` | `make_docs_work_backlog_snapshot` | `backlog_snapshot` |
| `work.backlog-cache.lookup` | `make_docs_work_backlog_cache_lookup` | `backlog_cache_read` |
| `work.backlog-cache.write` | `make_docs_work_backlog_cache_write` | `backlog_cache_write` |
| `resource.list` | `make_docs_resource_list` | `resource_list` |
| `resource.read` | `make_docs_resource_read` | `resource_read` |
| `resource.ensure` | `make_docs_resource_ensure` | `resource_ensure` |
| `project.state.status` | `make_docs_project_state_status` | `project_status` |
| `project.state.recover` | `make_docs_project_state_recover` | `project_recover` |
| `project.persona.list` | `make_docs_project_persona_list` | `personas` |
| `project.layout.preview` | `make_docs_project_layout_preview` | `layout_preview` |
| `project.layout.prepare` | `make_docs_project_layout_prepare` | `layout_prepare` |
| `project.layout.apply` | `make_docs_project_layout_apply` | `layout_apply` |
| `project.layout.verify` | `make_docs_project_layout_verify` | `layout_verify` |
| `project.surface.ensure` | `make_docs_project_surface_ensure` | `surface_ensure` |
| `project.path-hygiene.validate` | `make_docs_project_path_hygiene_validate` | `paths_validate` |
| `project.path-hygiene.repair` | `make_docs_project_path_hygiene_repair` | `paths_repair` |
| `lifecycle.start` | `make_docs_lifecycle_start` | `lifecycle_start` |
| `lifecycle.show` | `make_docs_lifecycle_show` | `lifecycle_show` |
| `lifecycle.list` | `make_docs_lifecycle_list` | `lifecycle_list` |
| `lifecycle.checkpoint` | `make_docs_lifecycle_checkpoint` | `lifecycle_checkpoint` |
| `lifecycle.pause` | `make_docs_lifecycle_pause` | `lifecycle_pause` |
| `lifecycle.resume` | `make_docs_lifecycle_resume` | `lifecycle_resume` |
| `lifecycle.attach-evidence` | `make_docs_lifecycle_attach_evidence` | `lifecycle_attach_evidence` |
| `lifecycle.complete` | `make_docs_lifecycle_complete` | `lifecycle_complete` |
| `lifecycle.fail` | `make_docs_lifecycle_fail` | `lifecycle_fail` |
| `lifecycle.abandon` | `make_docs_lifecycle_abandon` | `lifecycle_abandon` |
| `uat.scenario.validate` | `make_docs_uat_scenario_validate` | `uat_scenario_validate` |
| `uat.persona.resolve` | `make_docs_uat_persona_resolve` | `uat_persona_resolve` |
| `uat.target.validate` | `make_docs_uat_target_validate` | `uat_target_validate` |
| `uat.evidence-reference.validate` | `make_docs_uat_evidence_reference_validate` | `uat_evidence_validate` |
| `uat.finding.validate` | `make_docs_uat_finding_validate` | `uat_finding_validate` |
| `uat.result.validate` | `make_docs_uat_result_validate` | `uat_result_validate` |

The table is the migration list for saved prompts and direct `tools/call` clients. It does not require another MCP server entry. The installed binary will keep listing old names until it is replaced by an approved new package.

## PRD Change

Update PRD 39 R-MIG-3 from automatic spelling to an explicit, checked name projection. State that operation IDs stay stable and every active operation has exactly one public MCP name. Update PRD 25 to require the new list and shared handlers. Add dated requirement history for the replaced name rule.

## Acceptance

The table covers all six hand-defined tools and all 37 current registry operations. Each new name is distinct and 26 characters or less. A new operation without a chosen MCP name fails validation instead of silently gaining a long name.
