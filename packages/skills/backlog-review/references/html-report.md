# HTML Report

Use this path only when the user asks for a saved interactive report.

The delivery contract selects `static` only for that explicit request. A failed live open and chat fallback do not authorize file creation. Selecting a route does not create a file. The shared model and live payload boundaries preserve this renderer's report meaning. P5 reuses its accepted presentation for the full local widget. P6 agent flow and installed live acceptance remain later work. The saved report stays portable without the CLI, Store, network, or live bridge.

## Prepare the report

Build and validate the complete version 1 report model described in [report-model.md](report-model.md). The HTML report uses that same model. Do not remove records, rewrite statuses, or calculate different tallies for the HTML view.

Use the portable validator generated from the shared report contracts. The static renderer, full live payload, Data view, and JSON download use the same normalized V1 report. The separate live envelope supplies delivery and action identity. It does not change the static report's input schema.

Collect the bounded project-summary context and complete `projectLead` before rendering. The renderer displays those source-backed sentences exactly as inert text. It does not create project prose, report metrics, or report-use instructions. When `projectLead` is null, it hides the lead instead of inventing fallback copy.

Confirm the exact `.html` output path with the user. The renderer refuses to replace an existing file unless `--force` is present. Use `--force` only after the user approves replacement.

Write the normalized report JSON to a temporary file outside the project, then run:

```text
node <skill-root>/scripts/render-report.mjs --input <temporary-report.json> --output <selected-report.html>
```

Remove the temporary JSON after a successful render. Do not save another report copy in Store, the project, or the Skill directory.

## Report behavior

The report:

- contains all CSS, JavaScript, icons, and data in one file;
- makes no network request and loads no remote asset;
- opens with `In Scope` selected;
- includes the six fixed status filters, `Archived`, and trailing `All`;
- hides only non-aggregate filters that have no match in the full report;
- sorts by last updated, newest first, with created date and wave coordinate available;
- uses ascending coordinate and record-path ties after the selected primary sort;
- makes each collapsed summary the disclosure surface while leaving its wave link independent;
- makes each wave-specific Next and Attention item one accessible action that uses the matched wave coordinate as compact metadata and the claim as its main heading;
- selects Backlog on mobile, selects `All`, filters the exact sourced record reference, keeps its matched coordinate in search, and expands/focuses that wave when the action runs;
- labels null Attention references `Backlog finding` in the same metadata position and keeps them non-interactive;
- places Attention before Next and applies the inter-section gap to the second visible section, so either section can be absent without leaving an empty top gap;
- shows an accessible `Clear search` control only while search contains a value and preserves the active filter when it clears search;
- keeps expanded detail outside the disclosure surface;
- preserves visible focus, keyboard use, reduced motion, responsive layouts, and browser printing without an in-report Print button; and
- renders project text as inert text;
- labels the main record section `Backlog` and provides an icon-only top Data button with an accessible name;
- opens existing Data content in a modal and provides no Work/Data tabs;
- keeps search, filter, sort, and expanded-item state unchanged when the user opens or closes Data;
- includes the complete normalized embedded model in the Data modal; and
- downloads that same full model as JSON only after the user starts the download.

The data view and download never use the current filter, search, sort order, or expanded-item state. They always expose the complete validated report model that is embedded in the file.

Do not format or place the full JSON text in the Data modal during page startup. Format it only when the user first opens Data or starts the download. Reuse that formatted value for later view or download actions. Keep the download control inside the Data modal. Do not duplicate data controls in the footer.

At widths up to and including 760 pixels, show section tabs only for the available Attention, Next, and Backlog sections, in that order. Select the first available section by default. Do not create empty Attention or Next panels. Hide duplicate visible section headings on mobile; retain those headings on desktop and in print. At larger widths, keep the current section layout with no section tabs. Search, sort, status filter, and disclosure state survive section switches and resize.

