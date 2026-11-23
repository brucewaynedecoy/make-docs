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

## P2 Command Tree and Tool Names

Covers A4 to A6 in [P2](02-command-tree-and-tool-names.md). Evidence date: 2026-11-23. Base commit: `10674ba6` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Changed

- `packages/cli/src/operations/registry.ts`: every operation's CLI projection is its new path from the name catalog. The CLI roots are the eleven PRD 39 R-TOP-1 groups. `run` is not a root. An operation with no projection now fails instead of falling back to `run`. New `operationFullCliPath()` gives the group and the path.
- `packages/cli/src/mcp/tools.ts`: the hand-picked `MCP_TOOL_NAME_BY_OPERATION` map is gone. `deriveMcpToolName()` takes the CLI path after `make-docs` and changes spaces and hyphens to underscores (R-NAME-3). The six hand-defined tools take their catalog names, and each name is checked against the path it would have. The server fails at load when a name has more than 26 characters (R-NAME-4).
- `packages/cli/src/run/cli.ts`: one dispatcher runs the `work`, `backlog`, `lifecycle`, `factory`, and `check` groups. It matches the longest full CLI path in the registry projection, so a path need not look like its operation ID (`check prd` runs `prd.authority.validate`). Each group's help comes from the registry. An unknown command lists the valid commands of its group.
- `packages/cli/src/cli.ts`: the top level has the eleven groups and no `run`. `make-docs --help` lists the groups by capability, in plain words. `make-docs project paths validate|repair` replaces `project path-hygiene`. The removed `operations` command now names `make-docs <group> <command>`.
- `packages/cli/src/run/root-operations.ts`: `make-docs project move` replaces `project checkout-move`, and `make-docs project checkout` replaces `project checkout-register`. The project help lists its commands by capability.
- `packages/cli/src/operations/name-catalog.ts`: each current entry's current names are its new names. New `formerCli` and `formerMcp` fields keep the names from before W33 R0 for the P3 aliases. A hand-defined tool's ID is now its new MCP name. The alias-collision rule, the R-RUN-1 check, and the R-MCP-PROFILE check read the former names. New shape rules fail a current entry whose current names are not its new names, and a planned entry with a former name.
- Code messages that named an old command now name the new one: the `--last` lifecycle error, the Store table catalog next action, and the setup checkout-move next action.
- No alias was added. No shipped text, Skill, router, template, or PRD changed. Operation IDs and profile membership did not change.

### Top-Level Help

`make-docs --help` now prints:

```text
make-docs

Set up Make Docs, work with your project's docs and backlog, and serve tools to agents.

Usage:
  make-docs
  make-docs <group> <command> [options]
  make-docs <group> --help

Bare command:
  Run make-docs with no command to see install status (when installed) or start
  a guided setup (when not installed). Bare invocation never syncs.

Global flags:
  --version, -v   Print the installed make-docs version and exit.
  --help, -h      Show help for a group or command.

Groups:
  setup        Install, sync, or remove Make Docs in this project. Set up this computer and check the Store.
  project      See and repair this project: state, checkouts, Personas, layout, paths, and the doctor.
  resource     List, read, or copy Make Docs system resources.
  work         Find work items and record work evidence.
  backlog      Read the backlog, use its review cache, and open the review app.
  lifecycle    Start, track, and finish lifecycle runs.
  factory      Run approved backlog work through workers and review. No commands yet.
  check        Check PRDs, performance evidence, and user test records. Changes nothing.
  mcp          Serve Make Docs tools to agents over MCP.
  update       Update the installed make-docs tool.
  uninstall    Remove make-docs from this computer.

Examples:
  make-docs
  make-docs setup --yes
  make-docs setup system --dry-run
  make-docs project state status
  make-docs resource list
  make-docs work item resolve 'W18 R11 P2'
  make-docs backlog snapshot --target-root .
  make-docs lifecycle list
  make-docs check prd
  make-docs mcp

Use --help or -h with a group to list its commands.
```

### Name Rule (A4, A5)

- Every MCP tool name is the CLI path after `make-docs`, with spaces and hyphens as underscores. No exception exists. The six hand-defined tools have no CLI command (ND-10), so their names use the path they would have.
- The live registry passes the catalog rules. The catalog's current CLI paths equal the registry projection, and its current MCP names equal the derived server names, for all 48 operations and 6 tools.
- 32 CLI paths and 31 MCP names changed. Each old name is kept in `formerCli` or `formerMcp` for P3.
- The longest MCP name is `check_performance_evidence` (26 characters).

### Profile Membership (A6)

A new test in `tests/mcp-profiles.test.ts` holds the W24 profile inventory under the names from before W33 R0. It maps each name through the catalog to its new name and checks that every profile has the same members. It passes for `core`, `setup`, `workflow`, `quality`, and `backlog`. The profile metadata lives on each operation and did not change. Native MCP resources did not change.

### Tests Whose Expectations Changed

Each of these tests pinned an old CLI path or MCP name that P2 made out of date:

- `name-catalog.test.ts`: hand-defined tool IDs are their new names. Fixtures use `formerCli` and `formerMcp`. The R-MCP-PROFILE message says "current, new, or former". New tests check live names, former names, and the new shape rules.
- `run-cli.test.ts`, `reorganization-verification.test.ts`: group argv instead of `run` argv, group help instead of `run` help, the new error text, and the five dispatcher groups instead of the `run` root.
- `cli.test.ts`: the old seven-command help test became an exact help snapshot. A new test checks that each group's help lists its commands. The `operations` guidance names `make-docs <group> <command>`.
- `mcp.test.ts`, `mcp-derivation.test.ts`, `mcp-profiles.test.ts`, `mcp-profile-discovery.test.ts`, `mcp-app-contract.test.ts`: the new tool names, the new MCP help line, and an unknown operation fails with "Unknown operation identifier" because no name map exists.
- `p3-operation-surfaces.test.ts`, `p8-runtime-retirement.test.ts`: the new `check uat evidence` usage and the new error for a retired ID. A retired route is not a group, so it fails with "Unknown argument". Help is read from `make-docs lifecycle --help`.
- `p7-ugt.test.ts`, `prd-authority.test.ts`, `performance-evidence-validator.test.ts`, `backlog-cache.test.ts`, `backlog-snapshot.test.ts`, `w26-p3-cross-interface.test.ts`: `check ...` and `backlog ...` argv instead of `run ...` argv, and the new tool names.
- `w22-r1-ownership.test.ts`, `path-hygiene-cli.test.ts`, `p5-migration-safety.test.ts`: `project move`, `project checkout`, and `project paths` instead of `checkout-move`, `checkout-register`, and `path-hygiene`, and the new tool names.
- `w19-r5-recovery-cli.test.ts`, `w19-r6-access-config.test.ts`, `w19-r8-mid-task-installed.test.ts`, `w24-p4-compatibility.test.ts`, `w27-r0-copilot-adapter.test.ts`: the new tool names only.

`backlog-review-skill.test.ts` did not change. It reads the shipped Skill text, which still names the old commands until P4.

