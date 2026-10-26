# P11 Installed Acceptance Results

## Scope

The initial checks used the installed `make_docs` MCP entry and an isolated P10 2.0.5 candidate on 2026-10-24. The approved Codex MCP access intent was present in `.make-docs/config.yaml`. This record then follows each owner-approved P11 correction in time. The current saved entry runs the [browser-hash candidate](browser-hash-action-candidate.md), executable SHA-256 `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf`. Earlier Print failures and candidate limits below are historical results. This record keeps installed host results, direct client processes, and test-only inputs separate.

## Access and source

- The running Codex MCP `project_status` call returned `ready` for this project after the access-intent change. A direct client with an invalid connection key returned `store-denied` in the earlier P11 check.
- The installed MCP `backlog_snapshot` call read 76 records: 52 live and 24 archived. It returned 62 diagnostics: 48 unsupported legacy record shapes, 10 authority-link faults, and 4 status/task conflicts.
- A separate direct client process used the saved connection identity but lacked sandbox access to the Store lock. Its `project_status` call returned `store-unavailable`. This result does not describe the running Codex MCP process, which returned `ready`.
- That direct client opened a small test report and called refresh with the returned envelope. Refresh reported changed source facts and `needs-review`. Its optional cache lookup reported `store-unavailable`, but the current source snapshot remained available. This is a transport and failure-path check, not a visible Codex app check.
- The direct client also opened a current 76-record transport probe. Its raw response carried a compressed app payload and a confirmed envelope. Refresh reported unchanged source facts and `current` with zero added, changed, or removed records. The optional cache was unavailable to that sandboxed process. This result proves the source refresh path can proceed without cache access. The probe's review labels were test-only and were not the agent's current report.

### Disposable 2.0.5 access matrix

I ran the exact isolated 2.0.5 executable from the [P10 packet](../p10/candidate-and-connection-packet.md) through a new temporary MCP client, Store, and project. The test did not edit the installed Codex connection or this checkout. The executable hash in that packet is `2bef0ef7e48babede537ee32368eecee3b464e23de0aeef9e21ea983e7866c19`. The temporary setup made one generic MCP connection with project read/write and Store read/write access. Its `project_status` result was `ready`.

| Case | MCP result | Project and Store bytes after a refused call |
| --- | --- | --- |
| Read-only project intent, write call | `store-denied` | Unchanged |
| Missing project intent, write call | `store-not-configured` | Unchanged |
| Intent for a different harness, write call | `store-not-configured` | Unchanged |
| Revoked Store connection, write call | `store-denied` | Unchanged |
| Wrong connection key, write call | `store-denied` | Unchanged |
| Other project, write call | `store-not-configured` | Unchanged |
| Missing Store, status call | `store-denied` | Unchanged |
| Store config with no database, status call | `store-unavailable` | Unchanged |
| Unsupported Store schema, write call | `store-unsafe` | Unchanged |

After restoring the test settings, `project_status` returned `ready` again. The byte check covered project and Store files. It excluded SQLite WAL and SHM side files. The test script and its temporary files are under `/private/tmp`; they are test material, not product files. This matrix proves denial behavior for the isolated package. The running Codex entry's successful `ready` result above proves the approved live grant for this checkout.

## Current review and cache

- A full report kept all 76 records. It classified 36 live records in scope, 16 live records as history, and 24 archived records. The live status groups were 24 attention, 6 conflict, 4 current, 2 deferred, and 16 history. The 24 unsupported live records were marked for review rather than treated as complete.
- The first exact cache read found 76 misses. The installed MCP cache write stored 76 reviewed record entries with no rejected entry. The next exact read found 76 hits.
- A test-only change to one snapshot title gave 75 hits and one miss. A snapshot with a different target root was rejected. Snapshot schema version 2 was rejected at tool input validation. These inputs did not change a project file.
- Writing this P11 evidence changed the real W25 source record. A new installed snapshot then gave 75 hits and one miss for W25. This proves the dirty-source cache key changed. The W25 fragment was rebuilt. A repeat read found 76 hits, and a new open accepted the updated report. Each later edit to this work record needs the same current-source check before a current-open claim.
- A later P11 record update again changed only W25. The installed cache read found 75 hits and one miss. Refresh of the earlier reviewed W25 session returned `changed`, `needs-review`, one changed record, and no added or removed record. The prior report stayed the last reviewed result. The cache was available and had the same 75-hit/one-miss result. This is an installed MCP changed-source result. It is not a claim that the owner saw the changed state in the app.
- I made a new report with the new source snapshot and the same review conclusions. I checked that W25 still has status `active` and 53 of 66 tasks checked. I copied each record's dates and date evidence from the new snapshot. The installed open tool accepted the rebuilt report. The current source and the reviewed meaning agree on those checked facts.
- `backlog_review_open` accepted the complete report. Its text result named all four current records, five of six attention findings, and the first next action. Its structured result reported that one attention finding was omitted from the short summary. The full report remained in the tool input. This receipt does not prove a visible app.

## Visible host result and limits

The raw 2.0.5 MCP server advertises `ui://make-docs/backlog-review/v1.html` in the open tool's UI metadata. A direct MCP client received an open envelope and display data. The current full report used a compressed raw app payload. The tool result for that report in this Codex task contained only text and structured data. It did not expose `_meta` or a confirmed open envelope to this agent. The MCP Apps tab inventory had no tab, and Computer Use refused access to the Codex app.

The owner confirmed that the app appeared in this Codex chat. The [owner screenshot](app-visible-dark-narrow.png) shows the dark, narrow view with the project lead, project name, date, controls, four tallies of 76, 36, 16, and 24, section tabs, and six Attention entries. The owner used Refresh once and reported the footer returned to `Status: Ready`. This supports a visible open and one user-run refresh in this view. This first screenshot does not show the Backlog list or footer. Later checks below cover more of the app.

