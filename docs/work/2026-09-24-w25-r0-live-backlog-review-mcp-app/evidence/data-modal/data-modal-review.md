# Supplemental Data Modal Review — 2026-10-06

## Request and Scope

The user directly requests removal of the Work/Data tabs. Data moves to an icon-only top button to the right of Refresh. The button opens a modal with the existing Data content. This consultation specifies the new access path; it adds no status notice or new request wording.

The user then explicitly requires the modal to be at least 66 percent of the window height. The basis is the visible window, not an automatically grown report iframe. Keep the header and Close visible. Do not turn this into full-screen UI.

The standard MCP HostContext height is a fixed container height; maxHeight is its maximum. Neither field universally means parent-window height. The bounded test host declares maxHeight equal to its visible window and actually caps the report iframe. That matching fixture can support the 66 percent claim. An absent host bound leaves only the page's own frame measurable. Effect: parent-window height is unproved. Next action: the host must provide and honor an honest visible-height bound. Wider installed-host proof remains P7. Add no RPC, display-mode change, or UI notice for this limit.

This is a separate UI supplement outside the W25 R0 P6 backlog. The direct request is an explicit departure from the normal lifecycle order under the [Straddle Rule](../../../../../.make-docs/system/references/lifecycle.md#straddle-rule). No new phase, task, acceptance ID, or obligation is created. P6 task/status records and the completed wave-layout packet stay unchanged. Phase closeout/history/staging/commit is not authorized.

The shared static/live presentation owns this change. Keep the existing Data content, complete normalized JSON, user-started download, and lazy formatting. In live Data, keep last reviewed report data distinct from current source/cache facts. Opening and closing Data remains local; it creates no tool call, agent message, task, or Store action.

The owner clarified the normal path: close Data before selecting Refresh. Reopen Data to inspect results when useful. Refresh need not be clickable behind the open modal. A valid model arriving while Data is open is technical P6 context-compatibility evidence only. It is not a user-specified UX acceptance requirement, a new gate, or a reason to add a control.

## Human Experience Promises

Impact: `direct`. Affected humans: readers who inspect or save report data while reviewing work. Goal: reach the same exact Data through one top control, then return to the unchanged report. The [Human Experience Contract](../../../../../.make-docs/system/contracts/human-experience-contract.md) governs this review.

- An icon-only Data control opens the existing content without Work/Data tabs.
- A reader can close the modal and return to the report with its local state intact.
- The modal is at least 66 percent of the visible window height, with visible header/Close and bounded content scrolling.
- Data and download still expose the complete reviewed model; current source/cache facts remain distinct.
- Data stays lazy and local. The static/live report and accepted wave layout remain usable.

## Authority and Coverage

PRD reconciliation: `update-existing`. [PRD 51](../../../../prd/51-backlog-review-and-reporting.md#single-file-interactive-report) owns accessible Data access and Next/Attention navigation. Its Work activation wording and current tab-specific source guidance need the narrow modal reconciliation. Keep all existing requirement IDs and report/permission contracts. Preserve prior tab behavior in non-normative requirement history.

Only exact tab assumptions in the current P5 plan and upstream Skill Markdown are updated. Historical work, test, capture, and phase closeout evidence stays historical. No new PRD, guide topic, backlog, installed copy, or owner response gate is added.

Use affected modal/renderer checks and one finite static/live keyboard/visual path. Reuse unchanged P6 and layout proof. Performance Testing and Unassisted Goal Testing remain `not-needed-now`. Stop when the affected checks and required agent review answer these promises. Optional owner feedback is separate evidence.

## Current Result

Result: `satisfied` for the direct request within current source, one matching mock host, and the same-data static report. Final live HTML is 444,492 bytes, SHA-256 `3bde35c0e2670c211097f6990cf711de2d03d6540cc0fd109d8c42ac4b822117`. The [peer review](data-modal-peer-review.md), [browser result](data-modal-browser-result.json), and [resource proof](data-modal-resource-proof.json) support this conclusion. No owner acceptance of the built bytes or lived ease is claimed.

The final [technical packet](data-modal-final-technical-packet.json) records 137 passing affected cases: widget 56, presentation 30, controller 37, and Skill 14. Eight widget cases are new versus the pre-modal 48. Type, build, generated drift, whitespace, and [exact built stdio bytes/MIME/CSP](data-modal-final-built-resource-proof.json) pass. This is an affected set, not 137 additional P6 tests or a full P6 rerun. Earlier P6 and layout packets keep their original hashes and scope.

The modal meets the ceiling of 66 percent in each checked visible window: 720→476, 844→558, 1314→868, and 1900→1254 pixels. The matching mock supplies an honest standard container bound and enforces it. A short 1900-window frame grows from 1051 to 1278 through the existing size notification, so the 1254-pixel modal fits. Static uses its own 720-pixel viewport and has a 476-pixel modal. Header and Close remain visible. These facts do not make standard container fields universal parent-window measurements.

Small live/static JSON is lazy before first opening and then equals the complete 19,041-character baseline. The emitted 19,041-byte download Blob equals displayed JSON and the parsed two-record model, with SHA-256 `e722bc5af141404b21b20b6be8a6b770e629bc7fc2da871b56bec3fdb44a4ffe`. The anchor is inside the dialog. The [download audit](download-emission-proof.json) proves emitted data only; no OS-saved file is observed.

The normal path is **close Data → Refresh**. No access to Refresh behind the modal is required. A delayed valid model arriving while Data is open has separate technical compatibility proof. It adds no user gate, control, or reason for new UI.

## Agent Human Experience Review

Root used the CUA in-app browser. The browser review agent inspected captures and exact observations. The record agent inspected the modal captures and final packets. This required review supports the five promises within the stated source/fixture limits.

| Promise | Observation | Conclusion | Limit | Next action |
| --- | --- | --- | --- | --- |
| Reach existing Data through one top control | Mode, Print, Refresh, Data appear in that order. Buttons are icon-only. Tab, tablist, and tabpanel role counts are zero. | Satisfied. | Current source and matching mock. | Use the Data icon; use Close before Refresh. |
| Close and return without losing the report | Close → Download → JSON → Close and reverse Close → JSON stay inside. Escape closes and returns to Data. Return reopens with Close focused. | Satisfied for the observed path. | One engine and bounded keyboard cycle; local-state cases also have source tests. | Keep broader accessibility/host claims for P7. |
| Meet the visible-window height and keep exits visible | All four measured floors pass. Open resize preserves Close focus. The short frame grows within its honest maximum. Final narrow, phone, and retained views show header/Close. | Satisfied with the matching bound. | Without an honest bound, only frame height is known. | The host must provide and honor suitable visible-height bounds before a parent-window percentage claim. |
| Preserve complete reviewed data and distinct current facts | Live/static JSON and copy match the small baseline. The separate technical refresh path shows exact R3/R1/R2 change lists while old JSON remains exact. | Satisfied for content and bounded context compatibility. | Mock source/cache facts; no real Store or agent rebuild. | Keep reviewed JSON as export source. Close Data before a user-started Refresh. |
| Keep access lazy and local | Closed JSON length is zero. Opening formats the full model. The Blob matches it. Local Data actions add zero tool/message calls or tasks. Static has no live source/cache extras. | Satisfied for emitted data and local behavior. | No saved-file event or full production-host proof. | Verify saved-file/installed-host behavior only under its separate P7 scope. |

The clean handoff capture is [742-pixel dark](live-narrow-final.jpg). [Phone](live-phone-final.jpg), [wide](live-wide-final.jpg), and [retained report](live-retained-final.jpg) provide the other bounded views. The wide view keeps a slight body scroll; it is not a first-heading reset claim. Static geometry/data has its [same-input proof](static-small-proof.json), not a new static screenshot claim. The [artifact manifest](data-modal-artifacts.json) binds retained files.

## Repairs and Limits

Initial placement hid the header/Close under parent scroll. The first keyboard path also escaped the dialog. A scoped focus loop repaired the keyboard gap. Native scrollIntoView did not repair the outer-view gap. Button-based placement and the honest height bound resolved it. The owner's later 66 percent request superseded the fixed 560-pixel candidate. Interim captures are not final evidence. The [peer review](data-modal-peer-review.md#findings-repairs-and-limits) preserves that short history and setup limits.

The retained 73-record Oct 4 example proves finite toolbar/modal placement only. Its reported JSON length is 6,999,540; its full JSON and large accessibility tree were not read. It is not a current facts review or performance test. One retained-route `MutationObserver.observe` non-Node log has no URL or stack. The [bounded attribution check](observer-attribution-limit.json) finds zero literals in the served app, host script, and parent page. The log stays unassigned. No empty-all-logs claim or speculative source repair follows.

The optional technical arrival path starts Refresh before Data opens. It has one tool call, one fixed review-backlog message, and no task. A valid replacement leaves the modal open/focused on Close and changes JSON to 17,877 characters with R1 plus R3. Body scroll zero is preserved in that browser path; nonzero scroll has source test evidence. This is compatibility evidence, not user-specified UX acceptance.

No production-host, full accessibility, OS-saved-file, Store, real-message/task, installed, or performance outcome is claimed. No P6 phase/task/status, closeout, history, staging, or commit changes. The useful next action is optional normal use: open Data, inspect it, then close it before Refresh. A missing response creates no new gate.
