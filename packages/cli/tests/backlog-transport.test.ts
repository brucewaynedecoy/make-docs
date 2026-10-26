import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { BACKLOG_TRANSPORT_MAX_BYTES, BACKLOG_TRANSPORT_THRESHOLD_BYTES,
  encodeBacklogToolResult, type EncodedBacklogV1 } from "../src/mcp/backlog-transport";
import { createMakeDocsMcpServer } from "../src/mcp/server";
import { createBacklogLivePayload, BacklogLivePayloadV1Schema } from "../src/operations/work/backlog/presentation";
import { createBacklogLiveEnvelope, createBacklogRefreshResult } from "../src/operations/work/backlog/live-contracts";
import { createBacklogReviewRefreshPayload, BacklogReviewRefreshPayloadV1Schema } from "../src/operations/work/backlog/review-contracts";
import { largePresentationReport, PRESENTATION_SESSION_ID, smallPresentationReport } from "./fixtures/backlog-presentation";

// Keep transport coverage independent of a captured live backlog.
const fixture = largePresentationReport();
for (const record of fixture.records) record.statusReason = "Synthetic detail. ".repeat(300);

function decode(result: CallToolResult) {
  const encoded = result._meta!.backlogEncoded as EncodedBacklogV1;
  expect(Object.keys(encoded).sort()).toEqual(["byteLength", "data", "encoding", "schemaVersion", "sha256"]);
  expect(encoded).toMatchObject({ schemaVersion: 1, encoding: "gzip-base64" });
  const bytes = gunzipSync(Buffer.from(encoded.data, "base64"));
  expect(bytes.byteLength).toBe(encoded.byteLength);
  expect(createHash("sha256").update(bytes).digest("hex")).toBe(encoded.sha256);
  return { bytes, backlog: JSON.parse(bytes.toString("utf8")) };
}

