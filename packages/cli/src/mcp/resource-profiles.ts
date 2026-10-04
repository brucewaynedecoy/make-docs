import type { McpProfile, McpServerProfile } from "../operations/mcp-metadata";

export interface McpResourceReservation {
  readonly uri: string;
  readonly profiles: readonly McpProfile[];
  readonly ready: false;
}

/** W25 owns registration and bytes. This descriptor only reserves profile membership. */
export const BACKLOG_REVIEW_UI_RESOURCE = {
  uri: "ui://make-docs/backlog-review/v1.html",
  profiles: ["backlog"],
  ready: false,
} as const satisfies McpResourceReservation;

export const MCP_RESOURCE_RESERVATIONS = [BACKLOG_REVIEW_UI_RESOURCE] as const;

export function isMcpResourceInProfile(
  profiles: readonly McpProfile[],
  profile: McpServerProfile,
): boolean {
  return profiles.length > 0 && (profile === "all" || profiles.includes(profile));
}
