import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { GlobalHarnessIntent, McpConnectionRecord } from "./store/global-config";

export const MCP_CONNECTION_ID_ENV = "MAKE_DOCS_MCP_CONNECTION_ID";
export const MCP_CONNECTION_KEY_ENV = "MAKE_DOCS_MCP_CONNECTION_KEY";
export const REDACTED_MCP_CONNECTION_KEY = "<redacted-mcp-connection-key>";

export interface McpConnectionSecret {
  id: string;
  key: string;
  record: McpConnectionRecord;
}

/** A key selects one reviewed connection. Grants remain in machine and project intent. */
export function createMcpConnection(owner: string): McpConnectionSecret {
  const id = randomUUID();
  const key = randomBytes(32).toString("base64url");
  return {
    id,
    key,
    record: { id, keySha256: hashMcpConnectionKey(key), active: true, method: "mcp", owner },
  };
}

export function hashMcpConnectionKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

/** Keep host-file structure in durable evidence without saving the host key. */
export function redactMcpNativeValue<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(
      /(^MAKE_DOCS_MCP_CONNECTION_KEY\s*=\s*)"(?:[^"\\]|\\.)*"/m,
      `$1${JSON.stringify(REDACTED_MCP_CONNECTION_KEY)}`,
    ) as T;
  }
  if (Array.isArray(value)) return value.map(redactMcpNativeValue) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
      key,
      key === MCP_CONNECTION_KEY_ENV ? REDACTED_MCP_CONNECTION_KEY : redactMcpNativeValue(nested),
    ])) as T;
  }
  return value;
}

export function isRedactedMcpNativeValue(value: unknown): boolean {
  if (typeof value === "string") {
    return value.includes(`${MCP_CONNECTION_KEY_ENV} = ${JSON.stringify(REDACTED_MCP_CONNECTION_KEY)}`);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const env = (value as Record<string, unknown>).env;
    return !!env && typeof env === "object" &&
      (env as Record<string, unknown>)[MCP_CONNECTION_KEY_ENV] === REDACTED_MCP_CONNECTION_KEY;
  }
  return false;
}

export function matchMcpConnection(
  harnesses: Record<string, GlobalHarnessIntent>,
  id: string | undefined,
  key: string | undefined,
): { owner: string; intent: GlobalHarnessIntent } | null {
  if (!id || !key || !/^[0-9a-f-]{36}$/.test(id) || !/^[A-Za-z0-9_-]{43}$/.test(key)) return null;
  for (const [owner, intent] of Object.entries(harnesses)) {
    const record = intent.mcpConnection;
    if (!record || !record.active || record.id !== id || record.owner !== owner || record.method !== "mcp") continue;
    const actual = Buffer.from(hashMcpConnectionKey(key), "hex");
    const expected = Buffer.from(record.keySha256, "hex");
    if (expected.length === actual.length && timingSafeEqual(actual, expected)) return { owner, intent };
  }
  return null;
}