The owner then supplied a [wide dark screenshot](app-visible-dark-wide.png) and a [wide light screenshot](app-visible-light-wide.png). Both show the same four tallies, Attention and Next, the Backlog list, filters, task bars, and W25 at 53 of 66 tasks complete. The light screenshot shows a visible focus ring on the theme button. Both views keep the source link, status text, and task count readable.

I inspected the expanded Codex MCP App tab. The All filter showed 76 of 76 rows. Forty-eight rows showed `Task count unavailable: unsupported record format.` The In Scope filter restored 36 of 76 rows. The Data view held all 76 records and the same four tallies. These local actions did not add a message to this chat. The visible changed-Refresh tab showed `Status: Needs review`; W25's Explain and Work buttons were disabled there. This is real-host proof of full row count, local filters, Data, and stale-action blocking. It does not prove that every claim text was visually checked.

The owner tried Print in the live Codex app. It did not open print preview. The owner reports that print preview works for the static report in a browser. The live button calls `window.print()`, but this host did not produce a print result. Mark live Print **failed** for this host. Do not count the static result as a live pass.

An earlier expanded Codex MCP App reported `typeof window.print === "undefined"`. The [print correction candidate](print-correction-candidate.md) offered local guidance in that case and passed isolated tests. The saved Codex entry later moved to the [static icon candidate](static-icon-candidate.md). The reopened app exposed a print function but did not open a preview or show guidance. Both host results are failures. Function presence is not a usable-print check.

I tested keyboard and motion on a temporary browser host with the exact current generated widget and a 76-record report. Tab moved focus to Print and showed a 3-pixel solid focus ring. Enter closed a focused W25 disclosure; Space reopened it. At narrow width, ArrowRight moved focus and selection from Attention to Next. In reduced-motion mode, `matchMedia` reported reduce, root scrolling was `auto`, and a wave transition was `0s`. Print media hid controls and tabs, showed both report sections, and expanded details. These are browser-host checks of the candidate widget. The Codex MCP Apps control surface cannot send native key presses or change the host's motion setting, so native keyboard and reduced-motion behavior remain unproved. The owner did not know the controls or how to change the motion setting; no owner test is inferred from that statement.

## Explain request and result

The owner first selected Explain on W25 while an assistant question was still open. Codex placed the action in a pending steer. The owner removed that steer before it reached this chat. The widget records the action key before it asks the host to send a message. It rejects a second click with the same key in that report session, even after the owner removes an unsent steer. This first attempt did not reach the agent.

I opened a fresh full-report session. After the assistant turn ended, the owner selected **Explain this wave** for W25 R0. The app sent a `review-wave` request into this same chat. It named the W25 record path and the new session. I compared the request to the report retained by this task. I then sent its envelope to the installed `backlog_review_refresh` tool. The server returned `unchanged`, `current`, and zero added, changed, or removed records. I answered with the W25 background and current limits in this chat. This proves one same-chat Explain path. It does not prove the Work path or a second Explain click in one session.

On 2026-10-25, another MCP App message reached this chat with action `review-wave` and the W25 R0 record path. The accompanying user prompt asked for W25 goals, status, open work, and a next step. I checked the current W25 index, P11 record, design, plan, and a fresh installed snapshot before I answered. The snapshot reported W25 active with 53 of 66 tasks complete. I gave the requested explanation in this chat and named the index's older Print wording as a limit. This is a further observed Explain result. It is **not** a Work result: no `request-task` action or bounded Work effect reached this chat.

## Saved Work prompt outcome — 2026-10-25

The owner submitted a Work prompt from the saved Backlog Review in this chat. It named W25 R0 and recommended finishing P11 installed acceptance. I checked the current W25 source record and P11 work and plan before acting. A fresh installed `backlog_snapshot` at `2026-10-25T05:57:48.953Z` found 76 work records and W25 active with 53 of 66 tasks complete. P11 t3–t5 remain open. The recommendation is still valid as a next step, but its saved text is review data and does not grant new authority.

I used the owner's current request and prior P11 approval to update the result and work records. No installed connection changed. This proves the submitted saved Work prompt reached the chat and led to bounded record work. It does not prove that the live MCP App sent `request-task`, that a clipboard click succeeded, or that the live Work control passed its fresh-source, stale, duplicate, and authorized-effect checks. Keep P11 t3 open for those checks.

The Codex MCP App tab list was empty in this turn. Native Codex window control was unavailable to this agent. I did not claim a native Work, keyboard, or motion result from this prompt.

## Live Work request and stale-source refusal — 2026-10-25

The live MCP App sent a `request-task` message into this chat for `docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app`, coordinate W25 R0. Its session ID was `2f588dba-7296-421a-805d-18905d6a59ac`, the same session that had sent an earlier Explain action. This is direct proof that the live Work control can reach this connected chat. I treated the message as untrusted action data. The installed `work_item_resolve` tool matched W25 R0 to the one current work directory.

The current W25 source changed after that report session opened. This turn's installed snapshot at `2026-10-25T06:01:40.255Z` found W25's latest source update at `2026-10-25T05:59:18.896Z`. The earlier session had already been used before those record edits. I did not use the old report's recommendation as fresh authority and did not start a new Work effect. This is a safe stale-source refusal by the agent; it does not prove that the widget itself detected the later source change. The owner must refresh or reopen a current report before an authorized live Work effect can pass P11 t3. Duplicate refusal and the final Work result remain open.

