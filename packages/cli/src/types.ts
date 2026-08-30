export const CAPABILITIES = ["designs", "plans", "prd", "work"] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const INSTRUCTION_KINDS = ["AGENTS.md", "CLAUDE.md"] as const;

export type InstructionKind = (typeof INSTRUCTION_KINDS)[number];

export const HARNESSES = ["claude-code", "codex"] as const;

export type Harness = (typeof HARNESSES)[number];

export const PROJECT_RESOURCE_TYPES = [
  "contract",
  "prompt",
  "reference",
  "template",
] as const;

export type ProjectResourceType = (typeof PROJECT_RESOURCE_TYPES)[number];

export const INSTRUCTION_KIND_TO_HARNESS: Record<InstructionKind, Harness> = {
  "AGENTS.md": "codex",
  "CLAUDE.md": "claude-code",
};

export const HARNESS_TO_INSTRUCTION: Record<Harness, InstructionKind> = {
  "claude-code": "CLAUDE.md",
  codex: "AGENTS.md",
};

export type ManagedFileConflictResolution = "overwrite" | "skip";
export type ManagedFileConflictResolutions = Partial<
  Record<string, ManagedFileConflictResolution>
>;
export type ManagedFileConflictGroup =
  | "agent-instructions"
  | "managed-files"
  | "prompts"
  | "references"
  | "skills"
  | "templates";
export type ActionType =
  | "create"
  | "noop"
  | "skip"
  | "update"
  | "update-conflict"
  | "skip-conflict"
  | "remove-managed"
  | "generate";

export const SYSTEM_ASSET_MATERIALIZATION_MODES = [
  "full-snapshot",
  "provider-backed",
  "hybrid-pinned-cache",
] as const;

export type SystemAssetMaterializationMode =
  (typeof SYSTEM_ASSET_MATERIALIZATION_MODES)[number];

export const DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE =
  "full-snapshot" satisfies SystemAssetMaterializationMode;

export const SYSTEM_ASSET_MATERIALIZATION_CLASSES = [
  "always-local-bootstrap",
  "materialized-system-asset",
  "deferred-system-asset",
] as const;

export type SystemAssetMaterializationClass =
  (typeof SYSTEM_ASSET_MATERIALIZATION_CLASSES)[number];

export type ManifestHashAlgorithm = "sha256";

export type SystemAssetOfflineExpectation =
  | "local"
  | "cache-or-provider"
  | "reviewed-full-snapshot-fallback";

export type SystemAssetSelectionTrigger =
  | "local-bootstrap"
  | "profile-selection"
  | "internal-materialization-mode";

export interface SystemAssetMaterializationPlan {
  mode: SystemAssetMaterializationMode;
  localBootstrapPaths: string[];
  deferredSystemAssetPaths: string[];
  materializationClasses: Record<string, SystemAssetMaterializationClass>;
}

export interface ManifestSystemAssetEntry {
  materializationMode: SystemAssetMaterializationMode;
  sourcePackage?: string;
  sourceProvider?: string;
  sourceVersion?: string;
  sourceImmutableRef?: string;
  hashAlgorithm: ManifestHashAlgorithm;
  expectedHashes: string[];
  logicalAssetId: string;
  localPath?: string;
  materializationClass: SystemAssetMaterializationClass;
  offlineExpectation: SystemAssetOfflineExpectation;
  recoveryGuidance: string;
  selectionTrigger: SystemAssetSelectionTrigger;
}

export interface SystemAssetManifestState extends SystemAssetMaterializationPlan {
  sourcePackage?: string;
  sourceProvider?: string;
  sourceVersion?: string;
  sourceImmutableRef?: string;
  hashAlgorithm?: ManifestHashAlgorithm;
  recoveryGuidance: string;
  assets: Record<string, ManifestSystemAssetEntry>;
}

