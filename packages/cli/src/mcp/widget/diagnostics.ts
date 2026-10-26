/** A bounded local trace. Report text and host error messages never enter it. */
export type WidgetDiagnosticEvent = {
  event: string;
  facts?: Record<string, boolean | number | string | readonly string[]>;
};
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const knownErrors = new Map([
  ["No tool result.", "no-tool-result"], ["The host reported a failed tool result.", "tool-result-failed"],
  ["No client report.", "no-client-report"],
  ["Invalid serialized tool result.", "serialized-result-invalid"],
  ["Serialized tool result exceeds its decode limit.", "serialized-result-limit"],
  ["Ambiguous client report transport.", "encoded-result-ambiguous"],
  ["Invalid encoded client report.", "encoded-result-invalid"],
  ["Client report decompression is unavailable.", "decompression-unavailable"],
  ["Encoded client report exceeds its decode limit.", "encoded-result-limit"],
  ["Encoded client report identity differs.", "encoded-result-identity"],
  ["This host cannot validate report identity. Continue the review in chat.", "web-crypto-unavailable"],
  ["Report identity validation exceeded its bounded replay count.", "hash-replay-limit"],
]);
export function widgetProtocolVersion(value: unknown): string {
  return typeof value === "string" && value.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "invalid";
}
export function widgetErrorFacts(error: unknown): WidgetDiagnosticEvent["facts"] {
  if (object(error) && Array.isArray(error.issues)) {
    const codes = error.issues.flatMap(issue => object(issue) && typeof issue.code === "string"
      && /^[a-z_]{1,40}$/.test(issue.code) ? [issue.code] : []).slice(0, 8);
    return { reason: "schema-rejected", issueCount: error.issues.length, codes };
  }
  return { reason: error instanceof Error ? knownErrors.get(error.message) ?? "exception" : "exception" };
}
export function widgetResultFacts(input: unknown): WidgetDiagnosticEvent["facts"] {
  const raw = object(input) ? input : {};
  const meta = object(raw._meta) ? raw._meta : {};
  const backlog = object(meta.backlog) ? meta.backlog : {};
  const envelope = object(backlog.envelope) ? backlog.envelope : {};
  const report = object(envelope.report) ? envelope.report : {};
  const snapshot = object(report.snapshot) ? report.snapshot : {};
  let resultBytes = -1, reportBytes = -1;
  try { resultBytes = new TextEncoder().encode(JSON.stringify(input)).byteLength; } catch { /* No source value is retained. */ }
  try { if (object(envelope.report)) reportBytes = new TextEncoder().encode(JSON.stringify(envelope.report)).byteLength; } catch { /* No source value is retained. */ }
  const type = (value: unknown) => value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  const wrapperFields = ["result", "toolResult", "toolOutput", "output", "data", "toolResponseMetadata", "call_tool_result", "mcp_tool_result"];
  const fields = ["content", "structuredContent", "_meta", ...wrapperFields, "arguments", "status"];
  const shape = (value: unknown) => object(value) ? `object:${fields.filter(field => field in value).join(",")}` : type(value);
  const nestedShapes = wrapperFields.filter(field => field in raw).flatMap(field => {
    const value = raw[field];
    return [`${field}:${shape(value)}`, ...object(value) ? wrapperFields.filter(nested => nested in value)
      .map(nested => `${field}.${nested}:${shape(value[nested])}`) : []];
  }).slice(0, 16);
  const blocks = Array.isArray(raw.content) ? raw.content : [];
  const contentKinds = blocks.slice(0, 8).map(block => object(block) && ["text", "image", "audio", "resource", "resource_link"].includes(block.type as string)
    ? block.type as string : "unknown");
  const textShapes: string[] = [];
  let textBytes = 0;
  for (const block of blocks.slice(0, 2)) {
    if (!object(block) || block.type !== "text" || typeof block.text !== "string") continue;
    const bytes = new TextEncoder().encode(block.text).byteLength; textBytes += bytes;
    if (bytes > 8_000_000) { textShapes.push("inspection-limit"); continue; }
    try { textShapes.push(shape(JSON.parse(block.text))); } catch { textShapes.push("not-json"); }
  }
  return { inputType: type(input), knownFields: fields.filter(field => field in raw), keyCount: Object.keys(raw).length,
    nestedShapes, contentBlockCount: blocks.length, contentKinds, inspectedTextBytes: textBytes, textShapes,
    hasMeta: object(raw._meta), hasBacklog: object(meta.backlog), hasEncodedBacklog: object(meta.backlogEncoded), hasReport: object(envelope.report),
    hasStructuredContent: object(raw.structuredContent), isError: raw.isError === true, resultBytes, reportBytes,
    records: Array.isArray(report.records) ? report.records.length : 0,
    sourceRecords: Array.isArray(snapshot.records) ? snapshot.records.length : 0 };
}
export function createWidgetDiagnostics(limit = 32) {
  const capacity = Math.max(1, Math.min(64, Math.floor(limit) || 32));
  const entries: (WidgetDiagnosticEvent & { sequence: number })[] = [];
  let sequence = 0;
  return {
    record(event: WidgetDiagnosticEvent) {
      entries.push({ sequence: ++sequence, event: event.event, ...(event.facts ? { facts: structuredClone(event.facts) } : {}) });
      if (entries.length > capacity) entries.shift();
    },
    snapshot: () => structuredClone(entries),
  };
}