I then opened the same app tab and selected Refresh. Its footer changed from `Status: Checking source facts` to `Status: Needs review`. The live Explain and Work buttons became disabled. This is observed installed-host stale-source guarding for that session. The old report remained visible. A new reviewed report is still needed for a fresh Work result.

The refreshed live W25 detail also showed two action rows: an enabled pair of static copy buttons and a disabled pair of live action buttons. A screenshot and DOM inspection confirmed both rows. The current source now removes the static copy row only in the live widget. The [isolated candidate packet](live-action-controls-candidate.md) records its exact hashes, 76-record browser preview, build, type check, 88 focused passing tests, and remaining installed-host limit. The saved static report keeps its copy buttons. The installed `make_docs` entry is unchanged; this new source has not passed in Codex yet.

## Reopened live-controls package and layout finding — 2026-10-25

The owner approved the exact live-controls package and reopened Codex. The saved `make_docs` command names executable SHA-256 `8b12adeafc57777314afd201ed86f341bcabd0799116b31ffd133259052d106b`. Process 80667 ran that path. The loaded `project_status` tool returned `ready` with Store available. A loaded snapshot found 76 records. I opened a reviewed report with the current snapshot and W25 source date. In the expanded Codex app, W25 showed 53 of 66 tasks complete. DOM inspection found zero static copy rows and exactly one Explain and one Work button on that wave. Refresh returned `Status: Ready`. This passes the installed check for the duplicate icon correction.

I clicked Work twice in the current W25 row while this assistant turn was active. The app showed no result for either click, and no same-chat Work result became visible to this agent during the turn. These clicks do not pass fresh Work or duplicate refusal. Keep P11 t3 open until the chat outcome can be checked.

The owner then showed the phase bar running past the right edge on a narrower wide screen. In the installed app, the W25 phase bar required 258 pixels while its grid column had 201 pixels. The [layout candidate](layout-overflow-candidate.md) removes that fixed cell minimum. A real browser check passed at seven widths from 600 to 1200 pixels and saved an [820-pixel preview](layout-820-preview.png). The correction passed the build, TypeScript check, generated asset check, Skill parity check, and 88 focused tests. This is source and browser proof. The installed Codex entry still runs the prior package, so the layout fix needs a separately approved installed check.

The owner approved that exact layout candidate and reopened Codex. Process 29237 ran its executable SHA-256 `719276d7dc3888bcc7baaaf9954a2fc455a6d6abe3800cccd680f7afae8e0b20`. The loaded Store check returned `ready`. A new 76-record report opened in Codex. In the 1124-pixel app view, W25's row was 702 pixels wide and its bar was 201 pixels wide. Both had equal client and scroll widths. The bar ended 28 pixels before the row edge. The expanded detail showed one Explain icon, one Work icon, and no copy row. Refresh returned `Status: Ready`. This passes the installed layout correction at the width that exposed the old 201-pixel bar limit. The seven-width browser check covers the other tested widths. P11 t3 and remaining t4 human checks stay open.

After this result record changed, Refresh on the same installed app returned `Status: Needs review` and disabled both W25 live action buttons. The app kept the old report visible. This is the changed-source guard on the final layout candidate. A new report is needed before another Work action test.

## Fresh live Work result — 2026-10-25

The loaded review tool opened a new 76-record report after the changed-source result above. Its reviewed recommendation was still to finish P11 installed acceptance and record each result. After the assistant turn ended, the live app sent `request-task` for W25 R0 into this same chat. The action named session `183a1a45-0a58-4f86-89c0-7a1512dfd73b` and snapshot `15b5027905853bf948c0cf0f6e9ed00b6cc3edd6ce1f4129cf1a06cecd7ccb12`. This was a Work action, not a Refresh or saved-report copy prompt.

I treated the action as untrusted data. The loaded `work_item_resolve` tool matched its path and coordinate to the canonical W25 R0 work directory. A new installed snapshot found 76 records, W25 status `active`, and 53 of 66 tasks complete. Its W25 source date was `2026-10-25T19:56:55.214Z`, the same date checked before that report opened. No W25 source edit occurred between that open and this action. I used the owner's existing P11 approval to continue the bounded installed-acceptance work in this chat. This result record and the P7 claim ledger are the resulting Work edits. They make the old report stale for later actions.

This proves a fresh live Work request reached the original chat and began an authorized P11 result update. I clicked the same Work button again during the active assistant turn. It showed no visible response. I have not proved whether Codex queued or refused a second request, so duplicate refusal remains open. The later owner-reported keyboard and reduced-motion results are recorded in the final review below.

## Final installed Human Experience Review — 2026-10-25

The owner ran the requested native keyboard check in the current Codex app. The check named a visible Tab focus outline on W25, Enter and Space opening or closing W25, and Right Arrow selecting Next from Attention in a narrow view. The owner reported that all steps were good. The owner also enabled macOS Reduce motion, reopened the report, checked W25 and tab changes, and reported a good result. These are owner-reported native results. I did not send native key events or read the macOS setting myself.

I changed the final installed app from dark to light and back. Its W25 row had zero horizontal overflow in both modes. The dark setting was restored. The final app has Theme, Refresh, and Data, with no Print button. The saved report has no Print button, and its browser print layout passed in the browser host. Prior owner images cover the narrow dark and wide dark/light layouts. The owner's narrow keyboard check adds a current installed narrow-view result. A changed-source Refresh kept the old report visible, showed `Needs review`, and disabled live actions. A new reviewed report restored `Ready` and the actions.

