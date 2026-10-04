import backlogReviewHtml from "./assets/backlog-review-v1";
import type { McpServerProfile } from "../operations/mcp-metadata";
import { BACKLOG_REVIEW_UI_RESOURCE, isMcpResourceInProfile } from "./resource-profiles";
import type { AppResource } from "./app-resources";

/** Embedded at build time. No project file or Store read occurs at resource delivery. */
export function defaultAppResources(profile: McpServerProfile): AppResource[] {
  return isMcpResourceInProfile(BACKLOG_REVIEW_UI_RESOURCE.profiles, profile) ? [{
    uri: BACKLOG_REVIEW_UI_RESOURCE.uri, name: "Backlog Review",
    description: "Read the tool summary. Continue the review in chat. Full live controls are planned.",
    text: backlogReviewHtml,
  }] : [];
}
