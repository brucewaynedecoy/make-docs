import type { McpProfile, McpServerProfile } from "../operations/mcp-metadata";

export interface McpResourceReservation {
  readonly uri: string;
  readonly profiles: readonly McpProfile[];
  readonly ready: boolean;
}

/** Static app membership follows the same intent profiles as tools and native resources. */
export const BACKLOG_REVIEW_UI_RESOURCE = {
  uri: "ui://make-docs/backlog-review/v1.html",
  profiles: ["backlog"],
  ready: true,
} as const satisfies McpResourceReservation;

export const MCP_RESOURCE_RESERVATIONS = [BACKLOG_REVIEW_UI_RESOURCE] as const;

export function isMcpResourceInProfile(
  profiles: readonly McpProfile[],
  profile: McpServerProfile,
): boolean {
  return profiles.length > 0 && (profile === "all" || profiles.includes(profile));
}