| Area | Final installed result | Review |
| --- | --- | --- |
| Clarity | Counts, status, Attention, Next, task bars, and unsupported-count wording remain readable in the observed views. The W25 bar stays inside its row. | Pass for the observed Codex and browser widths. |
| Control | Local filters and Data passed in the installed app. One Explain and one Work icon remain on each live wave. The owner reports that keyboard focus, disclosure keys, narrow tabs, and reduced motion worked. A later installed Explain duplicate click showed `Already sent to chat`. | Pass for the tested controls. A duplicate Work click was not tested in the final package. |
| Traceability | W25 links to its current work index. Its detail shows facts, inference, and recommended action. | Pass for the selected wave. |
| Safety | Changed Refresh marks the old report stale and disables its actions. Denied Store calls left durable test bytes unchanged. The strict agent resolver refused a stale Work request and a mismatched wave. | Pass for those paths. The wrong-wave result is agent-side proof, not an installed wrong-wave click. |
| Recovery | A new reviewed report restores `Ready` after a changed-source result. The prior report remains visible during review. | Pass for the observed path. |

This completes the P11 t4 human review for the selected macOS Codex host and the tested static browser path. It does not make a Windows, Linux, or unsupported-host claim. A58 can pass with that scope. A60 needs its final P11 claim review. This is an agent review, not an owner release decision.

## Clear live action messages — source candidate, 2026-10-25

The owner asked for clear Explain and Work text in the Codex chat. The currently installed layout candidate sends the strict action as raw JSON in its single visible `ui/message` text item. I found no proven hidden Codex field for a separate machine payload. The [candidate packet](clear-action-message-candidate.md) shows the fixed readable text, exact review-reference fields, isolated executable hash, checks, and recovery path. The agent method now tells the connected agent to read the resolved current source record before it answers or starts work.

The source checks passed: CLI build, TypeScript, 58 focused tests, generated Skill parity, and `git diff --check`. Tests keep stale session, model, project, snapshot, path, and coordinate refusal. They also reject extra instructions in the visible message. These checks do not prove a message rendered in Codex. The owner approved the exact saved-command change. The new command is in the parsed config, and its private backup differs by that line alone. Codex still needs a restart. Explain and Work installed results remain open.

## Clear live action message — first installed result and correction, 2026-10-25

The owner restarted Codex. `project_status` returned ready. The MCP snapshot found 76 records. A new live report opened with W25 R0 at 55 of 66 tasks complete. I clicked Explain in the expanded app. The owner reported raw JSON in this chat. The clear-message check failed. I did not test Work from this failed package.

The generated live widget still had the older JSON message, while `agent-contracts.ts` had the clear text. The asset check reproduced the mismatch. I rebuilt the widget and added its check to the CLI build. The new build, TypeScript check, `git diff --check`, 131 focused tests, and isolated package check passed. The [correction packet](clear-action-widget-correction.md) names the new package, exact hash, next host test, and rollback. The saved `make_docs` command still points to the failed candidate. The new candidate needs separate approval before the installed test can continue.

The owner then approved the correction packet's exact command change. Both executable hashes matched. I saved a mode-`0600` config backup and changed only that command line. Full byte comparison confirmed the one-line change, and `codex mcp list --json` parsed the new saved entry. The connected Codex process still needs a restart. Explain and Work from the corrected package remain unproved in Codex.

## Corrected live action result — 2026-10-25

After the restart, Codex loaded the corrected 2.0.5 package. A fresh 76-record report opened in this chat. The owner clicked Explain and Work in that report. Both actions reached this same chat as clear text. The owner controlled when each message was sent; I did not press either action button.

For each message, I checked the exact action text against the independently retained open context and a new 76-record source snapshot. The resolver accepted Explain as `review-wave` and Work as `request-task` for W25 R0. Before the Explain answer and the Work step, I read the current W25 source record. It was still active with 55 of 66 tasks complete. The bounded Work effect was this P11 result update; no other phase or installed connection changed.

This proves same-chat delivery and exact action matching for the corrected package. It does not close t3. The message still shows four long identity values. The owner asked for a shorter visible reference. A later package must keep stale, duplicate, and wrong-wave refusal and pass the same installed check. The new app-initiated wrapper after Work carried no action text to this agent, so it is not evidence of another action pass.

The [short-reference candidate](short-wave-reference-candidate.md) was packed and source-checked. At that point, its saved connection change and live Codex checks were pending. The saved `make_docs` command still pointed to the prior corrected package. No short-reference host pass was claimed.

The owner then approved that candidate's exact saved command change. Config backup, one-value comparison, and Codex config parsing passed. A separate MCP client started the candidate and found 45 tools. That client's Store call failed for both the new and prior packages, while the running Codex MCP connection still reported Store access as ready. The owner has not restarted Codex since the saved change. The short-reference installed result remains open.

## Focused package checks

On 2026-10-24, the current source test run passed 272 tests in nine files. The selected tests cover the request controller, widget, report presentation, live/chat/static selection, action surface, and cache. The test runner also found three duplicate test files in a `.delta` worktree. The result is 194 unique selected tests plus 78 duplicate runs. These tests support the source contracts. They do not replace installed Codex app observations.

Before the Print correction, the nine package input files named in the [P10 packet](../p10/candidate-and-connection-packet.md) had the same SHA-256 hashes. The running installed executable still has the P10 hash. The later Print correction changed the upstream static template, generated widget, and live button code. The [new packet](print-correction-candidate.md) binds those new bytes. A source test does not replace an installed host check.

## Agent Human Experience Review

This review uses the owner's screenshots and statements, the expanded Codex MCP App, and the isolated browser checks. It applies to the installed P10 candidate. It is not an owner release decision.

