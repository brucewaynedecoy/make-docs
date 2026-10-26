# W25 R0 P6 — Bounded Source Browser Review

## Scope

The owner approved the exact `v1.2-feedback-removed` preview. This review covers the matching actual source controls, refresh/message boundary, preserved report, and affected Data state. Prototype approval is separate from actual-source evidence. No request-result paragraph or new footer words are approved.

Root uses the CUA in-app browser. This agent has no CUA browser surface and reviews root's captures and exact observations. No direct browser CLI is used. Host protocol results are mocked. No actual message, task, or Store write occurs.

## Source identity

The canonical source and built stdio resource are 441,531 bytes with SHA-256 `e4c41748a6418243fcc137013dca7daa77d24f4522832518435348d1c5efc438`. [Built resource proof](built-resource-proof.json) records source parity, URI, MIME type, and CSP. The mock host serves these bytes with no UI overlay.

The [complete small fixture](fixtures-proof.json) has two records. Its valid changed snapshot has one added, one changed, and one removed path. The old reviewed envelope is retained. A validated replacement model is prepared. The separate retained 73-record report is from Oct 4; it is not a fresh snapshot.

## Human Experience Review

Impact is direct. The promise is an honest refresh and a focused request under the person's control. The reviewed surfaces are the top icon controls, wave details, Data, the permanent footer, and the mocked request boundary. The review result is `satisfied` for the exact observed source and fixtures below. It makes no claim about a person's lived ease or confidence.

Root operated the source in the CUA in-app browser. This agent reviewed the paired captures and root's exact state observations. The owner approved the frozen prototype. These are separate forms of evidence.

| Promise | Observation | Conclusion | Limit | Next action |
| --- | --- | --- | --- | --- |
| Local controls stay local | Theme, search, sort, Attention, Next, and disclosure add zero tool calls or messages. | Satisfied in the observed path. | Mock host, current source only. | Reuse unchanged P5 local-control proof. |
| Approved icon controls and silent wave row | Three top buttons have empty text and one SVG each. Names match. Review and New Task remain inside details. No inline paragraph appears. | Satisfied in the observed views. | [Source actions](source-actions.jpg) uses a two-record fixture; [approved removal](approved-wave-no-feedback.jpg) used one record. | Do not claim pixel-identical full content. |
| Controlled requests, no task claim | Review then New Task send two valid fixed actions. Tool calls stay zero; messages are two. Task-created remains false. A duplicate New Task leaves messages at two. | Satisfied for widget request/receipt boundary. | No real agent or task execution. | Use separate agent-helper evidence for current-state/host checks. |
| Unchanged refresh keeps the report | Refresh adds one tool call and no review message. Paths stay the same. | Satisfied in the observed path. | Existing message count was two from prior wave actions. | Record the delta, not an absolute zero. |
| Changed refresh keeps the old model | Fresh changed route produces one tool call, one valid review-backlog message, exact 1/1/1 paths, Needs review, and reviewed JSON byte-equal to before. Wave buttons disable; Refresh remains enabled. | Satisfied in the observed path. | Source facts and the message receipt are mocked. | The active agent must build and send a valid reviewed model. |
| Repeated changed refresh sends no duplicate review | Two refresh calls leave the message count at one. The exact reviewed JSON stays the same. | Satisfied for the observed repeated result. | The fixture returns the same changed snapshot. | Use controller tests for other order and stale-result cases. |
| A valid rebuilt model restores current state | The replacement produces two opens, one tool call, and one valid message. Data changes to R1 plus added R3. The title is `Orbit Notes — changed source`. Ready returns. Data selection, dark mode, search, and coordinate sort stay set. A separate Work path keeps R1 details open. | Satisfied in the observed replacement paths. | The host injects a schema-valid replacement. No agent authors it in this test. | Require a valid envelope before replacing the reviewed model. |
| Source failure preserves a limited prior result | Source-unavailable produces one tool call and no message. The old JSON remains exact. The footer says Last reviewed report — source unavailable. Refresh stays enabled. Wave actions disable. Data reports cache not attempted. | Satisfied in the observed failure path. | This is a typed synthetic source failure. | Retry Refresh after the source is available. Use the active chat if the limit persists. |
| Cache failure does not hide current source facts | The cache-unavailable fixture is changed. It sends one tool call and one review-backlog message. Needs review remains. Exact change lists remain visible. Data says Store not configured and counts unavailable. The old JSON remains exact. | Satisfied for the cache/source distinction. | No real Store is read or written. Typed reason values are facts within the approved template. | Continue the current review. Repair Store access only for optional cache reuse. |
| Failed refresh receipt allows recovery | The bad-refresh route returns `isError: true`. It sends one tool call and no message. The old JSON remains exact. The footer says update failed. Refresh stays enabled and wave actions disable. Data says source unavailable; cache facts remain pending. | Satisfied in this MCP failure path. | This route is a failed MCP receipt, not a malformed-payload browser test. | Retry Refresh. Keep prior content clearly limited until a valid result arrives. |
| A message receipt does not claim task creation | A New Task request with a failed message reply records one valid fixed action and no tool call. Task-created remains false. Ready remains. The button returns to enabled. No inline request text appears. | Satisfied for the approved request boundary. | Silent request feedback is the owner's approved design. It does not confirm agent delivery or a created task. | Confirm delivery and task creation in the active chat. |
| Missing host capabilities disable only the affected request | Missing message support leaves Refresh enabled and wave actions disabled. Missing tool support disables Refresh and leaves wave actions enabled. Both initial paths have zero requests. | Satisfied in the observed capability paths. | These are mocked capability facts. No compatible production host is proved. | Use the active chat for the unsupported action. P7 owns the wider host matrix. |
| The accepted report remains the user's point of reference | The retained 73-record top view has the same lead, date, tallies, Attention, Next, and three directed icons as the approved preview. Tool calls and messages stay zero. No notice is added above the masthead. | Satisfied in the matched top view. | The retained report is from Oct 4. It does not describe current repository facts. | Keep the report meaning and layout when using fresh validated facts. |

