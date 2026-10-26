# P11 Live Action Controls Candidate

## Finding and source change

The owner sent a live `request-task` action for W25 R0 to the connected Codex chat. The old report had become stale after W25 source edits. I refreshed the open app. It showed `Status: Needs review` and disabled the live Explain and Work buttons. The same wave also showed a second, enabled pair of saved-report copy buttons. These extra buttons made two actions with the same names visible in the live app.

The current source removes `.copy-actions` from each rendered wave in the live widget before it adds the live action row. The static report source is unchanged, so its copy buttons remain. The [isolated after view](live-action-controls-preview.png) shows one Explain icon and one Work icon. It is a browser preview, not installed Codex proof.

## Exact candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `<LOCAL_TEMP>/w25-p11-live-controls-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `85e666fa474826cf555a38c5eaa94646f55291064ac6335087b0f560dded32df` |
| Isolated executable | `<LOCAL_TEMP>/w25-p11-live-controls-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `8b12adeafc57777314afd201ed86f341bcabd0799116b31ffd133259052d106b` |
| MCP App resource SHA-256 | `fbdf614896cc461b606c7568f6a043360612fdb7d697acc4d2873352bc6e12b2` |
| Static report template SHA-256 | `0dd8e183342421ec0faf20e4837b2b3f8af9a227739ace024e420315feeeab0b` |

The isolated executable reports `2.0.5`. A direct MCP client read its 471,907-byte UI resource with MIME type `text/html;profile=mcp-app`. The resource hash matches the generated source. A file-tree comparison with the running no-Print package found only the executable and one generated server chunk and map changed.

## Checks and limits

- The CLI build and TypeScript check passed.
- The focused widget and Skill tests passed: 88 tests in two files.
- A real browser host opened the generated widget with the saved 76-record report. It found zero `.copy-actions` rows in the live report and exactly two live buttons on W25 R0. The preview shows the resulting row.
- The broader browser script's Data action exceeded its 20-second check limit. I ran the bounded open-only check for this controls change. Earlier installed Data proof remains separate.
- `git diff --check` passed. The saved Codex entry now names this candidate. The installed-host result is recorded below.

## Saved entry change for owner review

The owner approved the exact command change on 2026-10-25. The prior saved command was `<LOCAL_TEMP>/w25-p11-no-print-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js`, SHA-256 `e54a377f5de07cdd3f6ed27134d130b213ac7bb8894ff0e5a52ca42293a727e2`. I changed only that command to the isolated executable above. The `mcp` argument, private identity, tool approvals, and separate `make-docs` entry were unchanged. A mode-0600 backup is at `<LOCAL_TEMP>/w25-p11-live-controls-candidate-20261025/codex-config-before-command-change.toml`. A full `codex mcp list --json` parse found the new enabled entry. A byte check found only the approved command difference in the saved config.

The isolated executable started as an MCP server with 45 tools. A direct `project_status` call using the saved private identity returned `ready` when the test process had Store access. The sandboxed call returned `store-unavailable` because it could not create the Store lock directory; no project file changed. This proves the candidate's Store path in a separate process. It does not prove that Codex loaded the new package or rendered its app.

## Installed Codex result

After the owner reopened Codex, process 80667 ran the exact executable hash above. The loaded `project_status` tool returned `ready` with Store available. The loaded `backlog_snapshot` found 76 records. Only W25's source record had changed since the saved report model. I opened a new report with that current snapshot and updated W25 source date. The visible Codex app showed 76 records, 36 in scope, 16 historical, and 24 archived. Its W25 detail showed 53 of 66 tasks complete, one Explain icon, and one Work icon. DOM inspection found zero `.copy-actions` rows in the live app. Refresh returned `Status: Ready`.

I clicked W25 Work twice while this agent turn was active. The app showed no result for either click. No new same-chat Work result was visible to this agent during the turn. Do not count those clicks as a passed Work result or duplicate refusal. P11 t3 stays open. A later W25 source edit can test the changed-source guard on this installed candidate. Native keyboard and reduced-motion behavior also remain open.

Keep the prior package and the mode-0600 config backup for rollback until installed acceptance is complete.
