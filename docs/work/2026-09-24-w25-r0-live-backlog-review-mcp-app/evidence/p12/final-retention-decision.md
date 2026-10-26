# P12 Final Retention Decision

## Decision and scope

Keep the 15 exact paths in the [approved cleanup proposal](cleanup-proposal.md#paths-kept). Keep the current Codex config, the lasting 2.0.5 install, the new private config backup, and the final temporary qualification folder. This decision deletes and moves no file. It does not put a private file, cache, install, or temporary report in Git.

The six `~/.codex/config.toml.w25-*` rows in that proposal remain user-owned recovery copies. The nine temporary roots remain local test or recovery records. The old browser-hash candidate is now a rollback reserve, not an active MCP dependency. The final temporary qualification folder also contains private test settings and remains outside Git. The project checkout has no `.codex/` directory. The untracked `.playwright-mcp/` folder is scratch output and is outside the commit set.

## Active dependency and exact package

The saved `make_docs` command points to the lasting install under `<user-home>/.local/share/make-docs/installs/2.0.5-w25-2b09a9a6de6f/`. Its archive SHA-256 is `2b09a9a6de6f0b4721973ca577a11ef591266881f0363fea7e6d0c0db1ca2023`. Its executable SHA-256 is `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf`. A process check after the Codex restart found two MCP processes from that lasting install and none from the old browser-hash candidate. The setup preview returned `unchanged`; project Store status returned `ready`.

The restarted Codex app showed the 76-record report, W25 at 62 of 66 tasks complete, six Attention findings, and Theme, Refresh, and Data controls. Refresh returned to `Status: Ready`. Explain and Work each sent one clear-text W25 request to this chat. Work used a fresh app session after the first session's controls remained inactive while this chat was active. That host state was not proved to be a source defect or normal host behavior. The source and isolated package checks had already refused wrong-wave and stale-snapshot requests. The earlier P11 installed host check had shown `Already sent to chat` for a duplicate Explain click on the same executable hash. This restarted run does not add a new host duplicate-click result.

## Recovery boundary

Keep the new mode-`0600` full config backup and its tool-approval copy under `<user-home>/.local/share/make-docs/recovery/w25-20261026-2.0.5/`. Keep the old candidate and its private backups through the release decision as an optional rollback reserve. A later cleanup may remove a named path only after a new active-use check, an exact file list, and separate owner approval. Do not restore Store database bytes by hand.

The previously approved 52-path deletion is complete in [cleanup results](cleanup-results.md). The 15 kept paths now have a deliberate retention decision. P12 has no remaining file move or deletion in this scope. P13 owns the release hold, unmet host checks, and commit disposition.
