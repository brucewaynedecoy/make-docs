import type { OperationDefinition } from "../../registry";
import { workEvidenceReadOperation } from "./evidence-read";
import { workEvidenceRecordOperation } from "./evidence-record";
import { workItemResolveOperation } from "./item-resolve";

/**
 * The retained work-operation slots (R-RUN-1): the tight work-item identity
 * resolver and the work-execution evidence record/read pair keyed to that
 * canonical identity. Everything else the legacy work domain carried is
 * pruned per the migrated-operations inventory disposition.
 */
export const workOperations: OperationDefinition[] = [
  workItemResolveOperation as OperationDefinition,
  workEvidenceRecordOperation as OperationDefinition,
  workEvidenceReadOperation as OperationDefinition,
];

export { workEvidenceReadOperation, workEvidenceRecordOperation, workItemResolveOperation };
