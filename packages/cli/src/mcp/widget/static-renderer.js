// Generated from the accepted static report. Run scripts/build-mcp-app-assets.mjs.
export const reportMarkup = "<main class=\"shell\">\n    <header class=\"masthead\">\n      <div><h1>Backlog review</h1><p class=\"lead\" id=\"reportLead\"></p></div>\n      <dl class=\"report-meta\">\n        <div><dt>Project</dt><dd><a class=\"project-link\" id=\"projectLink\"></a></dd></div>\n        <div><dt>Date</dt><dd id=\"reportDate\"></dd></div>\n        <div class=\"meta-actions\">\n          <button class=\"meta-button theme-button\" type=\"button\" id=\"themeToggle\" aria-pressed=\"false\">Dark mode</button>\n          <button class=\"meta-button print-button\" type=\"button\" id=\"printReport\">\n            <svg aria-hidden=\"true\" viewBox=\"0 0 16 16\" fill=\"none\"><path d=\"M4 6V2h8v4M4 11H2.5A1.5 1.5 0 0 1 1 9.5v-2A1.5 1.5 0 0 1 2.5 6h11A1.5 1.5 0 0 1 15 7.5v2a1.5 1.5 0 0 1-1.5 1.5H12M4 9h8v5H4z\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/></svg>\n            <span>Print</span>\n          </button>\n          <button class=\"meta-button icon-button\" type=\"button\" id=\"openReportData\" aria-label=\"Data\" title=\"Data\" aria-haspopup=\"dialog\" aria-controls=\"dataDialog\" aria-expanded=\"false\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><ellipse cx=\"12\" cy=\"5\" rx=\"8\" ry=\"3\"/><path d=\"M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3\"/></svg></button>\n        </div>\n      </dl>\n    </header>\n    <section class=\"snapshot-strip\" aria-label=\"Portfolio totals\">\n      <div class=\"metric\"><strong id=\"recordsFound\"></strong><span>work records found</span></div>\n      <div class=\"metric\"><strong id=\"recordsInScope\"></strong><span>records in scope</span></div>\n      <div class=\"metric\"><strong id=\"historicalRecords\"></strong><span>historical records</span></div>\n      <div class=\"metric\"><strong id=\"archivedRecords\"></strong><span>archived records</span></div>\n    </section>\n    <div class=\"review-tabs\" id=\"reviewTabs\" role=\"tablist\" aria-label=\"Review sections\" hidden>\n      <button class=\"review-tab\" id=\"attentionSectionTab\" type=\"button\" role=\"tab\" aria-controls=\"attentionBlock\" data-review-tab=\"attention\">Attention</button>\n      <button class=\"review-tab\" id=\"nextSectionTab\" type=\"button\" role=\"tab\" aria-controls=\"orderBlock\" data-review-tab=\"next\">Next</button>\n      <button class=\"review-tab\" id=\"backlogSectionTab\" type=\"button\" role=\"tab\" aria-controls=\"backlogSection\" data-review-tab=\"backlog\">Backlog</button>\n    </div>\n    <div class=\"workspace\">\n      <aside class=\"attention\" id=\"attentionRail\" aria-label=\"Attention and recommended order\">\n        <section class=\"attention-block\" id=\"attentionBlock\" data-review-section=\"attention\"><div class=\"section-heading\"><h2>Attention</h2></div><ul class=\"attention-list\" id=\"attentionList\"></ul></section>\n        <section id=\"orderBlock\" data-review-section=\"next\"><div class=\"section-heading\"><h2>Next</h2></div><ol class=\"order-list\" id=\"orderList\"></ol></section>\n      </aside>\n      <section class=\"ledger\" id=\"backlogSection\" data-review-section=\"backlog\" aria-labelledby=\"ledgerHeading\">\n        <div class=\"section-heading\"><h2 id=\"ledgerHeading\">Backlog</h2></div>\n        <div id=\"workPanel\">\n          <div class=\"controls\"><div class=\"search-wrap\"><label class=\"sr-only\" for=\"search\">Search waves</label><input id=\"search\" type=\"search\" placeholder=\"Search coordinates, titles, states, or notes\" autocomplete=\"off\"><button class=\"search-clear\" id=\"clearSearch\" type=\"button\" aria-label=\"Clear search\" title=\"Clear search\" hidden><svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><path d=\"M4 4l8 8M12 4l-8 8\"></path></svg></button></div></div>\n          <div class=\"ledger-tools\">\n            <div class=\"filters\" id=\"filters\" role=\"group\" aria-label=\"Filter waves\"></div>\n            <div class=\"sort-controls\">\n              <label for=\"sortBy\"><span class=\"sr-only\">Sort waves by</span><select id=\"sortBy\"><option value=\"created\">Created date</option><option value=\"coordinate\">Wave coordinate</option><option value=\"updated\" selected>Last updated</option></select></label>\n              <button id=\"sortDirection\" type=\"button\" data-direction=\"desc\" aria-label=\"Sort direction: newest first. Change to oldest first.\" title=\"Newest first\">\n                <svg class=\"sort-direction-icon descending\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 4v16m-3-3 3 3 3-3\"></path><path d=\"M12 6h9M12 10h7M12 14h5M12 18h3\"></path></svg>\n                <svg class=\"sort-direction-icon ascending\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M6 20V4M3 7l3-3 3 3\"></path><path d=\"M12 6h3M12 10h5M12 14h7M12 18h9\"></path></svg>\n              </button>\n            </div>\n          </div>\n          <p class=\"result-note\" id=\"resultNote\" aria-live=\"polite\"></p>\n          <div class=\"wave-list\" id=\"waveList\"></div>\n          <div class=\"legends\"><section class=\"legend-block\" aria-labelledby=\"legendHeading\"><h2 id=\"legendHeading\">Phase state legend</h2><div class=\"legend\"><span><i class=\"complete\"></i>Complete</span><span><i class=\"open\"></i>Open or planned</span><span><i class=\"blocked\"></i>Blocked</span><span><i class=\"conflict\"></i>Conflicting evidence</span><span><i class=\"superseded\"></i>Superseded</span><span><i></i>Not started or unknown</span></div></section></div>\n        </div>\n      </section>\n    </div>\n    <dialog class=\"data-dialog\" id=\"dataDialog\" aria-labelledby=\"dataDialogTitle\">\n      <header class=\"data-dialog-header\"><h2 id=\"dataDialogTitle\">Data</h2><button class=\"meta-button icon-button\" type=\"button\" id=\"closeReportData\" aria-label=\"Close data\" title=\"Close data\" autofocus><svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><path d=\"M4 4l8 8M12 4l-8 8\"/></svg></button></header>\n      <div class=\"data-dialog-body\" id=\"dataPanel\">\n        <p class=\"data-copy\">View or save the complete normalized data that backs this report. Filters, search, sorting, and open items do not change this data.</p>\n        <div class=\"data-actions\"><button class=\"meta-button\" type=\"button\" id=\"downloadReportData\">Download JSON</button></div>\n        <pre class=\"data-view\" id=\"reportDataView\" role=\"region\" aria-label=\"Complete normalized report data\" tabindex=\"0\"></pre>\n      </div>\n    </dialog>\n    <footer><p><a id=\"projectFooterLink\">Open the project</a></p></footer>\n  </main>";
export const reportStyles = "\n    :root {\n      color-scheme: light dark;\n      --ink: #15213c;\n      --muted: #5d6b82;\n      --paper: #f5f7fb;\n      --panel: #ffffff;\n      --copy: #34415a;\n      --detail: #eef3ff;\n      --detail-copy: #42506a;\n      --line: #d7deea;\n      --line-strong: #aeb9ca;\n      --blue: #3159d8;\n      --blue-soft: #e9efff;\n      --accent: #3159d8;\n      --accent-line: #7187b6;\n      --phase-complete: #70ad9a;\n      --phase-open: #829de0;\n      --phase-blocked: #d77d87;\n      --phase-conflict: #d5a158;\n      --phase-superseded: #a7afbc;\n      --phase-unknown: #dfe4ec;\n      --wave-current: #3159d8;\n      --wave-current-soft: #e9efff;\n      --wave-attention: #9a5a10;\n      --wave-attention-soft: #fff0db;\n      --wave-conflict: #a6333d;\n      --wave-conflict-soft: #fdebee;\n      --wave-deferred: #6750a4;\n      --wave-deferred-soft: #f0ebff;\n      --wave-complete: #246b58;\n      --wave-complete-soft: #e4f4ee;\n      --wave-history: #5f6b7e;\n      --wave-history-soft: #edf0f5;\n      --button-text: #ffffff;\n      --focus: #005fcc;\n      --radius: 5px;\n      --measure: 72ch;\n      font-family: \"Avenir Next\", Avenir, \"Segoe UI\", Helvetica, Arial, sans-serif;\n      font-synthesis: none;\n    }\n\n    @media (prefers-color-scheme: dark) {\n      :root:not([data-theme=\"light\"]) { color-scheme: dark; }\n    }\n\n    :root[data-theme=\"light\"] { color-scheme: light; }\n\n    :root[data-theme=\"dark\"] {\n        --ink: #f5f5f7;\n        --muted: #a6a6b0;\n        --paper: #111111;\n        --panel: #191919;\n        --copy: #dedee3;\n        --detail: #202022;\n        --detail-copy: #d7d7dd;\n        --line: #2d2d33;\n        --line-strong: #484850;\n        --blue: #75adff;\n        --blue-soft: #1c1c22;\n        --accent: #75adff;\n        --accent-line: #3e5f8a;\n        --phase-complete: #469c7e;\n        --phase-open: #527fca;\n        --phase-blocked: #ca5362;\n        --phase-conflict: #bd873e;\n        --phase-superseded: #687282;\n        --phase-unknown: #242429;\n        --wave-current: #75adff;\n        --wave-current-soft: #13243d;\n        --wave-attention: #f2b65f;\n        --wave-attention-soft: #352510;\n        --wave-conflict: #ff7888;\n        --wave-conflict-soft: #3a171e;\n        --wave-deferred: #b9a2ff;\n        --wave-deferred-soft: #271f40;\n        --wave-complete: #68d4aa;\n        --wave-complete-soft: #113126;\n        --wave-history: #c1c7d0;\n        --wave-history-soft: #252c37;\n        --button-text: #111111;\n        --focus: #91bdff;\n    }\n\n    @media (prefers-color-scheme: dark) {\n      :root:not([data-theme=\"light\"]) {\n        --ink: #f5f5f7;\n        --muted: #a6a6b0;\n        --paper: #111111;\n        --panel: #191919;\n        --copy: #dedee3;\n        --detail: #202022;\n        --detail-copy: #d7d7dd;\n        --line: #2d2d33;\n        --line-strong: #484850;\n        --blue: #75adff;\n        --blue-soft: #1c1c22;\n        --accent: #75adff;\n        --accent-line: #3e5f8a;\n        --phase-complete: #469c7e;\n        --phase-open: #527fca;\n        --phase-blocked: #ca5362;\n        --phase-conflict: #bd873e;\n        --phase-superseded: #687282;\n        --phase-unknown: #242429;\n        --wave-current: #75adff;\n        --wave-current-soft: #13243d;\n        --wave-attention: #f2b65f;\n        --wave-attention-soft: #352510;\n        --wave-conflict: #ff7888;\n        --wave-conflict-soft: #3a171e;\n        --wave-deferred: #b9a2ff;\n        --wave-deferred-soft: #271f40;\n        --wave-complete: #68d4aa;\n        --wave-complete-soft: #113126;\n        --wave-history: #c1c7d0;\n        --wave-history-soft: #252c37;\n        --button-text: #111111;\n        --focus: #91bdff;\n      }\n    }\n\n    :root[data-theme=\"dark\"] .masthead { border-top-color: var(--line-strong); }\n    :root[data-theme=\"dark\"] .section-heading { border-bottom-color: var(--line-strong); }\n\n    @media (prefers-color-scheme: dark) {\n      :root:not([data-theme=\"light\"]) .masthead { border-top-color: var(--line-strong); }\n      :root:not([data-theme=\"light\"]) .section-heading { border-bottom-color: var(--line-strong); }\n    }\n\n    * { box-sizing: border-box; }\n    html, body { background: var(--paper); }\n    body { margin: 0; color: var(--ink); line-height: 1.5; }\n    button, input, select { font: inherit; }\n    button, a, input, select { -webkit-tap-highlight-color: transparent; }\n    button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {\n      outline: 3px solid color-mix(in srgb, var(--focus) 32%, transparent);\n      outline-offset: 2px;\n    }\n    a { color: var(--blue); text-underline-offset: .16em; }\n    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }\n    .shell { width: min(1480px, calc(100% - 40px)); margin: 0 auto; padding: 32px 0 72px; }\n    .masthead {\n      display: grid;\n      grid-template-columns: minmax(0, 1fr) auto;\n      gap: 32px;\n      align-items: start;\n      border-top: 7px solid var(--ink);\n      border-bottom: 1px solid var(--line-strong);\n      padding: 24px 0 28px;\n    }\n    h1 { max-width: 18ch; margin: 0; font-size: clamp(2.2rem, 5vw, 5.4rem); font-weight: 650; letter-spacing: -.055em; line-height: .98; }\n    .lead { max-width: var(--measure); margin: 22px 0 0; color: var(--copy); font-size: clamp(1.03rem, 1.6vw, 1.3rem); line-height: 1.55; }\n    .report-meta { min-width: 230px; margin: 4px 0 0; border-left: 1px solid var(--line); padding-left: 24px; }\n    .report-meta div + div { margin-top: 15px; }\n    .report-meta dt { color: var(--muted); font-size: .76rem; }\n    .report-meta dd { margin: 2px 0 0; font-weight: 650; }\n    .project-link { text-decoration-color: var(--line-strong); }\n    #projectLink, #projectFooterLink { color: var(--accent); }\n    .meta-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; padding-top: 8px; }\n    .meta-button {\n      display: inline-flex;\n      align-items: center;\n      gap: 8px;\n      min-height: 33px;\n      border: 1px solid var(--line-strong);\n      border-radius: var(--radius);\n      background: transparent;\n      color: var(--ink);\n      padding: 7px 10px;\n      font-size: .78rem;\n      line-height: 1;\n      cursor: pointer;\n    }\n    .theme-button::before { width: 12px; height: 12px; border: 1px solid currentColor; border-radius: 50%; background: linear-gradient(90deg, currentColor 50%, transparent 50%); content: \"\"; }\n    .print-button svg { width: 13px; height: 13px; stroke: currentColor; }\n    .snapshot-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-bottom: 1px solid var(--line-strong); }\n    .metric { min-width: 0; padding: 18px 14px; border-right: 1px solid var(--line); }\n    .metric:last-child { border-right: 0; }\n    .metric strong { display: block; font-size: 1.65rem; line-height: 1; }\n    .metric span { color: var(--muted); font-size: .82rem; }\n    .workspace { display: grid; grid-template-columns: minmax(250px, 340px) minmax(0, 1fr); gap: 42px; padding-top: 42px; }\n    .attention { align-self: start; position: sticky; top: 18px; }\n    .section-heading { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin: 0 0 14px; border-bottom: 2px solid var(--ink); padding-bottom: 9px; }\n    .section-heading h2 { margin: 0; font-size: 1rem; font-weight: 750; letter-spacing: -.01em; }\n    .attention-list, .order-list { margin: 0; padding: 0; list-style: none; }\n    .attention-item, .order-item { border-bottom: 1px solid var(--line); }\n    .report-action, .backlog-finding { display: grid; width: 100%; grid-template-columns: 32px 1fr; gap: 12px; border: 0; background: transparent; color: inherit; padding: 16px 0; text-align: left; }\n    .report-action { cursor: pointer; }\n    .report-action:hover { background: color-mix(in srgb, var(--blue-soft) 28%, transparent); }\n    .report-action:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }\n    .attention-icon, .order-number { width: 28px; min-height: 23px; display: grid; place-items: center; align-self: start; }\n    .attention-icon svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }\n    .attention-item.info .attention-icon { color: var(--wave-current); }\n    .attention-item.warning .attention-icon { color: var(--wave-attention); }\n    .attention-item.error .attention-icon { color: var(--wave-conflict); }\n    .action-copy { min-width: 0; }\n    .action-detail { display: block; margin-top: 4px; color: var(--muted); font-size: .82rem; }\n    .attention-item strong, .order-item strong { display: block; font-size: .9rem; }\n    .action-coordinate { display: block; margin-bottom: 3px; color: var(--muted); font-size: .72rem; font-weight: 700; }\n    .attention > section:not([hidden]) + section:not([hidden]) { margin-top: 42px; }\n    .order-item .report-action { padding: 13px 0; }\n    .order-number { padding: 3px; font-size: .7rem; background: var(--paper); color: var(--ink); }\n    .ledger { min-width: 0; }\n    .review-tabs { display: flex; gap: 18px; margin-top: 28px; border-bottom: 1px solid var(--line); }\n    .review-tabs[hidden], .review-tab[hidden], [data-review-section][hidden], .attention[hidden] { display: none; }\n    .review-tab { min-height: 38px; margin-bottom: -1px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--muted); padding: 6px 2px; font-size: .82rem; cursor: pointer; }\n    .review-tab[aria-selected=\"true\"] { border-bottom-color: var(--ink); color: var(--ink); font-weight: 700; }\n    .icon-button { width: 34px; min-width: 34px; padding: 0; display: inline-grid; place-items: center; }\n    .icon-button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }\n    .data-dialog { position: fixed; inset: 24px 0 auto; width: min(960px, calc(100vw - 48px)); max-width: none; height: 66dvh; min-height: 66dvh; max-height: none; margin: 0 auto; border: 1px solid var(--line-strong); background: var(--panel); color: var(--ink); padding: 20px; }\n    .data-dialog[open] { display: flex; flex-direction: column; gap: 16px; }\n    .data-dialog::backdrop { background: rgb(0 0 0 / .55); }\n    .data-dialog-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }\n    .data-dialog-header h2 { margin: 0; font-size: 1rem; }\n    .data-dialog-body { min-height: 0; overflow: auto; }\n    .controls { margin-bottom: 28px; }\n    .search-wrap { position: relative; }\n    .search-wrap::before { position: absolute; left: 13px; top: 50%; width: 12px; height: 12px; border: 2px solid var(--muted); border-radius: 50%; content: \"\"; transform: translateY(-58%); pointer-events: none; }\n    .search-wrap::after { position: absolute; left: 25px; top: 57%; width: 7px; height: 2px; background: var(--muted); content: \"\"; transform: rotate(45deg); pointer-events: none; }\n    #search { width: 100%; min-height: 43px; border: 1px solid var(--line-strong); background: var(--panel); color: var(--ink); padding: 9px 48px 9px 42px; }\n    #search::-webkit-search-cancel-button { -webkit-appearance: none; }\n    .search-clear { position: absolute; right: 5px; top: 50%; width: 34px; min-height: 34px; display: grid; place-items: center; border: 0; background: transparent; color: var(--muted); padding: 0; transform: translateY(-50%); cursor: pointer; }\n    .search-clear:hover { color: var(--ink); }\n    .search-clear[hidden] { display: none; }\n    .search-clear svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.8; }\n    .ledger-tools { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 14px; }\n    .filters { display: flex; flex-wrap: wrap; gap: 7px; margin: 0; padding: 0 0 13px; }\n    .filter-button { min-height: 34px; border: 1px solid var(--line-strong); background: transparent; color: var(--ink); padding: 6px 12px; font-size: .8rem; cursor: pointer; }\n    .filter-button:hover, .filter-button:focus-visible, .filter-button[aria-pressed=\"true\"] { border-color: var(--ink); background: var(--ink); color: var(--button-text); }\n    .filter-button[data-filter=\"attention\"] { --filter-color: var(--wave-attention); --filter-soft: var(--wave-attention-soft); }\n    .filter-button[data-filter=\"current\"] { --filter-color: var(--wave-current); --filter-soft: var(--wave-current-soft); }\n    .filter-button[data-filter=\"conflict\"] { --filter-color: var(--wave-conflict); --filter-soft: var(--wave-conflict-soft); }\n    .filter-button[data-filter=\"deferred\"] { --filter-color: var(--wave-deferred); --filter-soft: var(--wave-deferred-soft); }\n    .filter-button[data-filter=\"complete\"] { --filter-color: var(--wave-complete); --filter-soft: var(--wave-complete-soft); }\n    .filter-button[data-filter=\"history\"], .filter-button[data-filter=\"archived\"] { --filter-color: var(--wave-history); --filter-soft: var(--wave-history-soft); }\n    .filter-button[data-semantic]:hover, .filter-button[data-semantic]:focus-visible, .filter-button[data-semantic][aria-pressed=\"true\"] { border-color: color-mix(in srgb, var(--filter-color) 55%, var(--line)); background: var(--filter-soft); color: var(--filter-color); }\n    .sort-controls { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; padding-bottom: 14px; }\n    #sortBy, #sortDirection { min-height: 34px; border: 1px solid var(--line-strong); background: var(--panel); color: var(--ink); font-size: .78rem; }\n    #sortBy { padding: 5px 28px 5px 9px; }\n    #sortDirection { width: 34px; min-width: 34px; padding: 0; display: grid; place-items: center; cursor: pointer; }\n    .sort-direction-icon { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }\n    .sort-direction-icon.ascending { display: none; }\n    #sortDirection[data-direction=\"asc\"] .ascending { display: block; }\n    #sortDirection[data-direction=\"asc\"] .descending { display: none; }\n    .result-note { margin: 0 0 12px; color: var(--muted); font-size: .8rem; }\n    .wave-list { border-top: 1px solid var(--line); background: color-mix(in srgb, var(--panel) 82%, transparent); }\n    .wave { border-bottom: 1px solid var(--line); }\n    .wave-overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 22px; row-gap: 4px; align-items: start; padding: 20px 28px; cursor: pointer; }\n    .wave-overview:hover { background: color-mix(in srgb, var(--blue-soft) 20%, transparent); }\n    .wave-overview:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px; }\n    .wave-title { display: contents; padding-bottom: 8px; }\n    .wave-title a { display: flex; align-items: flex-end; align-self: stretch; grid-column: 1; grid-row: 1; justify-self: start; color: var(--ink); font-size: 1.05rem; font-weight: 760; text-decoration: none; }\n    .wave-title a:hover { text-decoration: underline; }\n    .wave-title p { grid-column: 1; grid-row: 2; margin: 0; color: var(--muted); font-size: .78rem; }\n    .badge { display: inline-flex; width: fit-content; color: var(--muted); padding: 3px 8px; font-size: .7rem; font-weight: 650; }\n    .badge.current { background: var(--wave-current-soft); color: var(--wave-current); }\n    .badge.attention { background: var(--wave-attention-soft); color: var(--wave-attention); }\n    .badge.conflict { background: var(--wave-conflict-soft); color: var(--wave-conflict); }\n    .badge.deferred { background: var(--wave-deferred-soft); color: var(--wave-deferred); }\n    .badge.complete { background: var(--wave-complete-soft); color: var(--wave-complete); }\n    .badge.history { background: var(--wave-history-soft); color: var(--wave-history); }\n    .wave-status { display: flex; grid-column: 2; grid-row: 2; margin-bottom: 9px; }\n    .track-wrap { grid-column: 3; grid-row: 2; }\n    .track { display: grid; grid-template-columns: repeat(var(--phase-count), minmax(18px, 1fr)); gap: 2px; min-height: 22px; }\n    .phase { min-height: 10px; border: 1px solid var(--line-strong); background: var(--phase-unknown); }\n    .phase.complete { border-color: var(--phase-complete); background: var(--phase-complete); }\n    .phase.open { border-color: var(--phase-open); background: var(--phase-open); }\n    .phase.blocked { border-color: var(--phase-blocked); background: var(--phase-blocked); }\n    .phase.conflict { border-color: var(--phase-conflict); background: var(--phase-conflict); }\n    .phase.superseded { border-color: var(--phase-superseded); background: var(--phase-superseded); }\n    .track-stats { display: flex; align-items: flex-end; align-self: stretch; grid-column: 3; grid-row: 1; min-height: 1.575rem; margin: 0; color: var(--muted); font-size: .73rem; }\n    .detail { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; margin: 0 4px 2px; border-left: 3px solid var(--blue); background: var(--detail); padding: 18px 24px 18px 21px; font-size: .82rem; }\n    .detail[hidden] { display: none; }\n    .detail h3 { margin: 0 0 6px; font-size: .8rem; }\n    .claim-list { margin: 0; padding-left: 18px; color: var(--detail-copy); }\n    .claim-list li + li { margin-top: 8px; }\n    .claim-copy { margin: 0; color: var(--detail-copy); }\n    .claim-copy + .claim-copy { margin-top: 8px; }\n    .empty { border-bottom: 1px solid var(--line); padding: 48px 16px; text-align: center; color: var(--muted); }\n    .legends { margin-top: 24px; }\n    .legend-block h2 { margin: 0 0 12px; font-size: .88rem; }\n    .legend { display: flex; flex-wrap: wrap; gap: 12px 24px; color: var(--muted); font-size: .75rem; }\n    .legend span { display: inline-flex; gap: 7px; align-items: center; }\n    .legend i { width: 30px; height: 14px; flex: 0 0 auto; border: 1px solid var(--line-strong); border-radius: 4px; background: var(--phase-unknown); }\n    .legend .complete { background: var(--phase-complete); border-color: var(--phase-complete); }\n    .legend .open { background: var(--phase-open); border-color: var(--phase-open); }\n    .legend .blocked { background: var(--phase-blocked); border-color: var(--phase-blocked); }\n    .legend .conflict { background: var(--phase-conflict); border-color: var(--phase-conflict); }\n    .legend .superseded { background: var(--phase-superseded); border-color: var(--phase-superseded); }\n    .data-copy { max-width: var(--measure); margin: 0; color: var(--muted); font-size: .82rem; }\n    .data-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }\n    .data-view { max-height: 34rem; margin: 16px 0 0; overflow: auto; border: 1px solid var(--line); background: var(--panel); padding: 16px; color: var(--copy); font: .75rem/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre; tab-size: 2; }\n    .data-view[hidden] { display: none; }\n    footer { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 30px; margin-top: 48px; border-top: 1px solid var(--line-strong); padding-top: 20px; color: var(--muted); font-size: .78rem; }\n    footer p { max-width: var(--measure); margin: 0; }\n\n    @media (max-width: 1080px) {\n      .workspace { grid-template-columns: 1fr; }\n      .attention { position: static; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }\n      .attention > section:not([hidden]) + section:not([hidden]) { margin-top: 0; }\n      .wave-overview { column-gap: 16px; }\n      .detail { column-gap: 16px; }\n    }\n    @media (max-width: 760px) {\n      .shell { width: min(100% - 24px, 680px); padding-top: 16px; }\n      .masthead { grid-template-columns: 1fr; gap: 18px; }\n      .report-meta { border-left: 0; border-top: 1px solid var(--line); padding: 15px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }\n      .report-meta div + div { margin-top: 0; }\n      .meta-actions { grid-column: 1 / -1; margin-top: 2px; }\n      .attention { display: block; }\n      .attention > section:not([hidden]) + section:not([hidden]) { margin-top: 42px; }\n      .workspace { padding-top: 18px; }\n      #attentionBlock > .section-heading, #orderBlock > .section-heading, #backlogSection > .section-heading { display: none; }\n      .ledger-tools { flex-direction: column; align-items: stretch; }\n      .sort-controls { justify-content: flex-start; }\n      .wave-overview { grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 20px 28px; }\n      .wave-status { display: block; }\n      .wave-title p { grid-column: 1 / -1; grid-row: 2; }\n      .track-stats { grid-column: 2; grid-row: 1; justify-self: end; }\n      .wave-status { grid-column: 1 / -1; grid-row: 3; }\n      .track-wrap { grid-column: 1 / -1; grid-row: 4; }\n      .detail { grid-template-columns: 1fr; margin-inline: 2px; padding-inline: 23px 26px; }\n      footer { grid-template-columns: 1fr; }\n    }\n    @media (max-width: 560px) {\n      .snapshot-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n      .metric { border-bottom: 1px solid var(--line); }\n      .metric:nth-child(even) { border-right: 0; }\n      .metric:nth-last-child(-n + 2) { border-bottom: 0; }\n    }\n    @media (prefers-reduced-motion: no-preference) {\n      html { scroll-behavior: smooth; }\n      .wave { transition: opacity 120ms ease; }\n    }\n    @media print {\n      :root, :root[data-theme=\"light\"], :root[data-theme=\"dark\"] { color-scheme: light; --ink: #15213c; --muted: #5d6b82; --paper: #ffffff; --panel: #ffffff; --copy: #34415a; --detail: #eef3ff; --detail-copy: #42506a; --line: #d7deea; --line-strong: #aeb9ca; --blue: #3159d8; --blue-soft: #e9efff; --phase-complete: #70ad9a; --phase-open: #829de0; --phase-blocked: #d77d87; --phase-conflict: #d5a158; --phase-superseded: #a7afbc; --phase-unknown: #dfe4ec; --wave-current: #3159d8; --wave-current-soft: #e9efff; --wave-attention: #9a5a10; --wave-attention-soft: #fff0db; --wave-conflict: #a6333d; --wave-conflict-soft: #fdebee; --wave-deferred: #6750a4; --wave-deferred-soft: #f0ebff; --wave-complete: #246b58; --wave-complete-soft: #e4f4ee; --wave-history: #5f6b7e; --wave-history-soft: #edf0f5; --button-text: #ffffff; }\n      :root, :root[data-theme=\"light\"], :root[data-theme=\"dark\"] { --accent: #3159d8; --accent-line: #7187b6; }\n      .shell { width: 100%; padding: 0; }\n      .controls, .filters, .sort-controls, .meta-actions, .review-tabs, #dataDialog { display: none !important; }\n      [data-review-section][data-available=\"true\"], .attention[data-available=\"true\"] { display: block !important; }\n      #attentionBlock > .section-heading, #orderBlock > .section-heading, #backlogSection > .section-heading { display: flex !important; }\n      #workPanel { display: block !important; }\n      .workspace { display: block; }\n      .attention { position: static; margin-bottom: 28px; }\n      .wave[hidden] { display: none; }\n      .wave { break-inside: avoid; }\n      .detail[hidden] { display: grid !important; }\n      .report-action { color: var(--ink); cursor: default; }\n      .report-action:hover { background: transparent; }\n    }\n  ";
export function mountStaticReport(report, presentation, root, hooks = {}) {
  const nativeDocument = root.ownerDocument, nativeWindow = nativeDocument.defaultView;
  let disposed = false; const cleanups = []; const frames = new Set();
  const listen = (target, type, listener, options) => { target.addEventListener(type, listener, options); cleanups.push(() => target.removeEventListener(type, listener, options)); };
  const document = new Proxy(nativeDocument, { get(target, key) {
    if (key === 'querySelector') return root.querySelector.bind(root);
    if (key === 'querySelectorAll') return root.querySelectorAll.bind(root);
    if (key === 'getElementById') return id => root.querySelector('#' + id);
    const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;
  }, set(target, key, value) { return Reflect.set(target, key, value, target); } });
  const window = new Proxy(nativeWindow, { get(target, key) {
    if (key === 'addEventListener') return (type, listener, options) => listen(target, type, listener, options);
    if (key === 'matchMedia') return query => { const media = target.matchMedia(query); return new Proxy(media, { get(object, name) {
      if (name === 'addEventListener') return (type, listener, options) => listen(object, type, listener, options);
      const value = Reflect.get(object, name, object); return typeof value === 'function' ? value.bind(object) : value;
    } }); };
    const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;
  } });
  const requestAnimationFrame = callback => { const id = nativeWindow.requestAnimationFrame(time => { frames.delete(id); if (!disposed) callback(time); }); frames.add(id); return id; };



    const snapshotByPath = new Map(report.snapshot.records.map((record) => [record.recordPath, record]));
    const presentationByPath = new Map(presentation.records.map((record) => [record.recordPath, record]));
    const reportByPath = new Map(report.records.map((record) => [record.recordPath, record]));
    const fixedFilters = [
      ["in-scope", "In Scope", false], ["attention", "Attention", true],
      ["current", "Current", true], ["conflict", "Conflict", true],
      ["deferred", "Deferred", true], ["complete", "Complete", true],
      ["history", "History", true], ["archived", "Archived", true],
      ["all", "All", false],
    ];
    const phaseNames = { complete: "complete", open: "open or planned", blocked: "blocked", conflict: "conflicting evidence", superseded: "superseded", unknown: "not started or unknown" };
    let activeFilter = "in-scope";
    let focusedRecordPath = null;

    const node = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined && text !== null) element.textContent = String(text);
      return element;
    };
    const valueOf = (field, fallback = null) => field && typeof field === "object" && "value" in field ? field.value ?? fallback : fallback;
    const recordName = (record) => presentationByPath.get(record.recordPath).coordinate;
    const recordTitle = (record) => presentationByPath.get(record.recordPath).title;
    const fileHref = (relativePath = "") => {
      const full = `${String(report.targetRoot).replace(/[\\/]+$/, "")}/${relativePath}`.replaceAll("\\", "/");
      const parts = full.split("/").map((part, index) => index === 0 ? "" : encodeURIComponent(part).replace("%3A", ":"));
      return `${full.startsWith("/") ? "file://" : "file:///"}${parts.join("/")}`;
    };
    const sourceHref = (record) => fileHref(presentationByPath.get(record.recordPath).sourcePath);
    const claimText = (claim) => claim?.text || "No review text supplied.";
    const firstSummary = (record) => presentationByPath.get(record.recordPath).summary;

    function factList(claims) {
      const list = node("ul", "claim-list");
      const items = claims?.length ? claims : [{ text: "No facts added." }];
      items.forEach((claim) => {
        const item = node("li", "", claimText(claim));
        list.append(item);
      });
      return list;
    }

    function claimCopy(claims, kind) {
      const group = node("div");
      const items = claims?.length ? claims : [{ text: `No ${kind.toLowerCase()} added.` }];
      items.forEach((claim) => group.append(node("p", "claim-copy", claimText(claim))));
      return group;
    }

    function matchesFilter(record, filter = activeFilter) {
      if (filter === "all") return true;
      if (filter === "in-scope") return record.scope === "live" && record.waveStatus !== "history";
      if (filter === "archived") return record.scope === "archived";
      if (filter === "history") return record.scope === "live" && record.waveStatus === "history";
      return record.scope === "live" && record.waveStatus === filter;
    }

    function compareText(left, right) { return String(left || "").localeCompare(String(right || ""), undefined, { numeric: true, sensitivity: "base" }); }
    function comparePrimary(left, right, direction) {
      if (!left && !right) return 0;
      if (!left) return 1;
      if (!right) return -1;
      return compareText(left, right) * direction;
    }
    function compareRecords(left, right) {
      const direction = document.querySelector("#sortDirection").dataset.direction === "asc" ? 1 : -1;
      const sort = document.querySelector("#sortBy").value;
      const leftSnapshot = snapshotByPath.get(left.recordPath);
      const rightSnapshot = snapshotByPath.get(right.recordPath);
      const leftPrimary = sort === "coordinate" ? recordName(left) : sort === "created" ? valueOf(left.createdAt) : valueOf(left.lastUpdatedAt);
      const rightPrimary = sort === "coordinate" ? recordName(right) : sort === "created" ? valueOf(right.createdAt) : valueOf(right.lastUpdatedAt);
      void leftSnapshot; void rightSnapshot;
      return comparePrimary(leftPrimary, rightPrimary, direction) || compareText(recordName(left), recordName(right)) || compareText(left.recordPath, right.recordPath);
    }

    function renderFilters() {
      const container = document.querySelector("#filters");
      fixedFilters.forEach(([filter, label, semantic]) => {
        const button = node("button", "filter-button", label);
        button.type = "button";
        button.dataset.filter = filter;
        if (semantic) button.dataset.semantic = "";
        button.setAttribute("aria-pressed", String(filter === activeFilter));
        button.hidden = !["all", "in-scope"].includes(filter) && !report.records.some((record) => matchesFilter(record, filter));
        button.addEventListener("click", () => {
          focusedRecordPath = null;
          setActiveFilter(filter);
          renderWaves();
        });
        container.append(button);
      });
    }

    function setActiveFilter(filter) {
      activeFilter = filter;
      document.querySelectorAll("#filters .filter-button").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
      });
    }

    function renderOrder() {
      const list = document.querySelector("#orderList");
      report.recommendationOrder.forEach((item) => {
        const record = reportByPath.get(item.recordPath);
        const row = node("li", "order-item");
        const action = node("button", "report-action");
        action.type = "button";
        action.setAttribute("aria-label", `Show ${recordName(record)} in the Backlog: ${claimText(item.claim)}`);
        action.addEventListener("click", () => focusBacklogRecord(record));
        action.append(node("span", "order-number", item.rank));
        const copy = node("span", "action-copy");
        copy.append(node("span", "action-coordinate", recordName(record)));
        copy.append(node("strong", "", claimText(item.claim)));
        copy.append(node("span", "action-detail", item.claim.rationale));
        action.append(copy);
        row.append(action);
        list.append(row);
      });
      document.querySelector("#orderBlock").hidden = report.recommendationOrder.length === 0;
    }

    function attentionKind(finding) {
      const record = report.records.find((item) => item.recordPath === finding.recordPath);
      return record?.waveStatus === "conflict" ? "error" : record?.waveStatus === "attention" ? "warning" : "info";
    }
    function attentionIcon(kind) {
      const wrap = node("span", "attention-icon");
      wrap.setAttribute("role", "img");
      wrap.setAttribute("aria-label", kind === "error" ? "Error" : kind === "warning" ? "Warning" : "Information");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const paths = kind === "error" ? ["M7.2 2.5h9.6l4.7 4.7v9.6l-4.7 4.7H7.2l-4.7-4.7V7.2z", "M12 7.5v6", "M12 16.5h.01"] : kind === "warning" ? ["M10.2 4.2 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.8 4.2a2.1 2.1 0 0 0-3.6 0z", "M12 9v5", "M12 17h.01"] : ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18", "M12 10.5v6", "M12 7.5h.01"];
      paths.forEach((data) => { const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", data); svg.append(path); });
      wrap.append(svg);
      return wrap;
    }
    function renderAttention() {
      const list = document.querySelector("#attentionList");
      report.attentionFindings.forEach((finding) => {
        const kind = attentionKind(finding);
        const row = node("li", `attention-item ${kind}`);
        const record = finding.recordPath === null ? null : reportByPath.get(finding.recordPath);
        const content = record ? node("button", "report-action") : node("div", "backlog-finding");
        if (record) {
          content.type = "button";
          content.setAttribute("aria-label", `Show ${recordName(record)} in the Backlog: ${claimText(finding.claim)}`);
          content.addEventListener("click", () => focusBacklogRecord(record));
        }
        content.append(attentionIcon(kind));
        const copy = node("span", "action-copy");
        copy.append(node("span", "action-coordinate", record ? recordName(record) : "Backlog finding"));
        copy.append(node("strong", "", claimText(finding.claim)));
        content.append(copy);
        row.append(content);
        list.append(row);
      });
      document.querySelector("#attentionBlock").hidden = report.attentionFindings.length === 0;
      document.querySelector("#attentionRail").hidden = report.attentionFindings.length === 0 && report.recommendationOrder.length === 0;
    }

    function renderWave(record, index) {
      const snapshot = snapshotByPath.get(record.recordPath);
      const article = node("article", "wave");
      article.dataset.recordPath = record.recordPath;
      const overview = node("div", "wave-overview");
      const detailId = `wave-detail-${index}`;
      overview.dataset.disclosureSurface = "";
      overview.tabIndex = 0;
      overview.setAttribute("role", "button");
      overview.setAttribute("aria-expanded", "false");
      overview.setAttribute("aria-controls", detailId);
      overview.setAttribute("aria-label", `Show details for ${recordName(record)}`);

      const title = node("div", "wave-title");
      const link = node("a", "", recordName(record));
      link.href = sourceHref(record);
      link.target = "_blank";
      link.rel = "noopener";
      title.append(link, node("p", "", recordTitle(record)));
      const trackWrap = node("div", "track-wrap");
      const statusWrap = node("div", "wave-status");
      const status = record.scope === "archived" ? "history" : record.waveStatus;
      const badge = node("span", `badge ${status}`, record.statusReason);
      badge.setAttribute("aria-label", `${record.scope === "archived" ? "archived" : record.waveStatus} status: ${record.statusReason}`);
      statusWrap.append(badge);
      const phases = Array.isArray(snapshot?.phases) ? snapshot.phases : [];
      const track = node("div", "track");
      track.style.setProperty("--phase-count", Math.max(phases.length, 1));
      const phaseDescriptions = [];
      (phases.length ? phases : [null]).forEach((phase, phaseIndex) => {
        const displayPhase = presentationByPath.get(record.recordPath).phases[phaseIndex];
        const state = phase ? displayPhase.state : "unknown";
        const label = phase ? displayPhase.label : "No interpreted phase";
        const segment = node("span", `phase ${state}`);
        segment.title = `${label}: ${phaseNames[state]}`;
        track.append(segment);
        phaseDescriptions.push(segment.title);
      });
      track.setAttribute("aria-label", phaseDescriptions.join(", "));
      const complete = valueOf(snapshot?.taskCounts?.complete, 0);
      const total = valueOf(snapshot?.taskCounts?.total, 0);
      const stats = node("div", "track-stats", `${complete} of ${total} tasks complete`);
      trackWrap.append(track);
      overview.append(title, stats, statusWrap, trackWrap);

      const detail = node("div", "detail");
      detail.id = detailId;
      detail.hidden = true;
      [["Facts", record.facts], ["Inference", record.inferences], ["Recommended action", record.recommendations]].forEach(([heading, claims]) => {
        const group = node("div");
        group.append(node("h3", "", heading), heading === "Facts" ? factList(claims) : claimCopy(claims, heading));
        detail.append(group);
      });
      article.append(overview, detail);
      return article;
    }

    function renderWaves() {
      const list = document.querySelector("#waveList");
      const query = document.querySelector("#search").value.trim().toLowerCase();
      const visible = report.records.filter((record) => {
        if (focusedRecordPath !== null && record.recordPath !== focusedRecordPath) return false;
        const snapshot = snapshotByPath.get(record.recordPath);
        const claims = [...(record.facts || []), ...(record.inferences || []), ...(record.recommendations || [])].map(claimText);
        const haystack = [recordName(record), recordTitle(record), record.waveStatus, record.statusReason, valueOf(snapshot?.recordedStatus), ...claims].join(" ").toLowerCase();
        return matchesFilter(record) && (!query || haystack.includes(query));
      }).sort(compareRecords);
      document.querySelector("#resultNote").textContent = `Showing ${visible.length} of ${report.records.length} records.`;
      list.replaceChildren();
      if (!visible.length) list.append(node("div", "empty", "No waves match. Clear the search or choose another filter."));
      visible.forEach((record, index) => list.append(renderWave(record, index)));
      hooks.wavesRendered?.();
    }

    function setExpanded(surface, open) {
      const detail = document.getElementById(surface.getAttribute("aria-controls"));
      surface.setAttribute("aria-expanded", String(open));
      surface.setAttribute("aria-label", `${open ? "Hide" : "Show"} details for ${surface.querySelector(".wave-title a").textContent}`);
      detail.hidden = !open;
    }

    const projectName = presentation.projectName;
    let normalizedReportJson = null;
    function getNormalizedReportJson() {
      if (normalizedReportJson === null) normalizedReportJson = `${JSON.stringify(report, null, 2)}\n`;
      return normalizedReportJson;
    }
    document.title = `${projectName} backlog review`;
    const reportLead = document.querySelector("#reportLead");
    if (report.projectLead) {
      reportLead.textContent = report.projectLead.sentences.map((sentence) => sentence.text).join(" ");
    } else {
      reportLead.hidden = true;
    }
    const projectLink = document.querySelector("#projectLink");
    projectLink.textContent = projectName;
    projectLink.href = fileHref("");
    projectLink.target = "_blank";
    projectLink.rel = "noopener";
    document.querySelector("#reportDate").textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(report.generatedAt));
    document.querySelector("#projectFooterLink").href = fileHref("");
    document.querySelector("#recordsFound").textContent = report.tallies.workRecordsFound;
    document.querySelector("#recordsInScope").textContent = report.tallies.workRecordsStillInScope;
    document.querySelector("#historicalRecords").textContent = report.tallies.historicalRecords;
    document.querySelector("#archivedRecords").textContent = report.tallies.archivedRecords;
    const reviewTabs = document.querySelector("#reviewTabs");
    const narrowReview = window.matchMedia("(max-width: 760px)");
    const reviewSections = [
      { name: "attention", tab: document.querySelector("#attentionSectionTab"), panel: document.querySelector("#attentionBlock"), available: report.attentionFindings.length > 0 },
      { name: "next", tab: document.querySelector("#nextSectionTab"), panel: document.querySelector("#orderBlock"), available: report.recommendationOrder.length > 0 },
      { name: "backlog", tab: document.querySelector("#backlogSectionTab"), panel: document.querySelector("#backlogSection"), available: true },
    ];
    let activeReviewSection = reviewSections.find((section) => section.available).name;
    let reviewPrinting = false;
    function updateReviewSections() {
      const mobile = narrowReview.matches && !reviewPrinting;
      reviewTabs.hidden = !mobile;
      reviewSections.forEach((section) => {
        const selected = section.name === activeReviewSection;
        section.tab.hidden = !section.available;
        section.tab.setAttribute("aria-selected", String(selected));
        section.tab.tabIndex = selected ? 0 : -1;
        section.panel.dataset.available = String(section.available);
        section.panel.hidden = !section.available || mobile && !selected;
        if (mobile && section.available) {
          section.panel.setAttribute("role", "tabpanel");
          section.panel.setAttribute("aria-labelledby", section.tab.id);
          section.panel.tabIndex = 0;
        } else {
          section.panel.removeAttribute("role");
          section.panel.removeAttribute("aria-labelledby");
          section.panel.removeAttribute("tabindex");
          if (section.name === "backlog") section.panel.setAttribute("aria-labelledby", "ledgerHeading");
        }
      });
      const rail = document.querySelector("#attentionRail");
      rail.dataset.available = String(reviewSections.slice(0, 2).some((section) => section.available));
      rail.hidden = reviewSections.slice(0, 2).every((section) => section.panel.hidden);
    }
    function selectReviewSection(name, moveFocus = false) {
      const section = reviewSections.find((item) => item.name === name && item.available);
      if (!section) return;
      activeReviewSection = name; updateReviewSections();
      if (moveFocus) section.tab.focus({ preventScroll: true });
    }
    reviewSections.forEach((section) => section.tab.addEventListener("click", () => selectReviewSection(section.name)));
    reviewTabs.addEventListener("keydown", (event) => {
      if (!narrowReview.matches || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const available = reviewSections.filter((section) => section.available);
      const index = available.findIndex((section) => section.tab === document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? available.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + available.length) % available.length;
      selectReviewSection(available[next].name, true);
    });
    narrowReview.addEventListener?.("change", updateReviewSections);
    window.addEventListener("beforeprint", () => { reviewPrinting = true; updateReviewSections(); });
    window.addEventListener("afterprint", () => { reviewPrinting = false; updateReviewSections(); });
    const reportDataView = document.querySelector("#reportDataView");
    let reportDataLoaded = false;
    const dataDialog = document.querySelector("#dataDialog");
    const dataButton = document.querySelector("#openReportData");
    const closeDataButton = document.querySelector("#closeReportData");
    function syncDataDialogState() {
      const open = dataDialog.open;
      dataButton.setAttribute("aria-expanded", String(open));
      hooks.dataChanged?.(open);
    }
    function layoutDataDialog() {
      const viewportHeight = hooks.dataViewportHeight?.() ?? window.innerHeight;
      const height = Math.ceil(.66 * viewportHeight);
      const top = Math.min(Math.max(12, dataButton.getBoundingClientRect().top), Math.max(12, window.innerHeight - height - 12));
      dataDialog.style.top = `${top}px`;
      dataDialog.style.height = `${height}px`;
      dataDialog.style.minHeight = `${height}px`;
    }
    function openDataDialog() {
      layoutDataDialog();
      if (!dataDialog.open) dataDialog.showModal();
      if (!reportDataLoaded) {
        reportDataView.textContent = getNormalizedReportJson();
        reportDataLoaded = true;
      }
      syncDataDialogState();
      dataDialog.scrollIntoView({ block: "start", inline: "nearest", behavior: "instant" });
    }
    function closeDataDialog() {
      if (dataDialog.open) dataDialog.close();
      syncDataDialogState();
    }
    listen(dataButton, "click", openDataDialog);
    listen(closeDataButton, "click", closeDataDialog);
    listen(dataDialog, "cancel", (event) => { event.preventDefault(); closeDataDialog(); });
    listen(dataDialog, "keydown", (event) => {
      if (event.key !== "Tab" || !dataDialog.open) return;
      const controls = [...dataDialog.querySelectorAll("button:not([disabled]), [tabindex='0']")].filter((control) => control.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !dataDialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || !dataDialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus({ preventScroll: true });
      }
    });
    listen(dataDialog, "close", () => {
      syncDataDialogState();
      if (dataButton.isConnected) dataButton.focus({ preventScroll: true });
    });
    window.addEventListener("resize", () => { if (dataDialog.open) { layoutDataDialog(); syncDataDialogState(); } });

    const searchInput = document.querySelector("#search");
    const clearSearch = document.querySelector("#clearSearch");
    function updateSearchClear() {
      clearSearch.hidden = searchInput.value.length === 0;
    }
    function focusBacklogRecord(record) {
      if (!record || !reportByPath.has(record.recordPath)) return;
      closeDataDialog();
      selectReviewSection("backlog");
      setActiveFilter("all");
      focusedRecordPath = record.recordPath;
      searchInput.value = recordName(record);
      updateSearchClear();
      renderWaves();
      requestAnimationFrame(() => {
        const target = [...document.querySelectorAll("#waveList .wave")].find(
          (wave) => wave.dataset.recordPath === record.recordPath,
        );
        const surface = target?.querySelector("[data-disclosure-surface]");
        if (surface) setExpanded(surface, true);
        surface?.focus({ preventScroll: true });
        if (target && window.matchMedia("(max-width: 1080px)").matches) {
          target.scrollIntoView({
            block: "start",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          });
        }
      });
    }

    let dataBeforePrint = false, dataFocusBeforePrint = null;
    window.addEventListener("beforeprint", () => {
      dataBeforePrint = dataDialog.open;
      dataFocusBeforePrint = dataDialog.contains(document.activeElement) ? document.activeElement : null;
      dataDialog.dataset.beforePrint = String(dataBeforePrint);
      closeDataDialog();
    });
    window.addEventListener("afterprint", () => {
      if (dataBeforePrint) {
        openDataDialog();
        if (dataFocusBeforePrint?.isConnected) dataFocusBeforePrint.focus({ preventScroll: true });
      }
      dataBeforePrint = false; dataFocusBeforePrint = null; delete dataDialog.dataset.beforePrint;
    });
    document.querySelector("#downloadReportData").addEventListener("click", () => {
      const blob = new Blob([getNormalizedReportJson()], { type: "application/json;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const download = document.createElement("a");
      const projectSlug = String(projectName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
      download.href = href;
      download.download = `${projectSlug}-backlog-review.json`;
      download.hidden = true;
      dataDialog.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(href), 0);
    });

    renderOrder();
    renderAttention();
    renderFilters();
    renderWaves();
    updateReviewSections();

    document.querySelector("#waveList").addEventListener("click", (event) => {
      const surface = event.target.closest("[data-disclosure-surface]");
      if (!surface || event.target.closest("a, button, input, select, textarea, label") || !window.getSelection().isCollapsed) return;
      setExpanded(surface, surface.getAttribute("aria-expanded") !== "true");
    });
    document.querySelector("#waveList").addEventListener("keydown", (event) => {
      const surface = event.target.closest("[data-disclosure-surface]");
      if (!surface || event.target !== surface || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      setExpanded(surface, surface.getAttribute("aria-expanded") !== "true");
    });
    searchInput.addEventListener("input", () => { focusedRecordPath = null; updateSearchClear(); renderWaves(); });
    clearSearch.addEventListener("click", () => {
      searchInput.value = "";
      focusedRecordPath = null;
      updateSearchClear();
      renderWaves();
      searchInput.focus();
    });
    updateSearchClear();
    document.querySelector("#sortBy").addEventListener("change", () => { updateSortLabel(); renderWaves(); });
    document.querySelector("#sortDirection").addEventListener("click", () => {
      const button = document.querySelector("#sortDirection");
      button.dataset.direction = button.dataset.direction === "asc" ? "desc" : "asc";
      updateSortLabel();
      renderWaves();
    });
    function updateSortLabel() {
      const button = document.querySelector("#sortDirection");
      const ascending = button.dataset.direction === "asc";
      const coordinate = document.querySelector("#sortBy").value === "coordinate";
      const current = coordinate ? (ascending ? "A to Z" : "Z to A") : (ascending ? "Oldest first" : "Newest first");
      const next = coordinate ? (ascending ? "Z to A" : "A to Z") : (ascending ? "Newest first" : "Oldest first");
      button.title = current;
      button.setAttribute("aria-label", `Sort direction: ${current.toLowerCase()}. Change to ${next.toLowerCase()}.`);
    }
    updateSortLabel();
    document.querySelector("#printReport").addEventListener("click", () => window.print());
    const themeButton = document.querySelector("#themeToggle");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const activeTheme = () => document.documentElement.dataset.theme || (systemTheme.matches ? "dark" : "light");
    function updateThemeButton() {
      const dark = activeTheme() === "dark";
      if (hooks.themeChanged) hooks.themeChanged(themeButton, dark);
      else themeButton.textContent = dark ? "Light mode" : "Dark mode";
      themeButton.setAttribute("aria-pressed", String(dark));
    }
    themeButton.addEventListener("click", () => { document.documentElement.dataset.theme = activeTheme() === "dark" ? "light" : "dark"; updateThemeButton(); });
    systemTheme.addEventListener?.("change", updateThemeButton);
    updateThemeButton();

  return () => { disposed = true; cleanups.forEach(cleanup => cleanup()); if (dataDialog.open) dataDialog.close(); frames.forEach(id => nativeWindow.cancelAnimationFrame(id)); };
}