### Commands Run

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npm run build`: passed.
- `npx vitest run tests/name-catalog.test.ts tests/mcp-derivation.test.ts tests/reorganization-verification.test.ts tests/run-cli.test.ts tests/mcp-profiles.test.ts`: 108 passed.
- `npx vitest run --reporter=json`: 2368 tests, 2359 passed, 3 failed, 6 skipped, counted from the JSON file. The 3 failures exist without this phase: two stdio tests in `tests/mcp-app-contract.test.ts` and the sandbox-only fixture 11 in `tests/p5-migration-safety.test.ts`.
- `node packages/cli/dist/index.js check prd --target-root .`: status `passed`, no diagnostics.

### Limits

- Old names do not work in this phase. `make-docs run ...` fails with "Unknown argument: run", and an old MCP name fails as an unknown tool. P3 adds the hidden aliases.
- Shipped Skills, routers, references, and PRD prose still name the old commands. P4 moves them.
- Native command rules are made from the registry, so they now use the new paths, such as `make-docs check prd`. Rules that a machine installed before this change use the old `run` paths. This phase did not test how an installed machine treats those rules. P3 or P5 must check it.
- The internal function names in `src/run/cli.ts` (`runRunCommand`, `adaptRunCliArgv`, `resolveRunOperationPath`) did not change. They now take argv that starts with the group.


## P3 Aliases and Migration Window

Covers A7 to A9 in [P3](03-aliases-and-migration-window.md). Evidence date: 2026-11-23. Base commit: `eb839187` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Changed

- `packages/cli/src/operations/migration-aliases.ts`: new alias layer. It reads old names only from the name catalog: `formerCli` and `formerMcp` on a current entry, when they differ from the new name. That gives 32 CLI aliases and 31 MCP aliases. A planned entry has no former name, so a name that never shipped gets no alias. `project_register_list` was only an earlier plan's name and gets none.
- The window: `RENAME_RELEASE = "2.1.0"` is the one constant. `ALIAS_MINOR_RELEASES = 2` and `RENAMED_MINOR_RELEASES = 1`. The state comes from the running package version. 2.1.x and 2.2.x run the alias. 2.3.x returns `command-renamed`. 2.4.0 and later remove the alias. A version before 2.1.0, such as this `2.0.9` build, runs the alias. A later major version removes it. A version that cannot be read runs the alias. A test seam injects the version.
- `packages/cli/src/cli.ts`: `runCli` matches the longest old CLI path after the caller-identity flags. In the window it runs the new path, and it prints one stderr line only after the command succeeds. A failing alias call writes only its one JSON error to stderr, and that error carries `renamedTo`. After the window it throws `command-renamed`. Any other `make-docs run` spelling fails with guidance. When the second word was a `run` group (`work`, `backlog`, `lifecycle`, `prd`, `performance`, or `uat`), the guidance names the new groups and their help, such as `make-docs check --help`. The map comes from the catalog's former paths. Any other word, such as `run playbook status`, gets the generic message that names the `work`, `backlog`, `lifecycle`, and `check` groups.
- JSON output: the shared `printJson` helpers and the `project paths` JSON writer add `renamedTo` when the command ran through an old path. An error from an alias carries `renamedTo` too. `serializeOperationError` now passes `renamedTo`.
- `packages/cli/src/mcp/tools.ts`: `callMakeDocsMcpTool` resolves an old name. It answers only where its new tool is in the profile. In the window it runs the new tool and adds `renamedTo`. After the window it throws `command-renamed`. At load the server checks that each alias names a live tool and is not a live name.
- `packages/cli/src/mcp/server.ts`: the server registers each active alias with its new tool's schema, so the SDK checks input the same way. A wrapper on the SDK list handler drops alias names, so `tools/list` shows only new names. The wrapper depends on the SDK setting its list handler when the first tool is registered. If that never happens, server startup fails with a typed `McpAliasHidingError` (`mcp-alias-hiding-unavailable`), so a server never lists old names. A backlog tool result keeps `renamedTo` in `structuredContent` and `_meta`.
- `packages/cli/src/run/root-operations.ts`: an unknown `make-docs project` command now lists the 17 real project commands (P2 review item 1). `make-docs project surface ...` keeps its own guidance. `make-docs resource --help` now has a title and a plain-words summary (P2 review item 2).
- No Skill, template, router, guide, or PRD changed. Operation IDs and profile membership did not change.

### Sample Output

CLI text, from `make-docs run prd authority validate --target-root .`. Stderr:

```text
make-docs: `make-docs run prd authority validate` is now `make-docs check prd`. The old name stops working in 2.3.0.
```

CLI JSON, from the same command. Stdout ends with:

```json
  "diagnostics": [],
  "renamedTo": "make-docs check prd"
}
```

CLI after the window (2.3.x), machine output with exit code 1:

```json
{"ok":false,"code":"command-renamed","message":"`make-docs run prd authority validate` was renamed. Use `make-docs check prd`. The old name is removed in 2.4.0.","nextAction":"Run `make-docs check prd`.","renamedTo":"make-docs check prd","details":{"formerName":"make-docs run prd authority validate","renamedTo":"make-docs check prd","renamedIn":"2.1.0","removedIn":"2.4.0"}}
```

MCP over real stdio, `make-docs mcp --profile quality`, a `tools/call` of `prd_validate`. The structured result has `tool: "check_prd"`, `operation: "prd.authority.validate"`, and `renamedTo: "check_prd"`. `tools/list` in the same session has 11 tools, with `check_prd` and without `prd_validate`. After the window the call returns `isError: true` with `code: "command-renamed"`, `renamedTo: "check_prd"`, and `nextAction: "Call \`check_prd\`."`.

### Alias Tests (A7, A8, A9)

`packages/cli/tests/w33-r0-p3-migration-aliases.test.ts` has 178 tests. A recorder replaces `invokeOperation`, so each command reaches the operation boundary with no Store or project fixture.

- Window states: a table of 13 versions, the version seam, and the end and removal releases.
- Catalog: the alias lists equal the catalog's renamed current entries, 32 and 31. No planned entry has an alias. Each alias names a live command or tool and is not a live name. The longest old path wins.
- Each of the 32 old CLI paths, in the window: the old and new paths record the same operation, input, dry-run flag, and write flag. Stderr has exactly the one line. Stdout JSON equals the new path's JSON plus `renamedTo`.
- Each of the 32 old CLI paths, after the window: `command-renamed` with `renamedTo`, `nextAction`, and details, and no operation runs. The new path still runs.
- Each of the 32 old CLI paths, after removal: no operation runs and no notice prints. A `run` path fails with the group guidance. A `project` path fails with the project command list.
- Each of the 31 old MCP names, in the window: in every profile that has the new tool, the alias records the same operation and returns the new tool's result plus `renamedTo`. In every other profile it is an unknown tool.
- Each of the 31 old MCP names: after the window `command-renamed`, and after removal an unknown tool.
- `tools/list` in all six profiles, at all three versions: exactly the new names.
- Over an in-memory MCP client: an alias answers with `renamedTo` in its profile and is "not found" outside it. After the window it returns the typed result. After removal it is "not found".
- Help: `make-docs --help`, each group's help, `project --help`, and `resource --help` show no old path.
- Exit code: a renamed command exits 1 with the typed machine result. An alias error in the window carries `renamedTo`.
- A failing alias call through the real entry point, `make-docs run work item resolve --help`, exits 1 with empty stdout. Stderr parses as one JSON object with `renamedTo: "make-docs work item resolve"` and no notice line. A succeeding alias call still prints the notice.
- Guidance: bare `make-docs run`, `run --help`, `run nothing`, and `run playbook status` get the generic message. Each former `run` group word gets its group hint. `make-docs run playbook status` exits 1 with empty stdout and one JSON `operation-error` line with no `renamedTo`.
- Server startup: a fake server whose list handler is never wrapped throws `McpAliasHidingError`. A real SDK server passes once a tool is registered. Every profile's real server starts.

### Old Native Command Rules (P2 Review Item 3)

`packages/cli/tests/w33-r0-p3-native-rule-migration.test.ts` has 3 tests. Every root is a temp folder.

- Codex command rules, through `runSystemSetupCommand`: the test installs the rules, then rewrites the rule file and the Store receipt to the `run ...` paths from `formerCli`. `verify` reports `drifted`: "The verified native entry does not match the current reviewed intent." The adapter plans one Make Docs-owned `update`, and apply without approval fails. `make-docs setup` with `--dry-run` reports `partial`, blocks nothing, and names `make-docs setup system --yes`. After approval the file has the new paths, the repeat is `unchanged`, and `verify` is `current`.
- Claude Code permission rules, through the adapter: setup does not offer this method today, so the test seeds it with the adapter. `verify` reports `drifted`. The approved update replaces only the Make Docs rules and keeps the user's `Bash(git status:*)` rule and `theme`. The repeat plan is `current`.

### Tests Whose Expectations Changed

- `cli.test.ts`: the group-help test now includes `resource` and checks that each group's help starts with its title and a plain-words summary.

### Commands Run

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npm run build`: passed.
- `npx vitest run tests/w33-r0-p3-migration-aliases.test.ts tests/w33-r0-p3-native-rule-migration.test.ts`: 181 passed.
- After the review fixes, `npx vitest run` of the two P3 tests, `tests/cli.test.ts`, `tests/name-catalog.test.ts`, and every `tests/mcp*.test.ts` with `--reporter=json`: 528 tests, 526 passed, 2 failed, counted from the JSON file. The 2 failures are the known `tests/mcp-app-contract.test.ts` stdio tests. They fail on a Node `DEP0205` warning on stderr, and that test file did not change.
- Before the review fixes, `npx vitest run --reporter=json --outputFile=<tmp>`: 2546 tests, 2537 passed, 3 failed, 6 skipped, counted from the JSON file. The 3 failures exist without this phase: two stdio tests in `tests/mcp-app-contract.test.ts` and the sandbox-only fixture 11 in `tests/p5-migration-safety.test.ts`. The full suite was not run again after the review fixes.