A wave-linked Attention or Next item selects Backlog on mobile, then filters the exact sourced record and expands its details. Wider views bring that same Backlog result into view without tabs. A backlog-wide finding remains non-interactive. Section switching and automatic wave navigation are local display actions. They call no tool, send no agent message, create no task, and read or write no Store state.

Editing search, using Clear search, or choosing a new status filter clears the local exact-record focus. Section switches and resize keep it. These display choices do not change the report model.

The top Data button remains separate from these section tabs and opens an accessible modal. Work/Data tabs remain absent. Use the Close data control or Escape to close it. Focus returns to Data. Opening or closing Data must not rebuild the work list or change local filters and disclosure state. Keep focus inside the open modal.

Make the Data modal at least 66 percent of the visible window height. In an embedded live view, the automatically grown report frame is not that height. Keep the header and Close control in the visible window, with scrollable Data content.

MCP host context describes container height or its maximum height. It does not always describe the parent window. Honor an honest host height bound and the host's actual container limit. Without that bound, the live page can measure only its own frame and cannot prove the parent-window percentage. The host must supply and honor a suitable visible-height bound before that height claim is made. This limit needs no new UI notice, RPC, or full-screen mode.

Printing shows the available report sections in Attention, Next, Backlog order, regardless of the selected mobile section. It shows no section tabs, Data modal, or JSON.

The wave badge shows the agent-written `statusReason` as provided. Keep it a brief status phrase under the [report-model rules](report-model.md#status-rules). Do not replace phrases or truncate report data at render time. Its color and exact filter membership come only from `waveStatus`. Archived scope comes only from the record scope.

The renderer owns all layout, labels, icons, title cleanup, colors, filters, sorting, and disclosure behavior. Do not rewrite the template or compose replacement HTML. Next and Attention share one hierarchy: marker, compact scope metadata, main claim heading, and any available supporting detail. Wave display names come from deterministic cleanup of the sourced title, with a directory-slug fallback only when no supported title exists.

The expanded wave panel uses the fixed three-column `Facts`, `Inference`, and `Recommended action` layout. It displays concise claim text. Claim evidence, confidence, rationale, and limits remain in the embedded normalized data and do not appear as long inline lists.

Below those columns, icon-only `Explain this wave` and `Work on this wave` controls match the live review buttons. Their accessible names and tooltips identify each action. Explain asks for goals, current status, open work, and a recommendation. Work includes the saved recommended action when one exists. Both prompts name the source record and tell the receiving agent to check current facts and user authority. The saved file sends no message and starts no work. Copy during the click, with a hidden browser-command path and a Clipboard API path. Show only brief success or failure feedback after a click. Do not show a prompt field or repeated help text. Hide these controls in print.

Attention icons use the fixed report mapping: `conflict` is error/red, `attention` is warning/amber, and all other record or backlog findings are info/blue.

## Verify the result

Open the saved file with network access unavailable. Check one wide and one narrow view in light and dark modes. At up to 760 pixels, check the available Attention/Next/Backlog tabs and first-available default. Check that larger widths have no section tabs. Use the keyboard to switch available sections, open and close Data, activate one Next item, activate one wave-specific Attention item, clear search, change a filter, change both sort controls, open a wave, follow its source link, and start the JSON download. Confirm each wave-linked item selects Backlog on mobile, selects `All`, filters its exact sourced record reference, keeps the visible coordinate in search, and expands/focuses the matched wave. Confirm `Backlog finding` is not an action. Confirm that clearing search preserves the selected filter. Confirm that the wave link does not open or close detail. Check both icon-only wave prompt buttons, their coordinate and source path, the saved action in Work, brief copy feedback, and both hidden copy paths. The buttons must send no message or network request. Confirm that section switches, resize, and Data open/close preserve local work-list state. Confirm that no Print button appears. The browser's Print command must show all available report sections with no section tabs, Data, or copy controls, while keeping coordinates readable.

Compare the displayed data and downloaded JSON with the embedded model. They must contain every report record even when the visible wave list is filtered.

Inspect hostile or markup-like project text when present. It must display as text and must not create elements or run code.
