import {
  HARNESSES,
  PLUGIN_PACKAGE_BOUNDARY_STATES,
  WORKFLOW_BUNDLE_AUDIENCES,
  WORKFLOW_BUNDLE_EXPOSURE_BOUNDARIES,
  WORKFLOW_BUNDLE_FAMILIES,
  WORKFLOW_BUNDLE_MUTATION_AUTHORITIES,
  type PluginConformanceScenarioCandidate,
  type PluginPackageBoundary,
  type PluginSupportClaim,
  type WorkflowBundleMetadata,
  type WorkflowBundleRunPlaybookBoundary,
} from "../types";
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
  if (definition.packageBoundary !== undefined) {
    validatePluginPackageBoundary(definition.packageBoundary);
  }
  if (definition.workflowBundles !== undefined) {
    validateWorkflowBundleCatalog(definition.workflowBundles);
  }
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

export function validateWorkflowBundleCatalog(
  bundles: WorkflowBundleMetadata[],
): WorkflowBundleMetadata[] {
  if (!Array.isArray(bundles)) {
    throw new Error("workflowBundles must be an array");
  }
  const bundleIds = new Set<string>();
  for (const [index, bundle] of bundles.entries()) {
    validateWorkflowBundleMetadata(bundle, `workflowBundles.${index}`);
    if (bundleIds.has(bundle.bundleId)) {
      throw new Error(`workflowBundles.${index}.bundleId must be unique`);
    }
    bundleIds.add(bundle.bundleId);
  }
  return bundles;
}

export function validateWorkflowBundleMetadata(
  bundle: WorkflowBundleMetadata,
  label = "workflowBundle",
): WorkflowBundleMetadata {
  assertSlug(bundle.bundleId, `${label}.bundleId`);
  assertNonEmptyString(bundle.title, `${label}.title`);
  assertNonEmptyString(bundle.summary, `${label}.summary`);
  assertOneOf(bundle.family, WORKFLOW_BUNDLE_FAMILIES, `${label}.family`);
  assertEnumArray(bundle.audiences, WORKFLOW_BUNDLE_AUDIENCES, `${label}.audiences`);
  assertOneOf(
    bundle.exposureBoundary,
    WORKFLOW_BUNDLE_EXPOSURE_BOUNDARIES,
    `${label}.exposureBoundary`,
  );
  assertOneOf(
    bundle.mutationAuthority,
    WORKFLOW_BUNDLE_MUTATION_AUTHORITIES,
    `${label}.mutationAuthority`,
  );
  assertBoolean(bundle.requestCapture, `${label}.requestCapture`);
  assertBoolean(bundle.authorizedMutation, `${label}.authorizedMutation`);
  validateExposureBoundaryAudience(bundle, label);
  validateRequestMutationBoundary(bundle, label);
  if (bundle.runPlaybook !== undefined) {
    validateWorkflowBundleRunPlaybookBoundary(bundle.runPlaybook, `${label}.runPlaybook`);
  }
  if (bundle.family === "use-run" && bundle.runPlaybook === undefined) {
    throw new Error(`${label}.runPlaybook is required for use-run bundles`);
  }
  validatePluginPackageBoundary(bundle.packageBoundary, `${label}.packageBoundary`);
  assertArray(bundle.supportClaims, `${label}.supportClaims`);
  for (const [index, claim] of bundle.supportClaims.entries()) {
    validatePluginSupportClaim(claim, `${label}.supportClaims.${index}`);
  }
  assertArray(bundle.conformanceScenarios, `${label}.conformanceScenarios`);
  for (const [index, scenario] of bundle.conformanceScenarios.entries()) {
    validatePluginConformanceScenarioCandidate(
      scenario,
      `${label}.conformanceScenarios.${index}`,
    );
  }
  return bundle;
}

