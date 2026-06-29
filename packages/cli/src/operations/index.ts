import { closeoutDomain } from "./closeout";
import { lifecycleDomain } from "./lifecycle";
import { playbookDomain } from "./playbook";
import type { OperationDomainDescriptor, OperationDomainName } from "./types";
import { workDomain } from "./work";

export type {
  JsonValue,
  OperationCommandDescriptor,
  OperationDomainDescriptor,
  OperationDomainName,
  OperationProvenance,
  OperationRenderMode,
  OperationResult,
} from "./types";
export { OperationError } from "./types";
export { closeoutDomain, probeCloseout } from "./closeout";
export { lifecycleDomain, checkpointPhase, gatePhase, guardPhaseScope } from "./lifecycle";
export {
  buildPlaybookCatalog,
  evaluateHarnessCapabilities,
  playbookDomain,
  readHarnessCapabilityEvaluation,
  readPlaybookCatalog,
  readPlaybookResolution,
  resolvePlaybook,
} from "./playbook";
export {
  planWorkPhase,
  readWaveStatus,
  readWorkPhaseState,
  resolveWorkWave,
  workDomain,
} from "./work";

const DOMAINS = [closeoutDomain, workDomain, lifecycleDomain, playbookDomain] as const;

export function listOperationDomains(): OperationDomainDescriptor[] {
  return DOMAINS.map((domain) => ({
    ...domain,
    commands: domain.commands.map((command) => ({ ...command })),
  }));
}

export function getOperationDomain(name: OperationDomainName): OperationDomainDescriptor {
  const domain = DOMAINS.find((candidate) => candidate.name === name);
  if (!domain) {
    throw new Error(`Unknown operation domain: ${name}`);
  }
  return {
    ...domain,
    commands: domain.commands.map((command) => ({ ...command })),
  };
}