| Area | Observed result | Review |
| --- | --- | --- |
| Clarity | Counts, status, Attention, Next, and source links are readable in narrow dark and wide dark/light views. Unsupported records say the task count is unavailable. | Pass for the observed views. |
| Control | All and In Scope filters changed the row count locally. Data opened and closed with the full report. | Pass for those controls. |
| Traceability | W25 links to its work index. The expanded W25 row shows facts, inference, and recommended action. | Pass for the selected wave. |
| Safety | A changed Refresh showed `Needs review` and disabled old Explain and Work buttons. Denied Store calls left durable test bytes unchanged. | Pass for those paths. |
| Recovery | The owner could Refresh back to `Ready` for unchanged facts. Changed facts kept the old review visible. | Pass for those paths. |
| Print | The first installed live button did nothing. A later app exposed `window.print`, but the button still gave no preview or guidance. | **Fail.** A new source correction needs an installed host check. |

The owner did not know which keys to try or how to turn on reduced motion. This is no user test failure. In the isolated browser host, Tab showed a focus ring on Print. Enter and Space operated a wave row. Arrow Right moved the selected narrow-view section tab. With reduced motion enabled in that host, the media query matched, scrolling became immediate, and the wave transition took zero seconds. These checks pass for the browser host. The same keys and motion setting remain unproved in the live Codex host.

The installed experience has a material Print gap. Do not close A60 or release W25 from this review. Recheck the print guidance, Work result, and remaining host limits after an approved candidate change.

## Remaining checks

At that check, the Codex entry ran the approved layout candidate. Store status was `ready`. The visible live report had 76 rows, one action pair on W25, no Print button, and no W25 phase-bar overflow at the measured 201-pixel bar width. The owner accepted the saved report as the print path, and its browser print layout passed. A fresh live Work action reached this chat and began the P11 result update. The owner reported native keyboard and reduced-motion passes. Duplicate refusal, unsupported-host fallback, and final A51–A60 dispositions remained open. The direct client's raw envelope proof and the visible Codex app proof keep their separate scopes. Record each result before closing a P11 task.

## Static prompt control correction — 2026-10-25

The owner rejected the first static prompt layout. It repeated instructions, used text buttons, and showed a prompt box when clipboard access failed. The revised upstream template and dogfood copy now use the live review's two fixed icons as 34-pixel buttons. Each has an accessible name and tooltip. The report has no visible prompt field or helper sentence. A click shows only `Copied.` or `Copy failed.` for three seconds.

The copy path first tries the browser's synchronous copy command while the click is active. It uses a short-lived offscreen field and removes it before returning. If that path fails, it tries the Clipboard API. A browser that denies both paths still reports failure. No static page can override the host's clipboard policy.

I rendered the same 76-record report through the revised source template in a disposable browser host. The W25 buttons had no text and each had the matching live icon. No prompt box remained after success or forced failure. Stubbed copy calls captured both prompts. Explain named W25 R0, its source record, goals, status, open work, and a next-step request. Work included the saved P11 recommendation. The Clipboard API fallback also copied under a stubbed browser command failure and returned keyboard focus to the Work button. A forced denial on both paths showed only `Copy failed.`. The browser server recorded one page request and no request from the button clicks. The focused Skill test passed 15 tests. The saved candidate embeds the same static template hash. These browser checks do not prove Codex's own clipboard behavior.

## Reopened Codex check — 2026-10-25

After the owner quit and reopened Codex, a read-only process check found the static icon candidate running. The saved config still names that exact executable. A `project_status` call through the current `make_docs` tool returned `ready` with Store available. A fresh 76-record snapshot and Store lookup returned 75 exact cache hits and one miss for W25, whose source changed during P11 work. W25 still has status active and 53 of 66 tasks checked.

I checked those W25 facts against the fresh snapshot and made a 76-record report with current snapshot dates. The report contract accepted it. The running `backlog_review_open` tool accepted that report and returned the project, tallies, coverage, and review summary. The tool wrapper did not expose the live app envelope or an MCP App tab to this agent. The Codex MCP Apps tab inventory was empty after the open call. Do not count this as visible rendering or live Print proof.

A separate direct client read `ui://make-docs/backlog-review/v1.html` from the new executable. The resource is 469,886 bytes and has SHA-256 `f2083a53912bd5b15fb53a1ed9a36c6d870066fbe91d5a71116e3a4b2b4f5815`, matching the generated widget. It includes the Print guidance that passed the earlier browser-host test. This binds the guidance to the running package bytes, but it does not prove what Codex displayed after a user click.

## Live Print failure and source correction — 2026-10-25

The owner saw the reopened live app. The Print tooltip said `Print report`. A click opened no preview and showed no help. The owner sent the [screen after the click](live-print-no-result-20261025.png). It shows the 76-record report and `Status: Ready`, with no Print message. The tooltip and source show that this app exposed `window.print` as a function. The static report's click handler called it and returned. The function did not open a usable preview in this host.

The tested source correction gave the live Print button the name `How to print this report`. Its local click handler showed one status message: `Print preview is unavailable here. Ask in chat for a static report, then print it in your browser.` It stopped the saved-report print handler from calling `window.print`. The saved static report still used browser print. A real browser-host test with the current 76-record report and a no-op `window.print` function passed. Two clicks gave one visible message and zero calls to that function. This was source and browser-host proof, not installed Codex proof. The saved `make_docs` entry stayed on the prior candidate.

## Owner decision and no-Print candidate — 2026-10-25

The owner then said neither the live nor saved report needs a Print button. The guidance-only candidate was not installed. The [no-Print candidate](no-print-candidate.md) removes both buttons and their click handlers. It keeps the saved report's browser print layout. The upstream static template and installed Skill copy match; the upstream guide and installed Skill copy match.

