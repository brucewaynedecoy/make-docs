import { canonicalInstallationPath, getExistingInstallationCheckoutId, readDeclarativeProjectId, withStoreReadOnlyDatabase } from "../../store/installation-state";
import { readProjectRegisterRow } from "../../store/project-register";
import { factoryWorkflowLiveState, readFactoryCheckoutConfig } from "./live-plan";

/**
 * W30 R0 P5 T13 and T14 (PRD 53 R-FACTORY-47, PRD 51 R-BACKLOG-APP-18): the
 * ready factory workflows of one checkout, for the backlog review handoff.
 *
 * It reads only. It returns null when the folder is not a bound checkout, when
 * the Store cannot be read, when the config cannot be read, or when no
 * workflow is `ready`. Then the backlog review action keeps its behavior from
 * before this phase. Readiness comes from the same live plan as `factory
 * status`, so the handoff and the factory agree.
 */
export interface FactoryHandoffFact {
  readyWorkflows: string[];
  project: { id: string; name: string | null };
}

export function readyFactoryWorkflowsForCheckout(targetRoot: string, storeRoot: string): FactoryHandoffFact | null {
  try {
    const root = canonicalInstallationPath(targetRoot);
    const projectId = readDeclarativeProjectId(root);
    if (!projectId || !getExistingInstallationCheckoutId(root, storeRoot)) return null;
    const config = readFactoryCheckoutConfig(root);
    if (!config.ok || Object.keys(config.workflows).length === 0) return null;
    return withStoreReadOnlyDatabase(storeRoot, (db) => {
      const register = readProjectRegisterRow(db, projectId);
      if (!register) return null;
      const ready = Object.keys(config.workflows)
        .sort()
        .filter((workflowName) => factoryWorkflowLiveState(db, { projectId, workflowName, root, config }).readiness === "ready");
      return ready.length === 0 ? null : { readyWorkflows: ready.slice(0, 16), project: { id: projectId, name: register.projectName ?? null } };
    });
  } catch {
    // No usable Store or an older one: the action keeps its behavior from before (T14).
    return null;
  }
}
