/**
 * Tool self-management module (W18 R11 P3; PRD 39 R-SELF-1..3, R-MIG-2).
 *
 * Implements the top-level `update` and `uninstall` commands — machine-level
 * tool self-management, honest about the remote-execution posture — plus the
 * pre-v2 fingerprint detection and R-MIG-2 warning-and-choice flow consumed
 * by `update`, `setup`, and `setup reconfigure`.
 */

export {
  defaultExecCommand,
  detectInstallSource,
  formatManagerCommand,
  INSTALL_MANAGER_MATRIX,
  REMOTE_EXECUTION_MARKERS,
  SELF_PACKAGE_NAME,
  type DetectInstallSourceOptions,
  type ExecCommand,
  type InstallDetection,
  type InstallManagerId,
  type InstallManagerSpec,
  type ManagerCommand,
} from "./install-manager";

export {
  defaultSelfCommandOutput,
  detectPreV2Install,
  PRE_V2_BREAKING_CHANGES,
  promptPreV2Choice,
  type PreV2Choice,
  type PreV2Detection,
  type SelfCommandOutput,
} from "./pre-v2";

export {
  runToolUninstallCommand,
  type ToolUninstallBinaryOutcome,
  type ToolUninstallOptions,
  type ToolUninstallResult,
} from "./uninstall-tool";

export {
  runToolUpdateCommand,
  type ToolUpdateOptions,
  type ToolUpdateResult,
} from "./update-tool";
