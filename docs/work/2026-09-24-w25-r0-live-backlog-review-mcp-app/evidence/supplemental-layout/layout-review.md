# Supplemental Wave Card Layout Review — 2026-10-06

## Request and Scope

The user requests two narrow card changes outside the W25 R0 P6 backlog. On desktop, show the wave coordinate alone in the first row. Put the title, status badge, and phase track together in the next row. Use the status badge in place of the duplicate inferred-status summary. Add no separator. Keep the mobile layout except for placing the badge where the prior summary appeared.

This direct request is the source authority for this supplement. It is an explicit departure from the default design-to-plan-to-PRD-to-backlog order under the [lifecycle Straddle Rule](../../../../../.make-docs/system/references/lifecycle.md#straddle-rule). No new phase, task, acceptance ID, or obligation is created. P6 t1-t6/A41-A50 and its phase status are unchanged. Phase closeout/history/staging/commit remains outside this request.

The affected source is the shared static/live presentation: the upstream `packages/skills/backlog-review/assets/backlog-review-report.html` and its generated widget renderer/UI assets. The report model, action authority, footer words, and request controls are outside these two layout changes. The preceding P6 304-case and `e4c41748…` source packet remains historical evidence for that checkpoint. A new narrow source identity and result will be recorded here after checks exist.

## Human Experience Promises

Impact: `direct`. Affected humans: people who scan work records and choose a wave. Goal: identify the wave, title, status reason, and phase state without duplicate summary text. The [Human Experience Contract](../../../../../.make-docs/system/contracts/human-experience-contract.md) governs the review.

- Desktop readers see the coordinate as its own first row, followed by the title, badge, and phase track in one row.
- Readers see one visible status reason in the badge. Detail retains distinct facts, inference, and recommendation meaning.
- Mobile readers keep the existing layout, with the badge in the old summary position.
- The affected layout preserves source navigation, disclosure, local controls, and the accepted static/live meaning.

## Coverage and Evidence Plan

PRD reconciliation: `none`. [PRD 51](../../../../prd/51-backlog-review-and-reporting.md#single-file-interactive-report) HTML-8 and HX-6 require named status meaning and its reason. They do not prescribe the old card rows or duplicate summary. The requested layout implements existing authority. No PRD, Skill guidance, or system resource update is warranted.

Reuse unchanged P6 functional and P5 local-control proof. Run only affected layout/renderer checks and inspect actual desktop/mobile static/live views. Stop when those checks and the required agent review answer the four promises. Performance Testing and Unassisted Goal Testing are `not-needed-now` for this narrow layout request. Optional owner feedback remains distinct from agent evidence; no new response gate is added.

## Final Source and Checks

The [final technical packet](layout-final-technical-packet.json) binds the six changed source/test files and exact commands. The [resource proof](layout-resource-proof.json) confirms served static/live bytes. The [static report proof](static-report-proof.json) confirms that embedded full data equals the retained input.

| Final artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Shared static template | 48,678 | `b417461a3b6a680e509752b56a79d9bedbeaa51206f273cef5a19ba0dae65450` |
| Live UI HTML | 441,742 | `a474ad4bb85cd682788cbf356c415b02f6e89f53033cb31b79bad935061d8b21` |
| Rendered static report | 4,119,474 | `3bcf4ba5d6f4d340f297b682eb4b99e5c64709475c31b0239ca608038217a43d` |

The first live/static check found the actual badge child three pixels below the title/track row. The code worker repaired desktop alignment with flex. Mobile keeps its block layout. Final browser geometry confirms the repaired badge-child alignment in all nine visible desktop rows. The initial `add233b6…` source is interim and does not support the final desktop claim. No unresolved material layout finding remains in this scope.

The final affected set passes 92 cases: presentation 30, widget 48, and Skill 14. The narrowed report-contract byte guard passes one case with 36 skipped. Type, build, generated drift, whitespace, and exact built stdio resource/MIME/CSP checks pass. No new cases were added. These are affected repeats within existing suites, not 93 new P6 tests or a full P6 rerun. The preceding 304-case/e4 packet remains unchanged.

## Agent Human Experience Review

Result: `satisfied` for the requested layout and observed source views. Root used the CUA in-app browser. The browser review agent inspected all captures. The record agent also inspected the wide and mobile live captures. The user directly specified this layout; no owner acceptance of the built bytes or lived ease is claimed.

Final live views are [desktop](live-wide-final.jpg), [742-pixel width](live-narrow-final.jpg), and [390-pixel width](live-mobile-final.jpg). The mobile capture shows collapsed overview rows. Root's separate disclosure observation supports the expanded detail/control claim.

The [browser result](layout-browser-result.json) records the final geometry and limits. The [artifact manifest](layout-artifacts.json) binds the retained files. The technical packet's pending browser field predates this later result; it is not overwritten.

| Promise | Observation | Conclusion | Limit | Next action |
| --- | --- | --- | --- | --- |
| Desktop row order | At 1280 pixels, all nine visible static/live rows put coordinate above equal title, actual badge-child, and track tops. No coordinate separator appears. | Satisfied after the three-pixel repair. | Same retained report, finite visible rows. | Preserve this shared row structure. |
| One visible status reason | Each visible row has one badge and zero collapsed `.wave-summary` elements. Expanded Inference text stays intact. | Satisfied for the checked source and detail. | No new status or report model is introduced. | Keep fact/inference/recommendation detail distinct. |
| Mobile placement | At 742 pixels, coordinate/title stay in one block, then badge with the existing 10-pixel group gap, then track. At 390 pixels, all nine visible rows fit without horizontal overflow. Static keeps the original stack. | Satisfied within the checked widths. | No broad device or accessibility matrix. | Reuse unchanged responsive evidence beyond these affected views. |
| Static/live meaning and controls | Static embedded data equals the retained 73-record input. Live expanded detail keeps icon-only Review/New Task and no inline request feedback. Tool calls 0, messages 0, task-created false, and current-route warning/error logs [] are observed. | Satisfied within layout/retention scope. | Mock host; Oct 4 data is not a current facts review. No actual agent, task, or Store action. | Keep P6 functional proof separate. Confirm actual host results only through their own flow. |

The useful next action is optional owner review of a wave row at desktop and mobile widths. The owner can expand it to see the retained Inference text. No response is needed to validate the bounded agent conclusion. Phase closeout or commit still needs its own authority.

## Document Checks

The two changed Markdown paths pass content path hygiene with zero findings or I/O errors and no writes. Refreshed scoped jdoc links have zero broken links. Both tracked and new-file whitespace checks have no whitespace findings. The new-file check returns 1 for the normal file difference; it has no whitespace output.

```text
node packages/cli/dist/index.js project path-hygiene validate --target-root . --scope content --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence/supplemental-layout/layout-review.md --path docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence.md --format json
git diff --check
git diff --no-index --check /dev/null docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/evidence/supplemental-layout/layout-review.md
```

The scoped index refresh uses `index_local` with the repository root, `name: make-docs-w23-r0-p6-20260922`, `include_dot_dirs: [.make-docs]`, `incremental: true`, and these two paths. Final review and central addendum sections use `get_sections` with `verify: true`. This is document/source evidence, not installed-state or phase-closeout proof.
