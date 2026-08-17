import path from "node:path";
import {
  SYSTEM_RESOURCE_TYPES,
  type SystemResourceIdentity,
  type SystemResourceResult,
  type SystemResourceType,
} from "./types";

const RESOURCE_URI_PREFIX = "make-docs://system/";
const WINDOWS_DRIVE_PATH = /^[A-Za-z]:/;
const ENCODED_OCTET = /%[0-9A-Fa-f]{2}/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

export function isSystemResourceType(value: unknown): value is SystemResourceType {
  return typeof value === "string" && SYSTEM_RESOURCE_TYPES.includes(value as SystemResourceType);
}

export function createSystemResourceIdentity(
  type: unknown,
  resourcePath: unknown,
): SystemResourceResult<SystemResourceIdentity> {
  if (!isSystemResourceType(type)) {
    return {
      ok: false,
      error: {
        code: "invalid-resource-type",
        message: `Unknown system-resource type: ${String(type)}.`,
        recovery: `Use one of: ${SYSTEM_RESOURCE_TYPES.join(", ")}.`,
      },
    };
  }

  const normalized = canonicalSystemResourcePath(resourcePath);
  if (!normalized.ok) {
    return normalized;
  }

  return {
    ok: true,
    value: {
      type,
      path: normalized.value,
      uri: `${RESOURCE_URI_PREFIX}${type}/${normalized.value}`,
    },
  };
}

export function parseSystemResourceUri(uri: unknown): SystemResourceResult<SystemResourceIdentity> {
  if (typeof uri !== "string" || !uri.startsWith(RESOURCE_URI_PREFIX)) {
    return invalidUri(uri, "The URI must start with make-docs://system/.");
  }
  if (uri.includes("?") || uri.includes("#")) {
    return invalidUri(uri, "Query and fragment parts are not permitted.");
  }

  const remainder = uri.slice(RESOURCE_URI_PREFIX.length);
  const slash = remainder.indexOf("/");
  if (slash <= 0) {
    return invalidUri(uri, "The URI must contain a type and a relative path.");
  }

  const result = createSystemResourceIdentity(remainder.slice(0, slash), remainder.slice(slash + 1));
  if (!result.ok) {
    return {
      ok: false,
      error: {
        ...result.error,
        code: result.error.code === "invalid-resource-type" ? result.error.code : "invalid-resource-uri",
        uri,
      },
    };
  }
  if (result.value.uri !== uri) {
    return invalidUri(uri, "The URI is not in canonical form.");
  }
  return result;
}

export function canonicalSystemResourcePath(
  value: unknown,
): SystemResourceResult<string> {
  if (typeof value !== "string" || value.length === 0) {
    return invalidPath(value, "The path must be a non-empty string.");
  }
  if (CONTROL_CHARACTER.test(value)) {
    return invalidPath(value, "Control characters are not permitted.");
  }
  if (value.includes("\\")) {
    return invalidPath(value, "Backslashes are ambiguous and are not permitted.");
  }
  if (ENCODED_OCTET.test(value)) {
    return invalidPath(value, "Percent-encoded octets are not permitted.");
  }
  if (path.posix.isAbsolute(value) || WINDOWS_DRIVE_PATH.test(value)) {
    return invalidPath(value, "Absolute and Windows drive paths are not permitted.");
  }

  const segments = value.split("/");
  if (segments.some((segment) => segment.length === 0)) {
    return invalidPath(value, "Empty path segments are not permitted.");
  }
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return invalidPath(value, "Dot and traversal segments are not permitted.");
  }
  if (path.posix.normalize(value) !== value) {
    return invalidPath(value, "The path is not in canonical POSIX form.");
  }

  return { ok: true, value };
}

function invalidPath(value: unknown, message: string): SystemResourceResult<never> {
  return {
    ok: false,
    error: {
      code: "invalid-resource-path",
      message,
      recovery: "Use a case-sensitive POSIX-relative path with non-empty ordinary segments.",
      path: typeof value === "string" ? value : undefined,
    },
  };
}

function invalidUri(value: unknown, message: string): SystemResourceResult<never> {
  return {
    ok: false,
    error: {
      code: "invalid-resource-uri",
      message,
      recovery: "Use make-docs://system/<type>/<posix-relative-path>.",
      uri: typeof value === "string" ? value : undefined,
    },
  };
}