### Limits

- The rename release is `2.1.0`. The owner chose it on 2026-11-23. The package is still `2.0.9`. If the rename ships in another release, change `RENAME_RELEASE` only.
- A later major version removes the aliases. If 3.0.0 ships before 2.3.0, the old names go away at once, with no `command-renamed` release. The window counts minor releases inside one major version only.
- A machine with old native command rules shows drift until the person approves the `make-docs setup` update. Until then a native-rule call can fail its access check, as it does for any other rule change.
- `validateMakeDocsCliArgv` does not accept old paths, so generated commands must use the new names.
- Shipped Skills, routers, references, and PRD prose still name the old commands. P4 moves them.
- For P5: `--help` on a leaf command fails with "`--help` requires a value." This happens on the old path, on the new path, and in released 2.0.9. For example, `make-docs work item resolve --help` fails. P3 does not change it.

## P4 Shipped Text and Skills

Covers A10 and A11 in [P4](04-shipped-text-and-skills.md). Evidence date: 2026-11-23. Base commit: `eb839187` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`.

### What Changed

- Template first: nine files under `packages/docs/template/` now name the new commands. They are `docs/prd/AGENTS.md`, `docs/prd/CLAUDE.md`, `output-contract.md`, `performance-evidence-governance.md`, `docs-path-hygiene-cleanup.prompt.md`, `naive-uat-validation.md`, `path-and-link-hygiene.md`, `prd-change-management.md`, and `wave-model.md`.
- Dogfood copy: the same nine files were copied byte for byte into `./.make-docs/` and `./docs/`. Each matched its upstream copy before the change. `node scripts/copy-template-to-cli.mjs` refreshed the bundled template.
- Skills: `backlog-review` (`SKILL.md`, `README.md`, `references/cache.md`), `naive-uat/SKILL.md`, and `factory` and `preflight` `references/store.md`. The four installed copies under `.agents/skills/` match their sources. `naive-uat` has no installed copy. No Skill script changed.
- READMEs: `README.md` and `packages/cli/README.md` list the eleven groups. Each row uses the exact words of its line in `make-docs --help`. Both files say how an MCP name comes from the CLI path. `packages/docs/README.md` and `packages/cli/src/README.md` named no old command.
- Guides: `cli-lifecycle-managing-installations.md` names the new tool names, says renamed names stay hidden aliases under PRD 39 R-MIG-1, and links the [name table](#name-table). `cli-maintaining-setup-and-harness-access.md` runs `check prd`. `cli-mcp-operation-parity-and-permissions.md` names the registry groups, the `resource_list` and `resource_read` tools, and the current work item and evidence commands.
- PRDs: `00-index.md`; PRD 07 (eleven groups and migration aliases); PRD 21 (`make-docs factory restore`); PRD 25 (group projection, derived names, `check uat` paths); PRD 38 (`make-docs lifecycle <operation>` and `make-docs work export --quick` in the work store records row); PRD 39 (R-SCOPE-1, new R-NAME-6, R-RUN-1, R-RUN-2, R-PRD-AUTH-1, R-PERF-VALIDATE-1, the R-CHECKOUT table, and R-TEST-3); and PRD 51 (snapshot and cache paths). Each changed PRD except the index has a `2026-11-23 — W33 R0 P4` Requirement History entry.
- `name-catalog.ts`: `compareMcpProfileNames` accepts only current tool names and names the current one when it finds a former name. `compareRRun1` reads the new R-RUN-1 group lists and fails on a former `run` path.
- New test: `packages/cli/tests/w33-r0-shipped-text-names.test.ts`.
- Tests whose expectation changed: `name-catalog.test.ts` (new R-RUN-1 fixtures, a former-name fixture for each check, and an R-BACKLOG-APP-1 fixture that changes only that line), `consistency.test.ts` (`project paths validate`), and `backlog-review-skill.test.ts` (`backlog cache lookup|write` and `backlog_cache_lookup`).
- Release scripts: `scripts/w22-r1-package-proof.mjs` runs `project move preview` and `project move apply` in its eight move calls. `scripts/smoke-pack.mjs` checks the retired `run playbook status`, `run package plan`, and `run protocol list` with a new `assertRetiredOperationRefusal` and no longer matches message text. The check follows the P3 reviewer's contract. Both scripts failed after P2 retired `run`, and `smoke:pack:local` runs both.
- No CLI route, MCP tool code, alias, or operation ID changed.

### Names Replaced (A10)

| Area | Files | Old CLI paths replaced | Old MCP names replaced |
| --- | --- | --- | --- |
| Template | 9 | 17 | 0 |
| Dogfood copy | 9 | 17 | 0 |
| Skills | 6 | 14 | 2 |
| Installed Skills | 5 | 8 | 2 |
| Guides | 3 | 3 | 3 |
| READMEs | 2 | 2 (`run` group rows) | 0 |
| PRDs | 7 | 12 | 4 |

PRD 07, 25, and 39 and the parity guide also had eight prose lines that called `run` the operation root. They now name the registry groups.

### Shipped-Text Test

The test reads 316 Markdown files: the template (97), its dogfood counterparts, `packages/skills/`, `.agents/skills/`, the root and package README files, `CONTRIBUTING.md`, `RELEASING.md`, `SECURITY.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `packages/cli/src/store/README.md`, the root routers, `docs/assets/user/`, `docs/assets/maintainer/`, `docs/prd/` without the decision register, and every `AGENTS.md` and `CLAUDE.md` under `docs/`. It does not read `docs/assets/project/`, the decision register, plans, designs, work backlogs, history records, or archives. PRD 39 R-NAME-6 names the same set. The test checks inline code and fenced code blocks.

