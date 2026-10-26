import { createHash } from "node:crypto";
import { z } from "zod";
import { BacklogLiveActionSchema, BacklogLiveEnvelopeV1Schema, backlogSnapshotId, backlogProjectKey,
  createBacklogLiveEnvelope, resolveBacklogLiveAction, type BacklogLiveAction } from "./live-contracts.js";
import { BacklogReportRecordV1Schema, BacklogReportV1Schema, BacklogSnapshotV1Schema } from "./schemas.js";
import { BacklogLivePayloadV1Schema, createBacklogLivePayload } from "./presentation.js";
import { BACKLOG_REVIEW_CACHE_SCHEMA_VERSION, BACKLOG_REVIEW_SKILL_VERSION,
  backlogCacheRecordKey, canonicalJson } from "./cache-key.js";
import { BACKLOG_RULE_CATALOG_VERSION } from "./catalog.js";
import type { BacklogCacheLookupResult } from "./cache-service.js";

export { resolveBacklogLiveAction } from "./live-contracts.js";
export const BACKLOG_ACTION_MESSAGE_PREFIX = "Make Docs Backlog Review\n";
export const BacklogActionMessageSchema = z.strictObject({ role: z.literal("user"),
  content: z.array(z.strictObject({ type: z.literal("text"), text: z.string() })).length(1) });

/** A visible reference binds a wave request to the full action held by the agent's own open. */
function waveActionReference(action: BacklogLiveAction): string {
  return createHash("sha256").update(canonicalJson({ contract: "backlog-wave-message/v2", action })).digest("hex").slice(0, 24);
}

/** V1 wire names remain stable: review-wave asks for explanation; request-task asks for work in the connected chat.
 * Only fixed action fields enter this message. Project titles, claims, and instructions do not. */
function backlogActionText(action: BacklogLiveAction): string {
  const lead = action.action === "review-wave"
    ? `Please explain ${action.coordinate} in this project. Read its current source record before you answer. Check that this review still names the right wave. Then explain its goals, status, open work, and the next useful step.`
    : action.action === "request-task"
      ? `Please work on ${action.coordinate} in this project. Read its current source record before you start. Check that this review and its recommended action are still current. Follow my existing approvals and project rules. Tell me what you changed or what approval you need.`
      : "The Backlog Review found changed source facts. Read the current source records before you update the review. Tell me what changed and what needs a new decision.";
  if (action.action !== "review-backlog") {
    return [BACKLOG_ACTION_MESSAGE_PREFIX.trimEnd(), lead, "", `Review reference: ${waveActionReference(action)}`].join("\n");
  }
  const lines = [BACKLOG_ACTION_MESSAGE_PREFIX.trimEnd(), lead, "", "Review reference:", "Action: Review changed backlog"];
  lines.push(`Session: ${action.sessionId}`, `Model: ${action.modelId}`, `Project: ${action.projectKey}`, `Snapshot: ${action.snapshotId}`);
  if (action.action === "review-backlog") {
    lines.push(`Previous snapshot: ${action.previousSnapshotId}`);
    for (const [label, paths] of [["Added", action.added], ["Changed", action.changed], ["Removed", action.removed]] as const) {
      lines.push(`${label} records: ${paths.length}`, ...paths.map(path => `- ${path}`));
    }
  }
  return lines.join("\n");
}

