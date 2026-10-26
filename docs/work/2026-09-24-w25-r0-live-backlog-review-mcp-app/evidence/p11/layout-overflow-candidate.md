# P11 Phase Bar Layout Candidate

## Finding

The owner showed a W25 phase bar that ran past the right edge on a narrower wide screen. The installed live app confirmed the cause. Its W25 row had 201 pixels for the phase bar, but the bar's 13 fixed-minimum cells required 258 pixels. The row's content was 29 pixels wider than its box.

## Source change

The accepted report source now lets each phase cell share the width available in its grid column. It also lets the bar wrapper shrink. The same two CSS rules changed in the shipped Skill source and this repo's installed Skill copy. The widget and static renderer were regenerated from that source. The [820-pixel preview](layout-820-preview.png) shows the bar inside the W25 row. The static report uses the same rules.

## Exact candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `/private/tmp/w25-p11-layout-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `2e9040d3949d120a9112b0f9abcb5ab0ab17a53d513eeea881723befa4781050` |
| Isolated executable | `/private/tmp/w25-p11-layout-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `719276d7dc3888bcc7baaaf9954a2fc455a6d6abe3800cccd680f7afae8e0b20` |
| MCP App resource SHA-256 | `504e2b4de46640f1dfaa526931337d0895fef1ea3c4b672e2c9492f1ad933652` |
| Accepted report source SHA-256 | `e351c336f77567e80b16f858f86433f0fbc0dae30c4dd254e0bf036c3551934e` |

## Checks

- A real browser rendered the generated 76-record widget. The W25 row and phase bar stayed within their boxes at widths of 1200, 1024, 900, 820, 761, 760, and 600 pixels. The same run found no static copy row in the live app and one Explain and one Work button on W25.
- The CLI build and TypeScript check passed. The widget and Skill tests passed: 88 tests in two files.
- The generated asset check, Skill source parity check, and `git diff --check` passed.
- The isolated executable reported version `2.0.5`. It started as an MCP server with 45 tools. A direct `project_status` call with the saved private identity returned `ready` when the test process had Store access.
- The prior and new packed files outside `dist/` match. The build regenerated `dist/` chunks. The MCP App resource changed from SHA-256 `fbdf614896cc461b606c7568f6a043360612fdb7d697acc4d2873352bc6e12b2` to the hash above. The source edit for this correction is limited to the two CSS rules and the browser layout check.

## Saved entry and installed check

The owner approved the exact layout candidate. The prior saved command pointed to the live-controls executable at `/private/tmp/w25-p11-live-controls-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js`, SHA-256 `8b12adeafc57777314afd201ed86f341bcabd0799116b31ffd133259052d106b`. I changed only the saved `make_docs` command. The `mcp` argument, private identity, tool approvals, other entry, and old package stayed as they were. A byte check found only that command difference in the full config. The mode-0600 backup is at `/private/tmp/w25-p11-layout-candidate-20261025/codex-config-before-command-change.toml`.

After the owner reopened Codex, process 29237 ran the exact executable hash above. The loaded `project_status` tool returned `ready` with Store available. A fresh snapshot found 76 records and W25 at 53 of 66 tasks complete. The loaded review tool opened a new report in Codex. In its 1124-pixel app view, W25's row had 702 pixels and its bar had 201 pixels. The row and bar each had no horizontal overflow. The bar's right edge was 28 pixels inside the row's right edge. The expanded W25 detail still had one Explain and one Work icon and no static copy row. Refresh returned `Status: Ready`.

This passes the installed layout check at the width that showed the 201-pixel bar problem. The seven-width browser check covers other widths. Keep the prior package and config backup for rollback until P11 acceptance is complete.

After the P11 result record changed, Refresh in this same installed app returned `Status: Needs review`. Both W25 live action buttons were disabled. The old report remained visible. This passes the changed-source guard on this candidate. A new reviewed report is needed before another live action test.