[Changed Data](source-changed-data.jpg) separates Added, Changed, and Removed source facts from Last reviewed report data. It shows the synthetic cache counts, including two misses. No request-result text is added. The displayed reviewed JSON stays byte-equal until a valid rebuilt model arrives. Download JSON keeps that reviewed-report boundary. The download boundary also has source test evidence; it was not repeated as a new browser download test.

The exact change lists are:

- Added: `docs/work/2042-06-03-w1-r3-added`.
- Changed: `docs/work/2042-06-01-w1-r1-orbit-notes`.
- Removed: `docs/work/2042-06-02-w1-r2-removable`.

The failure views retain Facts, Inference, and Recommended action. Compare [source unavailable](source-unavailable.jpg) with [message failed](source-message-failed.jpg). The former disables wave requests. The latter restores the request buttons. Both keep report content. Neither adds a request-result paragraph.

## Visual comparison

The [accepted top](approved-top.jpg) and [retained source top](source-retained-top.jpg) were opened together in one comparison input. Both are 742 × 1314, dark mode, the same Oct 4 report, and the same top scroll position. The title, lead, project link, date, tallies, Attention, Next, and icon group match. No visible layout drift was found in this view.

The [source actions](source-actions.jpg) and [approved removal](approved-wave-no-feedback.jpg) were also opened together. The intended icons and silent request row match. Their full content differs because the source fixture has two records and the accepted small preview has one. That data difference is not a UI change.

The [small source top](source-top.jpg) uses 1280 × 720. The file named [source narrow](source-narrow.jpg) uses 742 × 1314. Its name does not prove a 390-pixel mobile view. P5's unchanged layout proof remains separate. No new broad screen-size or accessibility claim is made.

## Evidence limits and recovery

The browser observations cover the current built widget in one mock host. The host provides standard initialize, tools/call, and ui/message replies. The test does not send a real agent message, create a task, read or write Store, or change a host setting. Task-created stays false by design. A message receipt is not task confirmation.

Source tests cover timeout, late reply, duplicate, cancel, teardown, invalid result, and stale identity boundaries. This bounded browser review does not repeat all those waits. The [final validation packet](final-validation-packet.json) records 304 unique selected passing cases plus type, build, asset, guide, and whitespace checks. Its browser-proof field was captured before this review and still says pending. This review records the later browser result separately. The [final built resource packet](final-built-resource-proof.json) binds the exact source bytes, MCP App MIME, CSP, and tool metadata.

The existing large-report Data inspection limit was not repeated as a performance test. The complete small fixture proves the changed Data view. The retained large fixture proves the finite top layout only. Current-route browser warning and error logs were empty. An early wait for the wrong cache-unavailable outcome was corrected after checking fixture facts. It was a test setup error. Initial supported-case controls can be disabled until initialize finishes. The browser proof waited for enabled Refresh before interaction. No product fault was found from those waits.

P7 owns installed/source parity, the wider compatible-host and fallback checks, the full accessibility and Store matrix, and any required performance work. P6 does not claim those outcomes. Durable task activity is outside W25. Root owns phase closeout and any later staging or commit authority.

## Result and next action

Human Experience Review is `satisfied` for the owner-approved UI and the observed current source/fixture behavior. No unresolved material visible defect remains in this scope. The owner approved the prototype's exact words, placement, and behavior. The agent review confirms the actual source within the evidence limits. It does not expand that approval or prove production-host support.

The useful next action is to reconcile P6 task and acceptance evidence with this bounded source proof. The accepted preview stays frozen. No further browser matrix is needed for this P6 decision.
