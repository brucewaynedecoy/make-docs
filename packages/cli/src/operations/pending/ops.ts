import type { OperationDefinition } from "../registry";

// All P3 reservations are active through their owning operation modules.
export const pendingOperations: OperationDefinition[] = [];