export interface InstallSelections {
  capabilities: Record<Capability, boolean>;
  harnesses: Record<Harness, boolean>;
  skills: boolean;
  skillScope: "project" | "global";
  selectedSkills: string[];
  skillManifest?: SkillManifestSelectionSource;
  skillSelectionProvenance?: SkillSelectionProvenanceEntry[];
  plugins: boolean;
  pluginScope: AgenticScope;
  selectedPlugins: string[];
  pluginManifest?: PluginManifestSelectionSource;
  pluginSelectionProvenance?: PluginSelectionProvenanceEntry[];
  /**
   * Explicit project-local system-resource projection. An empty array means
   * provider-only operation. Absence is reserved for pre-P4 manifests so
   * compatibility code can fail closed instead of inventing past intent.
   */
  resourceProjection?: ProjectResourceType[];
}

export interface SkillManifestSelectionSource {
  manifestId: string;
  displayName: string;
  sourcePolicyKind: "first-party" | "local" | "remote-pinned";
  source: "built-in" | "file" | "remote-pinned";
  path?: string;
  digest?: string;
}

export interface SkillSelectionProvenanceEntry {
  skillName: string;
  displayName: string;
  manifestId: string;
  manifestDisplayName: string;
  sourcePolicyKind: "first-party" | "local" | "remote-pinned";
  purposeIds: string[];
  purposeLabels: string[];
  supportedHarnesses: Harness[];
  skillSource: string;
  provenanceKind: "first-party" | "local" | "remote-pinned" | "third-party";
  provenanceLabel: string;
  repository?: string;
  ref?: string;
  digest?: string;
}

export function getActiveInstructionKinds(
  selections: Pick<InstallSelections, "harnesses">,
): Set<InstructionKind> {
  const active = new Set<InstructionKind>();
  for (const harness of HARNESSES) {
    if (selections.harnesses[harness]) {
      active.add(HARNESS_TO_INSTRUCTION[harness]);
    }
  }
  return active;
}

export interface CapabilityState {
  explicitSelection: boolean;
  effectiveSelection: boolean;
  missingPrerequisites: Capability[];
  disabledReason?: string;
}

export interface InstallProfile {
  selections: InstallSelections;
  capabilityState: Record<Capability, CapabilityState>;
  effectiveCapabilities: Capability[];
  profileId: string;
}

export interface ResolvedAsset {
  kind?: "file";
  relativePath: string;
  assetClass: "static" | "scoped-static";
  sourceId: string;
  content: string;
}

export interface ResolvedSkillExposureAsset {
  kind: "skill-exposure";
  relativePath: string;
  assetClass: "static" | "scoped-static";
  sourceId: string;
  skillExposure: SkillExposureMetadata;
  copyMirrorAssets: ResolvedAsset[];
}

export interface ResolvedPluginPayloadAsset {
  kind: "plugin-payload";
  relativePath: string;
  assetClass: "static" | "scoped-static";
  sourceId: string;
  content: string;
  pluginArtifact: PluginArtifactMetadata;
  agenticOwnership: AgenticOwnershipMetadata;
}

export interface ResolvedPluginExposureAsset {
  kind: "plugin-exposure";
  relativePath: string;
  assetClass: "static" | "scoped-static";
  sourceId: string;
  pluginArtifact: PluginArtifactMetadata;
  agenticOwnership: AgenticOwnershipMetadata;
  pluginExposure: PluginExposureMetadata;
  copyMirrorAssets: ResolvedPluginPayloadAsset[];
  generatedAdapterAsset?: ResolvedPluginPayloadAsset;
}

export type ResolvedInstallAsset =
  | ResolvedAsset
  | ResolvedSkillExposureAsset;

export type SkillExposureMode = "symlink" | "copy-mirror";

export interface SkillExposureMetadata {
  skillName: string;
  installName: string;
  harness: Harness;
  scope: "project" | "global";
  canonicalPayloadPath: string;
  exposurePath: string;
  symlinkTarget: string;
  preferredMode: "symlink";
  mode?: SkillExposureMode;
  copyMirrorSource?: string;
  fallbackReason?: string;
  legacyStub?: boolean;
}

