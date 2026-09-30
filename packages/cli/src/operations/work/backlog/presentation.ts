import { z } from "zod";
import {
  BacklogProjectSchema, BacklogReportTalliesSchema, BacklogReportV1Schema,
  WaveStatusSchema, WorkScopeSchema,
  type BacklogReportV1, type ReportClaim, type WorkPhaseFact,
} from "./schemas.js";
import {
  BacklogLiveActionSchema, BacklogLiveEnvelopeV1Schema, createBacklogLiveEnvelope,
  type BacklogLiveEnvelopeV1,
} from "./live-contracts.js";

const modelLimit = 5;
const copyLimit = 600;
const text = z.string();
const phaseState = z.enum(["complete", "open", "blocked", "conflict", "superseded", "unknown"]);

export const BacklogDisplayV1Schema = z.strictObject({
  schemaVersion: z.literal(1),
  projectName: text,
  records: z.array(z.strictObject({
    recordPath: text,
    coordinate: text,
    title: text,
    summary: text,
    sourcePath: text,
    phases: z.array(z.strictObject({ phasePath: text, label: text, state: phaseState })),
  })),
});
export type BacklogDisplayV1 = z.infer<typeof BacklogDisplayV1Schema>;

const modelClaim = z.discriminatedUnion("class", [
  z.strictObject({ class: z.literal("fact"), text: text.max(copyLimit), truncated: z.boolean() }),
  z.strictObject({
    class: z.literal("inference"), text: text.max(copyLimit), confidence: z.enum(["low", "medium", "high"]),
    limits: z.array(text.max(copyLimit)).max(3), truncated: z.boolean(),
  }),
  z.strictObject({
    class: z.literal("recommendation"), text: text.max(copyLimit), rationale: text.max(copyLimit),
    limits: z.array(text.max(copyLimit)).max(3), truncated: z.boolean(),
  }),
]);
const modelRecord = z.strictObject({
  recordPath: text,
  coordinate: text,
  title: text.max(copyLimit),
  scope: WorkScopeSchema,
  waveStatus: WaveStatusSchema.nullable(),
  statusReason: text.max(copyLimit),
  truncated: z.boolean(),
});
const coverageCount = z.strictObject({ total: z.number().int().nonnegative(), included: z.number().int().nonnegative().max(modelLimit) });
export const BacklogModelSummaryV1Schema = z.strictObject({
  schemaVersion: z.literal(1),
  sourceSchemaVersion: z.literal(1),
  project: BacklogProjectSchema.omit({ name: true }),
  projectName: text.max(copyLimit),
  projectNameTruncated: z.boolean(),
  tallies: BacklogReportTalliesSchema,
  currentRecords: z.array(modelRecord).max(modelLimit),
  attentionFindings: z.array(z.strictObject({ id: text, recordPath: text.nullable(), claim: modelClaim })).max(modelLimit),
  recommendationOrder: z.array(z.strictObject({ rank: z.number().int().positive(), recordPath: text, claim: modelClaim })).max(modelLimit),
  coverage: z.strictObject({ currentRecords: coverageCount, attentionFindings: coverageCount, recommendationOrder: coverageCount }),
  omitted: z.strictObject({ currentRecords: z.number().int().nonnegative(), attentionFindings: z.number().int().nonnegative(), recommendationOrder: z.number().int().nonnegative() }),
  detail: z.literal("The full client report preserves every record, claim, limit, diagnostic, and source fact."),
});
export type BacklogModelSummaryV1 = z.infer<typeof BacklogModelSummaryV1Schema>;

function phaseDisplayState(phase: WorkPhaseFact): z.infer<typeof phaseState> {
  const status = String(phase.recordedStatus.value ?? "").toLowerCase();
  if (/supersed|defer|pause/.test(status)) return "superseded";
  if (/conflict/.test(status)) return "conflict";
  if (/block/.test(status)) return "blocked";
  if (/complete|closed|done/.test(status)) return "complete";
  if (phase.tasks.length && phase.tasks.every(task => task.completed.value === true)) return "complete";
  if (phase.tasks.some(task => task.completed.value === false)) return "open";
  return "unknown";
}

