export const CAPABILITIES = ["designs", "plans", "prd", "work"] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const INSTRUCTION_KINDS = ["AGENTS.md", "CLAUDE.md"] as const;

export type InstructionKind = (typeof INSTRUCTION_KINDS)[number];

export const HARNESSES = ["claude-code", "codex"] as const;

export type Harness = (typeof HARNESSES)[number];

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
  relativePath: string;
  assetClass: "static" | "scoped-static";
  sourceId: string;
  content: string;
}

export interface ManifestFileEntry {
  hash: string;
  sourceId: string;
  systemAsset?: ManifestSystemAssetEntry;
}

export interface InstallManifest {
  schemaVersion: number;
  packageName: string;
  packageVersion: string;
  updatedAt: string;
  profileId: string;
  selections: InstallSelections;
  effectiveCapabilities: Capability[];
  systemAssetMaterialization: SystemAssetManifestState;
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
  content?: string;
  contentHash?: string;
  reason?: string;
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
}

export interface PackageMeta {
  name: string;
  version: string;
}

export interface ApplyResult {
  manifest: InstallManifest;
  appliedActions: PlannedAction[];
  conflictFiles: string[];
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
  | "managed-state-file"
  | "fallback-canonical-content-match"
  | "fallback-root-fingerprint-match"
  | "directory-eligible-for-prune"
  | "already-absent"
  | "inside-backup-root"
  | "outside-supported-roots"
  | "instruction-content-mismatch"
  | "managed-file-modified"
  | "manifest-skill-file-without-metadata"
  | "manifest-skill-file-content-mismatch"
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
}

export interface AuditCandidateMetadata extends AuditPathMetadata {
  ownershipSource?: AuditOwnershipSource;
  sourceId?: string;
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
  kind: "file";
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

export interface AuditReport {
  mode: AuditMode;
  targetDir: string;
  manifestPath: string;
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