export function createBacklogActionMessage(actionInput: unknown) {
  const action = BacklogLiveActionSchema.parse(actionInput);
  return BacklogActionMessageSchema.parse({ role: "user", content: [{ type: "text",
    text: backlogActionText(action) }] });
}
export function parseBacklogActionMessage(messageInput: unknown, authoritativeEnvelope?: unknown): BacklogLiveAction {
  const message = BacklogActionMessageSchema.parse(messageInput);
  const text = message.content[0].text;
  if (!text.startsWith(BACKLOG_ACTION_MESSAGE_PREFIX)) throw new Error("Use the fixed backlog action message.");
  if (/\nReview reference: [a-f0-9]{24}$/.test(text)) {
    const envelope = BacklogLiveEnvelopeV1Schema.parse(authoritativeEnvelope);
    const matches: BacklogLiveAction[] = [];
    for (const source of envelope.report.snapshot.records) {
      if (source.coordinate.value === null) continue;
      for (const kind of ["review-wave", "request-task"] as const) {
        const candidate = BacklogLiveActionSchema.safeParse({ schemaVersion: 1, action: kind,
          sessionId: envelope.sessionId, modelId: envelope.modelId, projectKey: envelope.projectKey,
          snapshotId: envelope.snapshotId, recordPath: source.recordPath, coordinate: source.coordinate.value });
        if (candidate.success && text === backlogActionText(candidate.data)) matches.push(candidate.data);
      }
    }
    if (matches.length !== 1) throw new Error("Use the fixed backlog action message.");
    return matches[0];
  }
  const lines = text.split("\n");
  let index = 4;
  const read = (label: string): string => {
    const prefix = `${label}: `, line = lines[index++];
    if (!line?.startsWith(prefix)) throw new Error("Use the fixed backlog action message.");
    return line.slice(prefix.length);
  };
  const actionLabel = read("Action");
  const actionKind = actionLabel === "Explain this wave" ? "review-wave"
    : actionLabel === "Work on this wave" ? "request-task"
      : actionLabel === "Review changed backlog" ? "review-backlog" : null;
  if (!actionKind) throw new Error("Use the fixed backlog action message.");
  if (actionKind !== "review-backlog") throw new Error("Use the fixed backlog action message.");
  const base = { schemaVersion: 1, action: actionKind, sessionId: read("Session"), modelId: read("Model"),
    projectKey: read("Project"), snapshotId: read("Snapshot") };
  let input: unknown;
  if (actionKind === "review-backlog") {
    const previousSnapshotId = read("Previous snapshot");
    const paths = (label: string): string[] => {
      const count = Number(read(`${label} records`));
      if (!Number.isSafeInteger(count) || count < 0 || count > 10000) throw new Error("Invalid backlog change count.");
      const result: string[] = [];
      for (let i = 0; i < count; i++) {
        const line = lines[index++];
        if (!line?.startsWith("- ")) throw new Error("Use the fixed backlog action message.");
        result.push(line.slice(2));
      }
      return result;
    };
    input = { ...base, previousSnapshotId, added: paths("Added"), changed: paths("Changed"), removed: paths("Removed") };
  }
  const action = BacklogLiveActionSchema.parse(input);
  if (text !== backlogActionText(action)) throw new Error("Use the fixed backlog action message.");
  return action;
}

/** Context must come from the agent's own successful open input, never from the received action. */
export function resolveBacklogAgentMessage(messageInput: unknown, authoritativeEnvelope: unknown, currentSnapshot: unknown) {
  if (authoritativeEnvelope == null) return { state: "rejected" as const, reason: "missing-open-context" as const };
  let action;
  try { action = parseBacklogActionMessage(messageInput, authoritativeEnvelope); }
  catch { return { state: "rejected" as const, reason: "invalid-action" as const }; }
  return resolveBacklogLiveAction(action, authoritativeEnvelope, currentSnapshot);
}

/** Generates the caller's fresh ID before open, so the agent can retain real session provenance. */
export function prepareBacklogAgentOpen(reportInput: unknown, latestSnapshotInput: unknown,
  createSessionId: () => string = () => globalThis.crypto.randomUUID()) {
  const report = validateBacklogRebuiltModel(reportInput, latestSnapshotInput);
  const sessionId = z.string().uuid().parse(createSessionId());
  const envelope = createBacklogLiveEnvelope(report, sessionId);
  return { state: "prepared" as const, openInput: { report, sessionId }, candidateEnvelope: envelope };
}

/** The caller supplies its actual own tool-call result. Preparation alone does not prove an open succeeded. */
export function confirmBacklogAgentOpen(prepared: ReturnType<typeof prepareBacklogAgentOpen>, actualResult: unknown) {
  if (!actualResult || typeof actualResult !== "object" || Array.isArray(actualResult) || (actualResult as { isError?: unknown }).isError === true) {
    return { state: "rejected" as const, reason: "open-failed" };
  }
  const raw = actualResult as Record<string, unknown>;
  const expected = createBacklogLivePayload(prepared.openInput.report, prepared.openInput.sessionId);
  // A model-facing tool receipt omits client _meta. Its own call arguments hold
  // the generated session, and the unchanged shared handler echoes that ID.
  const meta = raw._meta && typeof raw._meta === "object" && !Array.isArray(raw._meta) ? raw._meta as Record<string, unknown> : null;
  if (raw._meta !== undefined && meta === null) return { state: "rejected" as const, reason: "open-result-mismatch" };
  const parsed = BacklogLivePayloadV1Schema.safeParse({ content: raw.content, structuredContent: raw.structuredContent,
    _meta: { backlog: meta && Object.hasOwn(meta, "backlog") ? meta.backlog : expected._meta.backlog } });
  if (!parsed.success || parsed.data._meta.backlog.envelope.sessionId !== prepared.openInput.sessionId
    || parsed.data._meta.backlog.envelope.modelId !== expected._meta.backlog.envelope.modelId) {
    return { state: "rejected" as const, reason: "open-result-mismatch" };
  }
  return { state: "confirmed" as const, authoritativeEnvelope: expected._meta.backlog.envelope };
}

