# Data Modal — Bounded Peer Review

## Scope and result

The result is `satisfied` for the direct Data-modal request in the observed source and fixtures. Root used the CUA in-app browser. This agent reviewed the saved views and root's exact observations. No direct browser CLI was used. This review is separate from owner feedback. It makes no claim about a person's lived ease or confidence.

The final widget is 444,492 bytes. Its SHA-256 is `3bde35c0e2670c211097f6990cf711de2d03d6540cc0fd109d8c42ac4b822117`. The same-data static report is 61,762 bytes with SHA-256 `6ba5cd3f44fa8c517eb243d3521802375794e79a0712c38445b607b768402845`. The [resource proof](data-modal-resource-proof.json) and [built resource proof](data-modal-final-built-resource-proof.json) bind those bytes. The app frame has no test overlay.

## Promises and observations

| Promise | Observation | Conclusion | Limit | Next action |
| --- | --- | --- | --- | --- |
| Data moves from tabs to the toolbar | Mode, Print, Refresh, and Data appear in that order. Each is one SVG with no visible button text. Data is right of Refresh. Tab, tablist, and tabpanel role counts are zero. | Satisfied. | Current generated source. | Use the Data icon for the same report data. |
| Data content keeps its meaning | JSON has zero characters before first opening. Opening yields the exact 19,041-character baseline and the same copy. Static Data matches the same complete two-record input. | Satisfied. | The small complete fixture proves exact content. | Keep the displayed reviewed model as the export source. |
| The modal has at least 66% of the available window height | Window heights 720, 844, and 1314 yield floors 476, 558, and 868. Actual dialog heights meet each floor. An open-modal resize keeps Close focused. At height 1900, a short frame grows from 1051 to 1278 so the 1254-pixel floor fits. | Satisfied. | The mock gives a real maximum and enforces it. | Use honest host container bounds. Use the frame viewport when no usable bound is supplied. |
| The header and exit control stay visible | Final wide, narrow, phone, and retained views show Data and Close. The allocated frame contains the modal. | Satisfied. | One IAB engine and the stated sizes. | Keep the final positioning and sizing checks within this scope. |
| Keyboard users can stay in and leave the modal | Close → Download → JSON → Close stays inside. Shift+Tab returns from Close to JSON. Escape closes and focuses Data. Return on Data opens and focuses Close. Pointer Close also returns to Data. | Satisfied. | A bounded keyboard path was observed. | P7 owns the wider accessibility and host matrix. |
| Download keeps the full displayed model | The hidden host audit observes one anchor inside the active dialog. Its 19,041-byte Blob equals displayed JSON and the parsed model. Local checks add no tool or message call. | Satisfied for emitted JSON. | No OS saved-file event was observed. | Keep saved-file and host download claims separate. |

The normal path is to close Data, then use Refresh. Access to Refresh behind the open modal is not required. It is not a review or acceptance gate.

## Optional compatibility proof

One technical path starts Refresh before opening Data. Its delayed reply supplies exact added R3, changed R1, and removed R2 lists with zero cache hits, two misses, and zero rejected entries. The old JSON stays byte-equal. A later valid Open 2 keeps Data open at 868, focused on Close, with body scroll zero. New JSON has 17,877 characters and R1 plus R3. This proves bounded asynchronous arrival compatibility. It does not add a user control, a reason to access Refresh behind the modal, or a new user gate. The host mocks the facts and replacement. Nonzero scroll has source test evidence.

The clean handoff view is [narrow](live-narrow-final.jpg). The [phone](live-phone-final.jpg) view keeps the same content within the body. The [wide](live-wide-final.jpg) view retains a slight body scroll. It does not prove that the body is reset to its first heading. The [retained report](live-retained-final.jpg) is the complete 73-record Oct 4 example. It proves finite toolbar and modal placement. Its 6,999,540-character JSON length was read as one number. Its full JSON and large accessibility tree were not read.

The host uses the standard `containerDimensions` field and ordinary `host-context-changed` notification. The [official type](https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/src/spec.types.ts) defines fixed height or maximum height. It does not define a parent viewport field. The mock's maximum is the actual visible parent viewport. The mock caps its frame at that maximum. The app uses no parent DOM access or forced full screen.

## Findings, repairs, and limits

The first fixed-top modal hid its header under parent scroll. Its keyboard path also left the modal. The scoped focus loop fixed the keyboard gap. Native scrollIntoView did not fix the observed outer-view gap. Button-based positioning and the final honest height bound resolved the visible gap. The owner then changed the height target from the prior 560-pixel view to a minimum of 66% of the window. The final measurements prove the new target. Interim images remain outside the checkout.

The retained browser log contains one unassigned `MutationObserver.observe` non-Node error. It has no URL or stack. The [narrow attribution check](observer-attribution-limit.json) found zero MutationObserver literals in the served widget, host script, and parent HTML. Functional proof passed. This establishes no canonical source defect and no empty-log claim. Early control timing, a short wait before the owned 3.7-second replacement delay, and a coordinate miss after body scroll were test setup limits. Fresh controls and semantic clicks passed.

The [source packet](data-modal-final-technical-packet.json) records 137 passing focused checks plus type, build, asset, and whitespace checks. The [browser result](data-modal-browser-result.json) records exact geometry and state. Source/cache failure mappings and the existing agent request boundary retain their earlier focused evidence. This supplement does not repeat the full P6 suite or bind old P6 and layout claims to the new asset hash.

No real agent message, task, Store operation, installation, or host setting change occurs. No production-host, broad accessibility, saved-file, or performance outcome is claimed. The useful next action is to use the final source review and keep later P7 claims within their own evidence. The temporary static server is stopped. The source and prior approved preview remain available.
