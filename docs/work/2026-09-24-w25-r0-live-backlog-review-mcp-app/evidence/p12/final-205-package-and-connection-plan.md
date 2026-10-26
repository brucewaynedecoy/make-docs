# Final 2.0.5 package and connection plan

Date: 2026-10-26. State: isolated package checks and the lasting package install passed. The saved-entry change stopped at its hash guard before any config edit. A revised saved-entry guard awaits owner review. No release is approved.

## Exact package

The W25 checkout was on `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279`. It had 89 tracked or untracked status entries. The status stream SHA-256 was `463bcbca344a41f302b978e06030db44ec10b1743f65798ce17c7d33d60bdc7a`. The binary Git diff SHA-256 was `4f22a8e1dee5bfe0119137a29754f31f899013432497d1e1d1368cf1bb0b3874`. This binds the uncommitted package source state. Packing and the focused tests left both digests unchanged.

`npm pack` ran from `packages/cli`. Its prepack step checked the generated MCP App asset and built the CLI. The archive is `/private/tmp/w25-final-2.0.5-candidate-20261026/brucewaynedecoy-make-docs-2.0.5.tgz`. Its SHA-256 is `2b09a9a6de6f0b4721973ca577a11ef591266881f0363fea7e6d0c0db1ca2023`. npm reported SHA-1 `8ef873c33b805f1896574424ba83c81f7e0d4765` and integrity `sha512-lKZI5LuLSInx7aiiRJ38zIr3g+zwR+vUJbccm6hUbm60QVWnHQBPUtI7eXeMsACaALvCIN28gtOL5yGIhikzOQ==`. The archive is 2,596,907 bytes with 141 entries. Its paths contain no `node_modules`, `.codex`, `.env`, `.git`, or `store.db` path.

The archive was installed with scripts disabled at `/private/tmp/w25-final-2.0.5-candidate-20261026/runtime`. The installed `dist/index.js` SHA-256 is `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf`. The current temporary Codex package has the same executable hash. This does not prove that all other package files are equal. The fresh archive hash is the package identity for this plan.

## Isolated results

| Check | Result |
| --- | --- |
| CLI | `--version` returned `2.0.5`; `--help` and isolated `project state status` worked. The isolated project reported `ready`, Store available, version `2.0.5`, and no pending operation. |
| MCP | stdio handshake, tool list, and resource list worked for `core`, `setup`, `workflow`, `quality`, `backlog`, and `all`. Counts were 8, 15, 14, 9, 5, and 45. `all` was the exact union. |
| App asset | The backlog and all profiles returned `ui://make-docs/backlog-review/v1.html` as `text/html;profile=mcp-app`. Its 474,421 bytes matched the generated source asset. SHA-256 was `a15f322191d88d101f6064789a875a603443910702d1517d1a0e2287d5e601d5`. The CSP listed no outside domains. |
| Store | First-party setup made an isolated Codex entry, project access, and Store key. The package reported `ready`. A copied W25 record produced one snapshot record. Cache read showed one miss, the allowed write passed, and a new read showed one hit. |
| Backlog actions | Open passed with a confirmed envelope. Refresh returned `unchanged`. Explain and Work made clear text with `W25 R0`. Current action references resolved. Changed wave and old snapshot references were refused as `invalid-action`. |
| Focused tests | Four files passed 136 tests. They cover the request controller, widget, Skill, and action surface. |
| Codex parser | The Codex CLI read the repaired isolated config and listed the enabled `make_docs` entry. |

These are package and local protocol checks. They do not prove a new Codex live app session from a lasting install. The earlier P11 macOS Codex checks remain separate evidence. The saved browser view and another agent host remain unproved, as accepted for P11.

## Current saved entry and setup block

The current `make_docs` command is `/private/tmp/w25-p11-browser-hash-candidate-20261025/runtime/node_modules/@brucewaynedecoy/make-docs/dist/index.js`. Its arguments are `["mcp"]`. The saved entry has a private connection ID and key. This record does not show either value. Three active processes used that package during this check. Keep that package and the private backup files until the new live checks pass.

The full `~/.codex/config.toml` SHA-256 was `9b5adb73b5a301a4d56afef722775b349df7e9c2845b8f6f0275e80a60e237e6`. The managed `make_docs` block SHA-256 was `c05290c329b784b4fd3adf4b94662c324665ba95e1583ded4d87bf679d1f86b2`. Three active `make_docs.tools.*` approval tables sit inside that block. The last Make Docs Store receipt names the P10 candidate command, not the current P11 command. The receipt's connection ID matches the saved entry, but its key hash does not. Make Docs setup therefore reports that the native entry changed after the receipt. Both an ordinary preview and a key-rotation preview report no safe change. A direct command edit cannot repair this Store record.

## Tested recovery method

The isolated test copied this changed-block shape. A rotation preview refused it. The test then removed the **whole** managed block, including its three tool approval tables, before another setup preview. That preview planned a Codex change. Make Docs `setup system --yes` created and verified a complete entry and new Store key. The test put the same three approval tables **after** the managed end marker. The normal setup preview then reported `unchanged`; a rotation preview again reported a planned change. `codex mcp list` parsed the file. The new key gave Store status `ready` and passed the Backlog Review open, refresh, and cache checks. This method avoids an orphan `make_docs.tools.*` table, which caused the earlier Codex startup failure.

## Lasting package install

