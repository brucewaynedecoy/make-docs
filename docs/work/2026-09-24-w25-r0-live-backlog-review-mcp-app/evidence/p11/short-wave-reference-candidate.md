# P11 Short Wave Reference Candidate

## Purpose

Explain and Work reached this Codex chat as clear text. The first corrected package showed four long identity values. The owner asked whether they need to appear in the message. This candidate shows one 24-character reference after the clear request. The agent matches that reference to a full action from its own confirmed open. It then checks current source facts and reads the selected source record. The message uses one visible `ui/message` text item. It assumes no hidden Codex field.

## Exact candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `/private/tmp/w25-p11-compact-actions-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `c8ca7ccf196042f713f2308e079dc8256a24d64ea6859a46e946b32869c06a00` |
| Isolated executable | `/private/tmp/w25-p11-compact-actions-candidate-20261025/runtime/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `69b7ae42ed7b91329e40ad78e5bda29758eebe2937886b0406be67877638c035` |
| Saved `make_docs` command now | `/private/tmp/w25-p11-clear-action-widget-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Saved executable SHA-256 | `ec9b3a46c0980198614fac8d4586e59dd085b80063eb4f8a60ddfbd0630d3ee3` |

The offline install used an empty npm cache and stopped on an uncached dependency. I copied the prior isolated 2.0.5 dependency tree into this temporary directory. I replaced only its Make Docs package with the new tarball contents. The old and new package versions, dependencies, and optional dependencies match. The new executable reports version `2.0.5` and reads the current 76-record snapshot. This temporary runtime is outside Git.

## Source checks

- TypeScript check passed.
- CLI build passed, including the generated MCP App asset check.
- All 131 focused request-controller, widget, and Skill tests passed.
- PRD authority check passed with no diagnostics.
- `git diff --check` passed.
- Tests reject a changed session, model, project, snapshot, path, or wave. A changed current snapshot is rejected. Extra text is rejected. The UI keeps its duplicate-request guard.

## Proposed saved change and host check

P11 needs separate approval for this saved connection change. Change only the `make_docs` command from the saved executable above to this candidate executable. Keep its `mcp` argument, private identity, tool approvals, the separate `make-docs` entry, and the old package. Before the edit, check both hashes, parse the full config, and save a private mode-`0600` backup. After the edit, compare all config bytes except the one command value and check `codex mcp list --json` without printing private values.

The owner restarts Codex. Check that the entry starts, Store access is ready, and a fresh 76-record report opens. The owner sends Explain and Work from that new report when ready. Confirm each message has clear text plus one short reference. Match each against the independently retained open and a fresh source snapshot. Read W25 R0 before the answer or Work effect. Record the exact same-chat result, plus any failure, in P11. Do not count a message receipt as completed work.

If startup, Store access, or either action fails, restore only the saved command from the private backup and ask the owner to restart Codex again. Keep the candidate and failure record for review. Do not remove the old package.

## Approved saved change and current limit

The owner approved the exact command change. Both candidate hashes and the old executable hash matched this packet. The previous full config is in a private mode-`0600` backup at `/private/tmp/w25-p11-compact-actions-candidate-20261025/codex-config-before-command-change.toml`. A one-value draft was applied with an atomic file replacement. The saved config now matches that draft byte for byte and remains mode `0600`. `codex mcp list --json` reads the entry as enabled stdio with the approved command and unchanged `mcp` argument. No private identity was printed.

A separate local MCP client started the new package and listed 45 tools. Its `project_status` call returned `store-unavailable`. The same client and saved identity returned the same result with the prior package. The running Codex MCP connection still returned `ready` with `storeAvailable: true`. This local test proves startup and tool discovery. It does not test Codex's project grant, so the `store-unavailable` result is not a candidate-specific failure. The approved command remains saved for the Codex restart and installed Store check. Explain and Work with the short reference remain unproved in Codex.

## Installed result after restart

Codex restarted and loaded this exact package. Its `project_status` returned `ready`, with MCP and Store access available. A fresh 76-record Backlog Review opened in the original chat. It showed W25 R0 with 55 of 66 tasks complete and `Status: Ready`. The owner expanded W25 and clicked Explain. No message appeared. I ran the app's source check; it reported unchanged facts, 76 cache hits, and `Status: Ready`. The owner clicked Explain again. No message appeared. I did not click either action button.

This is a failed installed action result. It is not a short-reference pass. The widget did not show the action outcome, so the exact failure point is unproved. Source review found that the request controller marks an action as sent before the host confirms it and keeps that mark after a host error. That defect can hide later retries. The new [action feedback candidate](action-feedback-candidate.md) repairs that path and shows a small send result in the live app. This saved connection remains on the short-reference package until that separate change is approved.
