---
title: "W25 R0 P10 Candidate and Connection Packet"
kind: "evidence"
status: "draft"
coordinate: "W25 R0 P10"
source:
  type: "work"
  path: "docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/10-candidate-and-connection.md"
---

# Candidate and Connection Packet

Date: 2026-10-24. State: the first-party 2.0.5 `make_docs` entry is saved. The restarted Codex app loaded it and ran read-only tools. The old `make-docs` entry and old tool settings remain commented out by the owner.

## Candidate 1

| Item | Exact value |
| --- | --- |
| Package | `@brucewaynedecoy/make-docs@2.0.5` |
| Source branch | `w25-r0-p1-live-delivery-contract` |
| Source HEAD | `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Source state | Dirty. The changed package inputs are listed below. Project work records and the dogfood Skill are also dirty. |
| Lockfile SHA-256 | `d1f2ad0b65f43102a925a5f78dd4d9e7c41ab61773a43c07f7cd2f1d28064de5` |
| Tarball | `/private/tmp/w25-p10-candidate-20261024/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `beca5b8bcee208fbeed95eb99374efab6a115b025e29bbc2e33c1feb7c9ed30c` |
| Isolated install | `/private/tmp/w25-p10-candidate-20261024/installed` |
| Candidate executable | `/private/tmp/w25-p10-candidate-20261024/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Built and installed executable SHA-256 | `2bef0ef7e48babede537ee32368eecee3b464e23de0aeef9e21ea983e7866c19` |
| Built and installed Skill bundle SHA-256 | `ecbd48bf8eecb6adf4d157faa4a3aec518a497f216ffbac17d45fd7d768238f2` |
| Generated widget SHA-256 | `9699e31b10928b3bf7bd1a9965f29a5bafd2caa732ef7d1d34d8635fe5c09246` |

These dirty package inputs are part of the tarball source. Each hash is SHA-256.

| Package input | Hash |
| --- | --- |
| `packages/cli/src/operations/work/backlog/cache-key.ts` | `2e8d9f9d06343e7aefa54cc45a996ba8feff133c6bb035b6aa7adef8904d31cc` |
| `packages/cli/src/operations/work/backlog/cache-service.ts` | `d2d7984f2f8decfe5a9c21cf326e234c08c5665fb8cdb849f13418fdd1687aef` |
| `packages/cli/src/operations/work/backlog/agent-contracts.ts` | `739facc4b0ae6844a07a07400f93b3c77b90287dde298175ec3b64bb5278d4a8` |
| `packages/cli/src/mcp/widget/static-renderer.js` | `17131a4a3c3061e11bf988ee0680faa4686a55fd01af92f10307f42a33e3ddcc` |
| `packages/cli/src/mcp/assets/backlog-review-v1.html` | `9699e31b10928b3bf7bd1a9965f29a5bafd2caa732ef7d1d34d8635fe5c09246` |
| `packages/cli/src/mcp/assets/backlog-review-v1.ts` | `862e18ccc8588fd3e52f4a492d1f81b12b57d5d24f2e00438bb9e3aae1233cae` |
| `packages/skills/backlog-review/assets/backlog-review-report.html` | `cfb0ef7d7e523dfda3f6ad07f8e7d45ffcbf0b8fa1037e259cdbff291bb8d0b8` |
| `packages/skills/backlog-review/references/cache.md` | `34931ae25105c09d38df1c70136ac499ec2f9c5b7b133c60e6417c5d8a31a3ba` |
| `packages/skills/backlog-review/scripts/agent-contract.mjs` | `fa1468d08995a57f2eff92b58fff588fa5e62720d7c796741b0b5229b1c5d575` |

The package build copied the committed template into `packages/cli/template`. `npm pack` ran `prepack` and built the CLI. The first pack command could not write npm logs inside the sandbox. The second command used `/private/tmp/w25-p10-npm-cache` and made the tarball. An offline install first failed because that empty cache lacked `@clack/core`. An approved offline retry used the existing npm cache and installed 103 packages under the isolated path. No global package changed.

The isolated executable reports `2.0.5`. A real local MCP handshake with the exact proposed executable and `mcp` argument passed. The default profile listed 45 tools. It included `backlog_review_open`, `backlog_review_refresh`, `backlog_cache_read`, and `backlog_cache_write`. Resource read returned `ui://make-docs/backlog-review/v1.html`. Its bytes matched the generated widget hash above. The executable inside the tarball matches the built and isolated installed executable hash above.

