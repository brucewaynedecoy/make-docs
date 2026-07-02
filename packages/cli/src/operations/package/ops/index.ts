import type { OperationDefinition } from "../../registry";
import { packagePlanOperation } from "./plan";
import { packageSurfaceResolveOperation } from "./surface-resolve";
import { packageWriteOperation } from "./write";

/** The `package` domain slice of the operation registry (R-RUN-1). */
export const packageOperations: OperationDefinition[] = [
  packagePlanOperation,
  packageSurfaceResolveOperation,
  packageWriteOperation,
];
