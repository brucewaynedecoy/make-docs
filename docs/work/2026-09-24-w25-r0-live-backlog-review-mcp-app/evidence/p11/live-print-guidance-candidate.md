---
title: P11 Live Print Guidance Candidate
status: superseded
---

# P11 Live Print Guidance Candidate

This candidate was not installed. The owner removed the Print button from both reports before this candidate was applied. Keep this packet as the tested but superseded correction record. Use the later no-Print candidate for installed review.

## Host failure and correction

The owner clicked Print in the reopened Codex app. The tooltip said `Print report`. No preview or help appeared. The [screen after the click](live-print-no-result-20261025.png) shows the 76-record report and `Status: Ready` with no Print message. This host exposed `window.print` as a function, but that function did not open a preview. The earlier function-presence check was insufficient.

The live Print control now always gives one local help message. The message directs the user to ask in chat for a static report and print that report in a browser. The live control does not call `window.print`. The saved static report keeps browser printing. The icon-only button and report layout remain in place.

## Exact local candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `/private/tmp/w25-p11-live-print-guidance-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `40a7354d545cc870096d033f7e38a1e72376fe95e5616e31ac23cb288f5b0b99` |
| Isolated executable | `/private/tmp/w25-p11-live-print-guidance-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `3e645389f30a6c5479ef1ac0370e1aec2c2277987c4377b06ac89fdd9419a5ed` |
| MCP App resource SHA-256 | `c2a45dc425efc5f49d7b828948140c773c6e875997e9b65757b5871d2b7aecb8` |
| Static report template SHA-256 | `bc680e5032d629cc3e76c71039ea40d977449301cc4e8e54a6fc3aac9ce28674` |

The tarball was unpacked into a new isolated copy of the prior candidate's dependency tree. Its executable reports `2.0.5`. A direct MCP client read the 473,451-byte UI resource from that executable. Its SHA-256 matches the generated widget source. The resource includes the new help name and message. The static report template hash matches the prior candidate.

## Checks and limits

- The CLI build and TypeScript check passed.
- The focused widget and Skill tests passed. Vitest also found one duplicate test in a separate checkout; it passed.
- PRD authority validation passed across 35 PRDs with no diagnostics.
- The generated widget check and `git diff --check` passed.
- A real browser host rendered all 76 records from the current report. It supplied a no-op `window.print` function. Two Print clicks gave one visible help message and made zero calls to that function. The source-bundled and generated widgets both passed.
- A direct client confirmed the packaged MCP App resource hash and help text.

These checks do not prove the new package's Print result in Codex. The current installed entry still uses the prior candidate.

## Saved-entry change for owner review

Change only the saved `make_docs` MCP command to the isolated executable above. Keep its `mcp` argument, private identity value, tool approvals, and the separate `make-docs` entry unchanged. First recheck the tarball and executable hashes. Parse the full config before Codex reload. After reload, check that `make_docs` starts, Store status is `ready`, the 76-record report opens, and Print shows the help message in the visible app. If startup or access fails, restore the saved config backup and the prior command. Keep the prior package for rollback.

The current command is `/private/tmp/w25-p11-static-icon-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js`. Its executable SHA-256 is `d0f0ab5af9ed03edb721454a8bf1e9d8a1485895d560dcbfaacf8f3008d00e4d`. This packet does not change that command. The earlier approval named that prior candidate. The new exact command needs a separate approval before it is saved.