export interface ManifestFileEntry {
  hash: string;
  sourceId: string;
  ownershipClass?: ManifestOwnershipClass;
  systemAsset?: ManifestSystemAssetEntry;
  skillExposure?: SkillExposureMetadata;
  agenticOwnership?: AgenticOwnershipMetadata;
}

export type ManifestOwnershipClass =
  | "installed-provider"
  | "managed-projection"
  | "project-override"
  | "managed-snapshot"
  | "managed-block"
  | "project-owned"
  | "runtime-state"
  | "selected-skill";

export type ManifestProvenanceState =
  | "verified"
  | "incomplete"
  | "ambiguous"
  | "contradictory";

export interface ManifestResourceProjectionEntry {
  uri: string;
  type: ProjectResourceType;
  resourcePath: string;
  managedDestination: string;
  ownershipClass: "managed-projection" | "project-override";
  provenanceState: ManifestProvenanceState;
  providerPackage: string;
  providerVersion: string;
  providerImmutableRef: string;
  sourceDigest: string;
  installedDigest: string;
  hashAlgorithm: "sha256";
  selectionTrigger: "setup-selection" | "reconfigure-selection";
  operationLineage: "W19 R1 P4";
  competingClaims: string[];
}

export interface ResourceProjectionManifestState {
  selectedTypes: ProjectResourceType[];
  provider: {
    ownershipClass: "installed-provider";
    provenanceState: "verified";
    packageName: string;
    version: string;
    immutableRef: string;
    inventoryDigest: string;
  };
  resources: Record<string, ManifestResourceProjectionEntry>;
}

export type LifecyclePlanDisposition =
  | "create"
  | "update"
  | "preserve"
  | "conflict"
  | "skip"
  | "remove"
  | "stop";

export interface LifecyclePlanSnapshotEntry {
  relativePath: string;
  state: "missing" | "file" | "directory" | "symlink" | "other";
  digest?: string;
}

export interface LifecyclePlanSnapshot {
  id: string;
  entries: LifecyclePlanSnapshotEntry[];
}

export interface LifecycleMutationReceipt {
  schemaVersion: 1;
  receiptId: string;
  operation: string;
  projectId: string;
  manifestSchemaVersion: number;
  profileId: string;
  selectedResourceTypes: ProjectResourceType[];
  outcomes: Record<LifecyclePlanDisposition, number>;
  conflicts: string[];
  backupReferences: string[];
  committedAt: string;
  claims: {
    validated: false;
    accepted: false;
    published: false;
    released: false;
  };
}

export type AgenticSkillFileRole =
  | "shared-payload"
  | "native-exposure"
  | "copy-mirror"
  | "generated-stub"
  | "legacy-duplicated-payload";

export type AgenticPluginFileRole =
  | "plugin-payload"
  | "plugin-native-exposure"
  | "plugin-copy-mirror"
  | "plugin-generated-adapter"
  | "plugin-legacy-generated-output";

export type AgenticFileRole = AgenticSkillFileRole | AgenticPluginFileRole;

export type AgenticArtifactKind = "skill" | "plugin";
export type AgenticPathKind = "file" | "directory";
export type AgenticScope = "project" | "global";
export type AgenticExposureMode = "symlink" | "copy-mirror" | "generated-adapter";

export type PluginArtifactStatus = "provisional" | "active" | "deprecated";
export type PluginSupportStatus =
  | "provisional"
  | "implementation-validated"
  | "conformance-validated"
  | "unsupported";
export type PluginTrustPolicyKind =
  | "first-party"
  | "local-reviewed"
  | "remote-pinned"
  | "manual-review-required";
export type PluginSourceKind = "built-in" | "file" | "remote-pinned";

export const WORKFLOW_BUNDLE_FAMILIES = [
  "idea-brainstorm",
  "scaffold",
  "change-request-iterate",
  "use-run",
] as const;

export type WorkflowBundleFamily = (typeof WORKFLOW_BUNDLE_FAMILIES)[number];

export const WORKFLOW_BUNDLE_AUDIENCES = [
  "maintainer",
  "non-maintainer",
  "end-user",
] as const;

