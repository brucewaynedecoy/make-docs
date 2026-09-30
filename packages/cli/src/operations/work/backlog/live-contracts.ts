import { createHash } from "node:crypto";
import { z } from "zod";

import {
  BacklogReportV1Schema,
  BacklogSnapshotV1Schema,
  type BacklogReportV1,
  type BacklogSnapshotV1,
} from "./schemas.js";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const sessionId = z.string().uuid();
const coordinate = z.string().regex(/^W[1-9]\d* R(?:0|[1-9]\d*)$/);
const recordPath = z.string().min(1).refine(
  (value) => !value.startsWith("/") && !value.includes("\\") &&
    !/^[a-z]:/i.test(value) && !/[\u0000-\u001f\u007f]/.test(value) &&
    value.split("/").every((part) => part !== "" && part !== "." && part !== ".."),
  "Use one exact repository-relative record path.",
);
const paths = z.array(recordPath);
const requiredCapabilities = ["appResource", "toolCalls", "agentMessages"] as const;
const capabilityFact = z.boolean().nullable().optional();

/** Facts must come from the host adapter. A project name is not a capability. */
export const BacklogHostCapabilitiesSchema = z.object({
  appResource: capabilityFact,
  toolCalls: capabilityFact,
  agentMessages: capabilityFact,
  separateTasks: capabilityFact,
}).strict();

/** staticRequested records direct user intent supplied by the active agent. */
export const BacklogDeliveryRequestSchema = z.object({
  staticRequested: z.boolean(),
  capabilities: BacklogHostCapabilitiesSchema.default({}),
}).strict();

export const BacklogDeliveryResultSchema = z.object({
  schemaVersion: z.literal(1),
  mode: z.enum(["live", "static", "chat-fallback"]),
  missingCapabilities: z.array(z.enum(requiredCapabilities)),
  taskRequestsSupported: z.boolean(),
}).strict().superRefine((value, context) => {
  if (new Set(value.missingCapabilities).size !== value.missingCapabilities.length ||
    (value.mode === "live" && value.missingCapabilities.length !== 0) ||
    (value.mode === "chat-fallback" && value.missingCapabilities.length === 0)) {
    context.addIssue({ code: "custom", message: "Delivery must agree with the required capability facts." });
  }
});

export type BacklogHostCapabilities = z.infer<typeof BacklogHostCapabilitiesSchema>;
export type BacklogDeliveryRequest = z.infer<typeof BacklogDeliveryRequestSchema>;
export type BacklogDeliveryResult = z.infer<typeof BacklogDeliveryResultSchema>;

/** Selects an intended route. It neither delivers a view nor creates a file. */
export function selectBacklogDelivery(input: unknown): BacklogDeliveryResult {
  const request = BacklogDeliveryRequestSchema.parse(input);
  const missingCapabilities = requiredCapabilities.filter((key) => request.capabilities[key] !== true);
  return BacklogDeliveryResultSchema.parse({
    schemaVersion: 1,
    mode: request.staticRequested ? "static" : missingCapabilities.length === 0 ? "live" : "chat-fallback",
    missingCapabilities,
    taskRequestsSupported: request.capabilities.separateTasks === true,
  });
}

// Match the existing cache's canonical object ordering without importing Store code.
function canonicalJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize);
    if (!item || typeof item !== "object") return item;
    return Object.fromEntries(Object.entries(item as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, normalize(child)]));
  };
  return JSON.stringify(normalize(value));
}

function hash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function stableSnapshot(snapshot: BacklogSnapshotV1) {
  const { generatedAt: _generatedAt, ...facts } = snapshot;
  return facts;
}

function projectKeyFor(snapshot: BacklogSnapshotV1): string {
  return hash({ contract: "backlog-project/v1", targetRoot: snapshot.targetRoot, projectId: snapshot.project.id });
}

function snapshotIdFor(snapshot: BacklogSnapshotV1): string {
  return hash({ contract: "backlog-snapshot/v1", facts: stableSnapshot(snapshot) });
}

function modelIdFor(report: BacklogReportV1): string {
  const { generatedAt: _generatedAt, snapshot, ...model } = report;
  return hash({ contract: "backlog-model/v1", model, snapshot: stableSnapshot(snapshot) });
}

export function backlogProjectKey(input: unknown): string {
  return projectKeyFor(BacklogSnapshotV1Schema.parse(input));
}

export function backlogSnapshotId(input: unknown): string {
  return snapshotIdFor(BacklogSnapshotV1Schema.parse(input));
}

export function backlogModelId(input: unknown): string {
  return modelIdFor(BacklogReportV1Schema.parse(input));
}

