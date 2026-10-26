import type { BacklogHostCapabilities } from "../../operations/work/backlog/live-contracts.js";
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
/** Standard initialization facts only. No host-name inference or separate-task promise. */
export function backlogCapabilitiesFromInitialize(result: unknown): BacklogHostCapabilities {
  if (!object(result) || result.protocolVersion !== "2026-01-26") return {};
  const host = object(result.hostCapabilities) ? result.hostCapabilities : {};
  return { appResource: true, toolCalls: object(host.serverTools), agentMessages: object(host.message) && object(host.message.text), separateTasks: null };
}
