import type { OperationDefinition } from "../../registry";
import { packagePlanOperation } from "./plan";
import { packageShipOperation } from "./ship";
import { packageSurfaceResolveOperation } from "./surface-resolve";
import { packageWriteOperation } from "./write";

/**
 * The `package` domain slice of the operation registry (R-RUN-1).
 * `package.ship` is APPENDED per the R-REG-1 append-only rule (W18 R12 P3;
 * PRD 41 R-GRAM-3): the composite plan->preview->write entry point.
 */
export const packageOperations: OperationDefinition[] = [
  packagePlanOperation,
  packageSurfaceResolveOperation,
  packageWriteOperation,
  packageShipOperation,
];