/** This envelope is separate from V1. Its IDs bind data, not permission. */
export const BacklogLiveEnvelopeV1Schema = z.object({
  schemaVersion: z.literal(1),
  sessionId,
  projectKey: digest,
  snapshotId: digest,
  modelId: digest,
  report: BacklogReportV1Schema,
}).strict().superRefine((value, context) => {
  const expected = {
    projectKey: projectKeyFor(value.report.snapshot),
    snapshotId: snapshotIdFor(value.report.snapshot),
    modelId: modelIdFor(value.report),
  };
  for (const key of ["projectKey", "snapshotId", "modelId"] as const) {
    if (value[key] !== expected[key]) {
      context.addIssue({ code: "custom", path: [key], message: "Identity must match the validated report." });
    }
  }
});

export type BacklogLiveEnvelopeV1 = z.infer<typeof BacklogLiveEnvelopeV1Schema>;

/** The future open handler supplies a fresh UUID; tests can supply a fixed one. */
export function createBacklogLiveEnvelope(reportInput: unknown, suppliedSessionId: string): BacklogLiveEnvelopeV1 {
  const report = BacklogReportV1Schema.parse(reportInput);
  return BacklogLiveEnvelopeV1Schema.parse({
    schemaVersion: 1,
    sessionId: suppliedSessionId,
    projectKey: projectKeyFor(report.snapshot),
    snapshotId: snapshotIdFor(report.snapshot),
    modelId: modelIdFor(report),
    report,
  });
}

const changesShape = { added: paths, changed: paths, removed: paths };
type ChangeLists = { added: string[]; changed: string[]; removed: string[] };

function checkChangeLists(value: ChangeLists, context: z.RefinementCtx): void {
  const all = [...value.added, ...value.changed, ...value.removed];
  if (new Set(all).size !== all.length) {
    context.addIssue({ code: "custom", message: "Change lists must contain unique, disjoint record paths." });
  }
}

const refreshBase = { schemaVersion: z.literal(1), sessionId, modelId: digest, projectKey: digest, previousSnapshotId: digest };
export const BacklogRefreshFailureReasonSchema = z.enum(["source-unavailable", "source-denied", "source-unsafe"]);
export const BacklogRefreshSourceSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("available"), snapshot: BacklogSnapshotV1Schema }).strict(),
  z.object({ state: z.literal("unavailable"), reason: BacklogRefreshFailureReasonSchema }).strict(),
]);

export const BacklogRefreshResultV1Schema = z.discriminatedUnion("state", [
  z.object({ ...refreshBase, ...changesShape, state: z.literal("unchanged"), snapshotId: digest, reviewState: z.literal("current") }).strict(),
  z.object({ ...refreshBase, ...changesShape, state: z.literal("changed"), snapshotId: digest, reviewState: z.literal("needs-review") }).strict(),
  z.object({ ...refreshBase, state: z.literal("unavailable"), snapshotId: z.null(), reviewState: z.literal("last-known"), reason: BacklogRefreshFailureReasonSchema }).strict(),
]).superRefine((value, context) => {
  if (value.state === "unavailable") return;
  checkChangeLists(value, context);
  if (value.state === "unchanged" && (value.snapshotId !== value.previousSnapshotId ||
    value.added.length + value.changed.length + value.removed.length !== 0)) {
    context.addIssue({ code: "custom", message: "An unchanged refresh must preserve identity and have no changed records." });
  }
  if (value.state === "changed" && value.snapshotId === value.previousSnapshotId) {
    context.addIssue({ code: "custom", message: "A changed refresh requires a new snapshot identity." });
  }
});

export type BacklogRefreshResultV1 = z.infer<typeof BacklogRefreshResultV1Schema>;
export type BacklogRefreshSource = z.infer<typeof BacklogRefreshSourceSchema>;
export type BacklogRefreshFailureReason = z.infer<typeof BacklogRefreshFailureReasonSchema>;

function changesBetween(previous: BacklogSnapshotV1, current: BacklogSnapshotV1): ChangeLists {
  const before = new Map(previous.records.map((record) => [record.recordPath, hash(record)]));
  const after = new Map(current.records.map((record) => [record.recordPath, hash(record)]));
  return {
    added: [...after.keys()].filter((key) => !before.has(key)).sort(),
    changed: [...after.keys()].filter((key) => before.has(key) && before.get(key) !== after.get(key)).sort(),
    removed: [...before.keys()].filter((key) => !after.has(key)).sort(),
  };
}

