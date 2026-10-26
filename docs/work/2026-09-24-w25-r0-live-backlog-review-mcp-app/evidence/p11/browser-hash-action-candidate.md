# P11 Browser Hash Action Candidate

## Installed failure

The owner approved and loaded the action-feedback candidate. The saved `make_docs` command names its exact executable. A restarted Codex process ran that path. The loaded `project_status` call returned `ready`, with MCP and Store access available.

I opened a fresh 76-record report in this chat. W25 R0 showed 55 of 66 tasks complete, one Explain icon, one Work icon, and `Status: Ready`. The owner pressed Explain once. The app showed `Could not send to chat.` No Explain message reached the chat. The app's local failure reason was `Widget hash validation is not active.` I did not press Explain or Work. Work was not tested on this candidate.

## Cause and correction

The browser widget checks action identity inside `withBrowserHashes`. It then created the short visible message reference after that hash pass ended. The browser hash adapter refused the later hash. The failed click did not reach `ui/message`. This explains this installed failure. The request controller still removes its duplicate mark after an error, so a new attempt can run after a corrected package loads.

The source now resolves the action and creates its clear text message inside one hash pass. The full action, session, project, snapshot, source path, and coordinate checks remain in place. The message still gives one short review reference. No host or Store rule changed.

## Local checks

- The browser-bundled test sent both Explain and Work messages with clear text and a 24-character review reference.
- The request-controller and widget files passed 118 focused tests.
- The TypeScript check, package build, generated widget check, and `git diff --check` passed.
- The isolated executable reports version `2.0.5`. Its dependencies and optional dependencies match the prior candidate.
- An offline npm install stopped because one registry response was absent from the local cache. I copied the prior isolated runtime and replaced only its Make Docs package with the new tarball. This did not change the installed Codex entry.

These checks prove the source and package. They do not prove delivery in Codex.

## Exact candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `<LOCAL_TEMP>/w25-p11-browser-hash-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `2b09a9a6de6f0b4721973ca577a11ef591266881f0363fea7e6d0c0db1ca2023` |
| New command | `<LOCAL_TEMP>/w25-p11-browser-hash-candidate-20261025/runtime/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| New command SHA-256 | `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf` |
| Current saved command | `<LOCAL_TEMP>/w25-p11-action-feedback-candidate-20261025/runtime/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Current command SHA-256 | `2fe3c489ca3b5b817ad40e9a2cb9bb278cd1116f666110ab7890285de8c5d642` |

## Saved entry plan

P11 requires separate approval for this exact saved command change. The full current config has mode `0600`. A private backup and a draft are in the candidate folder. The draft differs by one command value. The current config SHA-256 is `711f5ceae666639d2c4e1e1b4d26b71c6f5d714bc043d99ede77d6c474aa7b89`. The draft SHA-256 is `16fe3449c66ae57ade47d44623912193f02329025af332552a5b452fdb437f6b`. Codex parsed the new command as an override with the same `mcp` argument. The apply and rollback scripts are prepared but have not run.

After approval, recheck both executable hashes and confirm the saved config still matches the backup. Apply only the draft command value. Keep the `mcp` argument, private identity, tool settings, the separate `make-docs` entry, and the old package. Ask the owner to restart Codex. Then check the loaded process path, Store access, a fresh report, and one owner-clicked Explain action. Check the app feedback and visible chat receipt. If Explain passes, ask the owner to test Work. Keep the user's Send step under the user's control. Restore the prior command from the private backup if startup or Store access fails. A later saved change needs its own approval.

## Approved saved change

The owner approved this exact command change. I rechecked the old and new executable hashes and the tarball hash. The apply script checked that the saved config still matched its private backup and that the draft changed only the command. It replaced the config atomically. The saved file matched the draft hash `16fe3449c66ae57ade47d44623912193f02329025af332552a5b452fdb437f6b` and kept mode `0600`. `codex mcp list --json` then showed the new enabled command with the unchanged `mcp` argument. The loaded process and live buttons still need a Codex restart and host check.

## Installed result

After the owner restarted Codex, process 76517 ran the approved executable. Its hash still matched this packet, and the loaded Store check returned `ready`. The fresh 76-record report opened in the same chat. The owner clicked Explain and Work in turn. Each app click showed `Sent to chat.` Each clear text message then reached this chat with one short reference. The strict agent resolver matched both texts to W25 R0 using the report and session from my own open plus an unchanged current snapshot. I read the W25 source before answering and before the bounded P11 Work update. [Installed acceptance results](installed-acceptance-results.md#browser-hash-installed-explain-result--2026-10-26) record the exact host scope. Duplicate and wrong-wave refusal and final P11 claim review remain open. This installed result does not claim release acceptance.
