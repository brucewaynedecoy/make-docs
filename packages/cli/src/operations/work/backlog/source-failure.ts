import { BacklogSnapshotError } from "./snapshot.js";
import type { BacklogRefreshFailureReason } from "./live-contracts.js";

/** Reuse the snapshot owner's typed cause; do not repeat filesystem safety checks. */
export function backlogSourceFailureReason(error: unknown): BacklogRefreshFailureReason {
  if (error instanceof BacklogSnapshotError) return error.sourceReason;
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (code === "EACCES" || code === "EPERM") return "source-denied";
  if (code === "ELOOP") return "source-unsafe";
  return "source-unavailable";
}
