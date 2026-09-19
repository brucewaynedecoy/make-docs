import type { OperationDefinition } from "../../registry";
import { prdAuthorityValidateOperation } from "./authority-validate";

export const prdOperations: OperationDefinition[] = [prdAuthorityValidateOperation];

export { prdAuthorityValidateOperation };