- A command starts a code line or span, or follows `$`, `&&`, `||`, `;`, `|`, or `(`. Environment assignments such as `MAKE_DOCS_HOME=x` may come first. The program is `make-docs`, `npx [-y] [@brucewaynedecoy/]make-docs[@<tag>]`, or `node <path>/dist/index.js`.
- Its words must be a catalog path, a setup or other non-registry command, or a known group or path prefix, such as `make-docs setup store` or `make-docs check uat --help`. A word after a full command is an argument unless it reaches into a deeper known path. MCP-only catalog paths, such as `setup status`, are not CLI commands.
- A code span or code line that starts with `run work`, `run backlog`, `run lifecycle`, `run factory`, `run prd`, `run performance`, or `run uat` fails, even with no program before it.
- A snake-case token that is a former catalog MCP name fails, and the message names the current one.
- A Requirement History or Change History section may keep the names it recorded. So may the table rows right after a line that holds only `<!-- make-docs:former-names -->`. Only lines that start with `|` are hidden. The first other line, blank or not, ends the marked table and counts. No shipped file uses the marker yet.
- Fixture tests prove that it fails on an environment prefix (`MAKE_DOCS_HOME=/tmp/x make-docs run lifecycle list`), `npx @brucewaynedecoy/make-docs@latest run ...`, `npx -y @brucewaynedecoy/make-docs@2.0.9 run ...`, `npx make-docs project checkout-register apply`, `node packages/cli/dist/index.js run ...`, `node <path>/dist/index.js run ...`, bare `run <root> ...` spans for all seven roots, a former name on a row after a blank line or on a non-table line after the marker, `make-docs run prd authority validate`, `make-docs project path-hygiene validate`, `make-docs project checkout-move preview`, `make-docs run lifecycle <verb>`, a chained `npx make-docs run work backlog snapshot`, `make-docs run factory restore`, unknown paths, a wrong word after a full command, and former MCP names. They prove that it passes current paths, groups and branch paths with flags (`make-docs setup store --help`), current commands behind an environment prefix, `npx`, or `node .../dist/index.js`, `npm run build`, `run package`, arguments, prose, an example commit message in a code block, history sections, and the rows of a marked table.
- Review pass: the wider scan found two more current-text names. They were `run work export --quick` in the PRD 38 Store table and `run work item resolve` and `run work evidence record|read` in a parity guide inventory row. Both now name the current commands.
- First run on the changed text: it found four names that the manual search missed. They were `backlog_cache_read` in the `backlog-review` README and its installed copy, and `make-docs run factory restore` in PRD 21. A fourth hit, prose in a commit-message example, led to the command-start rule.

### Commands Run

First pass:

- `npm run build`: passed.
- `node packages/cli/dist/index.js check prd --target-root . --json`: status `passed`, 37 PRD files, 734 Markdown files, 1432 links, no diagnostics.
- `node packages/cli/dist/index.js project paths validate`: 1104 files, 0 findings.
- `node packages/cli/dist/index.js project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption --target-root .`: 379 files, no problems.
- `npx vitest run --reporter=json --outputFile=<tmp>` in `packages/cli`: 2377 tests, 2368 passed, 3 failed, 6 skipped, counted from the JSON file. The 3 failures exist without this phase: two stdio tests in `tests/mcp-app-contract.test.ts` and the sandbox-only fixture 11 in `tests/p5-migration-safety.test.ts`. `tests/w19-r5-skills-command.test.ts` and the `tests/cli.test.ts` timeout did not fail in this run.
- Template and dogfood parity: `cmp` passed for all nine reseeded files. The only template files that differ from the repository copy are the root routers and the two install variants, as before.

