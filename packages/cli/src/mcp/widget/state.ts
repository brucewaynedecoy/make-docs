import { z } from "zod";
import { BacklogLivePayloadV1Schema, createBacklogLivePayload } from "../../operations/work/backlog/presentation.js";
import { BacklogReviewRefreshPayloadV1Schema, backlogReviewRefreshInputSchema } from "../../operations/work/backlog/review-contracts.js";
import { withBrowserHashes } from "./browser-crypto.js";

export function validateWidgetResult(input: unknown) {
  return withBrowserHashes(() => {
    // Hosts can add transport metadata. Only the canonical backlog value is report data.
    const raw = input as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("No tool result.");
    if (raw.isError === true) throw new Error("The host reported a failed tool result.");
    const meta = raw._meta as Record<string, unknown> | null;
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) throw new Error("No client report.");
    const canonical = { content: raw.content, structuredContent: raw.structuredContent, _meta: { backlog: meta.backlog } };
    const open = BacklogLivePayloadV1Schema.safeParse(canonical);
    if (open.success) return { kind: "open" as const, client: open.data._meta.backlog, refresh: null };
    const refreshed = BacklogReviewRefreshPayloadV1Schema.parse(canonical);
    const { envelope, refresh } = refreshed._meta.backlog;
    return { kind: "refresh" as const, client: createBacklogLivePayload(envelope.report, envelope.sessionId)._meta.backlog, refresh };
  });
}
export type WidgetResult = Awaited<ReturnType<typeof validateWidgetResult>>;
export function validateRefreshInput(input: unknown) {
  return withBrowserHashes(() => backlogReviewRefreshInputSchema.parse(input));
}

/** Display feedback only. Later agent flows can report one of these fixed states. */
export const WidgetFeedbackSchema = z.strictObject({ state: z.enum([
  "idle", "refreshing", "review-requested", "task-requested", "request-unconfirmed",
]) });
export function widgetFeedbackText(input: unknown): string {
  const { state } = WidgetFeedbackSchema.parse(input);
  return {
    idle: "To refresh or request agent work, use the active chat.",
    refreshing: "Current facts are being checked. The last reviewed report remains visible.",
    "review-requested": "A review request was reported. Keep the prior report until a new reviewed result arrives.",
    "task-requested": "A separate-task request was reported. Task creation is not confirmed. Check the active chat.",
    "request-unconfirmed": "The request is not confirmed. Continue in chat. Do not assume that a task was created.",
  }[state];
}
export function renderWidgetFeedback(element: Pick<HTMLElement, "textContent">, input: unknown) {
  element.textContent = widgetFeedbackText(input);
}

/** Local display state only. It changes no report facts, identity, or request authority. */
export interface WidgetStatusFacts {
  hasReport: boolean;
  invalid: boolean;
  bridge: "connecting" | "ready" | "unavailable";
  checking: boolean;
  refresh: "unchanged" | "changed" | "unavailable" | null;
}
export function widgetStatusText(facts: WidgetStatusFacts): string {
  const value = !facts.hasReport ? "Report unavailable"
    : facts.bridge === "unavailable" ? "Last reviewed report — update failed"
      : facts.checking ? "Checking source facts"
        : facts.invalid ? "Last reviewed report — update failed"
          : facts.refresh === "unavailable" ? "Last reviewed report — source unavailable"
            : facts.refresh === "changed" ? "Needs review" : "Ready";
  return `Status: ${value}`;
}
export function renderWidgetStatus(element: Pick<HTMLElement, "textContent">, facts: WidgetStatusFacts) {
  element.textContent = widgetStatusText(facts);
}

export function isRefreshForCurrent(result: WidgetResult, current: WidgetResult | null): boolean {
  if (result.kind === "open" || current === null) return true;
  const left = result.client.envelope, right = current.client.envelope;
  return ["sessionId", "modelId", "projectKey", "snapshotId"].every(key => left[key as keyof typeof left] === right[key as keyof typeof right]);
}