export function validatePluginPackageBoundary(
  boundary: PluginPackageBoundary,
  label = "packageBoundary",
): PluginPackageBoundary {
  assertOneOf(boundary.pluginPayloads, PLUGIN_PACKAGE_BOUNDARY_STATES, `${label}.pluginPayloads`);
  assertOneOf(boundary.pluginManifests, PLUGIN_PACKAGE_BOUNDARY_STATES, `${label}.pluginManifests`);
  assertOneOf(boundary.nativeExposures, PLUGIN_PACKAGE_BOUNDARY_STATES, `${label}.nativeExposures`);
  assertOneOf(boundary.generatedAdapters, PLUGIN_PACKAGE_BOUNDARY_STATES, `${label}.generatedAdapters`);
  assertOneOf(boundary.conformanceLabRecords, ["excluded"] as const, `${label}.conformanceLabRecords`);
  assertOneOf(boundary.generatedLocalRunArtifacts, ["excluded"] as const, `${label}.generatedLocalRunArtifacts`);
  assertOneOf(boundary.unreviewedGeneratedOutputs, ["excluded"] as const, `${label}.unreviewedGeneratedOutputs`);
  assertNonEmptyStringArray(boundary.decisionEvidence, `${label}.decisionEvidence`);
  return boundary;
}

export function validatePluginSupportClaim(
  claim: PluginSupportClaim,
  label = "supportClaim",
): PluginSupportClaim {
  assertSlug(claim.claimId, `${label}.claimId`);
  assertOneOf(claim.status, ["provisional", "implementation-validated", "conformance-validated", "unsupported"], `${label}.status`);
  assertOneOf(claim.surface, ["cli", "mcp", "plugin", "skills-bundle", "run-playbook", "harness-native"] as const, `${label}.surface`);
  assertOneOf(claim.wording, ["provisional", "validated", "unsupported"] as const, `${label}.wording`);
  assertStringArray(claim.evidenceRefs, `${label}.evidenceRefs`);
  validateOptionalSlug(claim.pluginId, `${label}.pluginId`);
  validateOptionalSlug(claim.bundleId, `${label}.bundleId`);
  validateOptionalHarnessId(claim.harness, `${label}.harness`);
  if (claim.playbookRef !== undefined) {
    assertNonEmptyString(claim.playbookRef, `${label}.playbookRef`);
  }
  if (claim.modelProvider !== undefined) {
    assertNonEmptyString(claim.modelProvider, `${label}.modelProvider`);
  }
  if (claim.runtime !== undefined) {
    assertNonEmptyString(claim.runtime, `${label}.runtime`);
  }
  if (claim.status === "provisional" && claim.wording !== "provisional") {
    throw new Error(`${label}.wording must remain provisional until evidence validates the exact tuple`);
  }
  if (claim.status === "unsupported" && claim.wording !== "unsupported") {
    throw new Error(`${label}.wording must be unsupported for unsupported claims`);
  }
  if (
    (claim.status === "implementation-validated" ||
      claim.status === "conformance-validated") &&
    (claim.wording !== "validated" || claim.evidenceRefs.length === 0)
  ) {
    throw new Error(`${label} needs validation evidence before public wording can be validated`);
  }
  return claim;
}

export function validatePluginConformanceScenarioCandidate(
  scenario: PluginConformanceScenarioCandidate,
  label = "conformanceScenario",
): PluginConformanceScenarioCandidate {
  assertSlug(scenario.scenarioId, `${label}.scenarioId`);
  assertSlug(scenario.claimId, `${label}.claimId`);
  assertOneOf(scenario.status, ["candidate", "implemented", "passed", "failed", "deferred"] as const, `${label}.status`);
  assertBoolean(scenario.required, `${label}.required`);
  assertRecord(scenario.dimensions, `${label}.dimensions`);
  validateOptionalSlug(scenario.dimensions.pluginId, `${label}.dimensions.pluginId`);
  validateOptionalSlug(scenario.dimensions.bundleId, `${label}.dimensions.bundleId`);
  validateOptionalHarnessId(scenario.dimensions.harness, `${label}.dimensions.harness`);
  if (scenario.dimensions.playbookRef !== undefined) {
    assertNonEmptyString(scenario.dimensions.playbookRef, `${label}.dimensions.playbookRef`);
  }
  if (scenario.dimensions.modelProvider !== undefined) {
    assertNonEmptyString(scenario.dimensions.modelProvider, `${label}.dimensions.modelProvider`);
  }
  if (scenario.dimensions.runtime !== undefined) {
    assertNonEmptyString(scenario.dimensions.runtime, `${label}.dimensions.runtime`);
  }
  if (scenario.dimensions.surface !== undefined) {
    assertOneOf(
      scenario.dimensions.surface,
      ["cli", "mcp", "plugin", "skills-bundle", "run-playbook", "harness-native"] as const,
      `${label}.dimensions.surface`,
    );
  }
  if (!hasScenarioDimension(scenario)) {
    throw new Error(`${label}.dimensions must include at least one support dimension`);
  }
  assertStringArray(scenario.evidenceRefs, `${label}.evidenceRefs`);
  if (
    (scenario.status === "implemented" ||
      scenario.status === "passed" ||
      scenario.status === "failed") &&
    scenario.evidenceRefs.length === 0
  ) {
    throw new Error(`${label}.evidenceRefs must cite evidence once the scenario is no longer only a candidate`);
  }
  return scenario;
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

function assertBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
}

function assertRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertStringArray(value: unknown, label: string): asserts value is string[] {
  assertArray(value, label);
  for (const [index, item] of value.entries()) {
    assertNonEmptyString(item, `${label}.${index}`);
  }
}

function assertNonEmptyStringArray(
  value: unknown,
  label: string,
): asserts value is string[] {
  assertStringArray(value, label);
  if (value.length === 0) {
    throw new Error(`${label} must include at least one entry`);
  }
}

function assertEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): asserts value is T[] {
  assertArray(value, label);
  if (value.length === 0) {
    throw new Error(`${label} must include at least one entry`);
  }
  for (const [index, item] of value.entries()) {
    assertOneOf(item, allowed, `${label}.${index}`);
  }
}

function validateOptionalSlug(value: unknown, label: string): void {
  if (value !== undefined) {
    assertSlug(value, label);
  }
}

function validateOptionalHarnessId(value: unknown, label: string): void {
  if (value === undefined) {
    return;
  }
  assertSlug(value, label);
  if (value === "generic") {
    throw new Error(`${label} cannot be generic`);
  }
}

function validateWorkflowBundleRunPlaybookBoundary(
  boundary: WorkflowBundleRunPlaybookBoundary,
  label: string,
): void {
  assertOneOf(boundary.mode, ["generic-run-playbook"] as const, `${label}.mode`);
  assertOneOf(boundary.orchestrator, ["w18-r4-run-playbook"] as const, `${label}.orchestrator`);
  assertOneOf(boundary.storageContract, ["docs/assets/playbooks"] as const, `${label}.storageContract`);
  if (boundary.pluginPackagingRequired !== false) {
    throw new Error(`${label}.pluginPackagingRequired must be false`);
  }
  assertStringArray(boundary.playbookRefs, `${label}.playbookRefs`);
}

function validateExposureBoundaryAudience(
  bundle: WorkflowBundleMetadata,
  label: string,
): void {
  if (
    bundle.exposureBoundary === "maintainer-only" &&
    (bundle.audiences.length !== 1 || bundle.audiences[0] !== "maintainer")
  ) {
    throw new Error(`${label}.audiences must be maintainer-only for maintainer-only bundles`);
  }
  if (
    bundle.exposureBoundary.startsWith("non-maintainer") &&
    !bundle.audiences.includes("non-maintainer")
  ) {
    throw new Error(`${label}.audiences must include non-maintainer for non-maintainer bundles`);
  }
  if (
    bundle.exposureBoundary === "end-user-run-stack" &&
    !bundle.audiences.includes("end-user")
  ) {
    throw new Error(`${label}.audiences must include end-user for run-stack bundles`);
  }
}

function validateRequestMutationBoundary(
  bundle: WorkflowBundleMetadata,
  label: string,
): void {
  if (bundle.mutationAuthority === "request-capture-only") {
    if (!bundle.requestCapture || bundle.authorizedMutation) {
      throw new Error(`${label} must capture requests without authorized mutation`);
    }
  }
  if (
    bundle.exposureBoundary === "non-maintainer-request-capture" &&
    bundle.authorizedMutation
  ) {
    throw new Error(`${label} cannot authorize mutation for request-capture entrypoints`);
  }
  if (
    bundle.exposureBoundary === "non-maintainer-guided-change" &&
    !bundle.requestCapture
  ) {
    throw new Error(`${label} must capture a request before guided non-maintainer change`);
  }
}

function hasScenarioDimension(
  scenario: PluginConformanceScenarioCandidate,
): boolean {
  return Object.values(scenario.dimensions).some((value) => value !== undefined);
}
