---
title: W25 R0 P13 closeout review
kind: work-evidence
status: active
coordinate: W25 R0 P13
---

# W25 R0 P13 closeout review

## Current decision

The owner approved bounded W25 closeout on 2026-10-26 for the tested macOS Codex and local text-client scope. The owner later checked the saved HTML view in a browser and reported a successful text review in GitHub Copilot CLI. A host with no app support, Windows, Linux, and the W25-only A56 waiver remain release limits below. A P13 Skill-guide correction made a new archive necessary. The owner approved that exact archive and saved-entry change. Make Docs setup applied and verified it. Codex restarted with the new package. The fresh live app and both chat actions passed. The prior working archive remains for rollback. The owner also approved the exact local W25 commit. Release publication remains on hold.

## Authority and evidence map

| Source | Reconciled result |
| --- | --- |
| [W25 design](../../../../designs/2026-09-24-live-backlog-review-mcp-app.md) and [plan](../../../../plans/2026-09-24-w25-r0-live-backlog-review-mcp-app/13-closeout-and-commit-disposition.md) | Live actions stay in the connected chat. The design now states that the live app has no Print control. A saved report may use the browser Print command. P13 owns the final evidence and Git decision. |
| [PRD 51](../../../../prd/51-backlog-review-and-reporting.md) | The current requirements call for Theme, Refresh, and Data; no Print button; clear Explain and Work messages; strict action checks; and static prompt copy. |
| [Risk register](../../../../prd/03-open-questions-and-risk-register.md) | D-047 and D-048 are closed for the named macOS Codex path. Wider hosts remain outside those proofs. PRD authority validation passed with no diagnostics. |
| [Shipped Skill](../../../../../packages/skills/backlog-review/references/review-method.md) | The upstream and installed Skill copies match. The current guide names the visible controls and brief action status. It no longer directs use of a removed Print control. |
| [P7 A51–A60 ledger](../../07-parity-performance-and-acceptance.md#2026-10-25-to-2026-10-26-p11-evidence-update) | A51, A52, and A54 have owner-accepted tested scope. A53, A55, A57, A58, and A60 have the stated bounded results. A56 is waived only for W25. A59 is advisory. Earlier failed attempts remain in the record. |
| [Work index](../../00-index.md), [P11 result](../p11/installed-acceptance-results.md), [P12 result](../p12/final-retention-decision.md), and [single summary](../../evidence.md) | P11 is closed in accepted scope. P12 is complete with 52 paths removed and 15 paths kept. The old install and private backup remain for rollback. P13 is complete in the accepted scope. |

## New exact 2.0.5 candidate

The corrected source was packed at `<LOCAL_TEMP>/w25-final-205-p13-SqCrHe/brucewaynedecoy-make-docs-2.0.5.tgz`. Archive SHA-256 is `c4687f2d032ed5dfdb0ea51fdbff7ee3c400da59fbe25ed78a80cf73dd2c83f2`. An offline npm install with scripts disabled succeeded in `<LOCAL_TEMP>/w25-final-205-p13-SqCrHe/runtime-npm`. Its executable SHA-256 is `d3043de066b76d2871fe6e9c4f30ec976f66dd490754e408511b0cf45260f55d`.

The old and new archives have the same non-`dist` files. A decoded first-party Skill comparison found one changed payload: `backlog-review/references/review-method.md`, from SHA-256 `c286d3d732437b0401d02e2ea2d7320662c7157e9a70c119b1da4ef6ecf3af33` to `6b995487a143ae38b95b9411ade80ad702834810617ad538e99e2a6b07128e91`. The new payload contains the corrected control text. The app resource SHA-256 stayed `a15f322191d88d101f6064789a875a603443910702d1517d1a0e2287d5e601d5`.

The npm-installed package returned CLI `2.0.5` and help. MCP handshakes, tool lists, and resource lists passed for core, setup, workflow, quality, backlog, and all profiles. Tool counts were 8, 15, 14, 9, 5, and 45. The all profile was their exact union. Both app-bearing profiles returned the same app asset. The package read a disposable project's Store as `ready`, read one current snapshot, and returned a cache hit through its MCP connection. Its Backlog Review open accepted a 76-record report. Refresh returned `changed` with one changed record after current source edits, so the old review was not treated as current. Three affected test files passed 133 tests. The package archive has 141 entries and no `node_modules`, `.codex`, `.env`, `.git`, or `store.db` path. The earlier archive's full Store denial, cache write, and action guard checks remain valid source evidence; those exact checks have not all been repeated against this new archive. No Codex live test has run from the new archive.

## Reviewed install plan and applied result

1. Recheck the new archive and executable hashes above. Check that the full saved Codex config still has SHA-256 `691742a2c5e8bb867f55d9c0ec9e629d2d0f9b72a1660b6efdd4d792ffdadb62`. Stop on any mismatch.
2. Keep the working install. Copy the exact archive to `<user-home>/.local/share/make-docs/installs/2.0.5-w25-c4687f2d032e/`. Install it there with npm scripts disabled. Check its package and executable hashes.
3. Back up the full Codex config in a private recovery folder with mode `0600`. Change only the managed `make_docs` entry through Make Docs setup. Keep the separate `make-docs` entry, all three tool approval tables, and all other settings. Setup may create a new private key and Store receipt. Do not print either value.
4. Before restart, check that Codex parses the full config, Make Docs setup preview says `unchanged`, the Store says `ready`, and a direct MCP client can list the tools and read current project data. Stop and restore the backup and working package on a failed check.
5. Ask the owner to restart Codex. Open a fresh live report and check current counts, Attention, Theme, Refresh, Data, Store, and clear Explain and Work delivery. Keep the working package until these checks pass. A host result from the prior package does not prove this candidate's live result.

The owner approved this new exact archive and saved-entry change on 2026-10-26. Steps 1–4 passed. The lasting archive SHA-256 is `c4687f2d032ed5dfdb0ea51fdbff7ee3c400da59fbe25ed78a80cf73dd2c83f2`; its executable SHA-256 is `d3043de066b76d2871fe6e9c4f30ec976f66dd490754e408511b0cf45260f55d`. Make Docs setup returned `configured` and `verified`. It issued a new private key and Store receipt. The full config backup is at `<user-home>/.local/share/make-docs/recovery/w25-20261026-p13-2.0.5-c468/config-before.toml` with mode `0600`. The three `approve` tool tables and separate `make-docs` entry were kept. Codex parsed the full config. Setup preview returned `unchanged`; project Store status returned `ready`. A direct MCP client used the saved identity, listed 45 tools, read 76 records, and found 75 cache hits and one miss. A sandboxed attempt could not create the Store lock; repeating only that check with approved Store access passed. The final full config SHA-256 is `64650bee58e2be15b9f65db8cb5ee1678eee46dba9a8a7579de2d3b81754be3b`. The owner restarted Codex. Its running MCP process uses the new lasting executable. The archive and executable hashes still match this plan. A fresh direct MCP check found Store status `ready`, 45 tools, 76 work records, 75 cache hits, and one miss. A new live report opened. This plan does not publish a release.

The owner expanded that report in Codex. It showed 76 records, 36 in scope, 16 historical, 24 archived, six Attention findings, and W25 at 64 of 66 tasks complete. Theme changed from dark to light. Data opened the normalized report. Refresh detected one changed W25 source record because the P13 work record changed after the report snapshot. It showed `Status: Needs review`. Data showed one changed record, 75 cache hits, one miss, and zero rejected records. Explain and Work were disabled for the stale report. This is the expected stale-action guard.

A second report used the current source. It showed the same totals and W25 count. Refresh returned to `Status: Ready`; the W25 Explain and Work controls were active. The owner clicked each icon and reported `Sent to chat`. Both messages reached this chat as clear text with W25 R0 and a short review reference. The agent read the current source record and found one W25 R0 record with active status and 64 of 66 tasks complete. The Work recommendation was still valid in part: the live host check passed, and P13 closeout and commit decisions remain. The host result proves message delivery and current-wave text. The earlier P11 resolver tests remain the evidence for rejecting old or wrong-wave actions; this P13 host run did not repeat those negative clicks. Step 5 passed in the tested macOS Codex scope. Recording these results changes the W25 source after the live report snapshot. Any later action in that open report needs a new current-source check.

## Owner checks after the local W25 commit

On 2026-10-26, the owner opened the saved 76-record HTML report in a browser. The report file has SHA-256 `74d92c3bb069a63417d322e4b34d2ee4cba93509fa277e9794c93418dfdadb72`. The owner supplied screen images of the wide dark and light views, narrow dark and light views, the browser Print preview, and visible keyboard focus on Explain. The report showed 36 in-scope, 16 historical, and 24 archived records; six Attention findings; and W25 at 66 of 66 tasks complete. The owner reported that both copied prompts worked. Each prompt named W25 R0 and told the agent to read its current source record. These checks pass the saved HTML browser view in the tested browser. The images and copied text are in the owner chat; no image was added to Git.

The owner then ran the review in GitHub Copilot CLI with a personal Copilot account. The owner reported success and said the review appeared as text in the terminal. This passes the owner-run second agent-host text review. The chat has no terminal trace of the Make Docs tool call or the review body, so this result does not independently prove the exact MCP route, report counts, or package identity. The owner says this CLI can host a live MCP app. This run therefore does not prove the separate fallback case for a host with no app support.

## Carried obligations after bounded closeout

| Owner | Trigger | Target | Dependency | Exit test |
| --- | --- | --- | --- | --- |
| Host reviewer | Before an unsupported-agent fallback claim | A separate agent host with no app support | Access to that host | The host receives the current text summary and its limit. Until then, keep the local text-client claim. |
| Platform reviewer | Before Windows or Linux support claims | Each named platform | A runnable host and package | Repeat install, MCP, Store, and report checks there. Until then, keep macOS Codex as the tested host. |
| W25 maintainer and owner | Before Git mutation | Exact W25 source and evidence allowlist | Validation and source review | The owner approved the local commit on 2026-10-26. Check the staged list against the 77-path allowlist; no install, cache, private config, or scratch path enters Git. |
| Release owner | Before publication | 2.0.5 release | Closeout and release review | Separate publication approval. A56 still carries a W25-only waiver, not a speed claim. |

The owner accepted macOS as the tested GitHub Copilot client scope for the 2.0.5 release review on 2026-10-26. Direct Windows and Linux Copilot client checks remain open in W27. W25 A56 remains a W25-only speed and scale waiver, not a measured pass. The owner later closed W23 P7 on accepted W23 and W25 evidence, with its exact limits in the [W23 P7 closeout](../../../2026-09-18-w23-r0-backlog-review-and-reporting/07-package-parity-and-acceptance.md#2026-10-26-cross-wave-closeout). Publication still needs separate approval.

## Git disposition

The current branch is `w25-r0-p1-live-delivery-contract` at pre-commit base `93c0ae6389fa345e6ef2ea3da51942cc6ad70279`. The exact approved file list is in [commit-allowlist.txt](commit-allowlist.txt). It excludes `.playwright-mcp/`, `.codex/`, private config, Store data, temporary archives, and lasting installs. The owner approved one local commit for the W25 design, PRD, source, tests, Skill, work records, and selected evidence on 2026-10-26. P13 t4 is checked and W25 is complete in the approved bounded scope. The final staged list and diff still require a check before the commit. No push, PR, or publication is in scope for that decision.

The current allowlist has 77 paths: 37 tracked edits and 40 new files. The full binary review diff is `<LOCAL_TEMP>/w25-final-205-p13-SqCrHe/w25-review.patch`. It is outside Git. It must be regenerated if any allowed file changes before staging.

After the live record update, PRD authority validation passed for 35 PRD files with no diagnostics. The changed W25 design, work, Skill, and P13 packet had no broken indexed links. P13 packet, phase, design, and Skill path hygiene passed with zero findings. One older absolute user-home path in the long W25 summary remains historical audit data; it is not in the P13 packet. P13 frontmatter and task syntax passed a local check. The CLI default package checks passed 53 tests before these document-only updates. `git diff --check` passed. The exact allowlist has 77 unique paths and excludes `.codex/`, `.playwright-mcp/`, private configuration, Store data, and installed packages. These checks do not close the named release obligations above.
