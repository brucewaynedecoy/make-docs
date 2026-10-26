import { createHash } from "node:crypto";

export const P7_METER_VERSION = "W25-R0-P7-MONOTONIC-1";
const kinds = ["cold", "unchanged", "changed"];
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Test-only measurement state. It records counts/hashes, never arguments or bodies. */
export function createP7Meter({ mode = "preparatory", fingerprint, clock = () => process.hrtime.bigint() }) {
  if (!["preparatory", "real-host"].includes(mode)) throw new Error("Unknown measurement mode.");
  if (!fingerprint || typeof fingerprint !== "object") throw new Error("A fingerprint is required.");
  if (mode === "real-host" && (fingerprint.fixtureApproved !== true || !fingerprint.hostVersion || !fingerprint.model || !fingerprint.candidateSha256 || !fingerprint.fixtureSha256 || !fingerprint.perfSourceDigest)) {
    throw new Error("Real-host measurement needs the approved fixture and bound candidate/host/model/profile.");
  }
  const fingerprintDigest = digest(fingerprint), results = [], pending = new Map();
  let active = null;
  function now() { const value = clock(); if (typeof value !== "bigint") throw new Error("Use a monotonic bigint clock."); return value; }
  function begin(kind) {
    if (!kinds.includes(kind) || active || results.length >= 3 || results.some(result => result.kind === kind)) throw new Error("Observation is duplicate, busy, invalid, or over budget.");
    active = { kind, start: now(), operations: [], payloadBytes: 0, cacheCounts: null, changeCounts: null };
  }
  function request(id, operation) {
    if (!active) return;
    if (pending.has(id)) throw new Error("Duplicate request ID.");
    pending.set(id, { start: now(), operation });
  }
  function response(id, result) {
    const request = pending.get(id); if (!active || !request) return;
    pending.delete(id); const end = now(); if (end < request.start) throw new Error("Clock moved backward.");
    const json = JSON.stringify(result), bytes = Buffer.byteLength(json);
    const backlog = result?._meta?.backlog;
    active.payloadBytes += bytes;
    active.operations.push({ operation: request.operation, elapsedNs: String(end - request.start), bytes, sha256: createHash("sha256").update(json).digest("hex"), isError: result?.isError === true });
    if (backlog?.cache?.state === "available") active.cacheCounts = { ...backlog.cache.result.counts };
    if (backlog?.refresh?.state === "changed") active.changeCounts = { added: backlog.refresh.added.length, changed: backlog.refresh.changed.length, removed: backlog.refresh.removed.length };
  }
  function rendered({ host, validatedModel, witness, humanThinkTimeExcluded = false }) {
    if (!active || pending.size || validatedModel !== true || !host || !witness) throw new Error("A validated host-render witness and settled operations are required.");
    const end = now(); if (end < active.start) throw new Error("Clock moved backward.");
    const result = { instrumentVersion: P7_METER_VERSION, kind: active.kind, mode, countsAsPerfObservation: mode === "real-host", fingerprintDigest,
      elapsedNs: String(end - active.start), operationReceipts: active.operations, payloadBytes: active.payloadBytes,
      cacheCounts: active.cacheCounts, changeCounts: active.changeCounts, host, witness, humanThinkTimeExcluded,
      limits: ["Manual render witnessing adds observer delay.", "No percentile, mean, stable speed claim, or variance estimate is supported."] };
    results.push(result); active = null; return structuredClone(result);
  }
  function interrupted(reason) {
    if (!active || !reason) throw new Error("An active observation and reason are required.");
    const result = { kind: active.kind, mode, countsAsPerfObservation: mode === "real-host", fingerprintDigest, comparable: false, reason };
    results.push(result); active = null; pending.clear(); return result;
  }
  return { begin, request, response, rendered, interrupted, results: () => structuredClone(results), fingerprintDigest };
}