/** The active agent reads current facts again before calling this gate and live open. */
export function validateBacklogRebuiltModel(reportInput: unknown, latestSnapshotInput: unknown) {
  const report = BacklogReportV1Schema.parse(reportInput);
  const latest = BacklogSnapshotV1Schema.parse(latestSnapshotInput);
  if (backlogProjectKey(report.snapshot) !== backlogProjectKey(latest) || backlogSnapshotId(report.snapshot) !== backlogSnapshotId(latest)) {
    throw new Error("Rebuilt model must match the latest checked source facts.");
  }
  return report;
}

/** A plan only. A successful exact lookup selects only fresh or rejected records. */
export function prepareBacklogAgentCacheWrite(reportInput: unknown, latestSnapshotInput: unknown, lookupInput: unknown) {
  const report = validateBacklogRebuiltModel(reportInput, latestSnapshotInput);
  const snapshot = BacklogSnapshotV1Schema.parse(latestSnapshotInput);
  const lookup = lookupInput as BacklogCacheLookupResult | null;
  if (!lookup || lookup.schemaVersion !== BACKLOG_REVIEW_CACHE_SCHEMA_VERSION || lookup.service?.state !== "available"
    || !Array.isArray(lookup.records) || lookup.records.length !== snapshot.records.length
    || report.records.length !== snapshot.records.length
    || lookup.key?.snapshotSchemaVersion !== snapshot.schemaVersion
    || lookup.key?.ruleCatalogVersion !== BACKLOG_RULE_CATALOG_VERSION
    || lookup.key?.skillVersion !== BACKLOG_REVIEW_SKILL_VERSION) {
    throw new Error("Cache lookup must match the current snapshot and rule versions.");
  }
  const reportByPath = new Map(report.records.map(record => [record.recordPath, record]));
  if (reportByPath.size !== snapshot.records.length) throw new Error("Rebuilt report records must match current source paths.");
  const selected = [] as typeof report.records;
  for (let i = 0; i < snapshot.records.length; i++) {
    const source = snapshot.records[i], row = lookup.records[i];
    const expected = backlogCacheRecordKey(snapshot, source);
    if (!row || Object.entries(expected).some(([key, value]) => row[key as keyof typeof expected] !== value)
      || !["hit", "miss", "rejected"].includes(row.state)) {
      throw new Error("Cache lookup records must match the current snapshot exactly.");
    }
    const fragment = reportByPath.get(source.recordPath);
    if (!fragment) throw new Error("Rebuilt report is missing a current source record.");
    if (row.state === "hit") {
      const parsed = BacklogReportRecordV1Schema.safeParse(row.fragment);
      if (!parsed.success || canonicalJson(parsed.data) !== canonicalJson(fragment)) {
        throw new Error("Exact cache hit does not match the rebuilt report record.");
      }
    } else selected.push(fragment);
  }
  if (lookup.counts?.total !== snapshot.records.length
    || lookup.counts.hits !== lookup.records.filter(row => row.state === "hit").length
    || lookup.counts.misses !== lookup.records.filter(row => row.state === "miss").length
    || lookup.counts.rejected !== lookup.records.filter(row => row.state === "rejected").length) {
    throw new Error("Cache lookup counts do not match its records.");
  }
  if (selected.length === 0) return null;
  return { operation: "work.backlog-cache.write" as const,
    input: { targetRoot: report.targetRoot, snapshot, records: selected } };
}

/** Agent-only optional workflow. UI controllers do not import or call this write callback. */
export async function attemptBacklogAgentCacheWrite(reportInput: unknown, latestSnapshotInput: unknown, lookupInput: unknown,
  callExistingWrite: (input: NonNullable<ReturnType<typeof prepareBacklogAgentCacheWrite>>["input"]) => Promise<unknown>) {
  const report = validateBacklogRebuiltModel(reportInput, latestSnapshotInput);
  let plan;
  try { plan = prepareBacklogAgentCacheWrite(report, latestSnapshotInput, lookupInput); }
  catch { return { report, cache: { state: "unavailable" as const, reason: "cache-lookup-mismatch" } }; }
  if (!plan) return { report, cache: { state: "not-needed" as const } };
  try {
    const result = await callExistingWrite(plan.input);
    const failure = result && typeof result === "object" && ((result as { isError?: unknown }).isError === true
      || ("state" in result && ["unavailable", "denied", "unsafe"].includes(String(result.state))));
    return { report, cache: { state: failure ? "unavailable" as const : "attempted" as const, result } };
  }
  catch (error) { return { report, cache: { state: "unavailable" as const, reason: error instanceof Error ? error.message : "cache-write-failed" } }; }
}