The owner approved the exact package and connection plan. The archive was copied to `/Users/tylerkneisly/.local/share/make-docs/installs/2.0.5-w25-2b09a9a6de6f/package-2.0.5.tgz` and installed offline in that root's `runtime` child with npm scripts disabled. The lasting archive SHA-256 is `2b09a9a6de6f0b4721973ca577a11ef591266881f0363fea7e6d0c0db1ca2023`. Its installed executable SHA-256 is `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf`. The CLI reports `2.0.5`. The lasting package passed all six MCP profile handshakes and tool counts. Its app asset has the same `a15f322191d88d101f6064789a875a603443910702d1517d1a0e2287d5e601d5` SHA-256. The lasting package is not yet the saved Codex command.

## Revised saved-entry change

The first approved apply stopped before backup or mutation. The full Codex config SHA-256 changed from `9b5adb73b5a301a4d56afef722775b349df7e9c2845b8f6f0275e80a60e237e6` to `a0f987555c381585e21adedefea5c841aab2f8646480955d5160552a6973b483`. The managed block SHA-256 is still exactly `c05290c329b784b4fd3adf4b94662c324665ba95e1583ded4d87bf679d1f86b2`. Its command and three `approve` tool tables are unchanged. The change is outside that block. The prior full-file hash guard did its job, but an unrelated Codex config write can repeat while this app is active.

For the next attempt, bind the change to the exact **managed block** SHA-256, command, argument, and three tool table names and values above. Read the full config once immediately before the edit. Save that full, current file as a private mode-0600 backup. Replace only the exact managed block in those same bytes. Preserve every byte outside it, including new user or Codex settings. Stop if the block, tool tables, archive, or executable hash differs, if another active `make_docs` table exists outside the block, or if the file changes between read and atomic replacement. This is a narrower guard than the first plan, so it needs a new owner review before use.

The proposed saved command is `/Users/tylerkneisly/.local/share/make-docs/installs/2.0.5-w25-2b09a9a6de6f/runtime/node_modules/@brucewaynedecoy/make-docs/dist/index.js`. The `mcp` argument stays. Codex tool approvals stay at `approve`. The separate `make-docs` entry and Claude Code and Copilot settings stay as they are. Setup will issue a new private key and Store receipt. It will not print the key in the W25 record.

After the revised guard passes, remove the entire old managed block in one local file update. Do not leave any active child tool tables without a parent. Before a Codex restart, run the lasting package's `setup system` for Codex MCP only, with `--target` set to this project, `--no-claude-code`, and `--no-github-copilot`. Preview first, then apply the same selection with `--yes`. Require `configured`, `verified`, and no blocked or pending machine work. Add the three preserved tool approval tables after the new managed end marker. Recheck TOML with `codex mcp list`. Require a new normal setup preview to say `unchanged`, and require project Store status `ready`.

If setup stops before verification, do not restart Codex. Follow Make Docs project state recovery first. If the config cannot parse, restore the exact private config backup to regain startup, then use Make Docs setup with the retained working package to create a valid key and Store receipt. Do not restore Store database bytes by hand. Keep the old package until the new Codex live check and rollback review pass.

After owner approval and the saved change, restart Codex. Check its loaded command, MCP handshake and five backlog tools, Store `ready`, a new 76-record report, Refresh, Explain, Work, duplicate refusal, and stale-source refusal. Record exact results. Then decide the retained temporary package and private backup paths in P12. P13 can start only after that decision. Publication needs separate approval.

## Applied saved-entry result before Codex restart

The owner approved the revised managed-block guard. The change passed its archive, executable, block, and three-tool checks. The script backed up the current full Codex config at `/Users/tylerkneisly/.local/share/make-docs/recovery/w25-20261026-2.0.5/config-before.toml` with mode `0600`. The old block SHA-256 was `c05290c329b784b4fd3adf4b94662c324665ba95e1583ded4d87bf679d1f86b2`. Make Docs setup wrote a new `make_docs` block with SHA-256 `3551787492bc11b66363fd1a8f585e9a18d893c402f3024f3113df7c955e582f` and a new private key. The three `approve` tool tables now follow the managed end marker. A comparison after removing only those moved tables showed that all other config content matched the backup. The final full config SHA-256 was `691742a2c5e8bb867f55d9c0ec9e629d2d0f9b72a1660b6efdd4d792ffdadb62`.

Codex parsed the new config. The normal Make Docs setup preview returned `unchanged` with no blocked work. Project Store status returned `ready` with no pending operation. A direct client used the saved identity and lasting package. It completed the MCP handshake, listed 45 tools, found all six required status and Backlog Review tools, reached the Store, and read 76 work records. The first direct snapshot check closed the client because its default message buffer was too small for this project report. The check passed with a 16 MiB client message buffer. No key value is in this record.

The old package and private backup remain for rollback. Codex must restart before the live app check. P12 remains open until that check and the retained-path decision pass. Publication still needs separate approval.

## Result after Codex restart

The owner restarted Codex. The new `make_docs` entry loaded from the lasting 2.0.5 install. The running Store returned `ready`. The live Backlog Review showed 76 records, six Attention findings, and W25 at 62 of 66 tasks. Refresh returned to `Status: Ready`. The owner sent clear Explain and Work messages from the live app to this chat. Work passed in a fresh app session. P12 then kept the old install and private backup under the [retention decision](final-retention-decision.md). This closed the planned install and recovery check for archive `2b09a9a6de6f0b4721973ca577a11ef591266881f0363fea7e6d0c0db1ca2023`.

P13 later found stale Print and action-status text in the shipped Backlog Review guide. The guide was corrected upstream and in this repo's installed Skill copy. That change makes the archive above an earlier, tested candidate. A new archive and its separate install decision are recorded in [P13](../p13/closeout-review.md). The saved entry still uses the working archive above. Do not remove it.
