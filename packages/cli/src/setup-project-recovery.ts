import "./store/layout-state";
import { registerSkillAdoptionRecovery } from "./skills-adoption";
import {
  readInstallationStatus,
  recoverInstallationOperation,
} from "./store/installation-state";

export type SetupProjectRecoveryMode = "resume" | "restore";
export type SetupProjectRecoveryMutationState = "none" | "partial";

export class SetupProjectRecoveryError extends Error {
  readonly mutationState: SetupProjectRecoveryMutationState;

  constructor(message: string, mutationState: SetupProjectRecoveryMutationState) {
    super(message);
    this.name = "SetupProjectRecoveryError";
    this.mutationState = mutationState;
  }
}

export interface SetupProjectRecoveryChoice {
  mode: SetupProjectRecoveryMode;
  label: string;
  available: boolean;
  status: string;
  changes: Array<{ path: string; to: string }>;
  conflicts: string[];
}

export interface SetupProjectRecoveryReview {
  schemaVersion: 1;
  targetRoot: string;
  status: "review-required" | "completed" | "rolled-back" | "blocked";
  operationId: string;
  operation: string;
  planComplete: boolean;
  choices: SetupProjectRecoveryChoice[];
  recommendation: SetupProjectRecoveryMode | null;
  selectedMode: SetupProjectRecoveryMode | null;
  nextAction: string;
}

function recoveryChoice(
  targetRoot: string,
  operationId: string,
  mode: SetupProjectRecoveryMode,
  storeRoot?: string,
): SetupProjectRecoveryChoice {
  const engineMode = mode === "restore" ? "rollback" : "resume";
  const result = recoverInstallationOperation(
    targetRoot,
    operationId,
    engineMode,
    true,
    storeRoot,
  );
  return {
    mode,
    label: mode === "resume" ? "Resume reviewed work" : "Restore the prior project state",
    available: result.status === "ready",
    status: result.status,
    changes: result.changes,
    conflicts: result.conflicts,
  };
}

export function prepareSetupProjectRecoveryReview(
  targetRoot: string,
  storeRoot?: string,
): SetupProjectRecoveryReview | null {
  registerSkillAdoptionRecovery();
  const installation = readInstallationStatus(targetRoot, storeRoot);
  if (
    installation.status !== "recovery-required" ||
    !("pendingOperation" in installation) ||
    !installation.pendingOperation
  ) {
    return null;
  }

  const pending = installation.pendingOperation as {
    operation_id: string;
    operation: string;
    planComplete: boolean;
  };
  const resume = recoveryChoice(
    targetRoot,
    pending.operation_id,
    "resume",
    storeRoot,
  );
  const restore = recoveryChoice(
    targetRoot,
    pending.operation_id,
    "restore",
    storeRoot,
  );
  const recommendation = pending.planComplete && resume.available
    ? "resume"
    : restore.available
      ? "restore"
      : resume.available
        ? "resume"
        : null;

  return {
    schemaVersion: 1,
    targetRoot,
    status: "review-required",
    operationId: pending.operation_id,
    operation: pending.operation,
    planComplete: pending.planComplete,
    choices: [resume, restore],
    recommendation,
    selectedMode: null,
    nextAction: recommendation
      ? "Choose the reviewed recovery action in setup. Setup will then reload the project and build a new plan."
      : "Preserve the project and review the listed conflicts. Setup cannot safely continue yet.",
  };
}

export function applySetupProjectRecovery(
  reviewed: SetupProjectRecoveryReview,
  mode: SetupProjectRecoveryMode,
  storeRoot?: string,
): SetupProjectRecoveryReview {
  const current = prepareSetupProjectRecoveryReview(reviewed.targetRoot, storeRoot);
  if (!current || current.operationId !== reviewed.operationId) {
    throw new SetupProjectRecoveryError(
      "The pending project operation changed after review. Run setup again for a new recovery review.",
      "none",
    );
  }
  const choice = current.choices.find((candidate) => candidate.mode === mode);
  if (!choice?.available) {
    const conflicts = choice?.conflicts.length
      ? ` ${choice.conflicts.join(" ")}`
      : "";
    throw new SetupProjectRecoveryError(
      `Setup cannot ${mode} this project operation safely.${conflicts}`,
      "none",
    );
  }

  let result: ReturnType<typeof recoverInstallationOperation>;
  try {
    result = recoverInstallationOperation(
      current.targetRoot,
      current.operationId,
      mode === "restore" ? "rollback" : "resume",
      false,
      storeRoot,
    );
  } catch (error) {
    throw new SetupProjectRecoveryError(
      error instanceof Error ? error.message : String(error),
      "partial",
    );
  }
  if (result.status !== "completed" && result.status !== "rolled-back") {
    throw new SetupProjectRecoveryError(
      `Project recovery did not finish. Recovery status: ${result.status}.`,
      "partial",
    );
  }

  return {
    ...current,
    status: result.status,
    selectedMode: mode,
    nextAction: "Project recovery finished. Setup will reload current state and build a new plan.",
  };
}

export function blockSetupProjectRecovery(
  review: SetupProjectRecoveryReview,
  mode: SetupProjectRecoveryMode | null,
  reason: string,
): SetupProjectRecoveryReview {
  return {
    ...review,
    status: "blocked",
    selectedMode: mode,
    nextAction: reason,
  };
}

export function renderSetupProjectRecovery(
  review: SetupProjectRecoveryReview,
): string {
  const lines = [
    review.status === "review-required"
      ? "Setup found unfinished project work."
      : review.status === "completed"
        ? "Setup resumed and completed the unfinished project work."
        : review.status === "rolled-back"
          ? "Setup restored the project state from before the unfinished work."
          : "Setup could not safely recover the unfinished project work.",
    `Operation: ${review.operation} (${review.operationId})`,
    `Saved plan: ${review.planComplete ? "complete" : "incomplete"}.`,
  ];
  for (const choice of review.choices) {
    lines.push(
      `${choice.label}: ${choice.available ? "ready" : `unavailable (${choice.status})`}.`,
    );
    for (const change of choice.changes) {
      lines.push(`- ${change.path}: ${change.to}`);
    }
    for (const conflict of choice.conflicts) {
      lines.push(`Review: ${conflict}`);
    }
  }
  if (review.recommendation) {
    const recommended = review.choices.find(
      (choice) => choice.mode === review.recommendation,
    );
    lines.push(`Recommended: ${recommended?.label ?? review.recommendation}.`);
  }
  lines.push(`Next: ${review.nextAction}`, "");
  return lines.join("\n");
}
