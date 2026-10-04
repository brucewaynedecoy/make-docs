import { MCP_PROFILES, type McpProfile } from "../mcp-metadata";
import { parseSystemResourceUri } from "./identity";
import type {
  SystemResourceMcpProfileAssignment,
  SystemResourceMcpProfiles,
  SystemResourceProviderInventory,
  SystemResourceResult,
} from "./types";

/** Native MCP must not expose a provider without complete source-owned assignments. */
export function getSystemResourceMcpProfiles(
  provider: SystemResourceProviderInventory,
): SystemResourceResult<SystemResourceMcpProfiles> {
  if (!provider || !Array.isArray(provider.resources)) {
    return invalidProfiles("The native MCP provider inventory is invalid.");
  }
  const uris: string[] = [];
  for (const resource of provider.resources) {
    if (!resource || typeof resource.identity?.uri !== "string") {
      return invalidProfiles("Each native MCP provider resource must have a canonical URI.");
    }
    uris.push(resource.identity.uri);
  }
  const assignments = validateSystemResourceMcpAssignments(provider.mcpResources, uris);
  if (!assignments.ok) return assignments;

  const profiles: Record<string, readonly McpProfile[]> = {};
  for (const assignment of assignments.value) profiles[assignment.uri] = assignment.profiles;
  return { ok: true, value: Object.freeze(profiles) };
}

/** Used at provider load as well as at the native adapter boundary. */
export function validateSystemResourceMcpAssignments(
  value: unknown,
  resourceUris: readonly string[],
): SystemResourceResult<readonly SystemResourceMcpProfileAssignment[]> {
  const inventory = new Set<string>();
  for (const uri of resourceUris) {
    if (typeof uri !== "string" || !parseSystemResourceUri(uri).ok) {
      return invalidProfiles("The native MCP provider inventory contains an invalid URI.");
    }
    if (inventory.has(uri)) {
      return invalidProfiles(`The native MCP provider inventory repeats URI ${uri}.`, uri);
    }
    inventory.add(uri);
  }
  if (!Array.isArray(value)) {
    return invalidProfiles("The system-resource catalog must declare native MCP profile assignments.");
  }

  const assignments: SystemResourceMcpProfileAssignment[] = [];
  const assigned = new Set<string>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return invalidProfiles("Each native MCP resource assignment must be an object.");
    }
    if (Object.keys(entry).some((key) => key !== "uri" && key !== "profiles")) {
      return invalidProfiles("Native MCP resource assignments accept only uri and profiles fields.");
    }
    const { uri, profiles } = entry as Record<string, unknown>;
    if (typeof uri !== "string" || !parseSystemResourceUri(uri).ok) {
      return invalidProfiles("Each native MCP resource assignment must name a canonical system URI.");
    }
    if (assigned.has(uri)) {
      return invalidProfiles(`The system-resource catalog repeats native MCP URI ${uri}.`, uri);
    }
    if (!inventory.has(uri)) {
      return invalidProfiles(`Native MCP URI ${uri} is outside the provider inventory.`, uri);
    }
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return invalidProfiles(`Native MCP resource ${uri} must declare a nonempty profile set.`, uri);
    }
    for (const profile of profiles) {
      if (!MCP_PROFILES.some((known) => known === profile)) {
        return invalidProfiles(`Native MCP resource ${uri} declares unknown profile: ${String(profile)}.`, uri);
      }
    }
    if (new Set(profiles).size !== profiles.length) {
      return invalidProfiles(`Native MCP resource ${uri} declares duplicate profiles.`, uri);
    }
    assigned.add(uri);
    assignments.push(Object.freeze({
      uri,
      profiles: Object.freeze([...profiles] as McpProfile[]),
    }));
  }
  const missing = [...inventory].find((uri) => !assigned.has(uri));
  if (missing) {
    return invalidProfiles(`Native MCP resource ${missing} has no profile assignment.`, missing);
  }
  assignments.sort((left, right) => left.uri < right.uri ? -1 : left.uri > right.uri ? 1 : 0);
  return { ok: true, value: Object.freeze(assignments) };
}

function invalidProfiles(message: string, uri?: string): SystemResourceResult<never> {
  return {
    ok: false,
    error: {
      code: "provider-catalog-invalid",
      message,
      recovery: "Restore the shipped catalog with one nonempty intent profile set for each provider URI.",
      ...(uri ? { uri } : {}),
    },
  };
}
