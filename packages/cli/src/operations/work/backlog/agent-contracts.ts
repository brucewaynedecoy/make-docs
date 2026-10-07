import { z } from "zod";
import { BacklogLiveActionSchema, BacklogLiveEnvelopeV1Schema, backlogSnapshotId, backlogProjectKey,
  createBacklogLiveEnvelope, resolveBacklogLiveAction, type BacklogLiveAction } from "./live-contracts.js";
import { BacklogReportV1Schema, BacklogSnapshotV1Schema } from "./schemas.js";
import { BacklogLivePayloadV1Schema, createBacklogLivePayload } from "./presentation.js";

export { resolveBacklogLiveAction } from "./live-contracts.js";
export const BACKLOG_ACTION_MESSAGE_PREFIX = "Make Docs backlog action v1\n";
export const BacklogActionMessageSchema = z.strictObject({ role: z.literal("user"),
  content: z.tuple([z.strictObject({ type: z.literal("text"), text: z.string() })]) });

/** Only fixed action fields enter this message. Titles, claims, and instructions do not. */
export function createBacklogActionMessage(actionInput: unknown) {
  const action = BacklogLiveActionSchema.parse(actionInput);
  return BacklogActionMessageSchema.parse({ role: "user", content: [{ type: "text",
    text: BACKLOG_ACTION_MESSAGE_PREFIX + JSON.stringify(action) }] });
}
export function parseBacklogActionMessage(messageInput: unknown): BacklogLiveAction {
  const message = BacklogActionMessageSchema.parse(messageInput);
  const text = message.content[0].text;
  if (!text.startsWith(BACKLOG_ACTION_MESSAGE_PREFIX)) throw new Error("Use the fixed backlog action message.");
  return BacklogLiveActionSchema.parse(JSON.parse(text.slice(BACKLOG_ACTION_MESSAGE_PREFIX.length)));
}

/** Context must come from the agent's own successful open input, never from the received action. */
export function resolveBacklogAgentMessage(messageInput: unknown, authoritativeEnvelope: unknown, currentSnapshot: unknown) {
  if (authoritativeEnvelope == null) return { state: "rejected" as const, reason: "missing-open-context" as const };
  let action;
  try { action = parseBacklogActionMessage(messageInput); }
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

/** A plan only. The existing operation and caller's write gate still admit any real cache write. */
export function prepareBacklogAgentCacheWrite(reportInput: unknown, latestSnapshotInput: unknown) {
  const report = validateBacklogRebuiltModel(reportInput, latestSnapshotInput);
  if (report.records.length === 0) return null;
  return { operation: "work.backlog-cache.write" as const,
    input: { targetRoot: report.targetRoot, snapshot: BacklogSnapshotV1Schema.parse(latestSnapshotInput), records: report.records } };
}

/** Agent-only optional workflow. UI controllers do not import or call this write callback. */
export async function attemptBacklogAgentCacheWrite(reportInput: unknown, latestSnapshotInput: unknown,
  callExistingWrite: (input: NonNullable<ReturnType<typeof prepareBacklogAgentCacheWrite>>["input"]) => Promise<unknown>) {
  const report = validateBacklogRebuiltModel(reportInput, latestSnapshotInput);
  const plan = prepareBacklogAgentCacheWrite(report, latestSnapshotInput);
  if (!plan) return { report, cache: { state: "not-needed" as const } };
  try {
    const result = await callExistingWrite(plan.input);
    const failure = result && typeof result === "object" && ((result as { isError?: unknown }).isError === true
      || ("state" in result && ["unavailable", "denied", "unsafe"].includes(String(result.state))));
    return { report, cache: { state: failure ? "unavailable" as const : "attempted" as const, result } };
  }
  catch (error) { return { report, cache: { state: "unavailable" as const, reason: error instanceof Error ? error.message : "cache-write-failed" } }; }
}

const hostCreatedResult = z.strictObject({ state: z.literal("created"), taskId: z.string().min(1) });
/** The adapter must return an actual host creation result. A ui/message receipt cannot satisfy it. */
export async function fulfilBacklogTaskRequest(messageInput: unknown, authoritativeEnvelope: unknown, currentSnapshot: unknown,
  host: { supported: boolean | null | undefined; createTask: (action: Extract<BacklogLiveAction, { action: "review-wave" | "request-task" }>) => Promise<unknown> },
  directTaskIntent: boolean) {
  const resolved = resolveBacklogAgentMessage(messageInput, authoritativeEnvelope, currentSnapshot);
  if (resolved.state !== "resolved") return { state: "not-created" as const, reason: resolved.reason };
  if (resolved.action.action !== "request-task" || !directTaskIntent) return { state: "not-created" as const, reason: "task-intent-required" };
  if (host.supported !== true) return { state: "not-created" as const, reason: "host-task-unavailable" };
  try {
    const result = hostCreatedResult.safeParse(await host.createTask(resolved.action));
    return result.success ? result.data : { state: "not-created" as const, reason: "creation-unconfirmed" };
  } catch { return { state: "not-created" as const, reason: "host-task-failed" }; }
}
