# P11 Live Action Feedback Candidate

## Failed installed check

The owner clicked W25 R0 Explain twice in the new live report. Neither click put text in this Codex chat. The first click happened before an explicit source check. I then used Refresh. The app reported unchanged source facts, 76 cache hits, and `Status: Ready`. The second click still put no text in chat. I did not press Explain or Work. Explain and Work remain unproved for the short-reference package.

The old widget does not show an action result. Its request controller marks an action as sent before Codex confirms it. A host error leaves that mark in place, so a later click can be ignored. The installed failure point is not yet known. The source defect is real and has a focused test.

## Candidate change

- Keep one icon for Explain and one for Work.
- Show `Sending to chat…` while a request is pending.
- Show `Sent to chat.` only after the host replies with success.
- Show `Could not send to chat.` after rejection or an error. Keep the internal reason in a data attribute for test inspection.
- Allow a new attempt after the host rejects a message. Keep duplicate blocking after confirmed delivery.
- Keep the current short message and its source, session, and wave checks.

This feedback will show whether the next installed click reaches the host. It does not treat a host reply as proof that text appeared in chat. The owner must still confirm visible same-chat delivery.

## Exact package

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `<LOCAL_TEMP>/w25-p11-action-feedback-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `20d440d883d9d8e14a5d1f76e951f67ac89343337f90279290677a2bde41b7d4` |
| Candidate command | `<LOCAL_TEMP>/w25-p11-action-feedback-candidate-20261025/runtime/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Candidate command SHA-256 | `2fe3c489ca3b5b817ad40e9a2cb9bb278cd1116f666110ab7890285de8c5d642` |
| Saved command now | `<LOCAL_TEMP>/w25-p11-compact-actions-candidate-20261025/runtime/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Saved command SHA-256 | `69b7ae42ed7b91329e40ad78e5bda29758eebe2937886b0406be67877638c035` |

The candidate has the same package version, dependencies, and optional dependencies as the saved package. Its executable reports `2.0.5`. The isolated runtime and tarball stay outside Git.

## Checks before a saved change

The asset build, TypeScript check, and package build passed. The focused request-controller, widget, and MCP app tests passed: 157 tests. A new test proves retry after a host error and duplicate refusal after a later success. The generated package contains the feedback text. These checks do not prove live Codex delivery.

## Proposed installed check and recovery

P11 requires separate approval for this exact saved command change. After approval, recheck both executable hashes. Save a private mode-`0600` copy of the full Codex config. Change only the `make_docs` command. Keep its `mcp` argument, private identity, tool approvals, the separate `make-docs` entry, and the old package. Parse the full config before asking the owner to restart Codex.

After restart, check the loaded process path, `project_status`, Store access, and a fresh 76-record report. Ask the owner to press Explain once. Inspect the live feedback and the chat. If the app reports a failure, record its reason and stop. If the app reports success without text in chat, record a host delivery gap and stop. If Explain reaches chat, validate its current source and short reference. Then ask the owner to test Work. Restore the old command from the private backup if startup or Store access fails. Do not make another saved connection change without a new approval.

## Approved saved change

The owner approved this exact command. Both executable hashes and the tarball hash matched this packet. The full prior config is saved at `<LOCAL_TEMP>/w25-p11-action-feedback-candidate-20261025/codex-config-before-command-change.toml` with mode `0600`. A draft changed only one command value. Codex parsed the new command as an override before the write. I applied the draft by atomic replacement. The saved file matched the draft byte for byte and retained mode `0600`. `codex mcp list --json` then reported the new enabled `make_docs` command with the unchanged `mcp` argument. The installed process and live action result remain unproved until Codex restarts.

## Installed result

After the owner restarted Codex, the loaded process ran this candidate and `project_status` returned `ready` with Store access. A fresh 76-record report opened in this chat. The owner pressed W25 R0 Explain once. The app showed `Could not send to chat.` Its local reason was `Widget hash validation is not active.` No message reached this chat. This candidate fails the installed Explain check. Work was not tested. The [browser hash correction packet](browser-hash-action-candidate.md) records the cause and a separate candidate.