After the review fixes:

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npx vitest run tests/w33-r0-shipped-text-names.test.ts tests/name-catalog.test.ts tests/backlog-review-skill.test.ts tests/consistency.test.ts`: 4 files, 107 tests passed. The shipped-text test has 11, the name-catalog test 43, and the backlog-review Skill test 15.
- `npm run validate:defaults -w packages/cli`: 53 passed.
- `bash scripts/check-instruction-routers.sh`: passed. It ran outside the sandbox because `mktemp -d` cannot write the system temp folder inside it.
- `npm run smoke:pack:local` with `MAKE_DOCS_HOME` set to a temporary folder, outside the sandbox: exit 1. Every local packed check passed (`runLocalPackedSmoke`), including the new retired-operation check. The run then stopped inside `scripts/w22-r1-package-proof.mjs` at line 146, before the first `project move` call: `setupReview.checkoutMove` is `null`. See "Release Proof Failure Found" below.
- `project move preview --target-root <moved> --json` on a hand-made 2.0.5 fixture: exit 0 with a typed `blocked` result. The old `project checkout-move preview` spelling fails with `operation-error`. So the eight script calls now reach the command.
- The CLI checks ran with `MAKE_DOCS_HOME` set to an empty temporary folder. No Store was created there, and the real Store was not read.

### Release Proof Failure Found

`scripts/w22-r1-package-proof.mjs` fails before this phase's changes, so `smoke:pack:local` cannot pass yet. The proof seeds two checkouts with the released 2.0.5 package, moves the folder, and expects candidate `setup --yes --json` to report `checkoutMove.status: "ready"`. The candidate gives `checkoutMove: null` and blocks on `missing-manifest-recognizable` instead. `project move preview` on the same fixture says "The Store must use the current schema before checkout move."

A hand-made copy of the proof's first steps ran against builds of earlier commits:

| Commit | `checkoutMove` |
| --- | --- |
| `ba4b95b5` (v2.0.9 merge) | ready |
| `1ac8f62d`, `879a8866`, `08f405bd`, `bc8f6602`, `669c12b2`, `125cfad6` | ready |
| `4daaf18f` (W32 R0 P2 Schema v7 and Defect Fixes) | `null` |
| `eb839187` (W33 R0 P2, this phase's base) | `null` |

The first bad commit is `4daaf18f`. Setup no longer finds a moved checkout in a Store with the 2.0.5 schema. This is a Store and setup defect, not shipped text, so P4 does not fix it. It needs its own fix, owned by W32 R0 or a register entry, before `smoke:pack:local` and the CI `platform-safety.yml` candidate proof can pass. The base worktree and fixtures were temporary and are removed.

### Left on Purpose

- History records, archives, `.make-docs/archive/legacy-playbooks/`, closed evidence, and every Requirement History and Change History entry keep their names.
- `docs/prd/03-open-questions-and-risk-register.md` records each decision as it was made, so the test does not scan it. D-065 lists the old names as the problem it solved.
- Plans, designs, and work backlogs are project records, not shipped text. Active backlogs such as W29 R0 and W30 R0 still name some `run` paths in their own evidence and indexes.
- Dated project artifacts under `docs/assets/project/`, such as `cli-command-reorganization.md` and `runtime-and-global-store.md`, describe the command tree of their date.
- The parity guide's inventory rows for the retired `run package` spelling and the Playbook tools describe removed surfaces.
- The user guide names `make_docs_resource_read` as a pre-W26 R1 name that is not an alias.

### Limits

- The test does not check one-word former MCP names (`personas`, `domains`, `manifest`, `config`, and `compatibility`), because they are common words. A manual search found none used as a tool name in shipped text.
- The test reads Markdown only. Skill scripts and their help strings were searched by hand and name no old command.
- The retired-operation check in `scripts/smoke-pack.mjs` does not match message text, because P3 changes the text, and P3 may add group hints for other `run` forms. It needs a nonzero exit, empty stdout, and stderr that parses as one JSON object with `ok: false` and `code: "operation-error"`, with no `renamedTo` key. The P3 reviewer confirmed that `run playbook status`, with or without `--json`, gives this result after P3 and for the whole migration window. These paths were removed, not renamed, so they never get an alias. The built CLI at this phase gives the same shape: exit 1, 0 bytes on stdout, and one stderr line.
- Depends on P3: `docs/assets/user/cli-lifecycle-managing-installations.md` line 100 says that renamed commands and tools keep their old names as hidden aliases for two minor releases. That is true only after W33 R0 P3 adds the aliases. P3 lands before any release, so the line stays.

## P5 Acceptance

Covers A12 to A15 in [P5](05-acceptance.md). Evidence date: 2026-11-23. Base commit: `c2498d55` on `docs/w29-w30-work-store-and-factory`. Node `v26.13.1`. CLI package version `2.0.9`. Every CLI and test run used a temporary `MAKE_DOCS_HOME`. No run read or wrote the real Store. This section has three passes: the first build, the fixes from the independent review, and the owner's help decisions. All counts and captures below are from the last pass.

### What Changed

Leaf help fix:

- `--help` on a leaf command failed. The cause: no code answered `--help` after a full command path. The argv reached the command's own option parser. The shared parser in `packages/cli/src/operations/cli-options.ts` reads any unknown `--name` as a flag that needs a value, so `make-docs work item resolve --help` and every other `work`, `backlog`, `lifecycle`, and `check` command failed with "`--help` requires a value." The `project` and `resource` routers failed in other ways: "Unexpected project move option: --help.", "Unknown option: --help", or "Unknown project paths option". `-h` was read as a target, for example "Could not parse target `-h`". The same failure is in released 2.0.9 and on every old alias path.
- The fix: `runResolvedCli` in `packages/cli/src/cli.ts` calls `resolveLeafHelp` (`packages/cli/src/run/leaf-help.ts`) before any router runs. When argv holds `--help` or `-h` after a registry command path, the CLI prints that command's help and exits 0. Help runs no operation, reads no Store, and writes nothing. A `--help` or `-h` that is the value of a flag that takes a value, such as `--checkpoint -h`, is that value. The option list in the help table says which flags take a value. A path prefix inside a dispatcher group, such as `make-docs check uat --help`, lists the commands under it.
- Through an old path in the window, the alias layer of P3 runs first. The leaf help prints for the new command, and the alias notice prints after it on stderr. After the window, an old path with `--help` returns `command-renamed`, as before.

One source for help and usage:

- New `packages/cli/src/operations/leaf-help-table.ts`: one entry for each of the 48 registry operations, with one plain-words summary, the usage line, the arguments, the options, and short notes.
- `packages/cli/src/operations/registry.ts`: `ADMITTED_CLI_USAGES` is gone. `operationCliCommand` and each operation's `cli.command` now come from the help table, so the registry usage line, group help, and `--help` cannot disagree. The 11 commands where they disagreed now have one line: `project state status|recover` and `project list` gain their flags, `project move apply` gains `--dry-run`, `project surface ensure` gains `--dry-run --target-root --json`, and `resource read|ensure` gain all their flags. `--target-root <project>` stays the spelling for `check prd`, `check performance-evidence`, the `check uat` commands, and the `backlog` commands, as in PRD 39 R-PRD-AUTH-1, R-PERF-VALIDATE-1, PRD 51, and the shipped references. The `resource` flags use the PRD 39 spelling, such as `--type <contract|prompt|reference|template>`. No PRD row had to change.
- The notes from the old command help moved into the table: `setup store clean` (the three newest backups, the backup folder, and how to restore one), `setup store check`, `project list` (what `--target-root` means), and `project state status|recover`. The dead command-level help branches for `project list`, `project state status|recover`, and `project doctor check|fix` in `packages/cli/src/run/root-operations.ts` are removed. Group help (`project state --help`, `project doctor --help`) stays.

Owner help decisions, 2026-11-23:

- Every group's help lists one path line and one plain-words summary line per command, with `[write]` on commands that change files or Store records. Flags are only in each command's own help. A shared `renderCommandLines` in `packages/cli/src/run/cli.ts` renders this for `work`, `backlog`, `lifecycle`, `check`, `project`, `resource`, and the `setup store` commands.
- `make-docs project --help` is short and plain. It no longer has "plan dispositions", "receipt", or "Store installation evidence".
- `make-docs setup --help` starts with plain words, lists each `setup` command with a summary, and has a `setup store` line: people run it in a terminal, and agents use the MCP tools `setup_store_check` and `setup_store_clean`. `setup` is a command as well as a group, so the options of `make-docs setup` itself follow the list under "Options for make-docs setup itself:".
- `make-docs mcp --help` describes the `core` profile as "Install state, settings, system resources, and the list of tool areas."
- Read-only commands end their summary with "Changes nothing." Leaf help no longer prints "This command reads only." Write commands still print "This command can change files or Store records."
- PRD 39 R-TOP-4 stays. The owner confirmed it. Its text now also says one summary line per command in group help, flags only in command help, the registry usage line is the help usage line, and a help flag that is a flag value is that value.

Other help and Store fixes:

- `make-docs uninstall --help` now says: it never changes project files; with no terminal it stops and removes nothing unless `--yes`; when it cannot tell how make-docs was installed it removes nothing; the Store is in `MAKE_DOCS_HOME` when set, else `~/.make-docs/`; `--remove-store` deletes the Store only after the tool is removed, or when nothing is installed (npx and other runners), and keeps it when the tool removal fails or the install method is unknown; and the Store clean backups in `<store>/backup/` are always kept. The backup rule matches the parallel W32 R0 P5 change.
- `packages/cli/src/self/uninstall-tool.ts`: one line. `uninstall --remove-store` printed "The global Store is preserved at ..." even when it removed the Store. That line now prints only without `--remove-store`. W32 R0 P5 changes the same area, so the edit is kept to that one condition.
- `naive-uat-validation.md` states the current MCP name rule. Template first, then a byte-identical dogfood copy, then `node scripts/copy-template-to-cli.mjs`.

### Leaf Help Tests

`packages/cli/tests/w33-r0-p5-leaf-help.test.ts` has 287 tests. A recorder replaces `invokeOperation`, so a help call that reaches an operation fails the test.

- The table has one entry for each registry operation and no other entry. For each operation, the usage line and the option list name the same flags, and the leading arguments match.
- For each operation, `operationCliCommand` equals `make-docs <path> <usage>`, and the registry and help usage lines have the same flags and arguments in both directions.
- Real options, dispatcher commands (26): each `work`, `backlog`, `lifecycle`, and `check` adapter runs on options whose values, booleans, and arrays are proxies that record each key it reads. The test starts with every key present, then makes each read key absent in turn, to reach `a ?? b` branches. The keys read, plus `--json`, which the dispatcher reads, must equal the flags in the help usage. A command reads positional arguments only when its help has arguments.
- Real options, router commands (22): each `project`, `resource`, and `setup store` command runs through the CLI with its required options and then with each other option, each alternative of `--a|--b` alone. Each run must reach its operation. An unknown option would stop it first.
- A mutation check proved both: removing `--store-root` from `lifecycle list` help and adding a fake `--bogus` to `project persona list` help each failed the test.
- For each operation, with `--help` and with `-h` (96 tests), through the real entry point: exit code 0, empty stderr, no operation call, and stdout equal to the command's help.
- Help after a target, a flag value, `--last`, `--rollback`, or `--apply` still prints help. `lifecycle checkpoint ... --checkpoint -h` runs the operation with checkpoint `-h` and prints no help. A `--help` after that value still asks for help. `-h` after `--last`, which takes no value, is help.
- Help on all 48 commands leaves the temporary Store folder empty.
- Every group (`setup`, `project`, `resource`, `work`, `backlog`, `lifecycle`, `check`) lists each command as one path line with its `[write]` marker and one summary line equal to its help summary. No command line names a flag.
- Read-only summaries end with "Changes nothing." and no help says "This command reads only." Write commands say "This command can change files or Store records."
- `setup --help` has the `setup store` line and the MCP tool names, and its text before the options does not say "target". `project --help` has no "plan dispositions", "receipt", or "installation evidence".
- The `setup store clean`, `setup store check`, `project list`, and `project state` notes are in their help.
- Each of the 32 old CLI paths with `--help`, in the window: exit code 0, the new command's help, then the alias notice. After the window: `command-renamed`.

`packages/cli/tests/self-management.test.ts` has a new test: `--remove-store` through npx removes the Store and does not print "The global Store is preserved". With an unknown install method, the Store stays and the affected path prints. Without `--remove-store`, the preserved line prints.

Tests whose expectations changed:

- `w33-r0-p3-migration-aliases.test.ts`: the failing-alias test used `run work item resolve --help` as its failing call. Help now succeeds, so it uses `run work item resolve` with no target.
- `w19-r5-state-help.test.ts`: no change. The first pass changed it, and the review pass restored it. The `project state` notes in the help table give the same text: both command names and "without reading the Store or changing files".
- `mcp.test.ts`: the `mcp --help` text checks use the new plain words.
- `p3-operation-surfaces.test.ts`, `p4-projection-lifecycle.test.ts`, `p5-migration-safety.test.ts`, `reorganization-verification.test.ts`: the pinned `operationCliCommand` strings now include each command's flags, from the help table.
- `p4-projection-lifecycle.test.ts`: the `project --help` checks read the new short text. The test's write and Store checks did not change.
- `cli.test.ts`: the `setup --help` test checks the new command list and the "Options for make-docs setup itself:" heading.

### Test Counts (A12)

From one JSON run after the last change:

| Test set | Files | Tests | Passed | Failed |
| --- | --- | --- | --- | --- |
| Naming rule: `name-catalog.test.ts` | 1 | 43 | 43 | 0 |
| Parity and profiles: `mcp-derivation`, `mcp-profiles`, `mcp-profile-discovery`, `mcp-profile-cli`, `mcp-resource-profiles`, `mcp.test.ts`, `reorganization-verification`, `run-cli` | 8 | 160 | 160 | 0 |
| MCP Apps contract: `mcp-app-contract.test.ts` | 1 | 40 | 38 | 2 |
| Aliases: `w33-r0-p3-migration-aliases`, `w33-r0-p3-native-rule-migration` | 2 | 181 | 181 | 0 |
| Shipped text: `w33-r0-shipped-text-names.test.ts` | 1 | 11 | 11 | 0 |
| Leaf help: `w33-r0-p5-leaf-help.test.ts`, `w19-r5-state-help.test.ts` | 2 | 293 | 293 | 0 |
| CLI: `cli.test.ts` | 1 | 146 | 146 | 0 |
| Tests whose expectations changed: `p3-operation-surfaces`, `p4-projection-lifecycle`, `p5-migration-safety`, `self-management` | 4 | 68 | 67 | 1 |
| Command help neighbors: `w31-r0-p3-project-doctor`, `w32-r0-p4-store-maintenance` | 2 | 100 | 100 | 0 |

22 files, 1042 tests: 1039 passed and 3 failed. The 3 failures are known and exist without this phase: the two `mcp-app-contract.test.ts` stdio tests, which fail on a Node `DEP0205` warning, and the sandbox-only fixture 11 in `p5-migration-safety.test.ts`.

### Full Suite

`npx vitest run --reporter=json --outputFile=<tmp>/full.json` in `packages/cli`, after the last change, counted from the JSON file: 136 test files, 2858 tests, 2848 passed, 4 failed, and 6 skipped. The 4 failures are known: the two `mcp-app-contract.test.ts` stdio tests, the sandbox-only fixture 11 in `p5-migration-safety.test.ts`, and one `cli.test.ts` test ("routes reconfigure skill scope and selected-name changes without changing Skills") that timed out at 15 seconds under load. That test passes alone. `w19-r5-skills-command.test.ts` did not fail.

### Commands Run

- `npx tsc --noEmit -p .` in `packages/cli`: passed. The root has no `tsconfig.json`, only `tsconfig.base.json`.
- `npm run build -w packages/cli`: passed.
- `npm run validate:defaults -w packages/cli`: 53 passed.
- `bash scripts/check-instruction-routers.sh`: passed. It ran outside the sandbox because `mktemp -d` cannot write the system temp folder inside it.
- `npm run smoke:pack:local` with `MAKE_DOCS_HOME` set to a temporary folder, outside the sandbox: passed. The W22 R1 package proof gives `status: "passed"`, released 2.0.5 to candidate 2.0.9, 2 receipts.
- `node packages/cli/dist/index.js check prd --target-root . --json`: status `passed`.
- `node packages/cli/dist/index.js project paths validate --format text`: 0 findings.
- `node packages/cli/dist/index.js project doctor check --exclude docs/work/2026-11-13-w22-r2-portable-checkout-adoption --target-root .`: no problems in 379 files.
- Template and dogfood parity: `cmp` passed for `naive-uat-validation.md`.

### Help Review (A13)

The agent captured the help below from the built CLI (`node packages/cli/dist/index.js`) with an empty temporary `MAKE_DOCS_HOME`. All 15 captures exit 0. The Store folder stayed empty. The agent checked them against the design's promises:

- Capability words: each group line in `make-docs --help` says what the group does for you. Pass.
- One capability per group: each group's commands serve the capability in its line. Pass.
- Nothing names `run`: no capture names `make-docs run` or a `run` group path. Pass.
- Every listed command exists: the 64 distinct `make-docs ...` command paths in these captures each answer `--help` with exit code 0. Pass.
- Plain words: every group lists one summary line per command. Pass.

Guided Progress Review: **passed on 2026-11-23**. The owner reviewed the help and accepted it with five changes: one summary line per command in every group, short plain `project` help, plain `setup` help with a `setup store` line, a plain `core` profile line in `mcp` help, and only "Changes nothing." on read-only commands. All five are made, and the captures below show them. The owner also confirmed PRD 39 R-TOP-4.

Captured help:

#### `make-docs --help`

```text
make-docs

