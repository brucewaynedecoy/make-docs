import type { OperationDefinition } from "../../registry";
import { playbookAdvanceOperation } from "./advance";
import { playbookCapabilitiesOperation } from "./capabilities";
import { playbookCatalogOperation } from "./catalog";
import { playbookCloseOperation } from "./close";
import { playbookGateOperation } from "./gate";
import { playbookInvokeOperation } from "./invoke";
import { playbookNextOperation } from "./next";
import { playbookResolveOperation } from "./resolve";
import { playbookResumeOperation } from "./resume";
import { playbookStartOperation } from "./start";
import { playbookStatusOperation } from "./status";
import { playbookValidateOperation } from "./validate";

/**
 * Playbook-domain registry entries (R-OP-1), one module per operation
 * (R-CORE-1). Identifiers are stable and append-only; the W18 R7 progression
 * identifiers reserved by W18 R11 are active as of W18 R7 P2.
 */
export const playbookOperations: OperationDefinition[] = [
  playbookValidateOperation as OperationDefinition,
  playbookCatalogOperation as OperationDefinition,
  playbookResolveOperation as OperationDefinition,
  playbookCapabilitiesOperation as OperationDefinition,
  playbookStartOperation as OperationDefinition,
  playbookInvokeOperation as OperationDefinition,
  playbookStatusOperation as OperationDefinition,
  playbookNextOperation as OperationDefinition,
  playbookAdvanceOperation as OperationDefinition,
  playbookGateOperation as OperationDefinition,
  playbookResumeOperation as OperationDefinition,
  playbookCloseOperation as OperationDefinition,
];

export {
  playbookAdvanceOperation,
  playbookCapabilitiesOperation,
  playbookCatalogOperation,
  playbookCloseOperation,
  playbookGateOperation,
  playbookInvokeOperation,
  playbookNextOperation,
  playbookResolveOperation,
  playbookResumeOperation,
  playbookStartOperation,
  playbookStatusOperation,
  playbookValidateOperation,
};