## Current saved entry and completed command-only trial

The named entry is `make_docs` in `/Users/tylerkneisly/.codex/config.toml`. It now launches global version `2.0.4`. Its current executable is `/Users/tylerkneisly/.nvm/versions/node/v24.19.0/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js`. That file has SHA-256 `d09f9b32839cb74577886c8c1ff4172e283f71e3d403a0cf8f932f3995105cd3`. The entry has `args = ["mcp"]`. It has no saved working directory. It has a private `MAKE_DOCS_HARNESS_CALLER_IDENTITY` value. This packet does not copy or show that value.

The owner approved this exact command-only diff. It was applied and then rolled back:

```diff
 [mcp_servers.make_docs]
-command = "/Users/tylerkneisly/.nvm/versions/node/v24.19.0/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js"
+command = "/private/tmp/w25-p10-candidate-20261024/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js"
 args = ["mcp"]
```

The trial kept the private environment value byte-for-byte unchanged. It kept the tool approval settings and the separate `make-docs` entry unchanged. Five running processes used the old executable path at the earlier process check. Their source entry was not proved. None was stopped.

The candidate tarball and executable hashes matched this packet before the switch. The saved entry then showed the new command and the same private environment key. The old private caller identity still bound to the 2.0.4 executable. The candidate's first-party access check could not accept it. The candidate's setup preview also blocked on the existing `make_docs` entry because that entry has no exact Make Docs ownership receipt. This is a user-owned entry in the setup contract. The phrase means that Make Docs cannot prove that it created or may replace that saved entry. It does not mean a second server is required.

The command-only trial did not prove running-host use. Its approved rollback restored the old command. A byte comparison with the pre-trial backup passed. The config file kept mode `0600`. The backup is `/Users/tylerkneisly/.codex/config.toml.w25-p10-backup`. Keep it until the replacement is settled.

## Replacement needed for first-party access

The candidate's new grant format uses `MAKE_DOCS_MCP_CONNECTION_ID` and `MAKE_DOCS_MCP_CONNECTION_KEY`. The old saved entry uses `MAKE_DOCS_HARNESS_CALLER_IDENTITY`. A command change alone cannot make the old identity valid for the candidate.

The first disposable setup passed with the five old tool tables left active. I then made an unsafe intermediate change in the live config: I removed only the `make_docs` parent and environment tables. TOML treated the remaining `make_docs.tools.*` tables as an implicit `make_docs` entry. That entry had no `command`. Codex rejected the file at startup with `invalid transport in mcp_servers.make_docs`. The owner commented out both Make Docs entries and every Make Docs tool table to restore startup. This stopped both connections from loading.

A minimal disposable Codex config reproduced the same error with an active child tool table and no parent. The same config passed after adding a parent command. The live setup had not run when Codex failed. No new Store receipt existed from that failed intermediate step. The protected pre-change backup is `/Users/tylerkneisly/.codex/config.toml.w25-p10-migration-backup`, SHA-256 `57455b37d1a7b997324fcd84e2ffbf6c8defc99b5c4038bf2f74cd6a9e21286b`. The invalid intermediate file had SHA-256 `59b04a38228dbb374209b4b693af16a8553ac8a25b04f1240a7c0cc66f2c7b9f`.

The owner's commented config parsed with `codex mcp list --json`. I copied that working state to `/Users/tylerkneisly/.codex/config.toml.w25-p10-user-commented-backup`, SHA-256 `2095105f10d2b4980c2c5bdd4957583b36128f4b57d52061cefcd501b0cdfbfc`. A second disposable setup used the same commented shape. It returned `configured`; Codex parsed the result and found one active `make_docs` entry. That test changed no live files.

The owner then asked me to continue with a safer approach. The live steps were:

1. Keep the owner's working commented config as the backup. Do not activate any old tool table without a valid parent entry.
2. Run the reviewed 2.0.5 candidate's `setup system` for Codex MCP only, bound to this project. Let the first-party code add one complete managed block by an atomic file replacement. Do not select Claude Code or GitHub Copilot.
3. Check that Codex parses the saved config before any app reload. Check the command and executable hash. Keep the old package and the owner's commented settings.