The generated live widget and saved static report each rendered the current 76-record report in a real browser. Both had no Print button. The live view kept Theme, Refresh, and Data. The saved report kept Theme and Data. Browser print media kept the saved report body and hid toolbar controls. The [live header](no-print-live-header.png) and [static header](no-print-static-header.png) were reviewed. A direct client read the packaged MCP App resource and confirmed its hash and absence of Print tokens. Build, TypeScript, focused tests, generated-asset check, PRD authority validation, and `git diff --check` passed.

These were source, package, and browser-host results. At that time, the installed Codex entry still pointed to the prior static icon candidate. Its visible Print button remained the last installed result. The no-Print candidate needed a separately approved saved-entry change and a visible Codex check. Same-chat Work and native keyboard and motion limits remained open.

## Reopened no-Print package — 2026-10-25

The owner approved the exact [no-Print candidate](no-print-candidate.md). I changed only the saved `make_docs` command and saved a private mode-0600 config backup. `codex mcp list --json` parsed the full saved config and reported the new enabled stdio entry with its unchanged `mcp` argument. The tarball and executable hashes still match the packet. After the owner quit and reopened Codex, process 49259 ran that exact executable. The loaded `project_status` tool returned `ready` with Store available.

A fresh `backlog_snapshot` through the loaded entry found 76 records. Only the W25 source record changed since the last 76-record report; its task count stayed 53 of 66 and its status stayed active. I updated that source record and date in the reviewed model. The loaded `backlog_review_open` tool accepted the report and returned 76 work records found, 36 in scope, 16 historical, and 24 archived. The owner has been asked to check the visible toolbar. Do not count tool acceptance as visible no-Print proof yet.

The owner then checked the live app in this Codex chat. Theme, Refresh, and Data were present. No Print button was displayed. This is visible installed-host proof for the no-Print live toolbar. The saved static report's no-Print control and browser print layout have browser-host proof. P11 t4 remains open for its other checks.

## Short-reference installed action failure — 2026-10-25

The owner approved and loaded the short-reference 2.0.5 candidate. The loaded `project_status` returned `ready` with MCP and Store access available. A fresh 76-record report opened in the original chat. W25 R0 showed 55 of 66 tasks complete, and the app showed `Status: Ready`. One Explain and one Work button were present. I did not press either action button.

The owner pressed Explain. No message appeared. I ran Refresh in the live app. It found unchanged source facts, 76 cache hits, and `Status: Ready`. The owner pressed Explain again. No message appeared. The short-reference package therefore fails the installed Explain check. Work was not tested on that package. The source record did not change between the report and the source check, apart from the snapshot's generated time.

Source review found a retry defect: the request controller marks an action as sent before the host confirms it and retains that mark after an error. The widget also gives no visible request result. This explains how a failed first request can make later clicks appear inert. It does not prove why the first request failed. I added a focused retry test and built a separate [action feedback candidate](action-feedback-candidate.md). It shows pending, success, or failure next to the two icons. The saved `make_docs` entry still points to the short-reference candidate. P11 t3 and t5 remain open.

## Action-feedback installed failure — 2026-10-25

The owner approved the exact action-feedback command change and restarted Codex. `codex mcp list --json` named the approved executable, and a running process used it. The loaded `project_status` call returned `ready` with MCP and Store access. I opened a fresh 76-record report. W25 R0 showed 55 of 66 tasks complete and `Status: Ready`. The owner pressed Explain once. The live app showed `Could not send to chat.` Its local reason was `Widget hash validation is not active.` No Explain message reached this chat. Work was not tested on this package.

The browser widget had made the short message reference after its hash pass ended. I moved action resolution and message creation into one pass. A browser-bundled test now sends clear Explain and Work text with a short reference. The build, TypeScript check, 118 focused tests, and generated asset check pass. The [correction packet](browser-hash-action-candidate.md) names the exact new package and saved-entry plan. The current installed entry remains on the failed action-feedback package. P11 t3 and t5 remain open until an approved new installed check gives an exact result.

## Browser-hash installed Explain result — 2026-10-26

The owner approved the exact browser-hash candidate and restarted Codex. Process 76517 ran its approved executable with SHA-256 `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf`. The loaded `project_status` call returned `ready` with Store access available. A fresh snapshot found 76 records. The complete reviewed report opened in this chat with 36 records in scope, 16 historical records, and 24 archived records. The visible W25 R0 row showed 55 of 66 tasks complete, one Explain button, one Work button, and `Status: Ready`.

The owner clicked Explain once. The app showed `Sent to chat.` A clear text message reached this same chat. It named W25 R0, asked for the current source record, and ended with one 24-character review reference, `62342cf8d033e4ed360e2874`. A new source snapshot matched the one used for the open report. I read the current W25 index before answering. This passes visible Explain delivery and the current-source read for this installed package. The host receipt alone would not have passed it.

I rebuilt the expected envelope from my own full report and session. I then used the strict agent resolver with a new source snapshot. It resolved the exact Explain text and short reference to `review-wave` for W25 R0. This checks the message against independent open context rather than trusting the text alone. Work delivery and effect, duplicate refusal, and wrong-wave refusal were still open at this point. No installed connection changed after the restart.

## Browser-hash installed Work result — 2026-10-26

The owner clicked W25 R0 Work once in the same live app. The app showed `Sent to chat.` A clear text Work message reached this chat with one short reference, `e1a32f9f39a003f3e509f014`. The owner controlled when to send it. I did not click either action button.

Before starting work, I obtained another current 76-record snapshot. Its source records matched the report I had opened. W25 R0 was still active with 55 of 66 tasks checked. Its captured recommendation was: “Finish P11 installed acceptance and record each result.” I read the current W25 index and P11 source record. The strict agent resolver used the same independently rebuilt envelope and current snapshot. It resolved the exact Work text and short reference to `request-task` for W25 R0. The bounded Work effect is this P11 evidence update and the linked phase and claim review. The update makes the old report stale for later actions.