export type WorkflowBundleAudience =
  (typeof WORKFLOW_BUNDLE_AUDIENCES)[number];

export const WORKFLOW_BUNDLE_EXPOSURE_BOUNDARIES = [
  "maintainer-only",
  "non-maintainer-request-capture",
  "non-maintainer-guided-change",
  "end-user-run-stack",
] as const;

export type WorkflowBundleExposureBoundary =
  (typeof WORKFLOW_BUNDLE_EXPOSURE_BOUNDARIES)[number];

export const WORKFLOW_BUNDLE_MUTATION_AUTHORITIES = [
  "request-capture-only",
  "plan-first",
  "authorized-mutation",
  "run-stack",
] as const;

export type WorkflowBundleMutationAuthority =
  (typeof WORKFLOW_BUNDLE_MUTATION_AUTHORITIES)[number];

export const PLUGIN_PACKAGE_BOUNDARY_STATES = [
  "included",
  "excluded",
  "deferred",
] as const;

export type PluginPackageBoundaryState =
  (typeof PLUGIN_PACKAGE_BOUNDARY_STATES)[number];

export type PluginSupportSurface =
  | "cli"
  | "mcp"
  | "plugin"
  | "skills-bundle"
  | "run-playbook"
  | "harness-native";

export type PluginSupportClaimWording =
  | "provisional"
  | "validated"
  | "unsupported";

export type PluginConformanceScenarioStatus =
  | "candidate"
  | "implemented"
  | "passed"
  | "failed"
  | "deferred";

export interface PluginPackageBoundary {
  pluginPayloads: PluginPackageBoundaryState;
  pluginManifests: PluginPackageBoundaryState;
  nativeExposures: PluginPackageBoundaryState;
  generatedAdapters: PluginPackageBoundaryState;
  conformanceLabRecords: "excluded";
  generatedLocalRunArtifacts: "excluded";
  unreviewedGeneratedOutputs: "excluded";
  decisionEvidence: string[];
}

export interface PluginSupportClaim {
  claimId: string;
  status: PluginSupportStatus;
  surface: PluginSupportSurface;
  wording: PluginSupportClaimWording;
  evidenceRefs: string[];
  pluginId?: string;
  bundleId?: string;
  playbookRef?: string;
  harness?: string;
  modelProvider?: string;
  runtime?: string;
}

export interface PluginConformanceScenarioCandidate {
  scenarioId: string;
  claimId: string;
  status: PluginConformanceScenarioStatus;
  required: boolean;
  dimensions: {
    pluginId?: string;
    bundleId?: string;
    playbookRef?: string;
    harness?: string;
    modelProvider?: string;
    runtime?: string;
    surface?: PluginSupportSurface;
  };
  evidenceRefs: string[];
}

export interface WorkflowBundleRunPlaybookBoundary {
  mode: "generic-run-playbook";
  orchestrator: "w18-r4-run-playbook";
  storageContract: "docs/assets/playbooks";
  pluginPackagingRequired: false;
  playbookRefs: string[];
}

export interface WorkflowBundleMetadata {
  bundleId: string;
  title: string;
  summary: string;
  family: WorkflowBundleFamily;
  audiences: WorkflowBundleAudience[];
  exposureBoundary: WorkflowBundleExposureBoundary;
  mutationAuthority: WorkflowBundleMutationAuthority;
  requestCapture: boolean;
  authorizedMutation: boolean;
  runPlaybook?: WorkflowBundleRunPlaybookBoundary;
  supportClaims: PluginSupportClaim[];
  conformanceScenarios: PluginConformanceScenarioCandidate[];
  packageBoundary: PluginPackageBoundary;
}

export interface PluginTrustPolicy {
  kind: PluginTrustPolicyKind;
  description?: string;
}

export interface PluginManifestSelectionSource {
  manifestId: string;
  displayName: string;
  sourcePolicyKind: PluginTrustPolicyKind;
  source: PluginSourceKind;
  path?: string;
  digest?: string;
}

