import path from "node:path";
import { z } from "zod";
import { PROJECT_READ_ACCESS } from "../../access";
import type { OperationDefinition } from "../../registry";
import {
  validatePrdAuthority,
  type PrdAuthorityValidationReport,
} from "../authority";

const inputSchema = z.object({
  targetRoot: z.string().min(1).optional(),
});
type PrdAuthorityValidateInput = z.infer<typeof inputSchema>;

export const prdAuthorityValidateOperation: OperationDefinition<
  PrdAuthorityValidateInput,
  PrdAuthorityValidationReport
> = {
  id: "prd.authority.validate",
  summary:
    "Validate that active PRDs describe product authority rather than editorial change operations.",
  mutates: "read",
  access: PROJECT_READ_ACCESS,
  status: "active",
  inputSchema,
  handler(input, context) {
    return validatePrdAuthority(path.resolve(context.cwd, input.targetRoot ?? "."));
  },
};