This passes same-chat Work delivery, exact action matching, a current source read, and the authorized record update for this installed package. It does not pass duplicate or wrong-wave refusal in the live host. Those checks and the final P11 claim review remain open. No new installed connection change was made.

After the source update, I tested the old Work message against the newly changed W25 snapshot. The strict resolver returned `stale-snapshot`. A W25 Work message changed to say W27 while keeping the W25 reference returned `invalid-action`. These are agent-side refusal results, not a host click on a wrong wave. I then used Refresh in the installed Codex app. It changed from `Checking source facts` to `Status: Needs review`, and both W25 action buttons became disabled. This is installed-host stale-action blocking on the current browser-hash package. The old report remains visible. A new reviewed report is needed before more live action tests.

The current source's focused request-controller, live-contract, and widget tests passed 159 of 159 tests in three files. They include a controller check that ignores duplicate clicks after a Work receipt and live-contract checks for stale or foreign identity. These are source tests for the code packed into the approved candidate. They do not replace a duplicate-click observation in the installed Codex app.

## Browser-hash installed duplicate-click check — 2026-10-26

I opened a new current 76-record report after the prior report became stale. The visible W25 R0 row again showed 55 of 66 tasks complete, one Explain button, one Work button, and `Status: Ready`. The owner clicked Explain twice and waited for the first result before the second click. The first click showed `Sent to chat.` The second showed `Already sent to chat.` I independently read the second status in the expanded Codex MCP App. This is installed-host feedback that the second click was refused. At that point, the first queued message still needed a chat receipt check.

The first queued Explain message then reached this chat. It named W25 R0 and one short reference, `dd05f6dac0c4d5ef2bd86a28`. I rebuilt the expected envelope from my own second report and session. The strict agent resolver matched that exact text to `review-wave` for W25 R0. A new 76-record source snapshot still matched the second report, with W25 active at 55 of 66 tasks complete. I read the current W25 index before answering. One Explain message was observed from the two clicks; no second Explain message was observed. This passes the installed duplicate-click check for Explain in this Codex session. It does not claim that every host uses the same message queue.

An older Refresh message from the first report session then reached this chat. Its strict reference resolved against my retained first open and the current source snapshot. It named one changed record, W25 R0, with no added or removed records. The change was the P11 result, work-index, and P7 claim updates made after that first open. W25 stayed active at 55 of 66 tasks complete. I had already opened a new reviewed report from those current facts. Its visible footer showed `Status: Ready`. This older Refresh message needs no new product decision and does not make the first report current again.

A later MCP App wrapper reached this chat without an action payload visible to the agent. It is not a second verified Explain or Work result. The duplicate-click conclusion rests on the observed `Already sent to chat` control response and the one clear Explain action that passed strict resolution. Do not infer the cause or content of the empty wrapper.

## Current-package access matrix — 2026-10-26

I reran the disposable P11 access matrix at `/private/tmp/w25-p11-fault-matrix.mjs` with the current browser-hash executable. Its SHA-256 matched `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf` before the run. The test used a new temporary home, project, Store, and MCP client under `/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-Hrnyer`. It did not change the saved Codex entry or this checkout.

The allowed connection returned `ready`. Read-only project intent, a revoked Store connection, a wrong key, and a missing Store returned `store-denied`. Missing intent, wrong harness intent, and another project returned `store-not-configured`. A Store config without a database returned `store-unavailable`. An unsupported Store schema returned `store-unsafe`. Each refused call left the test project and Store file bytes unchanged. Restoring the test settings returned `ready`. The test also read the packaged UI resource; its SHA-256 was `a15f322191d88d101f6064789a875a603443910702d1517d1a0e2287d5e601d5`.

The current installed entry then read a fresh 76-record snapshot. Its cache lookup found 75 hits and one W25 miss after the P11 record edits. A test-only title change in another snapshot record produced 74 hits and two misses. A snapshot with a different target root was refused with `operation-error` and the message `The cache snapshot target does not match the requested project root.` Snapshot schema version 2 was refused at input validation. These read checks wrote no project files.

I then ran the exact package again in a new temporary project and Store at `/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-xkLzSd`. A one-record snapshot first gave one cache miss. A validated write stored one fragment. The next lookup gave one hit. A test-only source-title change gave one miss. Changing only that temporary Store row's rule version to `999` gave one miss for the unchanged snapshot. The test project's file bytes stayed unchanged throughout the cache calls. The same run repeated the access-denial matrix and returned `ready` after settings were restored. This completes the current-package cache miss/write/hit and rule-version check without altering the installed connection.

## Current report source parity and browser limit — 2026-10-26

I rebuilt the report with the fresh 76-record snapshot after the P11 record edits. The current open tool accepted the report in dry run. It reported 36 records in scope, 16 historical, and 24 archived, with “Finish P11 access and report checks” as the first next action. The current source renderer embedded all 76 report records in static HTML. Parsed embedded data matched the report object exactly. The chat summary named W25 R0 and that next action. Neither rendered HTML nor its visible labels included a Print button. These checks prove source meaning and report data, not the current package's saved-report behavior in a browser.

I saved a disposable static HTML file to try the browser check. Codex's automatic browser review rejected the `file://` open because that protocol is blocked. It prohibited using another browser route for the same result. I removed the disposable file. No browser parity result came from this attempt. Keep P11 t2 and A51–A54 open for the current package and host scope.

I also opened the current 76-record report through the exact browser-hash MCP executable in a local MCP client that advertises no app UI capability. The call succeeded. Its text result named all 76 records, 36 in scope, W25 R0, and the current first next action. The result also advertised app metadata that this client did not render. This proves useful text fallback for that local no-UI client. It does not prove how a separate unsupported agent host presents the text. The temporary report JSON and test script were removed after the check.

