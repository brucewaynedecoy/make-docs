# P11 Clear Live Action Message Candidate

## Human result

Explain and Work should place a clear request in the current Codex chat. The agent must read the wave's current source record before it answers or starts work. The same visible text carries the exact review reference used to reject an old session, a changed report, a wrong project, or a wrong wave. This path uses one `ui/message` text item. It does not assume that Codex supports a hidden message field.

## Message shape

The fixed text for Explain starts as follows:

> Please explain W25 R0 in this project. Read its current source record before you answer. Check that this review still names the right wave. Then explain its goals, status, open work, and the next useful step.

The fixed text for Work starts as follows:

> Please work on W25 R0 in this project. Read its current source record before you start. Check that this review and its recommended action are still current. Follow my existing approvals and project rules. Tell me what you changed or what approval you need.

The actual message then shows `Review reference:` with `Action`, `Wave`, `Record path`, `Session`, `Model`, `Project`, and `Snapshot` on separate lines. The action lines are readable text. No raw JSON, report claim, project title, or source prose enters the message. The changed-backlog request uses the same text item and lists each changed path under its count.

The parser accepts only its own exact fixed form. It rejects extra lines or changed words. It parses the strict V1 action fields and checks them against the agent's independently confirmed open and current source facts. The agent method also requires a read of the resolved current source record. A message receipt is not proof of an answer or work.

## Exact candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `<LOCAL_TEMP>/w25-p11-clear-actions-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `b020100eb64546cbe38aae2a4255580ecb23b3f4ea3a9d51455bc08e87b879b1` |
| Isolated executable | `<LOCAL_TEMP>/w25-p11-clear-actions-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `87b225a0df2f1ea200f505fc91fe5e24e40b81d5978fa05a120ea3e02743ec75` |
| Current saved executable | `<LOCAL_TEMP>/w25-p11-layout-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Current saved executable SHA-256 | `719276d7dc3888bcc7baaaf9954a2fc455a6d6abe3800cccd680f7afae8e0b20` |

The packed files outside `dist/` match the current installed package. The new build changes the action-message code in `dist/`. The package keeps the existing MCP App resource and 2.0.5 version.

## Checks before Codex

- The CLI build and TypeScript check passed.
- The request-controller and Skill tests passed: 58 tests in two files.
- The tests checked clear Explain and Work text, one visible text item, fixed reference parsing, extra-instruction refusal, old session/model/snapshot refusal, wrong project/path/coordinate refusal, and duplicate button calls.
- The generated portable agent contract matches the source and the dogfood Skill copy. The two changed Skill references also match their dogfood copies.
- The isolated executable returned `2.0.5`. `git diff --check` passed.

These are source and isolated-package checks. They do not prove how Codex shows the message.

## Codex test and recovery

The owner approved this exact saved-command change. Both executable hashes matched the table before the edit. I saved the full config at `<LOCAL_TEMP>/w25-p11-clear-actions-candidate-20261025/codex-config-before-command-change.toml` with mode `0600`. I changed only `mcp_servers.make_docs.command` from the prior executable to the new one. A full byte comparison found only that command difference. `codex mcp list --json` parsed the full config and showed the new command with the same `mcp` argument. The private identity, tool approvals, separate `make-docs` entry, and prior package remain in place. Codex still needs a restart to load this saved change.

After Codex reloads, confirm the running executable and Store access. Open a new report from current W25 facts. Click Explain and check the exact visible message, source read, same-chat answer, and old/wrong-wave refusal. Open another current report before Work if Explain or evidence edits changed the source. Click Work and check the exact visible message, current source read, authorized P11 effect, and duplicate protection. Record both results in P11. If startup, Store access, or action delivery fails, restore only the saved command from the backup, parse the config, and reload Codex. Keep the old package until the result is accepted.

## Installed result and correction

Codex restarted with this candidate and loaded the live report. The owner saw raw JSON after I clicked Explain. The generated live widget still had its old action-message code even though the source controller had clear text. This candidate failed the clear-message check. Work was not tested from it. The [widget correction packet](clear-action-widget-correction.md) records the cause, the rebuilt asset, a build check that catches this mismatch, the new isolated candidate, and the next host check.
