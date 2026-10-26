---
title: P11 No Print Button Candidate
status: active
---

# P11 No Print Button Candidate

## Owner decision

The owner does not need a Print button in either Backlog Review report. The live app and saved static report now have no Print button or Print click handler. The saved report still supports the browser's Print command and its print layout. The [earlier guidance candidate](live-print-guidance-candidate.md) was not installed.

## Exact local candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `/private/tmp/w25-p11-no-print-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `88e0547e960397e97e33e7db1c8ce8668e6a3e6360f58c81ad0803133f0291fa` |
| Isolated executable | `/private/tmp/w25-p11-no-print-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `e54a377f5de07cdd3f6ed27134d130b213ac7bb8894ff0e5a52ca42293a727e2` |
| MCP App resource SHA-256 | `9eea9c86a57d9ec6f5fff07e6852971738c81374f2d0d0ebd9fb437c8248d6ed` |
| Static report template SHA-256 | `0dd8e183342421ec0faf20e4837b2b3f8af9a227739ace024e420315feeeab0b` |
| Static report guide SHA-256 | `9581fdd9cf80ac51cdb2a76fdbd32192b813a987e3b87d85051d6f07da156fe4` |

The tarball was unpacked into a new isolated copy of the prior candidate's dependency tree. Its executable reports `2.0.5`. A direct MCP client read the 471,863-byte UI resource from that executable. Its SHA-256 matches the generated widget source. The resource has no Print control or Print help element and still has Refresh. The packaged distribution files contain no `printReport` or `printUnavailable` token. The upstream static template and dogfood copy match. The upstream guide and dogfood copy match.

## Checks and human review

- The CLI build and TypeScript check passed.
- The focused widget and Skill tests passed. Vitest also found a duplicate Skill test in another checkout; it passed.
- PRD authority validation passed across 35 PRDs with no diagnostics.
- The generated widget check and `git diff --check` passed.
- A real browser host rendered all 76 records in the generated live widget. Print and its help element were absent. Refresh remained visible. The [live header preview](no-print-live-header.png) shows Theme, Refresh, and Data.
- A saved static report rendered all 76 records with no Print button. Theme and Data remained visible. Browser print media kept the report body and hid toolbar controls. The [static header preview](no-print-static-header.png) shows the two controls.

The browser previews show the intended layout. They do not prove the new package's result in Codex. The saved `make_docs` entry still uses the prior candidate, so its live app still has the failing Print button.

## Saved-entry change for owner review

Change only the saved `make_docs` MCP command to the isolated executable above. Keep its `mcp` argument, private identity value, tool approvals, and the separate `make-docs` entry unchanged. First recheck the tarball and executable hashes. Parse the full config before Codex reload. After reload, check that `make_docs` starts, Store status is `ready`, the 76-record report opens, and its header has Theme, Refresh, and Data with no Print button. If startup or access fails, restore the saved config backup and prior command. Keep the prior package for rollback.

Before the approved change, the saved command was `/private/tmp/w25-p11-static-icon-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js`. Its executable SHA-256 was `d0f0ab5af9ed03edb721454a8bf1e9d8a1485895d560dcbfaacf8f3008d00e4d`. The earlier approval named that prior candidate. The new exact command required a separate approval before it was saved.

## Approved saved-entry change

The owner approved this exact candidate. The saved `make_docs` command now points to the no-Print executable. The edit changed only that command line. It kept the `mcp` argument and all other config text. A private mode-0600 backup is at `/Users/tylerkneisly/.codex/config.toml.w25-p11-no-print-backup-20261025`. `codex mcp list --json` parsed the full config and reported an enabled stdio `make_docs` entry at the new command. The tarball and executable hashes still match this packet. A direct client read the new UI resource and found no Print control.

At that check, Codex still ran process 35226 from the prior static icon candidate. The saved command is ready, but the running host has not loaded it. Keep installed Store and visible app acceptance open until Codex restarts and the new process and app are checked.

## Reopened Codex check

The owner quit and reopened Codex. The new Make Docs process is PID 49259 and runs the exact no-Print executable. The saved entry still parses as enabled stdio with the `mcp` argument. `project_status` through the loaded `make_docs` tool returned `ready` with Store available. A fresh snapshot found 76 records. I updated the one changed W25 source record in the last report. The loaded `backlog_review_open` tool accepted that current 76-record report and returned the expected 76, 36, 16, and 24 tallies. Tool acceptance alone did not prove the visible toolbar.

The owner then confirmed that the visible app shows Theme, Refresh, and Data, with no Print button. This passes the installed live-toolbar check. Other P11 checks remain open in the [result record](installed-acceptance-results.md).