I decoded the Backlog Review Skill files from the current package's bundled first-party Skill payload. The packaged report contract, render script, and static template matched their declared SHA-256 values: `b8a45557bbbed21ef8085fd082b4e2757f1da3d31dc497b2e31a27f2d0937d8e`, `580291199e34b4d6748d1a1b77027a53b73798b7a4b5fa37cc2d51b50b5bc6bd`, and `e351c336f77567e80b16f858f86433f0fbc0dae30c4dd254e0bf036c3551934e`. In a temporary folder, no saved report existed before I explicitly ran that packaged render script. The script then made one saved HTML file from the current 76-record report. Its embedded report matched the input object exactly. The packaged chat summary named W25 and “Finish P11 access and report checks.” The packaged and source static HTML and chat text matched byte for byte. No Print button label appeared. I removed the temporary folder after the check. This proves exact-package static creation on request and source/package meaning parity. It does not add the blocked browser visual result or an unsupported agent-host result.

## Installed report and Attention correction — 2026-10-26

The owner expanded a new report from the installed browser-hash package. I read the live Codex app. It showed 76 records, 36 in scope, 16 historical, 24 archived, W25 R0 at 58 of 66 tasks complete, the updated first Next action, and `Status: Ready`. This passes visible delivery of those current report facts in the selected Codex host. The report was opened before the W25 index edit that supplied the updated Next wording, so a later source check found that one record's working-tree timestamp had changed. I do not count that first report as current after the edit.

The owner noticed that recent reports lacked an Attention section. The report object I supplied to the installed open tool had `attentionFindings: []`, even though six records were classified as conflicts in its Backlog. The app omits the section when the list is empty. This was a report preparation error, not a finding that all attention items had cleared. I made a new 76-record snapshot, retained the six source-backed conflict inferences as Attention findings, and passed the report through the installed tool's dry-run check. I then opened that corrected report. The owner saw Attention. I read all six findings in the expanded Codex app: W18 R9, W18 R13, W19 R6, W22 R0, W18 R16, and W26 R1. The corrected app also showed W25 at 58 of 66 tasks, the updated Next action, and `Status: Ready`. No saved connection, source code, or installed package changed for this correction. Do not treat an empty Attention list as proof that no conflict needs attention.

In that corrected app, the local All filter showed 76 of 76 records. The Data panel contained 76 records, six Attention findings, and one Next action in the last reviewed report data. These local controls did not create a chat action. The source record changed again when I wrote this result, so the open report is now a historical view of its captured source version.

## One-report package, live, static, and text-client check — 2026-10-26

I took a new deterministic snapshot with the exact 2.0.5 browser-hash executable, SHA-256 `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf`. The snapshot had 76 records. Only W25 R0's source timestamp and Git evidence had changed since the prior report; its task count stayed 58 of 66. I rebuilt one report with all 76 records, six Attention findings, one Next action, and current source facts. The installed open tool accepted it.

I extracted the saved-report renderer, contract, and template from that exact package's bundled Skill. Their SHA-256 values matched the recorded package values and the current source files. The packaged renderer made `/private/tmp/w25-p11-parity-20261026/report.html` only after an explicit test call. It contains the complete report model. Parsed embedded data matched the test input exactly: 76 records, six Attention findings, one Next action, and W25 at 58 of 66 tasks. The package output and current source renderer output were byte-identical. The packaged HTML SHA-256 is `60c442e47375a36a962f9eb6b8c22e73b4dd8f8624c6444a04ddcc6189e6959a`.

The same report opened in this Codex chat. The owner expanded it. I read its live Data view. Its model matched the saved report input exactly, including report time `2026-10-26T12:33:49.436Z`. A local report-text fingerprint was `c427ea87` in both places. The live app showed Attention, Next, the four 76/36/16/24 totals, W25 at 58 of 66 tasks, and `Status: Ready`. I opened and closed Data without a chat action. An unchanged live Refresh went through `Checking source facts` and returned to `Status: Ready`.

A disposable MCP client that did not advertise app UI support called `backlog_review_open` with that exact report and executable. It received one text result, 1,647 characters long. The text named the project, W25, the current Next action, and Attention. The text summary stated that six Attention items exist and included five in its short form. Its text fingerprint, `399f952d`, matched the installed tool's dry-run text exactly. This proves useful protocol text fallback for that local client. It does not prove how a separate agent host presents the result to its user.

The saved HTML was not opened in a browser during this check. Codex's earlier automatic browser review blocked the local `file://` open and prohibited another browser route for that result. The exact model, package, and HTML bytes passed; the current saved report's visual browser result remains unproved. The no-UI client result does not close the separate unsupported-agent-host case. Keep A51, A52, A54, and P11 t2 open for those two host limits or an approved narrower disposition. No saved connection or Git commit changed.

After the P11 result records changed, I pressed Refresh in the same live app. It moved from `Checking source facts` to `Status: Needs review`. The prior report stayed visible as a last reviewed view. This is the installed changed-source result for this report and package.

## Owner-accepted P11 scope — 2026-10-26

The owner accepted P11 for the tested macOS Codex host, the exact-package saved HTML data path, and the local text-only MCP client. This is an approved narrower disposition for A51, A52, A54, and t2. The current saved HTML was not viewed in a browser because automatic browser review blocked the local file open. A separate unsupported agent host did not present the fallback to a user. Both remain stated limits for release review. The accepted result does not claim Windows, Linux, all browsers, or every agent host. It does not authorize release, a commit, a connection change, or P12 work.