export interface PluginSelectionProvenanceEntry {
  pluginId: string;
  title: string;
  manifestId: string;
  manifestDisplayName: string;
  sourcePolicyKind: PluginTrustPolicyKind;
  supportedHarnesses: Harness[];
  pluginSource: PluginSourceKind;
  provenanceKind: PluginTrustPolicyKind;
  provenanceLabel: string;
  supportStatus: PluginSupportStatus;
  repository?: string;
  ref?: string;
  digest?: string;
}

export interface PluginSourceManifestMetadata {
  manifestId: string;
  displayName: string;
  source: PluginSourceKind;
  path?: string;
}

export interface PluginArtifactMetadata {
  pluginId: string;
  title: string;
  summary: string;
  status: PluginArtifactStatus;
  sourceManifest: PluginSourceManifestMetadata;
  ref?: string;
  version?: string;
  digest: string;
  provenance: string;
  trustPolicy: PluginTrustPolicy;
  supportedHarnesses: Harness[];
  scope: AgenticScope;
  supportStatus: PluginSupportStatus;
  workflowBundles?: WorkflowBundleMetadata[];
  packageBoundary?: PluginPackageBoundary;
}

export interface PluginExposureMetadata {
  pluginId: string;
  harness: Harness;
  scope: AgenticScope;
  canonicalPayloadPath: string;
  exposurePath: string;
  preferredMode: "symlink";
  mode?: AgenticExposureMode;
  symlinkTarget?: string;
  copyMirrorSource?: string;
  generatedAdapterSourceId?: string;
  generatedAdapterDigest?: string;
  fallbackReason?: string;
}

/**
 * Playbook-packaging provenance carried on manifest ownership records (W18 R8
 * P4, R-PROV-1): every generated artifact stays traceable to its source
 * Playbook refs and digests, package profile, adapter id, output kind, and
 * the concrete generated file — queryable through the manifest and the audit
 * records that embed it, not only through the in-tree
 * `.make-docs/provenance.json`. `adapterId` is the free-form harness adapter
 * identifier, so provenance survives adapters (like `pi`) that are not
 * first-class {@link Harness} values.
 */
export interface AgenticPackagingProvenance {
  packageId: string;
  profile: "native" | "portable";
  adapterId: string;
  outputKind: "plugin" | "skills-bundle";
  sourceRefs: string[];
  sourceDigests: string[];
  /** Container-relative generated file this entry tracks; "." for the exposure root. */
  generatedFile: string;
  /** Compiler inventory category (skill, harness-manifest, ...); "exposure" for exposure entries. */
  category: string;
  /** R-GEN-1 generation tier of the file's semantic content; absent on exposure entries. */
  generationTier?: "deterministic" | "agent-proposed";
  ownershipStatus: "make-docs-managed";
}

export interface AgenticOwnershipMetadata {
  artifactKind: AgenticArtifactKind;
  role: AgenticFileRole;
  id: string;
  pathKind: AgenticPathKind;
  scope?: AgenticScope;
  harness?: Harness;
  canonicalPayloadPath?: string;
  exposurePath?: string;
  exposureMode?: AgenticExposureMode;
  sourceManifest?: string;
  ref?: string;
  version?: string;
  digest?: string;
  provenance?: string;
  trustPolicy?: PluginTrustPolicy;
  supportStatus?: PluginSupportStatus;
  /** Per-artifact Playbook-packaging provenance (W18 R8 P4, R-PROV-1). */
  packaging?: AgenticPackagingProvenance;
}

export interface InstallManifest {
  schemaVersion: number;
  /**
   * Stable project identifier minted once at setup (W18 R10; PRD 38 R-ID-1).
   * Keys every project-scoped row in the machine-level global store and never
   * changes for the lifetime of the install — clones, moves, and worktrees
   * carry it with the manifest. Absent on pre-identifier manifests (installs
   * written before W18 R10); such manifests remain fully valid and the
   * identifier is minted on the next `make-docs` apply.
   */
  projectId?: string;
  packageName: string;
  packageVersion: string;
  updatedAt: string;
  profileId: string;
  selections: InstallSelections;
  effectiveCapabilities: Capability[];
  systemAssetMaterialization: SystemAssetManifestState;
  resourceProjection?: ResourceProjectionManifestState;
  files: Record<string, ManifestFileEntry>;
  skillFiles: string[];
}