The live setup returned `configured` with verified mutation state. A later read-only setup run returned `unchanged` with no blocked item. Codex parsed the live config and listed one active `make_docs` entry. Its command points to the exact isolated candidate executable with SHA-256 `2bef0ef7e48babede537ee32368eecee3b464e23de0aeef9e21ea983e7866c19`. The managed block and the owner's commented lines remain. The current config has SHA-256 `b4a86f707b480474e3facb6a8ed3c18e5f8eb0d3e57b2ede70b77f5701f91c4f` and mode `0600`. The separate `make-docs` entry is still commented out.

The saved config has this shape. Setup generated the new ID and key. This packet does not copy their private values.

```diff
 # [mcp_servers.make-docs]
 # ... owner's commented old settings ...
+# make-docs:begin harness-access codex mcp
+[mcp_servers.make_docs]
+command = "/private/tmp/w25-p10-candidate-20261024/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js"
+args = ["mcp"]
+[mcp_servers.make_docs.env]
+MAKE_DOCS_MCP_CONNECTION_ID = "[generated ID]"
+MAKE_DOCS_MCP_CONNECTION_KEY = "[generated private key]"
+# make-docs:end harness-access codex mcp
```

The new Store receipt holds hashes and redacted values, as tested in W26. The older private value stays in the protected pre-change backup. The owner-commented settings stay in the saved config. They are inert comments.

An MCP client launched the saved entry. It listed 45 tools and read the widget resource. The widget bytes matched SHA-256 `9699e31b10928b3bf7bd1a9965f29a5bafd2caa732ef7d1d34d8635fe5c09246`. A deliberately invalid connection key returned `store-denied`. The valid key returned `store-not-configured` for this project because it has no reviewed project access intent yet. This is a separate P11 setup need.

The owner quit and reopened Codex. This task gained the `make_docs` tools. The live `install_status` tool reported package version `2.0.5`. The live `resource_list` tool returned 12 references. The live `project_status` tool returned `store-not-configured` for the same missing project intent. A process check found candidate PID `69040` running from the exact saved executable path, while old 2.0.4 PID `25691` was still present. The candidate executable at that path has SHA-256 `2bef0ef7e48babede537ee32368eecee3b464e23de0aeef9e21ea983e7866c19`. This binds the running Codex host to the reviewed candidate. It does not pass P11 Store or app acceptance.

Two read-only P11 previews show why project access needs its own review. A plain setup run with `--project-resources none` planned removal of many managed resources, so it was not applied. A reconfigure run that kept the project's current Claude Code MCP choice and added Codex MCP planned no changes to 92 project paths, but it also marked the Claude Code machine entry as drifted and planned a native-file change. It was not applied. P11 must find a route that records Codex project intent without an unreviewed Claude Code repair or content removal.

If later checks fail, do not remove the new Store receipt or overwrite a live database by guesswork. Keep the verified config and stop at the recorded state. The owner's commented backup and the old global package remain available. Any rollback after the Store write needs an exact review of the live host and Store records.

## Trial rollback and limits

Retain the global `2.0.4` package and the exact current command. The command-only trial used the following rollback. This diff is historical. It is not a sufficient rollback for the broader replacement above.

Rollback diff for `make_docs`:

```diff
 [mcp_servers.make_docs]
-command = "/private/tmp/w25-p10-candidate-20261024/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js"
+command = "/Users/tylerkneisly/.nvm/versions/node/v24.19.0/lib/node_modules/@brucewaynedecoy/make-docs/dist/index.js"
 args = ["mcp"]
```

The candidate is in `/private/tmp`. Its path is temporary. Keep it present until the review or install route changes. The local and running-host checks do not prove normal Store access, visible Refresh, connected-chat actions, or installed accessibility. P11 owns those checks.

The owner approved the command-only trial, then approved the broader first-party replacement. The owner later asked for a safer approach after the invalid intermediate file stopped Codex startup. The first-party entry is saved, parsed, and loaded by the running Codex host. P10 is complete within its connection scope.
