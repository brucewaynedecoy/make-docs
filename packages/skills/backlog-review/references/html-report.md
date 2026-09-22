# HTML Report

Use this path only when the user asks for a saved interactive report.

## Prepare the report

Build and validate the complete version 1 report model described in [report-model.md](report-model.md). The HTML report uses that same model. Do not remove records, rewrite statuses, or calculate different tallies for the HTML view.

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
- keeps expanded detail outside the disclosure surface;
- preserves visible focus, keyboard use, reduced motion, responsive layouts, and print; and
- renders project text as inert text;
- labels the main record section `Backlog` and gives it keyboard-accessible `Work` and `Data` tabs;
- keeps search, filter, sort, and expanded-item state unchanged when the user switches tabs;
- includes the complete normalized embedded model in the `Data` tab; and
- downloads that same full model as JSON only after the user starts the download.

The data view and download never use the current filter, search, sort order, or expanded-item state. They always expose the complete validated report model that is embedded in the file.

Do not format or place the full JSON text in the Data panel during page startup. Format it only when the user first selects the `Data` tab or starts the download. Reuse that formatted value for later view or download actions. Keep the download control inside the `Data` panel. Do not duplicate data controls in the footer.

Use the standard tab pattern. `Work` is selected by default. Left Arrow, Right Arrow, Home, and End move and select the tabs. Tab changes must not rebuild the Work panel.

Printing always shows the normal Work report and never shows Data or JSON.

The wave badge shows `statusReason`. Its color and exact filter membership come only from `waveStatus`. Archived scope comes only from the record scope.

The renderer owns all layout, labels, icons, title cleanup, colors, filters, sorting, and disclosure behavior. Do not rewrite the template or compose replacement HTML. Wave display names come from deterministic cleanup of the sourced title, with a directory-slug fallback only when no supported title exists.

The expanded wave panel always uses the fixed three-column `Facts`, `Inference`, and `Recommended action` layout. It displays concise claim text. Claim evidence, confidence, rationale, and limits remain in the embedded normalized data and do not appear as long inline lists.

Attention icons use the fixed report mapping: `conflict` is error/red, `attention` is warning/amber, and all other record or portfolio findings are info/blue.

## Verify the result

Open the saved file with network access unavailable. Check one wide and one narrow view in light and dark modes. Use the keyboard to select both Backlog tabs, search, change a filter, change both sort controls, open a wave, follow its source link, reach Print, and start the JSON download. Confirm that the wave link does not open or close detail. Confirm that the Work state survives a move to Data and back. Confirm that print shows Work and omits Data.

Compare the displayed data and downloaded JSON with the embedded model. They must contain every report record even when the visible wave list is filtered.

Inspect hostile or markup-like project text when present. It must display as text and must not create elements or run code.
