/** Intent profiles only. `all` is their union, never a tool assignment. */
export const MCP_PROFILES = ["core", "setup", "workflow", "quality", "backlog"] as const;

export type McpProfile = (typeof MCP_PROFILES)[number];

export const MCP_SERVER_PROFILES = [...MCP_PROFILES, "all"] as const;

export type McpServerProfile = (typeof MCP_SERVER_PROFILES)[number];

export interface McpProfileOptions {
  profile?: McpServerProfile;
}

/** Check runtime input before creating a server or invoking a tool. */
export function parseMcpServerProfile(value: unknown = "all"): McpServerProfile {
  if (MCP_SERVER_PROFILES.some((profile) => profile === value)) {
    return value as McpServerProfile;
  }
  throw new Error(
    `Unknown make-docs MCP profile: ${String(value)}. Allowed profiles: ${MCP_SERVER_PROFILES.join(", ")}.`,
  );
}

export interface McpToolMetadata {
  profiles: McpProfile[];
  /** Host advice. This field does not hide or authorize a tool. */
  defaultExposure: "eager" | "deferred";
  /** Static UI resource reference. It does not grant tool or Store access. */
  uiResourceUri?: string;
}

/** Fail catalog construction instead of silently omitting an unassigned tool. */
export function assertMcpToolMetadata(
  owner: string,
  metadata: unknown,
): asserts metadata is McpToolMetadata {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    throw new Error(`MCP tool ${owner} must declare profile metadata.`);
  }
  const { profiles, defaultExposure } = metadata as Record<string, unknown>;
  if (!Array.isArray(profiles) || profiles.length === 0) {
    throw new Error(`MCP tool ${owner} must declare a nonempty profile set.`);
  }
  for (const profile of profiles) {
    if (!MCP_PROFILES.some((known) => known === profile)) {
      throw new Error(`MCP tool ${owner} declares unknown profile: ${String(profile)}.`);
    }
  }
  if (new Set(profiles).size !== profiles.length) {
    throw new Error(`MCP tool ${owner} declares duplicate profiles.`);
  }
  if (defaultExposure !== "eager" && defaultExposure !== "deferred") {
    throw new Error(`MCP tool ${owner} must declare eager or deferred default exposure.`);
  }
  const uri = (metadata as Record<string, unknown>).uiResourceUri;
  if (uri !== undefined && (typeof uri !== "string" || !/^ui:\/\/[a-z0-9][a-z0-9.-]*(?:\/[a-z0-9][a-z0-9-]*)*\/v[1-9][0-9]*\.html$/.test(uri))) {
    throw new Error(`MCP tool ${owner} must reference a versioned UI resource URI.`);
  }
}

export function cloneMcpToolMetadata(metadata: McpToolMetadata): McpToolMetadata {
  return { profiles: [...metadata.profiles], defaultExposure: metadata.defaultExposure,
    ...(metadata.uiResourceUri ? { uiResourceUri: metadata.uiResourceUri } : {}) };
}
