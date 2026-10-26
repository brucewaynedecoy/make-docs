import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const BACKLOG_TRANSPORT_THRESHOLD_BYTES = 512 * 1024;
export const BACKLOG_TRANSPORT_MAX_BYTES = 16_000_000;
export const BACKLOG_TRANSPORT_MAX_BASE64_CHARS = 8_000_000;

export interface EncodedBacklogV1 {
  schemaVersion: 1;
  encoding: "gzip-base64";
  byteLength: number;
  sha256: string;
  data: string;
}

/** Change only the client transport. Canonical operations and model summaries stay intact. */
export function encodeBacklogToolResult(result: CallToolResult): CallToolResult {
  const metadata = result._meta;
  if (!metadata || !Object.hasOwn(metadata, "backlog")) return result;
  if (Object.hasOwn(metadata, "backlogEncoded")) {
    throw new Error("Backlog transport has conflicting report fields.");
  }
  const bytes = Buffer.from(JSON.stringify(metadata.backlog), "utf8");
  if (bytes.byteLength <= BACKLOG_TRANSPORT_THRESHOLD_BYTES) return result;
  if (bytes.byteLength > BACKLOG_TRANSPORT_MAX_BYTES) {
    throw new Error("Backlog report exceeds the client transport size limit.");
  }
  const data = gzipSync(bytes).toString("base64");
  if (data.length > BACKLOG_TRANSPORT_MAX_BASE64_CHARS) {
    throw new Error("Backlog report exceeds the client transport size limit.");
  }
  const backlogEncoded: EncodedBacklogV1 = {
    schemaVersion: 1,
    encoding: "gzip-base64",
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    data,
  };
  const { backlog: _backlog, ...otherMetadata } = metadata;
  return { ...result, _meta: { ...otherMetadata, backlogEncoded } };
}