/** Compares supplied facts only. Cache availability cannot change this result. */
export function createBacklogRefreshResult(envelopeInput: unknown, sourceInput: unknown): BacklogRefreshResultV1 {
  const envelope = BacklogLiveEnvelopeV1Schema.parse(envelopeInput);
  const source = BacklogRefreshSourceSchema.parse(sourceInput);
  const base = {
    schemaVersion: 1 as const,
    sessionId: envelope.sessionId,
    modelId: envelope.modelId,
    projectKey: envelope.projectKey,
    previousSnapshotId: envelope.snapshotId,
  };
  if (source.state === "unavailable") {
    return BacklogRefreshResultV1Schema.parse({ ...base, state: "unavailable", snapshotId: null, reviewState: "last-known", reason: source.reason });
  }
  if (projectKeyFor(source.snapshot) !== envelope.projectKey) {
    throw new Error("Refresh facts must belong to the same project. Open a new review for the other project.");
  }
  const snapshotId = snapshotIdFor(source.snapshot);
  const unchanged = snapshotId === envelope.snapshotId;
  return BacklogRefreshResultV1Schema.parse({
    ...base,
    snapshotId,
    state: unchanged ? "unchanged" : "changed",
    reviewState: unchanged ? "current" : "needs-review",
    ...changesBetween(envelope.report.snapshot, source.snapshot),
  });
}

const actionBase = { schemaVersion: z.literal(1), sessionId, modelId: digest, projectKey: digest, snapshotId: digest };
export const BacklogLiveActionSchema = z.discriminatedUnion("action", [
  z.object({ ...actionBase, action: z.enum(["review-wave", "request-task"]), recordPath, coordinate }).strict(),
  z.object({ ...actionBase, ...changesShape, action: z.literal("review-backlog"), previousSnapshotId: digest }).strict(),
]).superRefine((value, context) => {
  if (value.action === "review-backlog") {
    checkChangeLists(value, context);
    if (value.previousSnapshotId === value.snapshotId) {
      context.addIssue({ code: "custom", message: "A refresh review request requires changed source facts." });
    }
  }
});

export type BacklogLiveAction = z.infer<typeof BacklogLiveActionSchema>;
export type BacklogLiveActionRejection =
  | "invalid-action" | "invalid-envelope" | "invalid-snapshot"
  | "stale-session" | "stale-model" | "wrong-project" | "stale-snapshot"
  | "missing-record" | "ambiguous-record" | "coordinate-mismatch" | "refresh-mismatch";
export type BacklogLiveActionResolution =
  | { state: "resolved"; action: BacklogLiveAction }
  | { state: "rejected"; reason: BacklogLiveActionRejection };

/** The active agent supplies current facts and checks user intent before acting. */
export function resolveBacklogLiveAction(
  messageInput: unknown,
  envelopeInput: unknown,
  currentSnapshotInput: unknown,
): BacklogLiveActionResolution {
  const reject = (reason: BacklogLiveActionRejection): BacklogLiveActionResolution => ({ state: "rejected", reason });
  const message = BacklogLiveActionSchema.safeParse(messageInput);
  if (!message.success) return reject("invalid-action");
  const parsedEnvelope = BacklogLiveEnvelopeV1Schema.safeParse(envelopeInput);
  if (!parsedEnvelope.success) return reject("invalid-envelope");
  const parsedSnapshot = BacklogSnapshotV1Schema.safeParse(currentSnapshotInput);
  if (!parsedSnapshot.success) return reject("invalid-snapshot");
  const action = message.data;
  const envelope = parsedEnvelope.data;
  const current = parsedSnapshot.data;
  if (action.sessionId !== envelope.sessionId) return reject("stale-session");
  if (action.modelId !== envelope.modelId) return reject("stale-model");
  if (action.projectKey !== envelope.projectKey || projectKeyFor(current) !== envelope.projectKey) return reject("wrong-project");
  if (action.snapshotId !== snapshotIdFor(current)) return reject("stale-snapshot");

  if (action.action === "review-backlog") {
    const expected = createBacklogRefreshResult(envelope, { state: "available", snapshot: current });
    if (expected.state !== "changed" || action.previousSnapshotId !== expected.previousSnapshotId ||
      ["added", "changed", "removed"].some((key) => {
        const field = key as keyof ChangeLists;
        return canonicalJson([...action[field]].sort()) !== canonicalJson(expected[field]);
      })) return reject("refresh-mismatch");
  } else {
    if (action.snapshotId !== envelope.snapshotId) return reject("stale-snapshot");
    const records = envelope.report.records.filter((record) => record.recordPath === action.recordPath);
    const sources = current.records.filter((record) => record.recordPath === action.recordPath);
    if (records.length === 0 || sources.length === 0) return reject("missing-record");
    if (records.length !== 1 || sources.length !== 1) return reject("ambiguous-record");
    if (sources[0].coordinate.value !== action.coordinate) return reject("coordinate-mismatch");
    if (current.records.filter((record) => record.coordinate.value === action.coordinate).length !== 1) {
      return reject("ambiguous-record");
    }
  }
  return { state: "resolved", action };
}