Set up Make Docs, work with your project's docs and backlog, and serve tools to agents.

Usage:
  make-docs
  make-docs <group> <command> [options]
  make-docs <group> --help

Bare command:
  Run make-docs with no command to see install status (when installed) or start
  a guided setup (when not installed). Bare invocation never syncs.

Global flags:
  --version, -v   Print the installed make-docs version and exit.
  --help, -h      Show help for a group or command.

Groups:
  setup        Install, sync, or remove Make Docs in this project. Set up this computer and check the Store.
  project      See and repair this project: state, checkouts, Personas, layout, paths, and the doctor.
  resource     List, read, or copy Make Docs system resources.
  work         Find work items and record work evidence.
  backlog      Read the backlog, use its review cache, and open the review app.
  lifecycle    Start, track, and finish lifecycle runs.
  factory      Run approved backlog work through workers and review. No commands yet.
  check        Check PRDs, performance evidence, and user test records. Changes nothing.
  mcp          Serve Make Docs tools to agents over MCP.
  update       Update the installed make-docs tool.
  uninstall    Remove make-docs from this computer.

Examples:
  make-docs
  make-docs setup --yes
  make-docs setup system --dry-run
  make-docs project state status
  make-docs resource list
  make-docs work item resolve 'W18 R11 P2'
  make-docs backlog snapshot --target-root .
  make-docs lifecycle list
  make-docs check prd
  make-docs mcp

Use --help or -h with a group to list its commands.
```

Exit code: 0.

#### `make-docs setup --help`

```text
make-docs setup

Install Make Docs in this project, or sync it with your saved choices.
A new install in a terminal opens a guided wizard. A sync shows the planned changes first.

Usage:
  make-docs setup [options]
  make-docs setup <command> [options]

Commands:
  make-docs setup [write]
      Install Make Docs in this project, or sync it with your saved choices.
  make-docs setup system [write]
      Set up Codex, Claude Code, and GitHub Copilot CLI support on this computer, after your review.
  make-docs setup reconfigure [write]
      Change the saved project choices of an install.
  make-docs setup skills [write]
      Sync, adopt, or remove the managed Skills.
  make-docs setup backup [write]
      Back up this project's managed files.
  make-docs setup remove [write]
      Remove this project's managed files, with an optional backup first.
  make-docs setup store check
      Check the Make Docs Store: what clean would remove, what needs your choice, and what blocks this computer. Changes nothing.
  make-docs setup store clean [write]
      Back up the Make Docs Store, then remove only what the fixed rules prove is safe to remove.

setup store checks and cleans the Make Docs Store. People run it in a terminal.
Agents use the MCP tools setup_store_check and setup_store_clean.

[write] commands change files or Store records.

Use --help or -h with a command to see its options.

Options for make-docs setup itself:

General options:
  --target <dir>                 Operate on a different make-docs install directory.
  --dry-run                      Show planned changes without writing files.
  --yes                          Approve a fully specified non-interactive plan.
  --adopt                        Register a checkout with a saved projectId in this Store.
  --conflicts <keep|overwrite>   Resolve changed managed files in this setup plan.
  --recover <resume|restore>     Choose recovery for unfinished project work.
  --json                         Emit only the canonical setup result JSON.
  --help, -h                     Show help for this command.

Harness options:
  --codex-method <none|mcp|command-rules>
  --claude-code-method <none|mcp|permission-rules>
  --github-copilot-method <none|mcp>
  --generic-mcp-client <label>  Add one bounded generic MCP client profile.
  --generic-mcp-action <configure|rotate|repair|remove>
                                Choose its repeat-safe lifecycle action.
  --no-codex                     Skip the Codex harness.
  --no-claude-code               Skip the Claude Code harness.
  --no-github-copilot           Skip the GitHub Copilot CLI harness.
  Deprecated aliases: --no-agents, --no-claude

Skill options:
  --no-skills                    Skip skill installation entirely.
  --skill-manifest <file>       Use an explicit local skills manifest for this run.
  --skill-scope project|global   Choose project or global agent locations.
  --selected-skills <csv|all|none>
                                  Replace the selected skill set.

Resource options:
  --project-resources <csv|all|none>
                                  Copy only the selected system resource types into this project.

Fresh projects always include Designs, Plans, PRD, and Work. Use setup
reconfigure to review a later project-surface change.

Examples:
  make-docs setup
  make-docs setup --yes
  make-docs setup --adopt --yes
  make-docs setup --adopt --yes --conflicts keep
  make-docs setup --target ~/Projects/example --dry-run
  make-docs setup reconfigure --yes --no-work
  make-docs setup remove --backup
```

Exit code: 0.

#### `make-docs project --help`

```text
make-docs project

See and repair this project: its state, checkouts, Personas, layout,
support folders, paths and links, and docs.

Usage: make-docs project <command> [options]

Commands:
  make-docs project list
      List every project that the Make Docs Store knows. Changes nothing.
  make-docs project state status
      Show this project's install state from the Store and the next safe step. Changes nothing.
  make-docs project state recover [write]
      Finish or undo one unfinished install operation.
  make-docs project move preview
      Show which saved checkout this moved folder can take over. Changes nothing.
  make-docs project move apply [write]
      Give this folder the saved checkout ID of its old folder. Project files stay the same.
  make-docs project checkout preview
      Show the new checkout ID this folder would get. Changes nothing.
  make-docs project checkout apply [write]
      Save this folder as a new checkout of its project.
  make-docs project persona list
      List this project's Personas. Needs no Store. Changes nothing.
  make-docs project layout preview
      Show where each old file would move, with its links and any blockers. Changes nothing.
  make-docs project layout prepare [write]
      Save a reviewed layout plan in the Store before any file moves.
  make-docs project layout apply [write]
      Move the files of one prepared cli layout plan, then check them.
  make-docs project layout verify [write]
      Check a manual layout plan after you moved the files, and record that it is done.
  make-docs project surface ensure [write]
      Make one project support folder and its instruction files.
  make-docs project paths validate
      Check this project's docs for unsafe paths and links. Changes nothing.
  make-docs project paths repair [write]
      Fix unsafe paths and links in this project's docs. Shows the changes first.
  make-docs project doctor check
      Check project files for known problems, show each exact fix, and give a review digest. Changes nothing.
  make-docs project doctor fix [write]
      Make only the fixes that a doctor check's review digest names, with a backup and a way to undo.

Install state is kept in the Make Docs Store.

[write] commands change files or Store records.

Use --help or -h with a command to see its options.
```

Exit code: 0.

#### `make-docs resource --help`

```text
make-docs resource

List, read, or copy Make Docs system resources: contracts, prompts,
references, and templates.

Usage: make-docs resource <command> [options]

Commands:
  make-docs resource list
      List the Make Docs system resources: contracts, prompts, references, and templates. Changes nothing.
  make-docs resource read
      Print one Make Docs system resource, byte for byte. Changes nothing.
  make-docs resource ensure [write]
      Copy one managed system resource into this project.

[write] commands change files or Store records.

Use --help or -h with a command to see its options.
```

Exit code: 0.

#### `make-docs work --help`

```text
make-docs work

Find work items and record work evidence.

Usage: make-docs work <command> [options]

Commands:
  make-docs work item resolve
      Find a work item from its coordinate or path, and show its project, wave, and phase file. Changes nothing.
  make-docs work evidence record [write]
      Save one piece of work evidence for a work item in the Make Docs Store.
  make-docs work evidence read
      Show the work evidence saved for a phase or a whole wave. Changes nothing.

[write] commands change files or Store records.

Use --help or -h with a command to see its options.
```

Exit code: 0.

#### `make-docs backlog --help`

```text
make-docs backlog

Read the backlog, use its review cache, and open the review app.

Usage: make-docs backlog <command> [options]

Commands:
  make-docs backlog snapshot
      Read every live and archived work record into one backlog snapshot. Changes nothing.
  make-docs backlog cache lookup
      Find saved backlog review notes that still match the current snapshot. Changes nothing.
  make-docs backlog cache write [write]
      Save backlog review notes in the Store cache, so the next review can reuse them.
  make-docs backlog review open
      Open a checked backlog report in the review app, with a short summary for chat. Changes nothing.
  make-docs backlog review refresh
      Read the current backlog facts again and keep the report you reviewed before. Changes nothing.

[write] commands change files or Store records.

Use --help or -h with a command to see its options.
```

Exit code: 0.

#### `make-docs lifecycle --help`

```text
make-docs lifecycle

Start, track, and finish lifecycle runs.

Usage: make-docs lifecycle <command> [options]

Commands:
  make-docs lifecycle start [write]
      Start a lifecycle run for this project in the Make Docs Store.
  make-docs lifecycle show
      Show one lifecycle run and its evidence. Changes nothing.
  make-docs lifecycle list
      List this project's lifecycle runs. Changes nothing.
  make-docs lifecycle checkpoint [write]
      Record a checkpoint in a lifecycle run.
  make-docs lifecycle pause [write]
      Pause an active lifecycle run.
  make-docs lifecycle resume [write]
      Resume a paused lifecycle run.
  make-docs lifecycle attach-evidence [write]
      Link one piece of evidence to a lifecycle run.
  make-docs lifecycle complete [write]
      Mark a lifecycle run as done.
  make-docs lifecycle fail [write]
      Mark a lifecycle run as failed.
  make-docs lifecycle abandon [write]
      Stop a lifecycle run that will not finish.

[write] commands change files or Store records.

Use --help or -h with a command to see its options.
```

Exit code: 0.

#### `make-docs factory --help`

```text
make-docs factory

Run approved backlog work through workers and review.

Usage: make-docs factory <command> [options]

This group has no commands yet.
```

Exit code: 0.

#### `make-docs check --help`

```text
make-docs check

Check PRDs, performance evidence, and user test records. Changes nothing.

Usage: make-docs check <command> [options]

Commands:
  make-docs check prd
      Check that the active PRDs describe the product, not edits to it. Changes nothing.
  make-docs check performance-evidence
      Check the shape and links of performance evidence records. Runs no benchmark. Changes nothing.
  make-docs check uat scenario
      Check one user test scenario record. Changes nothing.
  make-docs check uat persona
      Find the Persona for a user test and check it. Changes nothing.
  make-docs check uat target
      Check one user test target record. Changes nothing.
  make-docs check uat evidence
      Check one user test evidence link and its file digest. Changes nothing.
  make-docs check uat finding
      Check one user test finding record. Changes nothing.
  make-docs check uat result
      Check one user test result record. Changes nothing.

Use --help or -h with a command to see its options.
```

Exit code: 0.

#### `make-docs mcp --help`

```text
make-docs mcp

