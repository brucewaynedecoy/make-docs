import { z } from "zod";
import { BacklogLivePayloadV1Schema, createBacklogLivePayload } from "../../operations/work/backlog/presentation.js";
import { BacklogReviewRefreshPayloadV1Schema, backlogReviewRefreshInputSchema } from "../../operations/work/backlog/review-contracts.js";
import { withBrowserHashes } from "./browser-crypto.js";

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const serializedResultLimit = 8_000_000;
const decodedBacklogLimit = 16_000_000;
/** Codex can deliver a CallToolResult as JSON in one text block. Decode only that observed transport shape. */
function decodeSerializedResult(input: unknown): unknown {
  if (!object(input) || Object.keys(input).length !== 1 || !Array.isArray(input.content) || input.content.length !== 1) return input;
  const block = input.content[0];
  if (!object(block) || block.type !== "text" || typeof block.text !== "string") return input;
  if (block.text.length > serializedResultLimit || new TextEncoder().encode(block.text).byteLength > serializedResultLimit)
    throw new Error("Serialized tool result exceeds its decode limit.");
  let decoded: unknown;
  try { decoded = JSON.parse(block.text); } catch { throw new Error("Invalid serialized tool result."); }
  if (!object(decoded) || !object(decoded._meta) || !("backlog" in decoded._meta || "backlogEncoded" in decoded._meta))
    throw new Error("Invalid serialized tool result.");
  return decoded;
}

/** Lossless client transport only. The decoded value still requires whole-report validation. */
export async function decodeWidgetToolResult(input: unknown,
  onDecoded?: (facts: Record<string, string | number | boolean>) => void): Promise<unknown> {
  const decoded = decodeSerializedResult(input);
  if (!object(decoded) || !object(decoded._meta) || !("backlogEncoded" in decoded._meta)) return decoded;
  const meta = decoded._meta;
  if ("backlog" in meta) throw new Error("Ambiguous client report transport.");
  const encoded = meta.backlogEncoded;
  if (!object(encoded) || Object.keys(encoded).length !== 5 || encoded.schemaVersion !== 1 || encoded.encoding !== "gzip-base64"
    || !Number.isInteger(encoded.byteLength) || (encoded.byteLength as number) < 1 || (encoded.byteLength as number) > decodedBacklogLimit
    || typeof encoded.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(encoded.sha256)
    || typeof encoded.data !== "string" || encoded.data.length < 4 || encoded.data.length > serializedResultLimit
    || encoded.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded.data))
    throw new Error("Invalid encoded client report.");
  if (typeof DecompressionStream !== "function") throw new Error("Client report decompression is unavailable.");
  if (!globalThis.crypto?.subtle) throw new Error("This host cannot validate report identity. Continue the review in chat.");
  let binary: string;
  try { binary = atob(encoded.data); } catch { throw new Error("Invalid encoded client report."); }
  const compressed = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) compressed[i] = binary.charCodeAt(i);
  const reader = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > decodedBacklogLimit || byteLength > (encoded.byteLength as number)) {
        await reader.cancel().catch(() => {});
        throw new Error("Encoded client report exceeds its decode limit.");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Encoded client report exceeds its decode limit.") throw error;
    throw new Error("Invalid encoded client report.");
  } finally { reader.releaseLock(); }
  if (byteLength !== encoded.byteLength) throw new Error("Encoded client report identity differs.");
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const sha256 = Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
  if (sha256 !== encoded.sha256) throw new Error("Encoded client report identity differs.");
  let backlog: unknown;
  try { backlog = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Error("Invalid encoded client report."); }
  if (!object(backlog)) throw new Error("Invalid encoded client report.");
  try { onDecoded?.({ encoding: "gzip-base64", compressedBytes: compressed.byteLength, decodedBytes: byteLength,
    transportLengthVerified: true, transportHashVerified: true }); } catch { /* A trace cannot change report behavior. */ }
  const { backlogEncoded: _, ...remainingMeta } = meta;
  return { ...decoded, _meta: { ...remainingMeta, backlog } };
}

export async function validateWidgetResult(input: unknown) {
  const decoded = await decodeWidgetToolResult(input);
  return withBrowserHashes(() => {
    // Hosts can add transport metadata. Only the canonical backlog value is report data.
    const raw = decoded as Record<string, unknown> | null;
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
