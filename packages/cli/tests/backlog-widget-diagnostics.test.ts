import { describe, expect, it } from "vitest";
import { createWidgetDiagnostics, widgetErrorFacts, widgetResultFacts, widgetProtocolVersion } from "../src/mcp/widget/diagnostics";
import { createBacklogLivePayload } from "../src/operations/work/backlog/presentation";
import { createBacklogRequestController } from "../src/mcp/widget/request-controller";
import { PRESENTATION_SESSION_ID, smallPresentationReport } from "./fixtures/backlog-presentation";

describe("bounded widget delivery trace", () => {
  it("records only date-shaped protocol versions", () => {
    expect(widgetProtocolVersion("2026-01-26")).toBe("2026-01-26");
    expect(widgetProtocolVersion("2025-11-21")).toBe("2025-11-21");
    for (const value of [undefined, null, {}, 20260126, "Project text", "2026-01-26 Project text", "2026-01-26\n"])
      expect(widgetProtocolVersion(value)).toBe("invalid");
  });
  it("retains the latest bounded stages and returns detached copies", () => {
    const trace = createWidgetDiagnostics(3);
    for (let i = 0; i < 5; i++) trace.record({ event: "stage", facts: { records: i } });
    const entries = trace.snapshot();
    expect(entries.map(entry => entry.sequence)).toEqual([3, 4, 5]);
    entries[0].facts!.records = 500;
    expect(trace.snapshot()[0].facts!.records).toBe(2);
  });
  it("records counts and UTF-8 sizes without report text", () => {
    const result = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    const facts = widgetResultFacts(result);
    expect(facts).toMatchObject({ hasMeta: true, hasBacklog: true, hasReport: true, hasStructuredContent: true,
      records: result._meta.backlog.envelope.report.records.length, sourceRecords: result._meta.backlog.envelope.report.snapshot.records.length });
    expect(facts!.reportBytes).toBe(new TextEncoder().encode(JSON.stringify(result._meta.backlog.envelope.report)).byteLength);
    expect(JSON.stringify(facts)).not.toContain(smallPresentationReport.project.name);
    expect(widgetResultFacts({ content: [] })).toMatchObject({ hasMeta: false, hasBacklog: false, hasReport: false });
  });
  it("does not retain arbitrary errors, issue paths, or issue text", () => {
    const secret = "Project text must never appear";
    expect(widgetErrorFacts(new Error(secret))).toEqual({ reason: "exception" });
    expect(widgetErrorFacts({ issues: [{ code: "custom", message: secret, path: [secret] }] }))
      .toEqual({ reason: "schema-rejected", issueCount: 1, codes: ["custom"] });
    expect(widgetErrorFacts(new Error("No client report."))).toEqual({ reason: "no-client-report" });
  });
  it("records wrapper and text shapes without retaining unknown keys or text", () => {
    const secret = "Private project title";
    const canonical = { content: [], structuredContent: {}, _meta: { backlog: {} } };
    const wrapped = widgetResultFacts({ result: canonical, [secret]: secret });
    expect(wrapped).toMatchObject({ inputType: "object", knownFields: ["result"], keyCount: 2,
      nestedShapes: ["result:object:content,structuredContent,_meta"] });
    expect(JSON.stringify(wrapped)).not.toContain(secret);
    const textual = widgetResultFacts({ content: [{ type: "text", text: JSON.stringify(canonical) }, { type: secret, text: secret }] });
    expect(textual).toMatchObject({ contentBlockCount: 2, contentKinds: ["text", "unknown"], textShapes: ["object:content,structuredContent,_meta"] });
    expect(JSON.stringify(textual)).not.toContain(secret);
    expect(widgetResultFacts({ toolResponseMetadata: { status: "success", call_tool_result: {}, mcp_tool_result: canonical } }))
      .toMatchObject({ nestedShapes: ["toolResponseMetadata:object:call_tool_result,mcp_tool_result,status",
        "toolResponseMetadata.call_tool_result:object:", "toolResponseMetadata.mcp_tool_result:object:content,structuredContent,_meta"] });
  });
  it("distinguishes valid data from a later renderer exception", async () => {
    const trace = createWidgetDiagnostics();
    let renderCalls = 0;
    const controller = createBacklogRequestController({ send() {}, onDiagnostic: event => trace.record(event),
      onChange() { if (++renderCalls === 1) throw new Error("Private report text"); } });
    expect(await controller.acceptModel(createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID)))
      .toEqual({ state: "rejected", reason: "invalid-model" });
    expect(trace.snapshot().map(entry => entry.event))
      .toEqual(["model-validation-start", "model-validation-passed", "render-failed", "model-accept-failed"]);
    expect(JSON.stringify(trace.snapshot())).not.toContain("Private report text");
    controller.teardown();
  });
  it("a failed optional trace does not change model acceptance", async () => {
    const controller = createBacklogRequestController({ send() {}, onDiagnostic() { throw new Error("Trace blocked"); } });
    expect(await controller.acceptModel(createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID)))
      .toMatchObject({ state: "accepted" });
    controller.teardown();
  });
});