export interface ReviewableManagedFileConflict {
  relativePath: string;
  group: ManagedFileConflictGroup;
  sourceId: string;
  reason: string;
  instructionKind?: InstructionKind;
  scope?: "file" | "managed-block";
}

export interface PlannedAction {
  type: ActionType;
  relativePath: string;
  sourceId?: string;
  agenticRole?: AgenticFileRole;
  agenticOwnership?: AgenticOwnershipMetadata;
  skillExposure?: SkillExposureMetadata;
  copyMirrorAssets?: ResolvedAsset[];
  content?: string;
  contentHash?: string;
  reason?: string;
  disposition?: LifecyclePlanDisposition;
}

export interface InstallPlan {
  packageName: string;
  packageVersion: string;
  profile: InstallProfile;
  systemAssetMaterialization: SystemAssetManifestState;
  actions: PlannedAction[];
  desiredFiles: Record<string, ManifestFileEntry>;
  desiredSkillFiles: string[];
  conflictsRunId?: string;
  operation?: "setup" | "setup.reconfigure" | "setup.sync";
  resourceProjection?: ResourceProjectionManifestState;
  classificationSnapshot?: LifecyclePlanSnapshot;
  stops?: string[];
  /** Internal staged-migration control. It never comes from CLI or MCP input. */
  forceManifestWrite?: boolean;
}

export interface PackageMeta {
  name: string;
  version: string;
}

export interface ApplyResult {
  manifest: InstallManifest;
  appliedActions: PlannedAction[];
  conflictFiles: string[];
  receipt?: LifecycleMutationReceipt;
  mutationApplied: boolean;
}

export type AuditMode = "manifest-present" | "manifest-missing";
export type CompatibilitySourceState =
  | "clean-v1"
  | "clean-v2-full-snapshot"
  | "clean-v2-provider-backed"
  | "clean-v2-hybrid-pinned-cache"
  | "modified-v1"
  | "partial-install"
  | "malformed-manifest"
  | "missing-manifest-recognizable"
  | "unknown-shape";
export type CompatibilityDisposition =
  | "sync"
  | "migrate"
  | "migrate-with-review"
  | "backup-and-reinstall"
  | "manual-review-required";
export type AuditPathKind = "file" | "directory";
export type AuditPathScope = "project" | "home" | "external";
export type AuditOwnershipSource =
  | "manifest-file"
  | "manifest-skill-file"
  | "managed-state"
  | "project-config"
  | "fallback";
export type AuditSkippedStatus = "already-absent" | "excluded";
export type AuditReasonCode =
  | "instruction-content-match"
  | "managed-file-hash-match"
  | "managed-skill-file-content-match"
  | "managed-skill-exposure-symlink-match"
  | "managed-skill-exposure-copy-mirror-match"
  | "managed-plugin-file-content-match"
  | "managed-plugin-exposure-symlink-match"
  | "managed-plugin-exposure-copy-mirror-match"
  | "managed-state-file"
  | "fallback-canonical-content-match"
  | "fallback-root-fingerprint-match"
  | "directory-eligible-for-prune"
  | "already-absent"
  | "inside-backup-root"
  | "outside-supported-roots"
  | "instruction-user-content-preserved"
  | "instruction-content-mismatch"
  | "managed-file-modified"
  | "manifest-skill-file-without-metadata"
  | "manifest-skill-file-content-mismatch"
  | "manifest-skill-exposure-mismatch"
  | "manifest-plugin-file-content-mismatch"
  | "manifest-plugin-exposure-mismatch"
  | "fallback-root-fingerprint-mismatch"
  | "fallback-ambiguous"
  | "project-config-preserved"
  | "directory-contains-unmanaged-descendants"
  | "directory-contains-preserved-descendants";

export interface AuditReason {
  code: AuditReasonCode;
  message: string;
}