function titleFromPath(recordPath: string): string {
  const slug = (recordPath.split("/").filter(Boolean).at(-1) ?? "")
    .replace(/^\d{4}-\d{2}-\d{2}-/i, "").replace(/^w\d+-r\d+-/i, "");
  const smallWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "via"]);
  return slug.split("-").filter(Boolean).map((part, index) => {
    const lower = part.toLowerCase();
    return index > 0 && smallWords.has(lower) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(" ");
}

function displayFor(report: BacklogReportV1): BacklogDisplayV1 {
  const sourceByPath = new Map(report.snapshot.records.map(record => [record.recordPath, record]));
  return {
    schemaVersion: 1,
    projectName: report.project.name || report.project.id || report.targetRoot.split(/[\\/]/).filter(Boolean).at(-1) || "Project",
    records: report.records.map(record => {
      const source = sourceByPath.get(record.recordPath)!;
      const coordinate = source.coordinate.value || record.recordPath.match(/w\d+-r\d+/i)?.[0]?.replace(/-/g, " ").toUpperCase() || record.recordPath;
      const escapedCoordinate = coordinate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const title = (source.title.value ?? "").trim().replace(new RegExp(`^${escapedCoordinate}\\s+`, "i"), "")
        .replace(/\s+(?:Work Backlog|Work)$/i, "").trim();
      const indexPath = `${record.recordPath.replace(/\/$/, "")}/00-index.md`;
      return {
        recordPath: record.recordPath, coordinate,
        title: title || titleFromPath(record.recordPath) || "Unsupported work record",
        summary: record.inferences[0]?.text || record.facts[0]?.text || record.statusReason,
        sourcePath: source.discoveredFiles.includes(indexPath) ? indexPath : record.recordPath,
        phases: source.phases.map((phase, index) => ({
          phasePath: phase.phasePath,
          label: phase.coordinate.value || phase.title.value || `Phase ${index + 1}`,
          state: phaseDisplayState(phase),
        })),
      };
    }),
  };
}

function compactClaim(claim: ReportClaim): z.infer<typeof modelClaim> {
  const base = { text: claim.text.slice(0, copyLimit), truncated: claim.text.length > copyLimit };
  if (claim.class === "fact") return { class: "fact", ...base };
  const limits = claim.limits.slice(0, 3).map(limit => limit.slice(0, copyLimit));
  const truncated = base.truncated || claim.limits.length > 3 || claim.limits.some(limit => limit.length > copyLimit);
  if (claim.class === "inference") return { class: "inference", ...base, confidence: claim.confidence, limits, truncated };
  return { class: "recommendation", ...base, rationale: claim.rationale.slice(0, copyLimit), limits,
    truncated: truncated || claim.rationale.length > copyLimit };
}

function summaryFor(report: BacklogReportV1, display: BacklogDisplayV1): BacklogModelSummaryV1 {
  const displayByPath = new Map(display.records.map(record => [record.recordPath, record]));
  const current = report.records.filter(record => record.scope === "live" && record.waveStatus === "current");
  return BacklogModelSummaryV1Schema.parse({
    schemaVersion: 1, sourceSchemaVersion: 1,
    project: { id: report.project.id, manifestPath: report.project.manifestPath },
    projectName: display.projectName.slice(0, copyLimit), projectNameTruncated: display.projectName.length > copyLimit,
    tallies: report.tallies,
    currentRecords: current.slice(0, modelLimit).map(record => {
      const title = displayByPath.get(record.recordPath)!.title;
      return { recordPath: record.recordPath, coordinate: displayByPath.get(record.recordPath)!.coordinate,
        title: title.slice(0, copyLimit), scope: record.scope, waveStatus: record.waveStatus,
        statusReason: record.statusReason.slice(0, copyLimit), truncated: title.length > copyLimit || record.statusReason.length > copyLimit };
    }),
    attentionFindings: report.attentionFindings.slice(0, modelLimit).map(finding => ({
      id: finding.id, recordPath: finding.recordPath, claim: compactClaim(finding.claim),
    })),
    recommendationOrder: report.recommendationOrder.slice(0, modelLimit).map(item => ({
      rank: item.rank, recordPath: item.recordPath, claim: compactClaim(item.claim),
    })),
    coverage: { currentRecords: { total: current.length, included: Math.min(current.length, modelLimit) },
      attentionFindings: { total: report.attentionFindings.length, included: Math.min(report.attentionFindings.length, modelLimit) },
      recommendationOrder: { total: report.recommendationOrder.length, included: Math.min(report.recommendationOrder.length, modelLimit) } },
    omitted: { currentRecords: Math.max(0, current.length - modelLimit), attentionFindings: Math.max(0, report.attentionFindings.length - modelLimit), recommendationOrder: Math.max(0, report.recommendationOrder.length - modelLimit) },
    detail: "The full client report preserves every record, claim, limit, diagnostic, and source fact.",
  });
}

/** Parse the authoritative V1 once. Display data cannot add report conclusions. */
export function createBacklogPresentation(reportInput: unknown) {
  const report = BacklogReportV1Schema.parse(reportInput);
  const display = displayFor(report);
  return { report, display, model: summaryFor(report, display) };
}

function chatFor(model: BacklogModelSummaryV1): string {
  const lines = [`${model.projectName}: ${model.tallies.workRecordsFound} work records found; ${model.tallies.workRecordsStillInScope} still in scope; ${model.tallies.historicalRecords} historical; ${model.tallies.archivedRecords} archived.`];
  for (const record of model.currentRecords) lines.push(`Current: ${record.coordinate} — ${record.title}. ${record.statusReason}`);
  for (const finding of model.attentionFindings) {
    const claim = finding.claim;
    lines.push(`Attention (${claim.class}${claim.class === "inference" ? `, ${claim.confidence} confidence` : ""}): ${claim.text}`);
    if (claim.class !== "fact") for (const limit of claim.limits) lines.push(`Limit: ${limit}`);
  }
  for (const item of model.recommendationOrder) {
    const claim = item.claim;
    lines.push(`Next ${item.rank} (${claim.class}): ${claim.text}`);
    if (claim.class === "recommendation") lines.push(`Reason: ${claim.rationale}`);
    if (claim.class !== "fact") for (const limit of claim.limits) lines.push(`Limit: ${limit}`);
  }
  if (Object.values(model.omitted).some(count => count > 0)) {
    lines.push(`Summary limits: ${model.omitted.currentRecords} current records, ${model.omitted.attentionFindings} Attention items, and ${model.omitted.recommendationOrder} Next items are omitted. The full report includes them.`);
  }
  if (model.projectNameTruncated || model.currentRecords.some(record => record.truncated) || model.attentionFindings.some(item => item.claim.truncated) || model.recommendationOrder.some(item => item.claim.truncated)) {
    lines.push("Some summary text is shortened. Use the full report for the complete wording.");
  }
  return lines.join("\n");
}

/** A concise chat view of the same validated report, with declared summary limits. */
export function renderBacklogChatSummary(reportInput: unknown): string {
  return chatFor(createBacklogPresentation(reportInput).model);
}

function actionsFor(envelope: BacklogLiveEnvelopeV1) {
  const counts = new Map<string, number>();
  for (const source of envelope.report.snapshot.records) {
    if (source.coordinate.value !== null) counts.set(source.coordinate.value, (counts.get(source.coordinate.value) ?? 0) + 1);
  }
  return envelope.report.snapshot.records.flatMap(source => {
    const coordinate = source.coordinate.value;
    if (coordinate === null || counts.get(coordinate) !== 1) return [];
    return (["review-wave", "request-task"] as const).flatMap(action => {
      const parsed = BacklogLiveActionSchema.safeParse({ schemaVersion: 1, action,
        sessionId: envelope.sessionId, modelId: envelope.modelId, projectKey: envelope.projectKey,
        snapshotId: envelope.snapshotId, recordPath: source.recordPath, coordinate });
      return parsed.success ? [parsed.data] : [];
    });
  });
}

export const BacklogClientPayloadV1Schema = z.strictObject({
  schemaVersion: z.literal(1),
  dataBoundary: z.literal("client-visible-not-secret"),
  envelope: BacklogLiveEnvelopeV1Schema,
  display: BacklogDisplayV1Schema,
  actions: z.array(BacklogLiveActionSchema),
}).superRefine((value, context) => {
  if (JSON.stringify(value.display) !== JSON.stringify(displayFor(value.envelope.report)) ||
      JSON.stringify(value.actions) !== JSON.stringify(actionsFor(value.envelope))) {
    context.addIssue({ code: "custom", message: "Client display and action data must derive from the validated envelope." });
  }
});
export type BacklogClientPayloadV1 = z.infer<typeof BacklogClientPayloadV1Schema>;

export const BacklogLivePayloadV1Schema = z.strictObject({
  content: z.tuple([z.strictObject({ type: z.literal("text"), text })]),
  structuredContent: BacklogModelSummaryV1Schema,
  _meta: z.strictObject({ backlog: BacklogClientPayloadV1Schema }),
}).superRefine((value, context) => {
  const { envelope, display } = value._meta.backlog;
  if (JSON.stringify(value.structuredContent) !== JSON.stringify(summaryFor(envelope.report, display))) {
    context.addIssue({ code: "custom", message: "Model-visible data must agree with the complete client report." });
  }
  if (value.content[0].text !== chatFor(value.structuredContent)) {
    context.addIssue({ code: "custom", message: "Chat narration must agree with the concise report summary." });
  }
});
export type BacklogLivePayloadV1 = z.infer<typeof BacklogLivePayloadV1Schema>;

/** A data result for future live tools. This does not write a file, call a tool, or grant permission. */
export function createBacklogLivePayload(reportInput: unknown, sessionId: string): BacklogLivePayloadV1 {
  const envelope = createBacklogLiveEnvelope(reportInput, sessionId);
  const display = displayFor(envelope.report);
  const model = summaryFor(envelope.report, display);
  return BacklogLivePayloadV1Schema.parse({
    content: [{ type: "text", text: chatFor(model) }],
    structuredContent: model,
    _meta: { backlog: { schemaVersion: 1, dataBoundary: "client-visible-not-secret", envelope, display, actions: actionsFor(envelope) } },
  });
}

/** Preserve JSON values while keeping project text out of HTML markup and executable code. */
export function serializeBacklogHtmlData(value: unknown): string {
  return JSON.stringify(value).replaceAll("&", "\\u0026").replaceAll("<", "\\u003c").replaceAll(">", "\\u003e")
    .replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
}

/** The caller owns output selection and file creation. Data/download stays exactly the V1 report. */
export function renderBacklogStaticHtml(reportInput: unknown, template: string): string {
  const { report, display } = createBacklogPresentation(reportInput);
  const slots = {
    __MAKE_DOCS_BACKLOG_REPORT_DATA__: report,
    __MAKE_DOCS_BACKLOG_PRESENTATION_DATA__: display,
  };
  for (const slot of Object.keys(slots)) {
    if (template.split(slot).length !== 2) throw new Error("The bundled report template has an invalid data slot.");
  }
  return template.replace(/__MAKE_DOCS_BACKLOG_(?:REPORT|PRESENTATION)_DATA__/g,
    slot => serializeBacklogHtmlData(slots[slot as keyof typeof slots]));
}
