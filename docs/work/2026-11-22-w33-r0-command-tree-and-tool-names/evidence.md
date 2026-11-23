---
title: "W33 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W33 R0"
---

# W33 R0 Evidence Report

This report explains the acceptance evidence for the [W33 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## P1 Name Catalog and Rules

Covers A1 to A3 in [P1](01-name-catalog-and-rules.md). Evidence date: 2026-11-22. Base commit: `ee6dc50e` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Changed

- `packages/cli/src/operations/name-catalog.ts`: one name catalog with 73 entries. Each entry has the operation ID or tool name, the status, the group, the current CLI path and MCP name, the new CLI path and MCP name, and a reason and an owner decision where a rule left a choice. The module also holds the eleven groups, the end words, the owner decisions, the rule check, the registry coverage check, and the PRD list readers.
- `packages/cli/tests/name-catalog.test.ts`: 39 tests. They check the real catalog, and they use broken fixture entries and changed PRD text to prove that each check fails.
- PRD 39 R-NAME-2 now says that in the `check` group the group word is the verb, so a `check` path ends with its object. PRD 39 R-RUN-1 now lists every current `run` path, including the backlog paths, and calls the work queue and factory commands planned. PRD 25 R-MCP-PROFILE-10 now says `project_list` reads only. Both PRDs have a `2026-11-22 — W33 R0 P1` Requirement History entry.
- Nothing reads the catalog yet. No CLI route, MCP name, help text, alias, Skill, template, or router changed. `registry.ts` and `tools.ts` did not change. Operation IDs did not change.

### Counts (A1)

| Kind | Count |
| --- | --- |
| Current registry operations | 43 |
| Hand-defined MCP tools | 6 |
| Planned operations: W29 R0 work queue | 9 |
| Planned operations: W30 R0 factory | 10 |
| Planned operations: W31 R0 doctor | 2 |
| Planned operations: W32 R0 project list and Store maintenance | 3 |
| Total entries | 73 |

The design said 45 registry operations. The registry holds 43. The test counts the registry, so it will see a change.

### Rule Test Results (A2)

- The catalog passes R-NAME-1 to R-NAME-4, has no shared CLI path or MCP name, and covers every registry operation and hand-defined tool with their current names.
- The current CLI path of each entry matches the registry, and each current MCP name matches the server map. A planned entry that the registry starts to hold fails the test until it is marked current.
- Every `check` entry is a read-only registry operation. No new path is both a full command and the start of a longer command.
- Every word that ends a path is a verb or one of three documented exceptions: `lookup`, `next`, and `status`. Every listed word is used.
- The catalog matches the PRD 52 and PRD 53 operation tables, the PRD 39 R-DOCTOR and R-STORE-CMD tables, R-RUN-1, R-RUN-4, the tool names and operation IDs in PRD 25 R-MCP-PROFILE-1 to R-MCP-PROFILE-10, the five paths in PRD 51 R-BACKLOG-APP-1, and the W29 R0 P1 work store operation list.
- Broken fixtures fail as expected: a group outside R-TOP-1, a path outside its group, a group word inside another group, a bad word, no end verb, a `check` path that ends with a verb, an MCP name that is not the path, a name over 26 characters, a shared path, a shared MCP name, a new name that is another entry's old name, a family split over two groups, a full command that starts a longer command, a path that takes the place of a `setup` command, a missing reason, a shortening that R-NAME-4 does not force, an unknown decision, a missing or extra operation or tool, a changed current name, and a `check` entry that writes or is not in the registry.
- Changed PRD text fails as expected: a changed path, a changed tool, and a missing row in PRD 52; a dropped and an unknown operation in PRD 53; a changed path in R-DOCTOR and R-STORE-CMD; a missing ID and a wrong example in R-RUN-4; a missing active path, an unknown active path, and a missing planned path in R-RUN-1; a stale tool name and an unknown operation ID in R-MCP-PROFILE; and a wrong path in R-BACKLOG-APP-1.

### Name Table

`make-docs` starts every CLI path. "MCP only" means W33 adds no CLI command, and the MCP name uses the path it would have. "none" means no command or tool exists today. This table includes the owner's 2026-11-22 decisions.

#### `setup`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `install_status` | current tool | none | `install_status` | `make-docs setup status` (MCP only) | `setup_status` | MCP only. No CLI command exists, and W33 adds none. The name uses the path it would have. It reads the installed state. ND-10. |
| `install_plan` | current tool | none | `install_plan` | `make-docs setup plan` (MCP only) | `setup_plan` | MCP only. No CLI command exists, and W33 adds none. The name uses the path it would have. `make-docs setup --dry-run` already shows the plan. ND-10. |
| `manifest` | current tool | none | `manifest` | `make-docs setup manifest read` (MCP only) | `setup_manifest_read` | MCP only. No CLI command exists, and W33 adds none. The name uses the path it would have. R-NAME-2 needs the final verb `read`. ND-10. |
| `config` | current tool | none | `config` | `make-docs setup config read` (MCP only) | `setup_config_read` | MCP only. No CLI command exists, and W33 adds none. The name uses the path it would have. R-NAME-2 needs the final verb `read`. ND-10. |
| `compatibility` | current tool | none | `compatibility` | `make-docs setup compatibility check` (MCP only) | `setup_compatibility_check` | MCP only. No CLI command exists, and W33 adds none. The name uses the path it would have. R-NAME-2 needs the final verb `check`. ND-10. |
| `setup.store.check` | planned (W32 R0) | none | none | `make-docs setup store check` | `setup_store_check` |  |
| `setup.store.clean` | planned (W32 R0) | none | none | `make-docs setup store clean` | `setup_store_clean` |  |

#### `project`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `project.state.status` | current | `make-docs project state status` | `project_status` | `make-docs project state status` | `project_state_status` | The owner kept the path. The MCP name now follows R-NAME-3. ND-03. |
| `project.state.recover` | current | `make-docs project state recover` | `project_recover` | `make-docs project state recover` | `project_state_recover` | The owner kept the path. The MCP name now follows R-NAME-3. ND-03. |
| `project.checkout-move.preview` | current | `make-docs project checkout-move preview` | `checkout_move_preview` | `make-docs project move preview` | `project_move_preview` | Shortened: `project_checkout_move_preview` has 29 characters. Design row. ND-04. |
| `project.checkout-move.apply` | current | `make-docs project checkout-move apply` | `checkout_move_apply` | `make-docs project move apply` | `project_move_apply` | Shortened: `project_checkout_move_apply` has 27 characters. ND-04. |
| `project.checkout-register.preview` | current | `make-docs project checkout-register preview` | `checkout_register_preview` | `make-docs project checkout preview` | `project_checkout_preview` | Shortened: `project_checkout_register_preview` has 33 characters. ND-05. |
| `project.checkout-register.apply` | current | `make-docs project checkout-register apply` | `checkout_register_apply` | `make-docs project checkout apply` | `project_checkout_apply` | Shortened: `project_checkout_register_apply` has 31 characters. ND-05. |
| `project.persona.list` | current | `make-docs project persona list` | `personas` | `make-docs project persona list` | `project_persona_list` | R-NAME-2 needs a final verb, so the design row `project personas` is not used. ND-02. |
| `project.layout.preview` | current | `make-docs project layout preview` | `layout_preview` | `make-docs project layout preview` | `project_layout_preview` |  |
| `project.layout.prepare` | current | `make-docs project layout prepare` | `layout_prepare` | `make-docs project layout prepare` | `project_layout_prepare` |  |
| `project.layout.apply` | current | `make-docs project layout apply` | `layout_apply` | `make-docs project layout apply` | `project_layout_apply` |  |
| `project.layout.verify` | current | `make-docs project layout verify` | `layout_verify` | `make-docs project layout verify` | `project_layout_verify` |  |
| `project.surface.ensure` | current | `make-docs project surface ensure` | `surface_ensure` | `make-docs project surface ensure` | `project_surface_ensure` |  |
| `project.path-hygiene.validate` | current | `make-docs project path-hygiene validate` | `paths_validate` | `make-docs project paths validate` | `project_paths_validate` | Shortened: `project_path_hygiene_validate` has 29 characters. ND-06. |
| `project.path-hygiene.repair` | current | `make-docs project path-hygiene repair` | `paths_repair` | `make-docs project paths repair` | `project_paths_repair` | Shortened: `project_path_hygiene_repair` has 27 characters. ND-06. |
| `project.register.list` | planned (W32 R0) | none | none | `make-docs project list` | `project_list` | PRD 39 R-STORE-CMD names `make-docs project list`. The earlier plan named the tool `project_register_list`. |
| `project.doctor.check` | planned (W31 R0) | none | none | `make-docs project doctor check` | `project_doctor_check` |  |
| `project.doctor.fix` | planned (W31 R0) | none | none | `make-docs project doctor fix` | `project_doctor_fix` |  |

#### `resource`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `resource.list` | current | `make-docs resource list` | `resource_list` | `make-docs resource list` | `resource_list` |  |
| `resource.read` | current | `make-docs resource read` | `resource_read` | `make-docs resource read` | `resource_read` |  |
| `resource.ensure` | current | `make-docs resource ensure` | `resource_ensure` | `make-docs resource ensure` | `resource_ensure` |  |

#### `work`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `work.item.resolve` | current | `make-docs run work item resolve` | `work_item_resolve` | `make-docs work item resolve` | `work_item_resolve` | The owner kept the path and the MCP name instead of the design row `work resolve`. ND-09. |
| `work.evidence.record` | current | `make-docs run work evidence record` | `evidence_record` | `make-docs work evidence record` | `work_evidence_record` |  |
| `work.evidence.read` | current | `make-docs run work evidence read` | `evidence_read` | `make-docs work evidence read` | `work_evidence_read` |  |
| `work.queue.status` | planned (W29 R0) | none | none | `make-docs work status` | `work_status` |  |
| `work.queue.sync` | planned (W29 R0) | none | none | `make-docs work sync` | `work_sync` |  |
| `work.queue.next` | planned (W29 R0) | none | none | `make-docs work next` | `work_next` |  |
| `work.queue.claim` | planned (W29 R0) | none | none | `make-docs work claim` | `work_claim` |  |
| `work.queue.release` | planned (W29 R0) | none | none | `make-docs work release` | `work_release` |  |
| `work.queue.report` | planned (W29 R0) | none | none | `make-docs work report` | `work_report` |  |
| `work.queue.close` | planned (W29 R0) | none | none | `make-docs work close` | `work_close` |  |
| `work.queue.export` | planned (W29 R0) | none | none | `make-docs work export` | `work_export` |  |
| `work.queue.add` | planned (W29 R0) | none | none | `make-docs work add` | `work_add` |  |

#### `backlog`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `work.backlog.snapshot` | current | `make-docs run work backlog snapshot` | `backlog_snapshot` | `make-docs backlog snapshot` | `backlog_snapshot` |  |
| `work.backlog-cache.lookup` | current | `make-docs run work backlog-cache lookup` | `backlog_cache_read` | `make-docs backlog cache lookup` | `backlog_cache_lookup` |  |
| `work.backlog-cache.write` | current | `make-docs run work backlog-cache write` | `backlog_cache_write` | `make-docs backlog cache write` | `backlog_cache_write` |  |
| `backlog.review.open` | current | `make-docs run backlog review open` | `backlog_review_open` | `make-docs backlog review open` | `backlog_review_open` |  |
| `backlog.review.refresh` | current | `make-docs run backlog review refresh` | `backlog_review_refresh` | `make-docs backlog review refresh` | `backlog_review_refresh` |  |

#### `lifecycle`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `lifecycle.start` | current | `make-docs run lifecycle start` | `lifecycle_start` | `make-docs lifecycle start` | `lifecycle_start` |  |
| `lifecycle.show` | current | `make-docs run lifecycle show` | `lifecycle_show` | `make-docs lifecycle show` | `lifecycle_show` |  |
| `lifecycle.list` | current | `make-docs run lifecycle list` | `lifecycle_list` | `make-docs lifecycle list` | `lifecycle_list` |  |
| `lifecycle.checkpoint` | current | `make-docs run lifecycle checkpoint` | `lifecycle_checkpoint` | `make-docs lifecycle checkpoint` | `lifecycle_checkpoint` |  |
| `lifecycle.pause` | current | `make-docs run lifecycle pause` | `lifecycle_pause` | `make-docs lifecycle pause` | `lifecycle_pause` |  |
| `lifecycle.resume` | current | `make-docs run lifecycle resume` | `lifecycle_resume` | `make-docs lifecycle resume` | `lifecycle_resume` |  |
| `lifecycle.attach-evidence` | current | `make-docs run lifecycle attach-evidence` | `lifecycle_attach_evidence` | `make-docs lifecycle attach-evidence` | `lifecycle_attach_evidence` |  |
| `lifecycle.complete` | current | `make-docs run lifecycle complete` | `lifecycle_complete` | `make-docs lifecycle complete` | `lifecycle_complete` |  |
| `lifecycle.fail` | current | `make-docs run lifecycle fail` | `lifecycle_fail` | `make-docs lifecycle fail` | `lifecycle_fail` |  |
| `lifecycle.abandon` | current | `make-docs run lifecycle abandon` | `lifecycle_abandon` | `make-docs lifecycle abandon` | `lifecycle_abandon` |  |

#### `factory`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `factory.status` | planned (W30 R0) | none | none | `make-docs factory status` | `factory_status` |  |
| `factory.tools.save` | planned (W30 R0) | none | none | `make-docs factory tools save` | `factory_tools_save` |  |
| `factory.workflow.save` | planned (W30 R0) | none | none | `make-docs factory workflow save` | `factory_workflow_save` |  |
| `factory.workflow.show` | planned (W30 R0) | none | none | `make-docs factory workflow show` | `factory_workflow_show` |  |
| `factory.workflow.list` | planned (W30 R0) | none | none | `make-docs factory workflow list` | `factory_workflow_list` |  |
| `factory.proof.save` | planned (W30 R0) | none | none | `make-docs factory proof save` | `factory_proof_save` |  |
| `factory.assignment.start` | planned (W30 R0) | none | none | `make-docs factory assignment start` | `factory_assignment_start` |  |
| `factory.assignment.update` | planned (W30 R0) | none | none | `make-docs factory assignment update` | `factory_assignment_update` |  |
| `factory.assignment.list` | planned (W30 R0) | none | none | `make-docs factory assignment list` | `factory_assignment_list` |  |
| `factory.restore` | planned (W30 R0) | none | none | `make-docs factory restore` | `factory_restore` |  |

#### `check`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `prd.authority.validate` | current | `make-docs run prd authority validate` | `prd_validate` | `make-docs check prd` | `check_prd` | Design row. The `check` group word is the verb. ND-01. |
| `performance.evidence.validate` | current | `make-docs run performance evidence validate` | `performance_validate` | `make-docs check performance-evidence` | `check_performance_evidence` | The owner chose the full object. `check_performance_evidence` has 26 characters. ND-07. |
| `uat.scenario.validate` | current | `make-docs run uat scenario validate` | `uat_scenario_validate` | `make-docs check uat scenario` | `check_uat_scenario` | ND-08. |
| `uat.persona.resolve` | current | `make-docs run uat persona resolve` | `uat_persona_resolve` | `make-docs check uat persona` | `check_uat_persona` | It resolves and checks the Persona and changes nothing, so it is a `check`. ND-08. |
| `uat.target.validate` | current | `make-docs run uat target validate` | `uat_target_validate` | `make-docs check uat target` | `check_uat_target` | ND-08. |
| `uat.evidence-reference.validate` | current | `make-docs run uat evidence-reference validate` | `uat_evidence_validate` | `make-docs check uat evidence` | `check_uat_evidence` | Shortened: `check_uat_evidence_reference` has 28 characters. ND-08. |
| `uat.finding.validate` | current | `make-docs run uat finding validate` | `uat_finding_validate` | `make-docs check uat finding` | `check_uat_finding` | ND-08. |
| `uat.result.validate` | current | `make-docs run uat result validate` | `uat_result_validate` | `make-docs check uat result` | `check_uat_result` | ND-08. |

#### `mcp`

| ID | Status | Current CLI | Current MCP | New CLI | New MCP | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| `domains` | current tool | none | `domains` | `make-docs mcp domains list` (MCP only) | `mcp_domains_list` | MCP only. No CLI command exists, and W33 adds none. The name uses the path it would have. It lists operation domains for MCP clients. R-NAME-2 needs the final verb `list`. ND-10. |

### Rules Applied

- R-NAME-1: every path starts with its group. One operation family, such as `work.backlog-cache`, has one group. The backlog snapshot and cache move from `work` to `backlog`, so backlog review lives in one group.
- R-NAME-2: words are lower case with hyphens. Every path ends with a verb, except in `check`, where the group word is the verb (ND-01).
- R-NAME-3: every new MCP name is the new CLI path with spaces and hyphens as underscores.
- R-NAME-4: every new MCP name has at most 26 characters. Seven paths were shortened because their names would pass 26 characters: `project checkout-move preview` (29), `project checkout-move apply` (27), `project checkout-register preview` (33), `project checkout-register apply` (31), `project path-hygiene validate` (29), `project path-hygiene repair` (27), and `check uat evidence-reference` (28).
- No new name is another entry's old name, so P3 can keep every old name as an alias.

### Owner Decisions

The owner decided ND-01 to ND-10 on 2026-11-22. Six were accepted as proposed, and four were changed: ND-03, ND-05, ND-07, and ND-09. The catalog and the table above use the names in force.

| ID | Owner outcome | Name in force | P1 proposal |
| --- | --- | --- | --- |
| ND-01 | Accepted | **`check` paths end with an object.** In the `check` group the group word is the verb, so a path is `check <object>`, such as `check prd`. Every other group ends with a verb. PRD 39 R-NAME-2 holds this exception. | Same as the name in force. |
| ND-02 | Accepted | **`project persona list` keeps its path.** R-NAME-2 needs a final verb, so the design row `project personas` is not used. The path stays `project persona list`, and the MCP name is `project_persona_list`. | Same as the name in force. |
| ND-03 | Changed | **`project state` keeps `state`.** `project state status` and `project state recover` keep their paths. The MCP names become `project_state_status` and `project_state_recover`. | `project status` and `project recover`, with the MCP names `project_status` and `project_recover` unchanged. |
| ND-04 | Accepted | **Checkout move becomes `project move`.** `project checkout-move preview` and `apply` become `project move preview` and `project move apply` (forced: 29 and 27 characters). | Same as the name in force. |
| ND-05 | Changed | **Checkout register becomes `project checkout`.** `project checkout-register preview` and `apply` become `project checkout preview` and `project checkout apply` (forced: 33 and 31 characters). No `project register` subtree exists, so it is not confused with the `project_register` Store table or `project list`. | `project register preview` and `project register apply`. |
| ND-06 | Accepted | **Path hygiene becomes `project paths`.** `project path-hygiene validate` and `repair` become `project paths validate` and `project paths repair` (forced: 29 and 27 characters). | Same as the name in force. |
| ND-07 | Changed | **Performance evidence becomes `check performance-evidence`.** `run performance evidence validate` becomes `check performance-evidence`, and the MCP name is `check_performance_evidence` (26 characters). | `check performance` (`check_performance`). |
| ND-08 | Accepted | **UAT checks become `check uat <object>`.** The six UAT validators become `check uat scenario`, `persona`, `target`, `evidence`, `finding`, and `result`. `evidence-reference` becomes `evidence` (forced: 28 characters). `uat persona resolve` becomes `check uat persona`: it resolves and checks the Persona and changes nothing. | Same as the name in force. |
| ND-09 | Changed | **`work item resolve` keeps its path.** `work item resolve` keeps its path and its MCP name `work_item_resolve`. | The design row `work resolve` (`work_resolve`). |
| ND-10 | Accepted | **Hand-defined tools get paths but no new commands.** `install_status`, `install_plan`, `manifest`, `config`, and `compatibility` go to `setup` as `setup status`, `setup plan`, `setup manifest read`, `setup config read`, and `setup compatibility check`. `domains` goes to `mcp` as `mcp domains list`. W33 adds no CLI command for them, so they are MCP only. | Same as the name in force. |

### Rule Conflicts and Drift Found

- The design row `project personas` has no end verb, so it breaks R-NAME-2. The catalog uses `project persona list` (ND-02, accepted).
- The design row `check prd` ends with an object, not a verb. PRD 39 R-NAME-2 now holds the `check` exception (ND-01, accepted).
- The owner kept `work item resolve` instead of the design row `work resolve` (ND-09). The design example table was updated to `work item resolve` when P1 was committed.
- The design said 45 registry operations. The registry holds 43.
- Fixed in P1: PRD 25 R-MCP-PROFILE-10 said that `project_register_list` reads only. It now says `project_list`.
- Fixed in P1: PRD 39 R-RUN-1 called the planned factory commands active and left out the current `run work backlog`, `run work backlog-cache`, and `run backlog review` paths. It now lists them and calls the work queue and factory commands planned.
- Two status names will exist: `setup status` (MCP only, from `install_status`) and `project state status`. ND-10 covers this.

### Commands Run

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npx vitest run tests/name-catalog.test.ts`: 39 passed.
- `npx vitest run`: 2148 passed, 4 failed, 6 skipped. Three failures exist without this phase: two stdio tests in `tests/mcp-app-contract.test.ts` and the sandbox-only fixture 11 in `tests/p5-migration-safety.test.ts`. The fourth, a `tests/cli.test.ts` reconfigure test, timed out at 15 seconds under load and passes alone.
- `npm run build`, then `node packages/cli/dist/index.js run prd authority validate --target-root .`: status `passed`, 37 PRD files and 734 Markdown files scanned, 1432 links scanned, no diagnostics.

### Limits

- The catalog is a contract. P2 builds the command tree and MCP names from it. P3 adds the aliases.
- The PRD checks read the PRD 52 and PRD 53 operation tables, the PRD 39 R-DOCTOR and R-STORE-CMD tables, R-RUN-1, R-RUN-4, PRD 25 R-MCP-PROFILE-1 to R-MCP-PROFILE-10, and PRD 51 R-BACKLOG-APP-1. They do not read other PRDs that name commands. P4 moves shipped text to the new names.
- The R-MCP-PROFILE check reads tool names that have an underscore. One-word names such as `domains` look like profile names, so it does not check them.
- Profile membership of the new MCP names is not in the catalog. P2 owns it.
- A3: the owner accepted the names on 2026-11-22. The last step is the owner's final look at this updated table.