export interface AuditBackupPath {
  scope: Exclude<AuditPathScope, "external"> | null;
  relativePath: string | null;
}

export interface AuditOrderingMetadata {
  scopeOrder: number;
  depth: number;
  sortKey: string;
  pruneSortKey: string;
}

export interface AuditPathMetadata {
  path: string;
  absolutePath: string;
  kind: AuditPathKind;
  scope: AuditPathScope;
  pathScope: AuditPathScope;
  backupRelativePath: string | null;
  backup: AuditBackupPath;
  ordering: AuditOrderingMetadata;
}

export interface AuditManagedPathMetadata extends AuditPathMetadata {
  ownershipSource: AuditOwnershipSource;
  sourceId?: string;
  agenticRole?: AgenticFileRole;
  agenticOwnership?: AgenticOwnershipMetadata;
  skillExposure?: SkillExposureMetadata;
}

export interface AuditCandidateMetadata extends AuditPathMetadata {
  ownershipSource?: AuditOwnershipSource;
  sourceId?: string;
  agenticRole?: AgenticFileRole;
  agenticOwnership?: AgenticOwnershipMetadata;
  skillExposure?: SkillExposureMetadata;
}

export interface ManifestAuditRecord extends AuditManagedPathMetadata {
  manifestHash?: string;
}

export interface ManifestAuditContext {
  manifestPath: string;
  managedFiles: ManifestAuditRecord[];
  skillFiles: ManifestAuditRecord[];
  priorSelections: InstallSelections;
}

export interface AuditRemovableFile extends AuditManagedPathMetadata {
  kind: "file" | "directory";
  reason: string;
  reasonCode: AuditReasonCode;
  expectedHash?: string;
  currentHash?: string;
}

export interface AuditPrunableDirectory extends AuditPathMetadata {
  kind: "directory";
  reason: string;
  reasonCode: AuditReasonCode;
  removableDescendantPaths: string[];
  preservedDescendantPaths: string[];
}

export interface AuditPreservedPath extends AuditCandidateMetadata {
  reason: string;
  reasonCode: AuditReasonCode;
  preservedDescendantPaths?: string[];
}

export interface AuditSkippedPath extends AuditCandidateMetadata {
  reason: string;
  reasonCode: AuditReasonCode;
  status: AuditSkippedStatus;
}

export interface AuditSkillSelectionReview {
  skillsEnabled: boolean;
  skillScope: InstallSelections["skillScope"];
  selectedSkills: string[];
  skillManifest?: SkillManifestSelectionSource;
  skillSelectionProvenance: SkillSelectionProvenanceEntry[];
}

export interface AuditPluginSelectionReview {
  pluginsEnabled: boolean;
  pluginScope: InstallSelections["pluginScope"];
  selectedPlugins: string[];
  pluginManifest?: PluginManifestSelectionSource;
  pluginSelectionProvenance: PluginSelectionProvenanceEntry[];
}

export interface AuditReport {
  mode: AuditMode;
  targetDir: string;
  manifestPath: string;
  skillSelectionReview?: AuditSkillSelectionReview;
  pluginSelectionReview?: AuditPluginSelectionReview;
  removableFiles: AuditRemovableFile[];
  prunableDirectories: AuditPrunableDirectory[];
  preservedPaths: AuditPreservedPath[];
  skippedPaths: AuditSkippedPath[];
}

export type LifecyclePermissionsMode = "confirm" | "allow-all";

export interface BackupDestinationPlan {
  backupRoot: string;
  dateStamp: string;
  directoryName: string;
  destinationDir: string;
  promotion?: {
    from: string;
    to: string;
  };
}

export interface BackupCommandOptions {
  targetDir: string;
  permissions: LifecyclePermissionsMode;
  homeDir?: string;
  now?: Date;
}

export interface BackupExecutionResult {
  status: "completed" | "cancelled" | "noop";
  targetDir: string;
  destinationDir: string | null;
  auditReport: AuditReport;
  copiedFiles: string[];
  materializedDirectories: string[];
}
