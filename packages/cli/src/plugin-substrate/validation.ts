import { HARNESSES } from "../types";
import type {
  PluginArtifactDefinition,
  PluginHarnessExposureDeclaration,
} from "./types";

export function validatePluginArtifactDefinition(
  definition: PluginArtifactDefinition,
): PluginArtifactDefinition {
  assertSlug(definition.pluginId, "pluginId");
  assertNonEmptyString(definition.title, "title");
  assertNonEmptyString(definition.summary, "summary");
  assertOneOf(definition.status, ["provisional", "active", "deprecated"], "status");
  assertNonEmptyString(definition.sourceManifest.manifestId, "sourceManifest.manifestId");
  assertNonEmptyString(definition.sourceManifest.displayName, "sourceManifest.displayName");
  assertOneOf(definition.sourceManifest.source, ["built-in", "file", "remote-pinned"], "sourceManifest.source");
  assertNonEmptyString(definition.digest, "digest");
  assertNonEmptyString(definition.provenance, "provenance");
  assertOneOf(definition.trustPolicy.kind, ["first-party", "local-reviewed", "remote-pinned", "manual-review-required"], "trustPolicy.kind");
  assertOneOf(definition.supportStatus, ["provisional", "implementation-validated", "conformance-validated", "unsupported"], "supportStatus");
  if (!Array.isArray(definition.supportedHarnesses) || definition.supportedHarnesses.length === 0) {
    throw new Error("supportedHarnesses must include at least one harness");
  }
  for (const harness of definition.supportedHarnesses) {
    if (!HARNESSES.includes(harness)) {
      throw new Error(`supportedHarnesses contains unsupported harness ${harness}`);
    }
  }
  if (!Array.isArray(definition.payload) || definition.payload.length === 0) {
    throw new Error("payload must include at least one file");
  }
  for (const [index, payload] of definition.payload.entries()) {
    assertRelativePath(payload.installPath, `payload.${index}.installPath`);
    assertNonEmptyString(payload.content, `payload.${index}.content`);
  }
  return definition;
}

export function validatePluginHarnessExposureDeclaration(
  declaration: PluginHarnessExposureDeclaration,
): PluginHarnessExposureDeclaration {
  if (!HARNESSES.includes(declaration.harness)) {
    throw new Error(`harness must be one of: ${HARNESSES.join(", ")}`);
  }
  assertOneOf(declaration.exposureKind, ["native", "generated-adapter"], "exposureKind");
  assertRelativePath(declaration.pathTemplate, "pathTemplate");
  if (!declaration.pathTemplate.includes("{pluginId}")) {
    throw new Error("pathTemplate must include {pluginId}");
  }
  if (declaration.exposureKind === "generated-adapter" && declaration.adapterContent !== undefined) {
    assertNonEmptyString(declaration.adapterContent, "adapterContent");
  }
  return declaration;
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertSlug(value: unknown, label: string): asserts value is string {
  assertNonEmptyString(value, label);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    throw new Error(`${label} must be a lowercase slug`);
  }
}

function assertRelativePath(value: unknown, label: string): asserts value is string {
  assertNonEmptyString(value, label);
  if (value.startsWith("/") || value.split(/[\\/]/).includes("..")) {
    throw new Error(`${label} must be a safe relative path`);
  }
}

function assertOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): asserts value is T {
  if (!allowed.includes(value as T)) {
    throw new Error(`${label} must be one of: ${allowed.join(", ")}`);
  }
}
