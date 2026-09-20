import { CAPABILITIES, HARNESSES } from "./types";
import { cloneSelections } from "./profile";
import type { Capability, Harness, InstallSelections } from "./types";

export type SetupEntry = "setup" | "system" | "reconfigure" | "skills";
export type SetupProjectState = "fresh" | "current" | "partial" | "drifted" | "recoverable";
export type HarnessSupportState =
  | "detected"
  | "not-detected"
  | "configured"
  | "drifted"
  | "blocked"
  | "unsupported";

export interface SetupHarnessState {
  harness: Harness;
  state: HarnessSupportState;
  detail?: string;
  nextAction?: string;
}

export interface UnifiedSetupState {
  entry: SetupEntry;
  projectState: SetupProjectState;
  selections: InstallSelections;
  currentCapabilities: Capability[];
  harnesses: SetupHarnessState[];
  allowCapabilityExpansion: boolean;
}

export interface UnifiedSetupApplyResult {
  status: "configured" | "skipped-none" | "blocked" | "partial" | "failed" | "recovery" | "unchanged";
  system: "applied" | "unchanged" | "skipped" | "failed";
  project: "applied" | "unchanged" | "skipped" | "failed";
  nextAction: string;
  error?: unknown;
}

export const COMPLETE_PROJECT_CAPABILITIES: readonly Capability[] = CAPABILITIES;

export function resolveUnifiedSetupState(options: {
  entry: SetupEntry;
  projectState: SetupProjectState;
  selections: InstallSelections;
  harnesses?: SetupHarnessState[];
  allowCapabilityExpansion?: boolean;
}): UnifiedSetupState {
  const selections = cloneSelections(options.selections);

  if (options.projectState === "fresh") {
    for (const capability of CAPABILITIES) {
      selections.capabilities[capability] = true;
    }
  }

  return {
    entry: options.entry,
    projectState: options.projectState,
    selections,
    currentCapabilities: CAPABILITIES.filter(
      (capability) => selections.capabilities[capability],
    ),
    harnesses:
      options.harnesses ??
      HARNESSES.map((harness) => ({ harness, state: "not-detected" })),
    allowCapabilityExpansion:
      options.projectState !== "fresh" &&
      (options.allowCapabilityExpansion ?? options.entry === "reconfigure"),
  };
}

export function describeHarnessSupport(state: SetupHarnessState): string {
  const label = state.harness === "claude-code" ? "Claude Code" : "Codex";
  const status = state.state.replace("-", " ");
  return `${label}: ${status}${state.detail ? ` (${state.detail})` : ""}${state.nextAction ? ` Next: ${state.nextAction}` : ""}`;
}

/**
 * Apply the machine operation before the project operation. The callbacks own
 * their existing Store receipts and recovery records. This coordinator does
 * not add a second receipt or retry a project callback.
 */
export async function applyUnifiedSetup(options: {
  systemChanged: boolean;
  projectChanged: boolean;
  systemApproved: boolean;
  projectApproved: boolean;
  applySystem: () => Promise<void>;
  verifySystem: () => Promise<boolean>;
  applyProject: () => Promise<void>;
}): Promise<UnifiedSetupApplyResult> {
  let system: UnifiedSetupApplyResult["system"] = options.systemChanged
    ? "skipped"
    : "unchanged";

  if (options.systemChanged) {
    if (!options.systemApproved) {
      return {
        status: "blocked",
        system: "skipped",
        project: "skipped",
        nextAction: "Review and approve the This computer changes, then run `make-docs setup` again.",
      };
    }

    try {
      await options.applySystem();
      if (!(await options.verifySystem())) {
      return {
          status: "recovery",
          system: "failed",
          project: "skipped",
          nextAction: "The This computer change could not be verified. Run `make-docs setup system` to review and resume it.",
        };
      }
      system = "applied";
    } catch (error) {
      return {
        status: "failed",
        system: "failed",
        project: "skipped",
        nextAction: "The This computer change failed. Run `make-docs setup system` to review and resume it.",
        error,
      };
    }
  }

  if (!options.projectChanged) {
    return {
      status: system === "applied" ? "configured" : "unchanged",
      system,
      project: "unchanged",
      nextAction: "No project changes remain.",
    };
  }

  if (!options.projectApproved) {
    return {
      status: system === "applied" ? "partial" : "blocked",
      system,
      project: "skipped",
      nextAction: "This computer is ready. Review the This project changes, then run `make-docs setup` again.",
    };
  }

  try {
    await options.applyProject();
    return {
      status: "configured",
      system,
      project: "applied",
      nextAction: "Setup is complete.",
    };
  } catch (error) {
    return {
      status: system === "applied" ? "partial" : "failed",
      system,
      project: "failed",
      nextAction: "This computer remains configured. Run `make-docs setup` to review and resume the This project change.",
      error,
    };
  }
}
