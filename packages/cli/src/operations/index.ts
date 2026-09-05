import { listOperations } from "./registry";
import type { OperationDomainDescriptor } from "./types";

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
export { probeCloseout } from "./closeout";
export { checkpointPhase, gatePhase, guardPhaseScope } from "./lifecycle";
export {
  isActionPrefixedPrdFilename,
  PRD_AUTHORITY_DIAGNOSTIC_CODES,
  validatePrdAuthority,
} from "./prd";
export type {
  PrdAuthorityDiagnostic,
  PrdAuthorityDiagnosticCode,
  PrdAuthorityValidationReport,
} from "./prd";
export {
  planWorkPhase,
  readWaveStatus,
  readWorkPhaseState,
  resolveWorkWave,
} from "./work";

/**
 * Domain listing derived from the operation registry (R-REG-2, R-RUN-2):
 * groups `listOperations()` identifiers by their domain segment so surfaces
 * such as `make_docs_operation_domains` advertise exactly the registry —
 * pruned legacy operations never appear here.
 */
export function listOperationDomains(): OperationDomainDescriptor[] {
  const domains = new Map<string, OperationDomainDescriptor>();
  for (const operation of listOperations()) {
    let domain = domains.get(operation.domain);
    if (!domain) {
      domain = { name: operation.domain, commands: [] };
      domains.set(operation.domain, domain);
    }
    domain.commands.push({
      id: operation.id,
      summary: operation.summary,
      mutates: operation.mutates === "write",
      status: operation.status,
    });
  }
  return [...domains.values()];
}