Serve Make Docs tools to agents over MCP. The server talks over stdio.

Usage:
  make-docs mcp [--profile <name>] [--help]

Options:
  --profile <name>  Choose tools and native resources for one task. Default: all.
  --help, -h       Show help for this command.

Profiles:
  core      Install state, settings, system resources, and the list of tool areas.
  setup     Install plans, repair, compatibility, and layout.
  workflow  Lifecycle, project context, and work evidence.
  quality   Requirements, performance evidence, and user test checks.
  backlog   Backlog snapshots and the review cache.
  all       All ready tools and native resources.

Behavior:
  The default profile, all, gives every ready tool in one server.
  Native resource lists and reads use the selected profile.
  Tools read and plan first. A tool that writes needs allowWrite=true.
  Each MCP tool name is its CLI path with underscores, such as work_item_resolve for `make-docs work item resolve`.
  MCP tools run the same operations as the CLI groups.

Examples:
  make-docs mcp
  make-docs mcp --profile backlog
```

Exit code: 0.

#### `make-docs update --help`

```text
make-docs update

Update the make-docs tool on this computer. This is a machine-level change.
It finds the package manager that installed make-docs and asks it to update.
When it cannot tell which one, it prints the exact command instead.
With npx, pnpm dlx, or bunx, nothing is installed, so there is nothing to
update. Each run also updates the Make Docs Store format when needed. When this
folder has an install from before version 2, it first asks how to move it.

Usage:
  make-docs update [--target <dir>] [--yes] [--help]

Options:
  --target <dir>                   Check this project folder for an install from before version 2.
  --yes                            Skip questions that are not about safety.
  --help, -h                       Show help for this command.

To change a project's install, use `make-docs setup` or `make-docs setup reconfigure`.
```

Exit code: 0.

#### `make-docs uninstall --help`

```text
make-docs uninstall

Remove the make-docs tool from this computer. This is a machine-level change.
It never changes project files. It asks before it removes anything. With no
terminal, it stops and removes nothing unless you add --yes.
With npx, pnpm dlx, or bunx, nothing is installed, and it says so. When it
cannot tell how make-docs was installed, it prints the exact command and
removes nothing.

It keeps the Make Docs Store unless you add --remove-store. The Store is in
MAKE_DOCS_HOME when that is set, else in ~/.make-docs/. --remove-store deletes
the Store only after the tool is removed, or when nothing is installed (npx and
other runners). It keeps the Store when the tool removal fails or when it
cannot tell how make-docs was installed. It always keeps the Store clean
backups in <store>/backup/ and tells you how to delete them.

Usage:
  make-docs uninstall [--yes] [--remove-store] [--help]

Options:
  --yes                            Remove without a question.
  --remove-store                   Also delete the Make Docs Store records. Backups in <store>/backup/ stay.
  --help, -h                       Show help for this command.

To remove make-docs from a project, use `make-docs setup remove`.
```

Exit code: 0.

#### `make-docs work item resolve --help`

```text
make-docs work item resolve

Find a work item from its coordinate or path, and show its project, wave, and phase file. Changes nothing.

Usage:
  make-docs work item resolve <coordinate-or-path> [--repo-root <path>] [--json]

Arguments:
  <coordinate-or-path>  A coordinate such as 'W33 R0 P5', or a path to a backlog or phase file.

Options:
  --repo-root <path>  The project folder. The default is found from this folder.
  --json              Print the full result as JSON.
  --help, -h          Show this help.
```

Exit code: 0.

#### `make-docs check prd --help`

```text
make-docs check prd

Check that the active PRDs describe the product, not edits to it. Changes nothing.

Usage:
  make-docs check prd [--target-root <project>] [--json]

Options:
  --target-root <project>  The project folder. The default is this folder.
  --json                   Print the full result as JSON.
  --help, -h               Show this help.
```

Exit code: 0.

#### `make-docs project move preview --help`

```text
make-docs project move preview

Show which saved checkout this moved folder can take over. Changes nothing.

Usage:
  make-docs project move preview [--source-checkout <id>] [--target-root <path>] [--json]

Options:
  --source-checkout <id>  Show only this saved checkout.
  --target-root <path>    The project folder. The default is this folder.
  --json                  Print the full result as JSON.
  --help, -h              Show this help.
```

Exit code: 0.


### Human Experience Review (A14)

| Promise from the index | Result | Evidence | Limit |
| --- | --- | --- | --- |
| Every command for one capability starts with that capability's group. | Met | The naming-rule test (43) passes. Each group's help lists its commands, and all 64 listed command paths exist. | None. |
| Each MCP tool name is the CLI path after `make-docs`, joined with underscores. | Met | `mcp-derivation`, `mcp-profiles`, and the name-catalog tests pass. `mcp --help` states the rule. The last shipped line with the older `make_docs_` rule is fixed. | The two known `mcp-app-contract` stdio failures are a Node warning, not a name failure. |
| A current name keeps working for the window and names the new one. | Met | The 178 alias tests pass. `--help` on each of the 32 old CLI paths prints the new command's help, then the notice. | The window counts minor releases in one major version only (P3 limit). |
| `make-docs --help` lists the groups by capability, in plain words. | Met | The captures above. The owner's Guided Progress Review passed on 2026-11-23 with five changes, all made. | None. |

A person can now go from `make-docs --help` to a group, see one plain line for each command, and ask any command for its options with `--help`. Before this phase, help on one command failed.

### Plan Validation Items (A14)

- Naming-rule, parity, alias, and shipped-text tests: recorded under Test Counts.
- Full suite and known failures: recorded under Full Suite.
- Help reads by capability: the owner's review passed. Recorded under Help Review.
- Release proof: `smoke:pack:local` passed.

### Limits

- The router drift test checks one direction only: each option in a router command's help is accepted. The 22 `project`, `resource`, and `setup store` routers parse argv by hand, so no proxy can record what they read. A flag that a router accepts but its help leaves out is not found by a test. The 26 dispatcher commands are checked in both directions.
- Aliases that a router accepts are not in the help: `--target-root` for `--target` in `project paths` and `resource`. A `-h` right after such an alias is read as help.
- `packages/cli/src/run/setup-store.ts` still has a branch that answers `--help` after `setup store check|clean`. The leaf help answers first, so the branch no longer runs. W32 R0 P5 changed that file at the same time, so the builder left it. It was removed at integration (see P5 Integration).
- `setup` is a command and a group. Its own options stay in `make-docs setup --help`, after the command list.
- Lifecycle commands outside the registry (`setup`, `setup system`, `setup reconfigure`, `setup skills`, `setup backup`, `setup remove`, `mcp`, `update`, and `uninstall`) keep their own help. Each answers `--help` with exit code 0.
- `runRunCommand` called directly, as some tests do, does not answer leaf help. Only the CLI entry does.
- The `mcp-app-contract` stdio failures, the sandbox-only fixture 11, the `w19-r5-skills-command` flake, and the `cli.test.ts` timeout under load stay as known items.

### P5 Integration

- Merged on top of W32 R0 P5 (`309deec2`). The one conflict, in `packages/cli/src/run/root-operations.ts`, kept the leaf help for `project list --help`. W32 P5's note about `--target-root` is in the leaf help table entry.
- Removed the dead `setup store check|clean --help` branch in `packages/cli/src/run/setup-store.ts`. The leaf help answers those paths, and `setup store --help` still prints the group help.
- `tests/w32-r0-p5-store-wording.test.ts` now checks the `--target-root` note in its new leaf help wording.
- Full suite after the merge, counted from the JSON reporter: 2870 tests, 2860 passed, 4 failed, 6 skipped. 3 failures are the known ones (`mcp-app-contract` 2, `w19-r5-skills-command` 1). The fourth was the W32 P5 wording test above, fixed and rerun with the leaf help and state help tests: 305 passed.