describe("lossless backlog client transport", () => {
  it("leaves a small canonical result and an unrelated result unchanged", () => {
    const small = createBacklogLivePayload(smallPresentationReport, PRESENTATION_SESSION_ID);
    expect(encodeBacklogToolResult(small)).toBe(small);
    const ordinary: CallToolResult = { content: [{ type: "text", text: "A normal result." }], _meta: { other: true } };
    expect(encodeBacklogToolResult(ordinary)).toBe(ordinary);
    const error: CallToolResult = { isError: true, content: [{ type: "text", text: "A normal error." }] };
    expect(encodeBacklogToolResult(error)).toBe(error);
  });

  it("round trips every byte of a large synthetic report without a model leak", () => {
    const canonical = createBacklogLivePayload(fixture, PRESENTATION_SESSION_ID);
    const originalBytes = Buffer.from(JSON.stringify(canonical._meta.backlog), "utf8");
    const metadata = { ...canonical._meta, other: { retained: true } };
    const original = { ...canonical, _meta: metadata };
    const encoded = encodeBacklogToolResult(original);
    expect(encoded._meta).not.toHaveProperty("backlog");
    expect(encoded._meta!.other).toBe(metadata.other);
    expect(original._meta.backlog).toBe(canonical._meta.backlog);
    expect(encoded.content).toBe(original.content);
    expect(encoded.structuredContent).toBe(original.structuredContent);
    expect(encoded.structuredContent).not.toHaveProperty("report");
    const restored = decode(encoded);
    expect(restored.bytes.equals(originalBytes)).toBe(true);
    expect(restored.backlog.envelope.report.records).toHaveLength(140);
    expect(BacklogLivePayloadV1Schema.parse({ ...canonical, _meta: { backlog: restored.backlog } })).toEqual(canonical);
    expect(Buffer.byteLength(JSON.stringify(encoded))).toBeLessThan(1_000_000);
  });

  it("uses UTF-8 bytes at the threshold and preserves non-ASCII data", () => {
    const boundary = { content: [], _meta: { backlog: "a".repeat(BACKLOG_TRANSPORT_THRESHOLD_BYTES - 2) } };
    expect(encodeBacklogToolResult(boundary)).toBe(boundary);
    const original: CallToolResult = { content: [], _meta: { backlog: { text: "😀é".repeat(100_000) } } };
    const restored = decode(encodeBacklogToolResult(original));
    expect(restored.backlog).toEqual(original._meta!.backlog);
    expect(restored.bytes.byteLength).toBe(Buffer.byteLength(JSON.stringify(original._meta!.backlog), "utf8"));
  });

  it("preserves the prior synthetic report and the complete changed snapshot on refresh", () => {
    const envelope = createBacklogLiveEnvelope(fixture, PRESENTATION_SESSION_ID);
    const snapshot = structuredClone(fixture.snapshot);
    snapshot.records[0].title.value = "Changed synthetic title";
    const refresh = createBacklogRefreshResult(envelope, { state: "available", snapshot });
    const canonical = createBacklogReviewRefreshPayload(envelope, snapshot, refresh, {
      state: "unavailable", reason: "store-not-configured", operation: "work.backlog-cache.lookup",
      nextAction: "Current source facts are available. Continue the review. Restore cache access before a later cache lookup.",
    });
    const encoded = encodeBacklogToolResult(canonical);
    const restored = decode(encoded);
    expect(restored.bytes.equals(Buffer.from(JSON.stringify(canonical._meta.backlog), "utf8"))).toBe(true);
    const payload = BacklogReviewRefreshPayloadV1Schema.parse({ ...canonical, _meta: { backlog: restored.backlog } });
    expect(payload._meta.backlog.envelope.report).toEqual(envelope.report);
    expect(payload._meta.backlog.currentSnapshot).toEqual(snapshot);
    expect(payload._meta.backlog.refresh.state).toBe("changed");
    expect(payload._meta.backlog.cache).toEqual(canonical._meta.backlog.cache);
    expect(Buffer.byteLength(JSON.stringify(encoded))).toBeLessThan(1_000_000);
  });

  it("rejects conflicting encodings and payloads beyond the decoder bound", () => {
    expect(() => encodeBacklogToolResult({ content: [], _meta: { backlog: {}, backlogEncoded: {} } })).toThrow("conflicting");
    expect(() => encodeBacklogToolResult({ content: [], _meta: { backlog: "x".repeat(BACKLOG_TRANSPORT_MAX_BYTES) } })).toThrow("size limit");
  });

  it("allows bounded report growth past eight million bytes", () => {
    const original: CallToolResult = { content: [], _meta: { backlog: { text: "x".repeat(9_000_000) } } };
    const encoded = encodeBacklogToolResult(original);
    expect(decode(encoded).backlog).toEqual(original._meta!.backlog);
  });

  it("serves the compact synthetic payload through the registered MCP server", async () => {
    const server = createMakeDocsMcpServer({ profile: "backlog" });
    const client = new Client({ name: "backlog-transport-test", version: "1" });
    const [left, right] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(right), client.connect(left)]);
    try {
      const canonical = createBacklogLivePayload(fixture, PRESENTATION_SESSION_ID);
      const received = await client.callTool({ name: "backlog_review_open",
        arguments: { report: fixture, sessionId: PRESENTATION_SESSION_ID } });
      expect(received.isError).not.toBe(true);
      expect(received._meta).not.toHaveProperty("backlog");
      const restored = decode(received as CallToolResult);
      expect(restored.bytes.equals(Buffer.from(JSON.stringify(canonical._meta.backlog), "utf8"))).toBe(true);
      expect(received.content).toEqual(canonical.content);
      expect(received.structuredContent).toEqual(canonical.structuredContent);
      expect(Buffer.byteLength(JSON.stringify(received))).toBeLessThan(1_000_000);
    } finally {
      await client.close();
      await server.close();
    }
  });
});
