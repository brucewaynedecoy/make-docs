# P11 Clear Action Widget Correction

## Installed failure

The owner restarted Codex with the approved clear-action candidate. `project_status` returned ready. The MCP snapshot found 76 records. A fresh live report opened in Codex and showed W25 R0 with 55 of 66 tasks complete. I clicked its Explain button in the expanded app. The owner saw raw JSON in this chat, so the clear-message host check failed. I did not count the tool receipt or source tests as a pass. I did not test Work from that failed candidate.

## Cause and source correction

`agent-contracts.ts` and the controller built the clear text. The generated `backlog-review-v1.html` still contained the older `ui/message` code that sent `JSON.stringify(action)`. The package build did not check that generated asset. Running `node packages/cli/scripts/build-mcp-app-assets.mjs --check` reproduced the mismatch. I ran the asset builder to update the live HTML and its generated TypeScript module. I changed the CLI build script to check generated app assets before `tsup`, so a stale widget stops the build.

The new packed server resource contains the fixed visible prompt and review reference. It no longer contains the old `text:Xy+JSON.stringify(r)` path. The action schema and old/wrong-wave checks remain in the shared source. This source and package check does not prove the new text in Codex.

## Exact replacement candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `<LOCAL_TEMP>/w25-p11-clear-action-widget-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `f131f2e4899407a3c70ac61dda479611a76fcdf091f1bd88e279ca950fd9014b` |
| Isolated executable | `<LOCAL_TEMP>/w25-p11-clear-action-widget-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `ec9b3a46c0980198614fac8d4586e59dd085b80063eb4f8a60ddfbd0630d3ee3` |
| Saved executable now | `<LOCAL_TEMP>/w25-p11-clear-actions-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Saved executable SHA-256 | `87b225a0df2f1ea200f505fc91fe5e24e40b81d5978fa05a120ea3e02743ec75` |

## Checks and host plan

- CLI build, TypeScript, and `git diff --check` passed.
- Request-controller, widget, and Skill tests passed: 131 tests in three files. The widget test includes the generated-asset check.
- `npm pack` passed with the new build gate. The isolated executable returned `2.0.5`.
- The new bundled server resource contains clear prompt text and review-reference text. Its old raw-JSON wire text is absent.

The remaining host check needs a separate saved-entry change. Change only `mcp_servers.make_docs.command` to the new executable above. Keep its `mcp` argument, private identity, tool approvals, the separate `make-docs` entry, and the prior package. Save the full config with mode `0600`, verify that it differs by only this command line, and parse it before reload. After Codex restarts, check Store access, open a fresh report, and test Explain and Work in this chat. Read the current source record before each answer or Work effect. If startup, Store access, or delivery fails, restore only the saved command from the private backup, parse the config, and reload Codex.

## Approved saved change

The owner approved this exact replacement. I rechecked both executable hashes and the old saved command. I saved the full prior config at `<LOCAL_TEMP>/w25-p11-clear-action-widget-candidate-20261025/codex-config-before-command-change.toml` with mode `0600`. I changed only the `make_docs` command line. A full byte comparison found only that line change. `codex mcp list --json` parsed the complete config and showed the new command with the same `mcp` argument and enabled state. Codex still needs a restart before the corrected live widget can be tested.
